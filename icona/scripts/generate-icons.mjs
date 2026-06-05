import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parse } from "svgson";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const packageRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(packageRoot, "..");
const sourceRoot = path.join(workspaceRoot, "svg");
const iconsDir = path.join(packageRoot, "src", "icons");
const indexPath = path.join(packageRoot, "src", "index.ts");
const reportPath = path.join(packageRoot, "icon-report.json");

const STYLES = ["Bold", "BoldDuotone", "Broken", "LineDuotone", "Linear", "Outline"];

const STRIP_ELEMENTS = new Set(["style", "title", "desc", "metadata"]);
const STRIP_ATTRS = new Set(["id", "class", "data-name", "xml:space", "version"]);
const RENDERED_ELEMENTS = new Set([
  "path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "g", "defs", "clipPath", "linearGradient", "radialGradient", "stop", "mask", "use"
]);
const REACT_ATTR_MAP = {
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "fill-opacity": "fillOpacity",
  "vector-effect": "vectorEffect",
  "shape-rendering": "shapeRendering",
  "color-interpolation-filters": "colorInterpolationFilters",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity"
};

const PRIMARY_COLORS = new Set(["#1C274C", "#1C274D", "#1c274c", "#1c274d"]);
const SECONDARY_COLORS = new Set(["#8E93A6", "#8e93a6"]);

function pascalCase(input) {
  const cleaned = input.replace(/\.svg$/i, "").replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const base = words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  if (!base) return "Icon";
  return /^\d/.test(base) ? `Icon${base}` : base;
}

