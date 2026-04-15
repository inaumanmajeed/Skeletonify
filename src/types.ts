export type DescriptorType = "text" | "box" | "circle" | "group";

export interface Descriptor {
  type: DescriptorType;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  aspectRatio?: number;
  lines?: number;
  direction?: "row" | "column";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  padding?: number;
  children?: Descriptor[];
}
