import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const allowDirs = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "providers"),
];
const ignorePathParts = [
  `${path.sep}i18n${path.sep}`,
  `${path.sep}components${path.sep}ui${path.sep}`,
  `${path.sep}mock-data${path.sep}`,
];

const exts = new Set([".tsx", ".ts"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function isInAllowedDir(file) {
  return allowDirs.some((dir) => file.startsWith(dir));
}

function isIgnored(file) {
  return ignorePathParts.some((part) => file.includes(part));
}

const files = walk(root).filter((file) => isInAllowedDir(file) && !isIgnored(file));

const jsxTextPattern = />\s*([A-Za-z][^<{]*)\s*</g;
const literalPattern = /(["'`])([^"'`]*[A-Za-z][^"'`]*)\1/g;

const skipLiteralContains = [
  "className",
  "http",
  "/teacher/",
  "/student/",
  "@/",
  "aria-",
  "--color-",
  "YYYY",
  "MM",
  "DD",
  "HH",
  "MM/YY",
  "1234",
  "TODO",
];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith("//")) continue;

    jsxTextPattern.lastIndex = 0;
    const jsxMatch = jsxTextPattern.exec(line);
    if (jsxMatch) {
      const text = jsxMatch[1].trim();
      if (text.length > 1 && !text.startsWith("{") && !text.endsWith("}")) {
        console.log(`${rel}:${i + 1} JSX: ${text}`);
      }
    }

    if (!line.includes('"') && !line.includes("'") && !line.includes("`")) {
      continue;
    }

    literalPattern.lastIndex = 0;
    let match;
    while ((match = literalPattern.exec(line)) !== null) {
      const full = match[0];
      const value = match[2].trim();
      if (!value || value.length < 2) continue;
      if (!/[A-Za-z]/.test(value)) continue;
      if (skipLiteralContains.some((token) => line.includes(token) || value.includes(token))) {
        continue;
      }
      if (line.includes("import ") || line.includes("from ")) continue;
      if (line.includes("type ") || line.includes("interface ")) continue;
      if (line.includes("function ") || line.includes("const ")) continue;
      if (line.includes("variant=") || line.includes("size=")) continue;
      if (line.includes("id=") || line.includes("htmlFor=") || line.includes("value=")) continue;
      console.log(`${rel}:${i + 1} STR: ${full}`);
    }
  }
}
