#!/usr/bin/env node

import { readdirSync, statSync, watch } from "fs";
import { join, resolve, extname } from "path";
import { processFile, writeDescriptors, writeSkeletonMap, type GeneratedEntry } from "./generator.js";

const args = process.argv.slice(2);
const flags: Record<string, string | true> = {};
const paths: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out" && args[i + 1]) { flags.out = args[++i]; continue; }
  if (args[i] === "--map") { flags.map = true; continue; }
  if (args[i] === "--watch") { flags.watch = true; continue; }
  if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
skeletonify-generate — Pre-generate skeleton descriptors from JSX

Usage:
  skeletonify-generate <files-or-dirs...> [options]

Options:
  --out <dir>   Output directory (default: .skeletonify)
  --map         Generate skeletonMap.ts with lazy imports
  --watch       Watch for changes and regenerate
  -h, --help    Show this help

Examples:
  npx skeletonify-generate src/components/
  npx skeletonify-generate src/ --out .skeletonify --map --watch
`);
    process.exit(0);
  }
  paths.push(args[i]);
}

if (paths.length === 0) {
  console.error("Error: no input files or directories. Run with --help.");
  process.exit(1);
}

const EXTENSIONS = new Set([".tsx", ".jsx"]);

function collectFiles(target: string): string[] {
  const stat = statSync(target);
  if (stat.isFile() && EXTENSIONS.has(extname(target))) return [resolve(target)];
  if (stat.isDirectory()) {
    const result: string[] = [];
    for (const entry of readdirSync(target)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
      result.push(...collectFiles(join(target, entry)));
    }
    return result;
  }
  return [];
}

const outDir = resolve(typeof flags.out === "string" ? flags.out : ".skeletonify");
const baseDir = resolve(paths[0]);
const shouldMap = !!flags.map;
const shouldWatch = !!flags.watch;

function run(): void {
  const files = paths.flatMap(collectFiles);
  if (files.length === 0) {
    console.log("skeletonify-generate: no .tsx/.jsx files found.");
    return;
  }

  const allEntries: GeneratedEntry[] = [];

  for (const file of files) {
    try {
      const entries = processFile(file, baseDir);
      allEntries.push(...entries);
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      console.warn(`  skip: ${file} — ${msg}`);
    }
  }

  if (allEntries.length === 0) {
    console.log("skeletonify-generate: no components found.");
    return;
  }

  writeDescriptors(allEntries, outDir);
  if (shouldMap) writeSkeletonMap(allEntries, outDir);

  console.log(
    `skeletonify-generate: ${allEntries.length} descriptor(s) from ${files.length} file(s) → ${outDir}`
  );
}

run();

if (shouldWatch) {
  console.log("skeletonify-generate: watching for changes...");
  const dirs = new Set(paths.map((p) => resolve(p)));

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debouncedRun = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      run();
      debounceTimer = null;
    }, 150);
  };

  for (const dir of dirs) {
    try {
      watch(dir, { recursive: true }, (_, filename) => {
        if (!filename || !EXTENSIONS.has(extname(filename))) return;
        console.log(`  change: ${filename}`);
        debouncedRun();
      });
    } catch {
      console.warn(`  watch: could not watch ${dir}`);
    }
  }
}
