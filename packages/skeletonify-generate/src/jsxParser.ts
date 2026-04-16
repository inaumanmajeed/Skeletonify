import type {
  JSXElement,
  JSXFragment,
  JSXAttribute,
  StringLiteral,
  CallExpression,
  Expression,
  Node,
  Statement,
  ReturnStatement,
} from "@babel/types";

export type IRNodeType = "element" | "text" | "fragment";

export interface IRNode {
  type: IRNodeType;
  tag?: string;
  className?: string;
  hasSrc?: boolean;
  propWidth?: number;
  propHeight?: number;
  textContent?: string;
  children: IRNode[];
}

export const TEXT_TAGS = new Set([
  "p", "span", "a", "h1", "h2", "h3", "h4", "h5", "h6",
  "label", "li", "strong", "em", "small", "blockquote",
]);

export const IMAGE_TAGS = new Set(["img", "picture", "video", "svg", "canvas"]);

// cn(), clsx(), classnames(), twMerge() — extract static string arguments.
function extractStaticClassesFromCall(expr: CallExpression): string | undefined {
  const parts: string[] = [];
  for (const arg of expr.arguments) {
    if (arg.type === "StringLiteral") {
      parts.push(arg.value);
    } else if (arg.type === "TemplateLiteral" && arg.expressions.length === 0 && arg.quasis.length === 1) {
      parts.push(arg.quasis[0].value.raw);
    }
    // Skip dynamic args (variables, ternaries, arrays) — can't resolve statically
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function getClassName(el: JSXElement): string | undefined {
  const attr = findAttribute(el, "className");
  if (!attr) return undefined;
  const val = attr.value;
  if (!val) return undefined;

  if (val.type === "StringLiteral") return val.value;

  if (val.type === "JSXExpressionContainer") {
    const expr = val.expression;
    if (expr.type === "StringLiteral") return expr.value;
    if (expr.type === "TemplateLiteral" && expr.expressions.length === 0 && expr.quasis.length === 1) {
      return expr.quasis[0].value.raw;
    }
    // cn("flex gap-2", isActive && "bg-blue")  → extract "flex gap-2"
    if (expr.type === "CallExpression") {
      return extractStaticClassesFromCall(expr);
    }
  }
  return undefined;
}

function getStaticNumericValue(attr: JSXAttribute | undefined): number | undefined {
  if (!attr?.value) return undefined;
  const val = attr.value;
  if (val.type === "StringLiteral") {
    const n = parseFloat(val.value);
    return Number.isNaN(n) ? undefined : n;
  }
  if (val.type === "JSXExpressionContainer" && val.expression.type === "NumericLiteral") {
    return val.expression.value;
  }
  return undefined;
}

function findAttribute(el: JSXElement, name: string): JSXAttribute | undefined {
  for (const attr of el.openingElement.attributes) {
    if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === name) {
      return attr;
    }
  }
  return undefined;
}

function getTagName(el: JSXElement): string | null {
  const name = el.openingElement.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression" && name.property.type === "JSXIdentifier") {
    return name.property.name;
  }
  return null;
}

function isComponentTag(tag: string): boolean {
  return tag.length > 0 && tag[0] === tag[0].toUpperCase();
}

function parseChildren(children: JSXElement["children"]): IRNode[] {
  const result: IRNode[] = [];
  for (const child of children) {
    if (child.type === "JSXElement") {
      const ir = parseJSXElement(child);
      if (ir) result.push(ir);
    } else if (child.type === "JSXFragment") {
      result.push(...parseFragment(child));
    } else if (child.type === "JSXText") {
      const text = child.value.trim();
      if (text) result.push({ type: "text", textContent: text, children: [] });
    } else if (child.type === "JSXExpressionContainer") {
      if (child.expression.type === "StringLiteral") {
        const text = child.expression.value.trim();
        if (text) result.push({ type: "text", textContent: text, children: [] });
      }
    }
  }
  return result;
}

function parseFragment(frag: JSXFragment): IRNode[] {
  return parseChildren(frag.children);
}

function parseJSXElement(el: JSXElement): IRNode | null {
  const tag = getTagName(el);
  if (!tag) return null;
  if (tag === "Skeletonify") return null;

  const className = getClassName(el);
  const hasSrc = findAttribute(el, "src") !== undefined;
  const propWidth = getStaticNumericValue(findAttribute(el, "width"));
  const propHeight = getStaticNumericValue(findAttribute(el, "height"));

  if (isComponentTag(tag) && tag !== "Image") {
    const kids = parseChildren(el.children);
    if (kids.length > 0) {
      return { type: "element", tag: "component-group", className, hasSrc, propWidth, propHeight, children: kids };
    }
    return { type: "element", tag: "component", className, hasSrc, propWidth, propHeight, children: [] };
  }

  return {
    type: "element",
    tag: tag.toLowerCase(),
    className,
    hasSrc,
    propWidth,
    propHeight,
    children: parseChildren(el.children),
  };
}

// Walk function body to find the first JSX return.
function findJSXReturn(body: Statement[]): JSXElement | JSXFragment | null {
  for (const stmt of body) {
    if (stmt.type === "ReturnStatement" && stmt.argument) {
      const arg = stmt.argument;
      if (arg.type === "JSXElement" || arg.type === "JSXFragment") return arg;
      if (arg.type === "ParenthesizedExpression") {
        const inner = arg.expression;
        if (inner.type === "JSXElement" || inner.type === "JSXFragment") return inner;
      }
    }
    if (stmt.type === "IfStatement") {
      const found = findJSXReturnInBlock(stmt.consequent);
      if (found) return found;
    }
  }
  return null;
}

function findJSXReturnInBlock(node: Statement): JSXElement | JSXFragment | null {
  if (node.type === "BlockStatement") return findJSXReturn(node.body);
  if (node.type === "ReturnStatement" && node.argument) {
    const arg = node.argument;
    if (arg.type === "JSXElement" || arg.type === "JSXFragment") return arg;
  }
  return null;
}

export function parseJSXFromBody(body: Statement[]): IRNode | null {
  const root = findJSXReturn(body);
  if (!root) return null;

  if (root.type === "JSXFragment") {
    const kids = parseFragment(root);
    if (kids.length === 0) return null;
    if (kids.length === 1) return kids[0];
    return { type: "fragment", children: kids };
  }
  return parseJSXElement(root);
}
