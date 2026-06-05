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
  useEffect,
  useMemo,
  useRef,
  useState,
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

const indexed = iconNames.map((name) => {
  const { base, style } = splitName(name);
  return {
    name,
    base,
    style,
    haystack: `${name.toLowerCase()} ${searchTokens(base)}`
  };
});

export function App() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<IconaStyle>("Linear");
  const [active, setActive] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

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
      <div className="sticky top-0 z-20 border-b border-white/10 bg-gray-900/90 backdrop-blur">
        <header className="px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-3">
            <CrownMinimalisticBoldDuotone size={32} className="text-amber-400" />
            <h1 className="text-xl font-semibold tracking-tight text-white">Icona</h1>
          </div>
        </header>

        <div className="px-4 pb-3 sm:px-6 sm:pb-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Field className="min-w-0 sm:flex-1">
              <Label className="sr-only">Search icons</Label>
              <Input
                autoFocus
                type="search"
                placeholder={`Search ${filtered.length.toLocaleString()} ${style} icons…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full rounded-lg border-none bg-white/5 px-3 py-1.5 text-sm/6 text-white placeholder:text-white/40 focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25"
              />
            </Field>

            <TabGroup
              selectedIndex={styleIndex >= 0 ? styleIndex : 0}
              onChange={(i) => setStyle(STYLE_ORDER[i])}
              className="-mx-4 sm:mx-0"
            >
              <TabList className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-1 sm:overflow-visible sm:px-0 sm:pb-0">
                {STYLE_ORDER.map((s) => (
                  <Tab
                    key={s}
                    className="shrink-0 cursor-pointer rounded-full px-3 py-1 text-sm/6 font-semibold text-white focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-white/5 data-selected:bg-white/10 data-selected:data-hover:bg-white/10"
                  >
                    {s}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </div>
        </div>
      </div>

      <main className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-sm text-white/50">
              No icons match “{query}”.
            </div>
          ) : (
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}
            >
              {filtered.map((item) => {
                const Icon = iconMap[item.name];
                if (!Icon) return null;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActive(item.name)}
                    title={item.base}
                    className="flex aspect-square cursor-pointer items-center justify-center rounded-lg text-white/80 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon size={28} />
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
      <div className="pointer-events-none fixed inset-0 z-30 flex w-screen items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className="pointer-events-auto w-full max-w-md rounded-xl bg-white p-5 text-gray-900 shadow-2xl ring-1 ring-black/5 duration-300 ease-out data-closed:scale-95 data-closed:opacity-0 sm:p-6"
        >
          {Icon && meta && name && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle as="h3" className="font-mono text-base/7 font-medium text-gray-900">
                    {meta.base}
                  </DialogTitle>
                  <p className="text-sm/6 text-gray-500">
                    {meta.style} · <span className="font-mono">{name}</span>
                  </p>
                </div>
                <CloseButton onClick={onClose} />
              </div>

              <div className="mt-4 flex items-center justify-center rounded-lg bg-gray-50 py-12 text-gray-900">
                {createElement(Icon, { ref: svgRef, size: 96 })}
              </div>

              <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs/5 text-gray-800">
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
      className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-gray-900 data-hover:bg-gray-800 data-open:bg-gray-900"
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
      className="flex size-8 cursor-pointer items-center justify-center rounded-md text-gray-500 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-gray-900 data-hover:bg-gray-100 data-hover:text-gray-900"
    >
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </Button>
  );
}
