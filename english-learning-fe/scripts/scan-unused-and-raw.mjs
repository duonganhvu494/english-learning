import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");

const exts = new Set([".ts", ".tsx", ".css"]);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
}

const files = walk(root);

const rawTags = [];
for (const file of files) {
  if (!file.endsWith(".tsx")) continue;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.includes("<button")) {
      rawTags.push({ file, line: i + 1, tag: "button", text: line.trim() });
    }
    if (line.includes("<label")) {
      rawTags.push({ file, line: i + 1, tag: "label", text: line.trim() });
    }
  }
}

const componentFiles = files.filter(
  (f) => f.endsWith(".tsx") && f.includes(`${path.sep}components${path.sep}`),
);
const srcTexts = files
  .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
  .map((f) => fs.readFileSync(f, "utf8"));

function toImportCandidates(file) {
  const relFromSrc = path.relative(root, file).replace(/\\/g, "/");
  const noExt = relFromSrc.replace(/\.(tsx|ts)$/, "");
  const baseName = path.basename(noExt);
  return [
    `@/${noExt}`,
    `./${baseName}`,
    `../${baseName}`,
    `/${noExt}`,
    `${baseName}`,
  ];
}

const possiblyUnusedComponents = [];
for (const file of componentFiles) {
  const candidates = toImportCandidates(file);
  const hasRef = srcTexts.some((txt) =>
    candidates.some((c) => txt.includes(`"${c}"`) || txt.includes(`'${c}'`)),
  );
  if (!hasRef) {
    possiblyUnusedComponents.push(path.relative(process.cwd(), file).replace(/\\/g, "/"));
  }
}

const styleFiles = files.filter((f) => f.endsWith(".css"));
const globals = fs.readFileSync(path.resolve(root, "app/globals.css"), "utf8");
const possiblyUnusedStyles = [];
for (const file of styleFiles) {
  const rel = path.relative(path.resolve(root, "app"), file).replace(/\\/g, "/");
  const base = path.basename(file);
  if (file.endsWith("globals.css")) continue;
  if (!globals.includes(base) && !globals.includes(rel)) {
    possiblyUnusedStyles.push(path.relative(process.cwd(), file).replace(/\\/g, "/"));
  }
}

console.log("=== RAW_TAGS ===");
for (const item of rawTags) {
  console.log(`${path.relative(process.cwd(), item.file).replace(/\\/g, "/")}:${item.line} <${item.tag}> ${item.text}`);
}

console.log("\n=== POSSIBLY_UNUSED_COMPONENTS ===");
for (const file of possiblyUnusedComponents) {
  console.log(file);
}

console.log("\n=== POSSIBLY_UNUSED_STYLES ===");
for (const file of possiblyUnusedStyles) {
  console.log(file);
}
