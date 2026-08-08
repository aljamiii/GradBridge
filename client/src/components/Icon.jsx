// Hand-written 24×24 stroke icons — no icon library dependency (the project
// is free-stack and every byte is ours). All icons share the same grid,
// stroke width and round caps so they read as one set.
//
// Usage: <Icon name="compass" className="h-5 w-5" />

const PATHS = {
  // --- navigation / structure ---
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  map: "M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z",

  // --- study / academic ---
  graduation: "M12 4 2.5 8.5 12 13l9.5-4.5L12 4ZM6.5 10.8V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-5.2M20.5 9v5",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5ZM4 19.5A2.5 2.5 0 0 0 6.5 22H19v-5",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  gift: "M20 12v8.5H4V12M2.5 7.5h19V12h-19zM12 7.5V21M12 7.5S10.5 3 8 3a2.25 2.25 0 0 0 0 4.5h4Zm0 0s1.5-4.5 4-4.5a2.25 2.25 0 0 1 0 4.5h-4Z",

  // --- money / analysis ---
  wallet: "M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3M3 7.5V18a2.5 2.5 0 0 0 2.5 2.5H19a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5Zm14.5 5.5h.01",
  trendingUp: "M3.5 16.5 9 11l4 4 7.5-7.5M15.5 7.5h5v5",
  trendingDown: "M3.5 7.5 9 13l4-4 7.5 7.5M15.5 16.5h5v-5",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  puzzle: "M9 3.5A1.75 1.75 0 0 1 12.5 3.5V5h3a1 1 0 0 1 1 1v3h1.5a1.75 1.75 0 0 1 0 3.5H16.5v3a1 1 0 0 1-1 1h-3v-1.5a1.75 1.75 0 0 0-3.5 0V16.5h-3a1 1 0 0 1-1-1v-3H5.5a1.75 1.75 0 0 1 0-3.5H7V6a1 1 0 0 1 1-1h1V3.5Z",

  // --- people / social ---
  users: "M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM22 20v-1.5a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  user: "M19 20v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  message: "M21 11.5a8 8 0 0 1-8.5 8 9 9 0 0 1-3.9-.9L3 20.5l1.9-5.1A8 8 0 0 1 4 11.5a8 8 0 0 1 8-8 8 8 0 0 1 9 8Z",
  calendar: "M8 2.5V6M16 2.5V6M3.5 9.5h17M5.5 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",

  // --- documents / travel ---
  passport: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm6 8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-2.5 5h5",
  briefcase: "M3.5 8.5h17a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm5 0V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2.5M2.5 13.5h19",
  checklist: "M4 6.5h2l1.5 1.5L10 5M4 12.5h2l1.5 1.5L10 11M4 18.5h2l1.5 1.5L10 17M13 7h7M13 13h7M13 19h7",

  // --- utility ---
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-3.5a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2Z",
  logout: "M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6",
  menu: "M3.5 7h17M3.5 12h17M3.5 17h17",
  close: "M6 6l12 12M18 6L6 18",
  chevronDown: "M6 9.5l6 6 6-6",
  chevronRight: "M9.5 6l6 6-6 6",
  arrowRight: "M4 12h15M13 6l6 6-6 6",
  search: "M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm6-1.5 4 4",
  bell: "M18 8.5a6 6 0 1 0-12 0c0 5-2.5 6.5-2.5 6.5h17S18 13.5 18 8.5ZM13.7 19a2 2 0 0 1-3.4 0",
  shield: "M12 21s7.5-3.5 7.5-9V5.5L12 3 4.5 5.5V12c0 5.5 7.5 9 7.5 9Z",
  sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9L19 15Z",
  check: "M4.5 12.5l5 5 10-11",
  star: "M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5Z",
  external: "M14 4.5h5.5V10M20 4.5 11 13.5M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3 2",
  location: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  bridge: "M2.5 17.5h19M5 17.5V9m14 8.5V9M2.5 11a9.5 9.5 0 0 1 19 0M9.5 17.5v-4.2M14.5 17.5v-4.2",
};

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.7, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
