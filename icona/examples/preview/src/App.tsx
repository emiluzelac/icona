import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
  Tab,
  TabGroup,
  TabList
} from "@headlessui/react";
import {
  createElement,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode
} from "react";
import * as Icona from "@emiluzelac/icona";
import { CrownMinimalisticBoldDuotone, iconNames, iconStyles } from "@emiluzelac/icona";
import type { IconaIconProps, IconaStyle } from "@emiluzelac/icona";

type IconComponent = (props: IconaIconProps) => JSX.Element;
const iconMap = Icona as unknown as Record<string, IconComponent>;

const STYLE_SUFFIXES = [...iconStyles].sort((a, b) => b.length - a.length);
const STYLE_ORDER: IconaStyle[] = [
  "Linear",
  "Bold",
  "Outline",
  "Broken",
  "LineDuotone",
  "BoldDuotone"
];

function splitName(name: string): { base: string; style: IconaStyle } {
  for (const s of STYLE_SUFFIXES) {
    if (name.endsWith(s)) {
      return { base: name.slice(0, -s.length), style: s as IconaStyle };
    }
  }
  return { base: name, style: "Linear" };
}

function searchTokens(base: string): string {
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();
}

/** Split CamelCase into space-separated words for display (e.g. "ArrowUp" → "Arrow Up"). */
function displayName(base: string): string {
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

const indexed = iconNames.map((name) => {
  const { base, style } = splitName(name);
  return {
    name,
    base,
    style,
    haystack: `${name.toLowerCase()} ${searchTokens(base)}`
  };
});

/* Theme -------------------------------------------------------------------- */

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" || attr === "dark" ? attr : "light";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("icona-theme", next);
      return next;
    });
  };

  return { theme, toggleTheme };
}

/* App ---------------------------------------------------------------------- */

