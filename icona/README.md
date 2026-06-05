# icona

7,476 icons across 6 visual styles, sourced from [Solar Icons](https://solar-icons.vercel.app)
by [480 Design](https://www.figma.com/community/file/1166831539721848736)
and exposed as tree-shakeable React components. The API is inspired by
[Lucide](https://lucide.dev) (per-icon ESM exports, `forwardRef`, `currentColor`)
and [Phosphor Icons](https://phosphoricons.com) (multiple weights/styles).

## Install

```bash
npm install @emiluzelac/icona
```

Peer deps: `react ^17 || ^18 || ^19`.

## Usage

```tsx
import { HeartLinear, HeartBoldDuotone, BellOutline } from "@emiluzelac/icona";

export function Toolbar() {
  return (
    <>
      <HeartLinear size={24} />
      <HeartBoldDuotone size={32} color="crimson" />
      <BellOutline size={20} strokeWidth={2} />
    </>
  );
}
```

Every icon accepts the standard `SVGProps<SVGSVGElement>` plus:

| Prop          | Type                  | Default        | Notes                                                              |
| ------------- | --------------------- | -------------- | ------------------------------------------------------------------ |
| `size`        | `number \| string`    | `24`           | Sets `width` and `height`.                                         |
| `color`       | `string`              | `currentColor` | All paths reference `currentColor`, so this works via CSS too.     |
| `strokeWidth` | `number \| string`    | `1.5`          | Forwarded to the root SVG; affects stroked styles.                 |
| `title`       | `string`              | —              | When set, adds `<title>` and `role="img"` for accessibility.       |

## Styles

Each base icon ships in 6 styles. The component name is `<BaseName><Style>`:

| Style          | Visual                              | Example                  |
| -------------- | ----------------------------------- | ------------------------ |
| `Linear`       | Outline strokes                     | `HeartLinear`            |
| `Outline`      | Outlined fill (closed paths)        | `HeartOutline`           |
| `Bold`         | Solid fills                         | `HeartBold`              |
| `BoldDuotone`  | Solid + 50% opacity layer           | `HeartBoldDuotone`       |
| `LineDuotone`  | Lines + 50% opacity fill            | `HeartLineDuotone`       |
| `Broken`       | Stylized broken outline             | `HeartBroken`            |

Discoverable at runtime:

```ts
import { iconNames, iconStyles } from "@emiluzelac/icona";

iconStyles; // ["Bold", "BoldDuotone", "Broken", "LineDuotone", "Linear", "Outline"]
iconNames.length; // 7476
```

> **Tip — naming icons starting with a digit:** SVGs whose filename begins with
> a number get an `Icon` prefix, e.g. `4k.svg` → `Icon4kLinear`.

## Color & duotone behavior

The source SVGs use a few hardcoded colors. They are normalized at build time:

- Primary fills/strokes (`#1C274C`, `#1C274D`) → `currentColor`.
- Duotone secondary (`#8E93A6`) → `currentColor` with `opacity="0.5"` applied
  to that element. This preserves the visual layering while making the icon
  fully themeable from CSS.

Result: every icon is monochrome via `color` (or any ancestor's `color`) and
duotone variants automatically adapt to your theme.

## Tree-shaking

Icona ships a single barrel (`dist/index.js`) with `sideEffects: false` and
fully isolated icon definitions. Modern bundlers (Vite, webpack 5, esbuild,
Rollup, Next.js, Remix) include only what you import — even though the package
exposes 7,476 components, your bundle only gets the ones you use.

## Demo

A live preview app with search, style switcher, and click-to-copy lives in
[examples/preview](./examples/preview):

```bash
cd examples/preview
npm install
npm run dev
```

## Scripts (this repo)

```bash
npm run generate   # regenerate src/icons/*.tsx + src/index.ts from /svg
npm run build      # tsup → dist/index.{js,cjs,d.ts}
npm test           # smoke tests against dist
```

## License & credits

Icon artwork: [Solar Icons](https://solar-icons.vercel.app) by
[480 Design](https://www.figma.com/@480design), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This package
(generated components and tooling) is distributed under the same terms —
see [LICENSE](./LICENSE). If you use icona, the Solar attribution carries
through; no extra action is needed beyond keeping this notice.
