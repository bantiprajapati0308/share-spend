export const PIN_LENGTH = 4;

export const isPinComplete = (pin, length = PIN_LENGTH) => pin.length === length;

export const appendDigit = (pin, digit, length = PIN_LENGTH) => {
  if (!/^\d$/.test(String(digit)) || pin.length >= length) return pin;
  return `${pin}${digit}`;
};

export const removeLastDigit = (pin) => pin.slice(0, -1);

export const validatePin = (pin, length = PIN_LENGTH) => {
  if (!new RegExp(`^\\d{${length}}$`).test(pin)) {
    return `Enter a ${length} digit PIN.`;
  }
  if (/^(\d)\1+$/.test(pin)) {
    return 'Choose a PIN with more than one repeated digit.';
  }
  return '';
};
