/** Input checks used by the chat's forms. Each returns an error message, or null when valid. */

export const phoneError = (digits: string) =>
  /^[6-9]\d{9}$/.test(digits) ? null : 'Please enter a valid 10-digit mobile number';

export const panError = (pan: string) =>
  /^[A-Z]{5}\d{4}[A-Z]$/.test(pan) ? null : 'Please enter a valid PAN, e.g. ABCDE1234F';

export const aadhaarError = (digits: string) =>
  /^[2-9]\d{11}$/.test(digits) ? null : 'Aadhaar is 12 digits and doesn’t start with 0 or 1';

export const accountError = (digits: string) =>
  /^\d{9,18}$/.test(digits) ? null : 'Account numbers are 9 to 18 digits';

export const upiError = (id: string) =>
  /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(id.trim()) ? null : 'Please follow the format username@upi';

export const emailError = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : 'Please enter a valid email ID';

export const nameError = (name: string) =>
  /^[A-Za-z][A-Za-z .']{1,59}$/.test(name.trim()) ? null : 'Please enter a name using letters only';

export const requiredError = (value: string, label: string) => (value.trim() ? null : `Please enter ${label}`);
