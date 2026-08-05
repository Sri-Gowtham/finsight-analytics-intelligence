export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

export const crore = (n: number) => {
  if (Math.abs(n) >= 100000) return `₹${inr(Math.round(n / 1000) / 100)} L Cr`;
  return `₹${inr(Math.round(n))} Cr`;
};

export const pct = (n: number, digits = 2) => `${n.toFixed(digits)}%`;

export const bps = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 100)} bps`;

export const signedPct = (n: number, digits = 2) =>
  `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const roleLabel = (role: string) =>
  role === "cfo" ? "CFO" : role.charAt(0).toUpperCase() + role.slice(1);
