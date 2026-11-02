import { describe, expect, it } from 'vitest';
import { formatPhone, maskAadhaar, maskTail, rupees } from './format';
import { aadhaarError, accountError, emailError, panError, phoneError, upiError } from './validate';

describe('validators', () => {
  it('accepts Indian mobile numbers only', () => {
    expect(phoneError('9876543210')).toBeNull();
    expect(phoneError('5876543210')).not.toBeNull();
    expect(phoneError('98765')).not.toBeNull();
  });

  it('checks the PAN pattern', () => {
    expect(panError('ABCDE1234F')).toBeNull();
    expect(panError('RUEO938494')).not.toBeNull();
  });

  it('checks Aadhaar length and first digit', () => {
    expect(aadhaarError('456712346782')).toBeNull();
    expect(aadhaarError('056712346782')).not.toBeNull();
    expect(aadhaarError('45671234678')).not.toBeNull();
  });

  it('checks account numbers, UPI IDs and emails', () => {
    expect(accountError('30551240589')).toBeNull();
    expect(accountError('1234')).not.toBeNull();
    expect(upiError('mayank@okhdfc')).toBeNull();
    expect(upiError('mayank')).toBe('Please follow the format username@upi');
    expect(emailError('mayank.sharma@appinventiv.com')).toBeNull();
    expect(emailError('mayank@')).not.toBeNull();
  });
});

describe('format', () => {
  it('formats rupees in the Indian system', () => {
    expect(rupees(3_00_000)).toBe('₹3,00,000');
    expect(rupees(11_035)).toBe('₹11,035');
  });

  it('masks account and Aadhaar numbers', () => {
    expect(maskTail('30551240589', 4, '*')).toBe('*******0589');
    expect(maskAadhaar('456712346782')).toBe('XXXX XXXX 6782');
    expect(formatPhone('9876543210')).toBe('+91 98765 43210');
  });
});
