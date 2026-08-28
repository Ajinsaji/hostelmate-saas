/**
 * Canonical confirmation text normalization contract.
 *
 * Rules:
 * 1. Convert null/undefined to ""
 * 2. Remove / replace zero-width characters (U+200B-U+200D, U+FEFF)
 * 3. Replace all Unicode/NBSP whitespace (\u00A0, etc.) with standard space
 * 4. Collapse all whitespace sequences to single space
 * 5. Trim leading and trailing spaces
 * 6. PRESERVE CASE (case-sensitive match)
 */
export function normalizeConfirmationText(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g, " ")
    .trim();
}

/**
 * Validates whether the user's input confirmation string matches
 * the expected canonical hostel name after safe normalization.
 *
 * Case-sensitive match.
 */
export function isConfirmationMatching(input, expected) {
  const normInput = normalizeConfirmationText(input);
  const normExpected = normalizeConfirmationText(expected);
  return normInput.length > 0 && normInput === normExpected;
}