function readSvgFiles() {
  const out = [];
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Source SVG root not found: ${sourceRoot}`);
  }
  for (const category of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const catPath = path.join(sourceRoot, category.name);
    for (const style of fs.readdirSync(catPath, { withFileTypes: true })) {
      if (!style.isDirectory()) continue;
      if (!STYLES.includes(style.name)) continue;
      const stylePath = path.join(catPath, style.name);
      for (const entry of fs.readdirSync(stylePath, { withFileTypes: true })) {
        if (entry.isFile() && /\.svg$/i.test(entry.name)) {
          out.push({
            file: path.join(stylePath, entry.name),
            category: category.name,
            style: style.name,
            base: entry.name.replace(/\.svg$/i, "")
          });
        }
      }
    }
  }
  return out;
}

function jsxAttrName(name) {
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  if (REACT_ATTR_MAP[name]) return REACT_ATTR_MAP[name];
  if (name.includes(":")) return null; // skip namespaced
  return name;
}

function transformColor(value, attr) {
  if (value === "none") return value;
  if (value === "currentColor") return value;
  if (PRIMARY_COLORS.has(value)) return "currentColor";
  if (SECONDARY_COLORS.has(value)) return "currentColor";
  return value;
}

function shouldDropAttr(name) {
  if (STRIP_ATTRS.has(name)) return true;
  if (name === "xmlns" || name === "xmlns:xlink") return true;
  if (name === "width" || name === "height") return true; // handled by IconBase
  return false;
}

function normalizeAttrValue(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function escapeJsxAttr(value) {
  return normalizeAttrValue(value).replace(/"/g, "&quot;");
}

function cleanNode(node, ctx) {
  if (node.type !== "element") return null;
  const tag = node.name;
  if (STRIP_ELEMENTS.has(tag)) return null;
  if (!RENDERED_ELEMENTS.has(tag)) return null;

  const rawAttrs = node.attributes || {};
  const attrs = {};
  for (const [k, v] of Object.entries(rawAttrs)) {
    if (shouldDropAttr(k)) continue;
    const reactName = jsxAttrName(k);
    if (!reactName) continue;
    let value = v;
    if (k === "fill" || k === "stroke") {
      const replaced = transformColor(value, k);
      if (replaced !== value) {
        value = replaced;
        ctx.colorReplaced = true;
      }
      if (SECONDARY_COLORS.has(v)) {
        ctx.usesSecondary = true;
      }
    }
    attrs[reactName] = value;
  }

  // For elements that originally used the secondary color but had no opacity,
  // add opacity 0.5 so the duotone effect survives currentColor collapse.
  const originalFill = rawAttrs.fill;
  const originalStroke = rawAttrs.stroke;
  const usedSecondary =
    (originalFill && SECONDARY_COLORS.has(originalFill)) ||
    (originalStroke && SECONDARY_COLORS.has(originalStroke));
  if (usedSecondary && !rawAttrs.opacity && !rawAttrs["fill-opacity"] && !rawAttrs["stroke-opacity"]) {
    attrs.opacity = "0.5";
  }

  const children = (node.children || [])
    .map((c) => cleanNode(c, ctx))
    .filter((c) => c !== null);

  return { tag, attrs, children };
}

function nodeToJsx(node, indent) {
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => `${k}="${escapeJsxAttr(v)}"`)
    .join(" ");
  const open = attrs ? `<${node.tag} ${attrs}` : `<${node.tag}`;
  if (!node.children || node.children.length === 0) {
    return `${indent}${open} />`;
  }
  const inner = node.children.map((c) => nodeToJsx(c, indent + "  ")).join("\n");
  return `${indent}${open}>\n${inner}\n${indent}</${node.tag}>`;
}

async function processSvg(file) {
  const raw = fs.readFileSync(file, "utf8");
  const tree = await parse(raw, { camelcase: false });
  const viewBox = (tree.attributes && tree.attributes.viewBox) || "0 0 24 24";
  const ctx = { colorReplaced: false, usesSecondary: false };
  const cleaned = (tree.children || []).map((c) => cleanNode(c, ctx)).filter(Boolean);
  return { viewBox, nodes: cleaned, ctx };
}

function fingerprint(viewBox, nodes) {
  const serialize = (n) => {
    const a = Object.entries(n.attrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("|");
    const c = (n.children || []).map(serialize).join(",");
    return `${n.tag}{${a}}(${c})`;
  };
  const key = `${viewBox}::${nodes.map(serialize).join(",")}`;
  return crypto.createHash("sha1").update(key).digest("hex");
}

async function main() {
  fs.rmSync(iconsDir, { recursive: true, force: true });
  fs.mkdirSync(iconsDir, { recursive: true });

  const files = readSvgFiles();
  console.log(`Found ${files.length} source SVGs`);

  const finalNames = new Set();
  const manifest = [];
  const collisions = [];
  const fingerprints = new Map(); // for stats only
  let processed = 0;

  for (const item of files) {
    const baseName = pascalCase(item.base);
    let componentName = `${baseName}${item.style}`;
    if (finalNames.has(componentName)) {
      let i = 2;
      while (finalNames.has(`${componentName}${i}`)) i++;
      collisions.push({ original: componentName, resolved: `${componentName}${i}`, source: item.file });
      componentName = `${componentName}${i}`;
    }
    finalNames.add(componentName);

    const { viewBox, nodes } = await processSvg(item.file);
    const fp = fingerprint(viewBox, nodes);
    fingerprints.set(fp, (fingerprints.get(fp) || 0) + 1);

    const jsxBody = nodes.map((n) => nodeToJsx(n, "    ")).join("\n");
    const componentSource = [
      `import { forwardRef } from "react";`,
      `import { IconBase } from "../IconBase";`,
      `import type { IconaIconProps } from "../IconBase";`,
      ``,
      `export const ${componentName} = forwardRef<SVGSVGElement, IconaIconProps>(function ${componentName}(props, ref) {`,
      `  return (`,
      `    <IconBase ref={ref} iconName="${componentName}" viewBox="${viewBox}" {...props}>`,
      jsxBody,
      `    </IconBase>`,
      `  );`,
      `});`,
      ``
    ].join("\n");

    fs.writeFileSync(path.join(iconsDir, `${componentName}.tsx`), componentSource);
    manifest.push({
      componentName,
      base: baseName,
      style: item.style,
      category: item.category,
      viewBox
    });

    processed++;
    if (processed % 1000 === 0) {
      console.log(`  ...generated ${processed}/${files.length}`);
    }
  }

  manifest.sort((a, b) => a.componentName.localeCompare(b.componentName));

  const exportLines = manifest
    .map(({ componentName }) => `export { ${componentName} } from "./icons/${componentName}";`)
    .join("\n");
  const namesLines = manifest
    .map(({ componentName }) => `  "${componentName}",`)
    .join("\n");

  const indexSource = [
    `export type { IconaIconProps, IconaIcon, IconaStyle } from "./IconBase";`,
    exportLines,
    ``,
    `export const iconNames = [`,
    namesLines,
    `] as const;`,
    ``,
    `export type IconaIconName = (typeof iconNames)[number];`,
    ``,
    `export const iconStyles = ["Linear", "Bold", "Outline", "Broken", "LineDuotone", "BoldDuotone"] as const;`,
    ``
  ].join("\n");

  fs.writeFileSync(indexPath, indexSource);

  const duplicateGroups = [...fingerprints.values()].filter((n) => n > 1).length;

  const report = {
    totalSvgFiles: files.length,
    uniqueIcons: manifest.length,
    geometryFingerprintsWithDuplicates: duplicateGroups,
    nameCollisionsResolvedNumerically: collisions.length,
    countByStyle: STYLES.reduce((acc, s) => {
      acc[s] = manifest.filter((m) => m.style === s).length;
      return acc;
    }, {}),
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Generated ${manifest.length} icon components across ${STYLES.length} styles`);
  console.log(`Wrote ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
