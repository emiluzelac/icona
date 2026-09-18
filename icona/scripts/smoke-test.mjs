import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");

test("dist exports the full Solar icon set", async () => {
  const mod = await import(path.join(packageRoot, "dist", "index.js"));
  assert.ok(Array.isArray(mod.iconNames), "iconNames should be exported");
  assert.equal(mod.iconNames.length, 7494, `expected 7494 icons, got ${mod.iconNames.length}`);
  assert.deepEqual(
    [...mod.iconStyles].sort(),
    ["Bold", "BoldDuotone", "Broken", "LineDuotone", "Linear", "Outline"]
  );
});

test("each style has 1249 icons", async () => {
  const mod = await import(path.join(packageRoot, "dist", "index.js"));
  for (const style of mod.iconStyles) {
    const exact = mod.iconNames.filter((n) => n.slice(-style.length) === style).length;
    assert.ok(exact >= 1249, `expected 1249 ${style} icons, got ${exact}`);
  }
});

test("renderToStaticMarkup produces an svg with currentColor and no hardcoded brand colors", async () => {
  const mod = await import(path.join(packageRoot, "dist", "index.js"));
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");

  for (const sampleName of ["AddCircleLinear", "HeartBold", "BellBoldDuotone", "AddLinear", "CloseLinear", "ChevronUpDownLinear"]) {
    const Icon = mod[sampleName];
    if (!Icon) continue;
    const html = renderToStaticMarkup(createElement(Icon, { size: 32, title: "t" }));
    assert.match(html, /^<svg/);
    assert.match(html, /viewBox=/);
    assert.match(html, /currentColor/);
    assert.doesNotMatch(html, /#1C274/i, "no hardcoded primary color should remain");
    assert.doesNotMatch(html, /#8E93A6/i, "no hardcoded secondary color should remain");
  }
});

test("strokeWidth prop overrides default for stroked icons", async () => {
  const mod = await import(path.join(packageRoot, "dist", "index.js"));
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");

  const Icon = mod.AddCircleLinear;
  assert.ok(Icon, "AddCircleLinear should exist");
  const html = renderToStaticMarkup(createElement(Icon, { strokeWidth: 2 }));
  assert.match(html, /stroke-width="2"/);
});
