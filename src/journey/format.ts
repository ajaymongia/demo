const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export const rupees = (n: number) => `₹${inr.format(Math.round(n))}`;
export const digitsIn = (n: number) => inr.format(Math.round(n));
export const timeNow = () => timeFormat.format(new Date()).toUpperCase();

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** "+91 98765 43210" */
export const formatPhone = (digits: string) => `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`.trim();

/** Keep the last `keep` characters: "••••••0589". */
export const maskTail = (s: string, keep = 4, char = '•') =>
  char.repeat(Math.max(0, s.length - keep)) + s.slice(-keep);

/** "XXXX XXXX 6782" */
export const maskAadhaar = (digits: string) => `XXXX XXXX ${digits.slice(-4)}`;

/** "1234 5678 9012" while typing. */
export const groupAadhaar = (digits: string) => digits.replace(/(\d{4})(?=\d)/g, '$1 ');

export const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export const ordinal = (n: number) => {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
};
