import { forwardRef } from "react";
import type { ReactElement, ReactNode, SVGProps } from "react";

export type IconaStyle =
  | "Linear"
  | "Bold"
  | "Outline"
  | "Broken"
  | "LineDuotone"
  | "BoldDuotone";

export interface IconaIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Width and height of the icon in pixels. Defaults to 24. */
  size?: number | string;
  /** Stroke width override (only meaningful for stroked styles). */
  strokeWidth?: number | string;
  /** Optional accessible title. When provided, the icon is exposed as `role="img"`. */
  title?: string;
}

export type IconaIcon = ReturnType<typeof forwardRef<SVGSVGElement, IconaIconProps>>;

interface InternalIconProps extends IconaIconProps {
  iconName: string;
  viewBox: string;
  children: ReactNode;
}

export const IconBase = /* @__PURE__ */ forwardRef<SVGSVGElement, InternalIconProps>(function IconBase(
  { iconName, viewBox, children, size = 24, title, color = "currentColor", strokeWidth, ...rest },
  ref
): ReactElement {
  const labelled = typeof title === "string" && title.length > 0;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      color={color}
      fill="none"
      role={labelled ? "img" : "presentation"}
      aria-hidden={labelled ? undefined : true}
      data-icona={iconName}
      strokeWidth={strokeWidth}
      {...rest}
    >
      {labelled ? <title>{title}</title> : null}
      {children}
    </svg>
  );
});
