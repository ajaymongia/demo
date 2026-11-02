import type { ReactNode } from 'react';

/** 20×20 line icons in the Figma's style: 1.6 stroke, round caps, currentColor. */
function Icon({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const CheckIcon = () => (
  <Icon>
    <path d="M4.5 10.4l3.6 3.6 7.4-8" strokeWidth="2.2" />
  </Icon>
);

export const ShieldIcon = () => (
  <Icon>
    <path d="M10 2.5 4 4.8v4.6c0 3.8 2.6 6.9 6 8.1 3.4-1.2 6-4.3 6-8.1V4.8z" />
    <path d="m7.4 10 1.8 1.8 3.6-3.8" />
  </Icon>
);

export const InfoIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 9v4.6M10 6.4v.1" strokeWidth="2" />
  </Icon>
);

export const AlertIcon = () => (
  <Icon>
    <path d="M10 3 2.6 16h14.8z" />
    <path d="M10 8v3.6M10 13.8v.1" strokeWidth="1.9" />
  </Icon>
);

export const BulbIcon = () => (
  <Icon>
    <path d="M7.2 13.6c-1.5-1.1-2.4-2.8-2.4-4.6a5.2 5.2 0 0 1 10.4 0c0 1.8-.9 3.5-2.4 4.6v1.6H7.2z" />
    <path d="M7.8 17.6h4.4" />
  </Icon>
);

export const PinIcon = () => (
  <Icon>
    <path d="M10 18s5.5-5.2 5.5-9.5a5.5 5.5 0 0 0-11 0C4.5 12.8 10 18 10 18z" />
    <circle cx="10" cy="8.5" r="2" />
  </Icon>
);

export const CameraIcon = () => (
  <Icon>
    <path d="M3 6.6h3l1.4-2h5.2l1.4 2h3v9.2H3z" />
    <circle cx="10" cy="10.9" r="2.8" />
  </Icon>
);

export const BellIcon = () => (
  <Icon>
    <path d="M5 13.8V9a5 5 0 0 1 10 0v4.8l1.4 1.6H3.6z" />
    <path d="M8.2 17.4a1.9 1.9 0 0 0 3.6 0" />
  </Icon>
);

export const PhoneIcon = () => (
  <Icon>
    <path d="M6.6 3.2 4 3.6c-.6 3.2.6 6.6 3.4 9.4s6.2 4 9.4 3.4l.4-2.6-3.4-1.6-1.6 1.6c-1.6-.6-3.4-2.4-4-4l1.6-1.6z" />
  </Icon>
);

export const IdCardIcon = () => (
  <Icon>
    <rect x="2.6" y="4.4" width="14.8" height="11.2" rx="2" />
    <circle cx="7.3" cy="9.3" r="1.7" />
    <path d="M4.9 13.2c.5-1.2 1.4-1.8 2.4-1.8s1.9.6 2.4 1.8M11.6 8.6h3.6M11.6 11.4h2.6" />
  </Icon>
);

export const TimerIcon = () => (
  <Icon>
    <circle cx="10" cy="11.2" r="6.2" />
    <path d="M8 2.6h4M10 2.6V5M10 8.2v3.2l2 1.4" />
  </Icon>
);

export const CalculatorIcon = () => (
  <Icon>
    <rect x="4.2" y="2.6" width="11.6" height="14.8" rx="2" />
    <path d="M7 6h6M7.2 10h.1M10 10h.1M12.8 10h.1M7.2 13.4h.1M10 13.4h.1M12.8 13.4h.1" strokeWidth="2" />
  </Icon>
);

export const PercentIcon = () => (
  <Icon>
    <path d="m5 15 10-10" />
    <circle cx="6" cy="6" r="1.8" />
    <circle cx="14" cy="14" r="1.8" />
  </Icon>
);

export const ClockIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.8V10l2.8 1.8" />
  </Icon>
);

export const BankIcon = () => (
  <Icon>
    <path d="M2.8 7.4 10 3.4l7.2 4zM4.6 8.6v6M8.2 8.6v6M11.8 8.6v6M15.4 8.6v6M2.8 16.6h14.4" />
  </Icon>
);

export const LockIcon = () => (
  <Icon>
    <rect x="4.2" y="8.6" width="11.6" height="8.4" rx="2" />
    <path d="M6.8 8.6V6.4a3.2 3.2 0 0 1 6.4 0v2.2" />
  </Icon>
);

export const EditIcon = () => (
  <Icon>
    <path d="M12.2 4.2 15.8 7.8 8.4 15.2l-4.2 1 1-4.2z" />
    <path d="m10.6 5.8 3.6 3.6" />
  </Icon>
);

export const ChevronIcon = () => (
  <Icon>
    <path d="m5.6 7.8 4.4 4.4 4.4-4.4" />
  </Icon>
);

