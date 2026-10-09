import type { SdlcPhaseKey } from "@/lib/types";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function RequirementsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path strokeLinejoin="round" d="M14 3v5h5" />
      <path strokeLinecap="round" d="M8.5 12.5h7M8.5 15.5h7M8.5 9.5h3" />
    </svg>
  );
}

function DesignIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3" y="5" width="15" height="14" rx="1.5" />
      <path strokeLinecap="round" d="M6.5 9h4v3.5h-4zM6.5 15.5h8M13 9h2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.5 14.5 5-5a1.4 1.4 0 0 0-2-2l-5 5-.6 2.6 2.6-.6Z" />
    </svg>
  );
}

function DevelopmentIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="2.5" y="4" width="19" height="13" rx="1.5" />
      <path strokeLinecap="round" d="M9 21h6M12 17v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 8.5-2 2 2 2M15.5 8.5l2 2-2 2M13 7.5l-2 6" />
    </svg>
  );
}

function TestingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8a4 4 0 0 1 8 0v1H8V8Z" />
      <path strokeLinejoin="round" d="M7 9h10v5a5 5 0 0 1-10 0V9Z" />
      <path strokeLinecap="round" d="M12 9v10M7 12.5H3.5M20.5 12.5H17M7.5 17l-3 2M16.5 17l3 2M8.5 5 6.5 3M15.5 5l2-2" />
    </svg>
  );
}

function DeploymentIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11a4 4 0 0 1 .5-7.9A5 5 0 0 1 17 4.5a3.3 3.3 0 0 1 .5 6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10V5.5m0 0-2 2m2-2 2 2" />
      <rect x="4" y="13" width="16" height="3.5" rx="1" />
      <rect x="4" y="17.5" width="16" height="3.5" rx="1" />
      <path strokeLinecap="round" d="M7 14.75h.01M7 19.25h.01" />
    </svg>
  );
}

function MaintenanceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 6.5a4 4 0 0 0 5 5l-1.2-1.2M14.5 6.5l3.3 3.3m-3.3-3.3a4 4 0 0 1 5-3.3l-2.2 2.2.6 1.7 1.7.6 2.2-2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.2 10.3-9.7 9.7a1.6 1.6 0 0 1-2.3-2.3l9.7-9.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 4 2.5.8 6.2 6.2-1.7 1.7-6.2-6.2L4 4Z" />
      <path strokeLinecap="round" d="m14 14 5.5 5.5" />
    </svg>
  );
}

const ICONS: Record<SdlcPhaseKey, (props: IconProps) => React.JSX.Element> = {
  requirements: RequirementsIcon,
  design: DesignIcon,
  development: DevelopmentIcon,
  testing: TestingIcon,
  deployment: DeploymentIcon,
  maintenance: MaintenanceIcon,
};

export function SdlcPhaseIcon({ phase, ...props }: IconProps & { phase: SdlcPhaseKey }) {
  const Icon = ICONS[phase];
  return <Icon {...props} />;
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
