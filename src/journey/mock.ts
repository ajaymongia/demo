import { LIMITS } from './pricing';
import type { Answers, StartAt, StepId } from './types';

/**
 * Mock responses standing in for the real services (CKYC/PAN, bureau, Account Aggregator, DigiLocker,
 * mandate, eSign). Names and addresses follow the Figma file.
 */
export const CUSTOMER = {
  firstName: 'Mayank',
  lastName: 'Sharma',
  dob: '13-01-2000',
  gender: 'Male',
  fatherName: 'Mukesh Sharma',
  motherName: 'Rinku Sharma',
  email: 'mayank.sharma@gmail.com',
};

export const fullName = `${CUSTOMER.firstName} ${CUSTOMER.lastName}`;

export const CKYC_ADDRESS = {
  permanent: 'B-25, Appinventiv Technology, Sector 58, Noida, Uttar Pradesh 201301',
  current: 'H-14, Skytech Matrott, Sector 76, Noida, Uttar Pradesh 201301',
  pincode: '201301',
  area: 'Noida, UP',
};

export const AADHAAR_ADDRESS = 'H.No 40, Parwana Road, Radhey Shyam Park, Krishna Nagar, East Delhi, Delhi 110051';

/** Address search suggestions (mailing address and office address). */
export const PLACES = [
  { name: 'Skytech Matrott', area: 'Sector 76, Noida, Uttar Pradesh 201301' },
  { name: 'Aditya Celebrity Homes', area: 'Sector 76, Noida, Uttar Pradesh 201301' },
  { name: 'Crossings Republik', area: 'Ghaziabad, Uttar Pradesh 201016' },
  { name: 'C Block, Sector 63', area: 'Noida, Uttar Pradesh 201301' },
  { name: 'B-25, Sector 58', area: 'Noida, Uttar Pradesh 201301' },
  { name: 'Greenwave Solutions', area: 'Sector 16, Gurugram, Haryana 122001' },
  { name: 'FusionWare Technologies', area: 'Hinjewadi, Pune, Maharashtra 411057' },
];

export const INDUSTRIES = [
  'IT & Software Services',
  'Banking & Financial Services',
  'Manufacturing',
  'Healthcare & Pharma',
  'Education',
  'Retail & E-commerce',
  'Government / PSU',
  'Diamond Traders',
  'Other',
];

/** Popular banks first, as on the Figma bank picker. `short` is the logo monogram. */
export const POPULAR_BANKS = [
  { name: 'SBI', short: 'SBI', color: '#2d6db5' },
  { name: 'Bank of Baroda', short: 'BOB', color: '#f05a28' },
  { name: 'Union Bank', short: 'UBI', color: '#d71e28' },
  { name: 'PNB', short: 'PNB', color: '#a8102e' },
  { name: 'HDFC Bank', short: 'HDFC', color: '#004c8f' },
  { name: 'ICICI Bank', short: 'ICICI', color: '#b02a30' },
  { name: 'Canara Bank', short: 'CNRB', color: '#0091d5' },
  { name: 'Kotak Bank', short: 'KMB', color: '#ed1c24' },
];

export const OTHER_BANKS = [
  'Axis Bank',
  'Bank of India',
  'Bank of Maharashtra',
  'Central Bank of India',
  'Federal Bank',
  'IDFC FIRST Bank',
  'Indian Bank',
  'IndusInd Bank',
  'Yes Bank',
];

/** Banks that support debit-card e-mandates (the "Supported banks for debit card mode" list). */
export const DEBIT_CARD_BANKS = ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Bank of Baroda', 'PNB', 'IndusInd Bank', 'Yes Bank'];

export const PURPOSES = [
  'Travel / Vacation',
  'Wedding',
  'Medical emergency',
  'Home renovation',
  'Education',
  'Debt consolidation',
  'Consumer durables',
  'Other',
];

export const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed'] as const;
export const EDUCATION = ['Below 12th', '12th pass', 'Graduate', 'Post graduate', 'Professional degree'];
export const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'मराठी (Marathi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)'];

/** The three plans inside Protection Plus, with their share of the ₹200 a month. */
export const PROTECTION_PLANS = [
  {
    name: 'EMI Protection Plan',
    monthly: 45.75,
    text: 'Covers up to 3 EMIs (up to ₹50,000 each) if you lose your job or are hospitalised with one of 15 critical illnesses.',
  },
  {
    name: 'Health Subscription Plan',
    monthly: 41.66,
    text: 'Unlimited doctor tele-consultations, discounted lab tests and 24/7 medical support with Medical Buddy.',
  },
  {
    name: 'Protect your family from loan debt',
    monthly: 112.59,
    text: 'HDFC Life Loan Protect Cover pays the outstanding loan in case of death; anything left goes to your nominee.',
  },
];

export const APPLICATION_NO = '1838493205';
export const CUSTOMER_ID = '4560079';

/** A finished profile, used when the chat opens as "Welcome back" at a later stage. */
export const RESUME_ANSWERS: Answers = {
  request: '',
  phone: '9876543210',
  whatsapp: true,
  amount: LIMITS.approved,
  tenure: 36,
  pan: 'ABCDE1234F',
  panRetries: 0,
  mailing: null,
  fatherName: CUSTOMER.fatherName,
  motherName: CUSTOMER.motherName,
  employment: 'Salaried',
  industry: INDUSTRIES[0]!,
  company: 'Appinventiv',
  approved: LIMITS.approved,
  upgradeRequested: false,
  insurance: true,
  bank: { name: 'SBI', account: '30551240589', type: 'salary' },
  bankAttempts: 1,
  aadhaar: '456712346782',
  officeAddress: 'B-25, Sector 58, Noida, Uttar Pradesh 201301',
  officialEmail: 'mayank.sharma@appinventiv.com',
  personalEmail: 'mayank.sharma@gmail.com',
  income: 6_00_000,
  purpose: 'Travel / Vacation',
  marital: 'Single',
  education: 'Graduate',
  language: 'English',
  repayMode: 'emandate',
  upiId: '',
  verification: 'vkyc',
};

export const NEW_ANSWERS: Answers = {
  ...RESUME_ANSWERS,
  phone: '',
  whatsapp: false,
  amount: LIMITS.approved,
  tenure: 24,
  pan: '',
  fatherName: '',
  motherName: '',
  industry: '',
  company: '',
  insurance: false,
  bank: null,
  bankAttempts: 0,
  aadhaar: '',
  officeAddress: '',
  officialEmail: '',
  personalEmail: '',
  income: 0,
  purpose: '',
  marital: '',
  education: '',
  language: '',
};

/** The step each "Welcome back" link resumes at. */
export const RESUME_AT: Record<Exclude<StartAt, 'new'>, StepId> = {
  kyc: 'bank',
  work: 'work',
  repayment: 'repayment',
  esign: 'sanction',
};

/** Answers the chat starts with: blank for a new customer, or a saved profile up to the resumed stage. */
export function answersFor(start: StartAt): Answers {
  if (start === 'new') return NEW_ANSWERS;
  // Resuming at KYC: the bank account and Aadhaar are still to come.
  if (start === 'kyc') return { ...RESUME_ANSWERS, bank: null, bankAttempts: 0, aadhaar: '' };
  return RESUME_ANSWERS;
}
