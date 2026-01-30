/**
 * Malaysian IC Utility Functions
 *
 * Malaysian IC Format: YYMMDD-SS-GGGG
 * - YYMMDD: Date of birth (Year, Month, Day)
 * - SS: State/Country code (01-16 for states, others for countries)
 * - GGGG: 4-digit serial number (odd = male, even = female)
 *
 * Examples:
 * - 950101-03-5577 → Born Jan 1, 1995, Kelantan, Male
 * - 880615-14-4442 → Born Jun 15, 1988, W.P. Kuala Lumpur, Female
 */

export interface ICParseResult {
  dob: Date;
  gender: "L" | "P";
  stateCode: string;
  isValid: boolean;
}

/**
 * Clean IC number by removing dashes and spaces
 */
export function cleanIC(ic: string): string {
  return ic.replace(/[-\s]/g, "");
}

/**
 * Check if a string is a valid Malaysian IC format
 */
export function isValidMalaysianIC(ic: string): boolean {
  const cleaned = cleanIC(ic);
  // Must be exactly 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return false;
  }

  // Validate date portion
  const year = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  // Month must be 1-12
  if (month < 1 || month > 12) {
    return false;
  }

  // Day must be valid for the month (simplified check)
  if (day < 1 || day > 31) {
    return false;
  }

  return true;
}

/**
 * Extract date of birth from Malaysian IC
 *
 * @param ic - Malaysian IC number (with or without dashes)
 * @returns Date object or null if invalid
 */
export function extractBirthDateFromIC(ic: string): Date | null {
  const cleaned = cleanIC(ic);

  if (!isValidMalaysianIC(cleaned)) {
    return null;
  }

  const yearPart = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  // Determine century:
  // - 00-25 → 2000-2025 (born in 2000s)
  // - 26-99 → 1926-1999 (born in 1900s)
  // Using 26 as cutoff since we're in 2026
  const currentYear = new Date().getFullYear();
  const century = yearPart <= currentYear % 100 ? 2000 : 1900;
  const fullYear = century + yearPart;

  // JavaScript months are 0-indexed
  const dob = new Date(fullYear, month - 1, day);

  // Validate the date is valid (handles edge cases like Feb 30)
  if (dob.getMonth() !== month - 1 || dob.getDate() !== day) {
    return null;
  }

  return dob;
}

/**
 * Extract gender from Malaysian IC
 * Last digit: Odd = Male (L/Lelaki), Even = Female (P/Perempuan)
 *
 * @param ic - Malaysian IC number
 * @returns 'L' for male, 'P' for female, or null if invalid
 */
export function extractGenderFromIC(ic: string): "L" | "P" | null {
  const cleaned = cleanIC(ic);

  if (!isValidMalaysianIC(cleaned)) {
    return null;
  }

  const lastDigit = parseInt(cleaned.charAt(11), 10);
  return lastDigit % 2 === 1 ? "L" : "P";
}

/**
 * Calculate age as of a specific date (typically trip date)
 *
 * @param birthDate - Date of birth
 * @param asOfDate - Date to calculate age as of (default: today)
 * @returns Age in years
 */
export function calculateAge(
  birthDate: Date,
  asOfDate: Date = new Date(),
): number {
  let age = asOfDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOfDate.getMonth() - birthDate.getMonth();

  // If birthday hasn't occurred yet this year, subtract 1
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Determine passenger type based on age
 * - Adult: 12 years and above
 * - Child: 3-11 years
 * - Infant: Under 3 years
 *
 * @param age - Age in years
 * @returns Passenger type
 */
export function getPassengerType(age: number): "adult" | "child" | "infant" {
  if (age >= 12) return "adult";
  if (age >= 3) return "child";
  return "infant";
}

/**
 * Parse Malaysian IC and extract all information
 *
 * @param ic - Malaysian IC number
 * @param tripDate - Trip date for age calculation
 * @returns Parsed IC result or null if invalid/not Malaysian IC
 */
export function parseIC(ic: string, tripDate?: Date): ICParseResult | null {
  const cleaned = cleanIC(ic);

  if (!isValidMalaysianIC(cleaned)) {
    return null;
  }

  const dob = extractBirthDateFromIC(cleaned);
  const gender = extractGenderFromIC(cleaned);

  if (!dob || !gender) {
    return null;
  }

  return {
    dob,
    gender,
    stateCode: cleaned.substring(6, 8),
    isValid: true,
  };
}

/**
 * Auto-fill passenger data from IC number
 * For use in the booking form
 *
 * @param ic - IC or passport number
 * @param tripDate - Trip date for age calculation
 * @returns Object with calculated fields or empty object if not parseable
 */
export function autoFillFromIC(
  ic: string,
  tripDate: Date,
): {
  dob?: string;
  calculatedAge?: number;
  gender?: "L" | "P";
  passengerType?: "adult" | "child" | "infant";
  nationality?: string;
} {
  const parsed = parseIC(ic, tripDate);

  if (!parsed) {
    // Not a valid Malaysian IC - might be a passport
    return {};
  }

  const age = calculateAge(parsed.dob, tripDate);

  return {
    dob: parsed.dob.toISOString().split("T")[0], // YYYY-MM-DD format
    calculatedAge: age,
    gender: parsed.gender,
    passengerType: getPassengerType(age),
    nationality: "MALAYSIA",
  };
}

/**
 * Format IC number with dashes for display
 *
 * @param ic - Raw IC number
 * @returns Formatted IC (e.g., "950101-03-5577")
 */
export function formatIC(ic: string): string {
  const cleaned = cleanIC(ic);
  if (cleaned.length !== 12) {
    return ic; // Return as-is if not valid IC
  }
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8)}`;
}