export const StarIcon = () => (
  <Icon fill>
    <path d="m10 2.4 2.3 4.9 5.3.6-3.9 3.7 1 5.3L10 14.3l-4.7 2.6 1-5.3-3.9-3.7 5.3-.6z" />
  </Icon>
);

export const DownloadIcon = () => (
  <Icon>
    <path d="M10 3.4v9M6.2 8.8 10 12.6l3.8-3.8M4 16.4h12" />
  </Icon>
);

export const DocIcon = () => (
  <Icon>
    <path d="M5 2.8h6.6L15 6.2v11H5z" />
    <path d="M11.4 2.8v3.6H15M7.6 10h4.8M7.6 13h4.8" />
  </Icon>
);

export const HomeIcon = () => (
  <Icon>
    <path d="M3.2 9.2 10 3.6l6.8 5.6M5 7.8v8.6h10V7.8" />
    <path d="M8.4 16.4v-4.2h3.2v4.2" />
  </Icon>
);

export const ClipboardIcon = () => (
  <Icon>
    <rect x="4.4" y="3.6" width="11.2" height="13.8" rx="1.8" />
    <path d="M7.6 3.6V2.6h4.8v1M7.4 9.6l1.6 1.6 3.4-3.4M7.4 14.2h5.2" />
  </Icon>
);

export const VideoIcon = () => (
  <Icon>
    <rect x="2.6" y="5.4" width="10.6" height="9.2" rx="2" />
    <path d="m13.2 8.8 4.2-2.4v7.2l-4.2-2.4" />
  </Icon>
);

export const BatteryIcon = () => (
  <Icon>
    <rect x="2.6" y="6.4" width="13" height="7.2" rx="1.6" />
    <path d="M17.4 8.8v2.4M5 8.8v2.4M7.4 8.8v2.4M9.8 8.8v2.4" />
  </Icon>
);

export const SunIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="3.2" />
    <path d="M10 2.6v1.6M10 15.8v1.6M2.6 10h1.6M15.8 10h1.6M4.8 4.8l1.1 1.1M14.1 14.1l1.1 1.1M4.8 15.2l1.1-1.1M14.1 5.9l1.1-1.1" />
  </Icon>
);

export const WifiIcon = () => (
  <Icon>
    <path d="M2.8 7.6a10.4 10.4 0 0 1 14.4 0M5.2 10.2a7 7 0 0 1 9.6 0M7.6 12.8a3.4 3.4 0 0 1 4.8 0" />
    <circle cx="10" cy="15.6" r=".6" fill="currentColor" />
  </Icon>
);

export const FaceIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M7.2 12.2c.7.9 1.7 1.4 2.8 1.4s2.1-.5 2.8-1.4M7.4 8.2v.2M12.6 8.2v.2" />
  </Icon>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="8.8" cy="8.8" r="5.4" />
    <path d="m12.8 12.8 4 4" />
  </Icon>
);

export const LocateIcon = () => (
  <Icon>
    <circle cx="10" cy="10" r="5" />
    <circle cx="10" cy="10" r="1.6" fill="currentColor" />
    <path d="M10 2.4V5M10 15v2.6M2.4 10H5M15 10h2.6" />
  </Icon>
);

export const UserIcon = () => (
  <Icon>
    <circle cx="10" cy="6.4" r="3.2" />
    <path d="M3.8 17.4c0-3.4 2.8-6 6.2-6s6.2 2.6 6.2 6" />
  </Icon>
);

export const RupeeIcon = () => (
  <Icon>
    <path d="M6 4h8M6 7.4h8M6 4h2.6a3.4 3.4 0 0 1 0 6.8H6l6.4 6" />
  </Icon>
);

export const QrIcon = () => (
  <Icon>
    <rect x="3" y="3" width="5.4" height="5.4" rx=".8" />
    <rect x="11.6" y="3" width="5.4" height="5.4" rx=".8" />
    <rect x="3" y="11.6" width="5.4" height="5.4" rx=".8" />
    <path d="M11.6 11.6h2.2v2.2M17 11.6v.1M11.6 17h.1M14.6 14.6H17V17h-2.4z" />
  </Icon>
);

export const SendIcon = () => (
  <Icon>
    <path d="M17 3 8.6 11.4M17 3l-5.2 14-3.2-5.6L3 8.2z" />
  </Icon>
);

/** The AI mark: a four-point sparkle with a small one beside it. */
export const SparkleIcon = () => (
  <Icon fill>
    <path d="M8.5 2.5c.5 3.6 2 5.1 5.5 5.6-3.5.5-5 2-5.5 5.6-.5-3.6-2-5.1-5.5-5.6 3.5-.5 5-2 5.5-5.6z" />
    <path d="M15 11.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3z" />
  </Icon>
);

export const ChatIcon = () => (
  <Icon>
    <path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5z" />
    <path d="M6.5 8.5h7M6.5 11h4.5" />
  </Icon>
);
