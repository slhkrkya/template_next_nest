import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Common weak passwords that should be rejected
 */
const COMMON_WEAK_PASSWORDS = [
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyui',
  'admin123',
  'letmein1',
  'welcome1',
  'welcome123',
  'monkey123',
  'dragon123',
  'master123',
  'login123',
  'abc12345',
  'trustno1',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'superman',
  'starwars',
];

/**
 * Sequential number patterns (3+ consecutive)
 */
const SEQUENTIAL_NUMBERS = [
  '0123',
  '1234',
  '2345',
  '3456',
  '4567',
  '5678',
  '6789',
  '7890',
  '9876',
  '8765',
  '7654',
  '6543',
  '5432',
  '4321',
  '3210',
];

/**
 * Sequential letter patterns
 */
const SEQUENTIAL_LETTERS = [
  'abcd',
  'bcde',
  'cdef',
  'defg',
  'efgh',
  'fghi',
  'ghij',
  'hijk',
  'ijkl',
  'jklm',
  'klmn',
  'lmno',
  'mnop',
  'nopq',
  'opqr',
  'pqrs',
  'qrst',
  'rstu',
  'stuv',
  'tuvw',
  'uvwx',
  'vwxy',
  'wxyz',
  'zyxw',
  'yxwv',
  'xwvu',
  'wvut',
  'vuts',
  'utsr',
  'tsrq',
  'srqp',
  'rqpo',
  'qpon',
  'ponm',
  'onml',
  'nmlk',
  'mlkj',
  'lkji',
  'kjih',
  'jihg',
  'ihgf',
  'hgfe',
  'gfed',
  'fedc',
  'edcb',
  'dcba',
];

/**
 * Keyboard patterns that are commonly used
 */
const KEYBOARD_PATTERNS = [
  'qwert',
  'werty',
  'ertyu',
  'rtyui',
  'tyuio',
  'yuiop',
  'asdfg',
  'sdfgh',
  'dfghj',
  'fghjk',
  'ghjkl',
  'zxcvb',
  'xcvbn',
  'cvbnm',
  'qazws',
  'wsxed',
  'edcrf',
  'rfvtg',
  'tgbyh',
  'yhnuj',
  'ujmik',
  '!@#$%',
  '@#$%^',
  '#$%^&',
  '$%^&*',
];

/**
 * Check if password contains uppercase letter
 */
export function containsUppercase(password: string): boolean {
  return /[A-Z]/.test(password);
}

/**
 * Check if password contains lowercase letter
 */
export function containsLowercase(password: string): boolean {
  return /[a-z]/.test(password);
}

/**
 * Check if password contains digit
 */
export function containsDigit(password: string): boolean {
  return /\d/.test(password);
}

/**
 * Check if password contains special character
 */
export function containsSpecialChar(password: string): boolean {
  return /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password);
}

/**
 * Check if password contains common weak patterns
 */
export function containsCommonPatterns(password: string): boolean {
  const lowerPassword = password.toLowerCase();

  // Check common weak passwords
  if (COMMON_WEAK_PASSWORDS.some((weak) => lowerPassword.includes(weak))) {
    return true;
  }

  // Check sequential numbers
  if (SEQUENTIAL_NUMBERS.some((seq) => lowerPassword.includes(seq))) {
    return true;
  }

  // Check sequential letters
  if (SEQUENTIAL_LETTERS.some((seq) => lowerPassword.includes(seq))) {
    return true;
  }

  // Check keyboard patterns
  if (KEYBOARD_PATTERNS.some((pattern) => lowerPassword.includes(pattern))) {
    return true;
  }

  return false;
}

/**
 * Check if password contains repeated characters (3+ consecutive identical chars)
 */
export function containsRepeatedChars(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/**
 * Comprehensive password validation
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password && password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }

  if (!containsUppercase(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!containsLowercase(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!containsDigit(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (!containsSpecialChar(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (containsCommonPatterns(password)) {
    errors.push('Password contains common weak patterns');
  }

  if (containsRepeatedChars(password)) {
    errors.push('Password cannot contain 3 or more consecutive identical characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, _args: ValidationArguments): boolean {
    if (!password) return false;
    const { isValid } = validatePassword(password);
    return isValid;
  }

  defaultMessage(args: ValidationArguments): string {
    if (!args.value) {
      return 'Password is required';
    }
    const { errors } = validatePassword(args.value);
    return errors[0] || 'Password does not meet security requirements';
  }
}

/**
 * Decorator for strong password validation.
 * Validates:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * - No common weak patterns
 * - No 3+ consecutive identical characters
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