export function App() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<IconaStyle>("Linear");
  const [active, setActive] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const { theme, toggleTheme } = useTheme();

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    const list = indexed.filter((it) => it.style === style);
    if (!q) return list;
    const tokens = q.split(/\s+/);
    return list.filter(({ haystack }) => tokens.every((t) => haystack.includes(t)));
  }, [deferred, style]);

  const styleIndex = STYLE_ORDER.indexOf(style);

  return (
    <div className="min-h-screen">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <header className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <CrownMinimalisticBoldDuotone
                size={26}
                className="shrink-0 text-amber-500 dark:text-amber-400"
              />
              <div>
                <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white leading-none">
                  Icona
                </h1>
                <p className="mt-0.5 hidden text-xs text-gray-500 dark:text-slate-400 sm:block">
                  {iconNames.length.toLocaleString()} icons &middot; {STYLE_ORDER.length} styles
                </p>
              </div>
            </div>

            {/* Theme toggle */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="px-4 pb-3 sm:px-6 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {/* Search */}
            <Field className="min-w-0 sm:flex-1">
              <Label className="sr-only">Search icons</Label>
              <Input
                autoFocus
                type="search"
                placeholder={`Search ${filtered.length.toLocaleString()} ${style} icons…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-1.5 text-sm/6 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-blue-500/40 dark:data-focus:outline-white/25"
              />
            </Field>

            {/* Style tabs */}
            <TabGroup
              selectedIndex={styleIndex >= 0 ? styleIndex : 0}
              onChange={(i) => setStyle(STYLE_ORDER[i])}
              className="-mx-4 sm:mx-0"
            >
              <TabList className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-1 sm:overflow-visible sm:px-0 sm:pb-0">
                {STYLE_ORDER.map((s) => (
                  <Tab
                    key={s}
                    className="shrink-0 cursor-pointer rounded-full px-3 py-1 text-sm/6 font-medium text-gray-600 dark:text-slate-300 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-gray-400 dark:data-focus:outline-white/40 data-hover:bg-gray-100 dark:data-hover:bg-white/5 data-selected:bg-gray-900 data-selected:text-white dark:data-selected:bg-white/15 dark:data-selected:text-white data-selected:data-hover:bg-gray-700 dark:data-selected:data-hover:bg-white/20"
                  >
                    {s}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </div>
        </div>
      </div>

      {/* ── Icon grid ─────────────────────────────────────────────────────── */}
      <main className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="w-full">
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-sm text-gray-400 dark:text-white/40">
              No icons match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}
            >
              {filtered.map((item) => {
                const Icon = iconMap[item.name];
                if (!Icon) return null;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActive(item.name)}
                    title={item.name}
                    className="group flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-gray-500 dark:text-white/70 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white focus:not-data-focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/25"
                  >
                    <Icon size={36} />
                    <span className="w-full truncate px-1 text-center text-[11px] leading-tight text-gray-400 dark:text-white/30 group-hover:text-gray-500 dark:group-hover:text-white/50">
                      {displayName(item.base)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <IconDialog name={active} onClose={() => setActive(null)} />
    </div>
  );
}

/* Theme toggle ------------------------------------------------------------- */

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white focus:not-data-focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-white/25"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* Icon detail dialog ------------------------------------------------------- */

function IconDialog({ name, onClose }: { name: string | null; onClose: () => void }) {
  const Icon = name ? iconMap[name] : null;
  const meta = name ? splitName(name) : null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState<"svg" | "import" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const getSvgString = (): string | null => {
    if (!svgRef.current) return null;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("data-icona");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  };

  const handleCopySvg = async () => {
    const svg = getSvgString();
    if (!svg) return;
    await navigator.clipboard.writeText(svg);
    setCopied("svg");
  };

  const handleCopyImport = async () => {
    if (!name) return;
    await navigator.clipboard.writeText(`import { ${name} } from "@emiluzelac/icona";`);
    setCopied("import");
  };

  const handleDownload = () => {
    const svg = getSvgString();
    if (!svg || !name) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={Boolean(name)}
      as="div"
      className="relative z-30 focus:outline-none"
      onClose={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/50" aria-hidden="true" />

      {/* Panel container */}
      <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 p-5 text-gray-900 dark:text-slate-100 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 duration-300 ease-out data-closed:scale-95 data-closed:opacity-0 sm:p-6"
        >
          {Icon && meta && name && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle
                    as="h3"
                    className="font-mono text-base/7 font-medium text-gray-900 dark:text-white"
                  >
                    {meta.base}
                  </DialogTitle>
                  <p className="text-sm/6 text-gray-500 dark:text-slate-400">
                    {meta.style} &middot; <span className="font-mono">{name}</span>
                  </p>
                </div>
                <CloseButton onClick={onClose} />
              </div>

              <div className="mt-4 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-700 py-12 text-gray-900 dark:text-white">
                {createElement(Icon, { ref: svgRef, size: 96 })}
              </div>

              <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-100 dark:bg-slate-700/60 p-3 text-xs/5 text-gray-800 dark:text-slate-200">
                <code>{`import { ${name} } from "@emiluzelac/icona";`}</code>
              </pre>

              <div className="mt-4 flex flex-wrap gap-2">
                <DialogButton onClick={handleCopySvg}>
                  {copied === "svg" ? "Copied!" : "Copy SVG"}
                </DialogButton>
                <DialogButton onClick={handleCopyImport}>
                  {copied === "import" ? "Copied!" : "Copy import"}
                </DialogButton>
                <DialogButton onClick={handleDownload}>Download SVG</DialogButton>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function DialogButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-900 dark:bg-slate-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 dark:shadow-black/20 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-gray-900 dark:data-focus:outline-slate-400 data-hover:bg-gray-700 dark:data-hover:bg-slate-500 data-open:bg-gray-900"
    >
      {children}
    </Button>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      aria-label="Close"
      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 dark:text-slate-400 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-gray-500 dark:data-focus:outline-slate-400 data-hover:bg-gray-100 dark:data-hover:bg-slate-700 data-hover:text-gray-700 dark:data-hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </Button>
  );
}

