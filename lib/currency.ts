/**
 * Formats amount in cents to currency string
 * @param cents Amount in cents
 * @returns Formatted currency string (e.g., "$12.99")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Converts dollar amount to cents
 * @param dollars Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts cents to dollar amount
 * @param cents Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Parses currency input string to cents
 * @param input User input string (e.g., "12.99" or "$12.99")
 * @returns Amount in cents
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) {
    return 0;
  }
  return dollarsToCents(dollars);
}
