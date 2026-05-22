const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const normalizePhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
};

export const isValidIndianMobile = (value: string): boolean =>
  INDIAN_MOBILE_REGEX.test(normalizePhoneNumber(value));
