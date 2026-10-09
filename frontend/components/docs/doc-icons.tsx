import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Blue document glyph used for the app logo slot and doc tiles. */
export function DocIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 32" aria-hidden {...props}>
      <path d="M2 0h14l8 8v22a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2Z" fill="#4285f4" />
      <path d="M16 0l8 8h-6a2 2 0 0 1-2-2V0Z" fill="#a1c2fa" />
      <path d="M6 15h12M6 19h12M6 23h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export const ToolbarIcons = {
  undo: (p: IconProps) => (
    <svg {...base} {...p}><path d="M7 8H13a4 4 0 0 1 0 8H9" /><path d="M9.5 5.5 7 8l2.5 2.5" /></svg>
  ),
  redo: (p: IconProps) => (
    <svg {...base} {...p}><path d="M13 8H7a4 4 0 0 0 0 8h4" /><path d="M10.5 5.5 13 8l-2.5 2.5" /></svg>
  ),
  highlight: (p: IconProps) => (
    <svg {...base} {...p}><path d="m11.5 4.5 4 4-6 6H5.5v-4l6-6Z" /><path d="M4 17.5h12" strokeWidth={2.4} stroke="#fbbc04" /></svg>
  ),
  link: (p: IconProps) => (
    <svg {...base} {...p}><path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.8.8" /><path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l.8-.8" /></svg>
  ),
  alignLeft: (p: IconProps) => (
    <svg {...base} {...p}><path d="M4 5h12M4 8.5h8M4 12h12M4 15.5h8" /></svg>
  ),
  alignCenter: (p: IconProps) => (
    <svg {...base} {...p}><path d="M4 5h12M6 8.5h8M4 12h12M6 15.5h8" /></svg>
  ),
  alignRight: (p: IconProps) => (
    <svg {...base} {...p}><path d="M4 5h12M8 8.5h8M4 12h12M8 15.5h8" /></svg>
  ),
  alignJustify: (p: IconProps) => (
    <svg {...base} {...p}><path d="M4 5h12M4 8.5h12M4 12h12M4 15.5h12" /></svg>
  ),
  bulletList: (p: IconProps) => (
    <svg {...base} {...p}><circle cx="4.5" cy="6" r=".9" fill="currentColor" /><circle cx="4.5" cy="10" r=".9" fill="currentColor" /><circle cx="4.5" cy="14" r=".9" fill="currentColor" /><path d="M8 6h8M8 10h8M8 14h8" /></svg>
  ),
  orderedList: (p: IconProps) => (
    <svg {...base} {...p}><path d="M8 6h8M8 10h8M8 14h8" /><text x="2.6" y="7.6" fontSize="4.6" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="2.6" y="11.6" fontSize="4.6" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="2.6" y="15.6" fontSize="4.6" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
  ),
  checklist: (p: IconProps) => (
    <svg {...base} {...p}><rect x="3" y="4" width="4" height="4" rx=".8" /><path d="m3.6 13.3 1.2 1.2 2-2.3" /><path d="M10 6h7M10 13.5h7" /></svg>
  ),
  quote: (p: IconProps) => (
    <svg {...base} {...p}><path d="M5 6v8M9 7h7M9 10h7M9 13h5" /></svg>
  ),
  codeBlock: (p: IconProps) => (
    <svg {...base} {...p}><path d="m7.5 6.5-3.5 3.5 3.5 3.5M12.5 6.5l3.5 3.5-3.5 3.5" /></svg>
  ),
  clearFormat: (p: IconProps) => (
    <svg {...base} {...p}><path d="M5 5h9M9.5 5l-2 10M13 12l4 4M17 12l-4 4" /></svg>
  ),
  horizontalRule: (p: IconProps) => (
    <svg {...base} {...p}><path d="M3.5 10h13" /></svg>
  ),
};
