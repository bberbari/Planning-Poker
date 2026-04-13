// Use 999 to represent infinity for JSON compatibility
export const INFINITY_VALUE = 999;
export const FIBONACCI_CARDS = [1, 2, 3, 5, 8, INFINITY_VALUE];

export function isValidCard(cardValue: number): boolean {
  return FIBONACCI_CARDS.includes(cardValue);
}

export function formatCardValue(cardValue: number): string {
  return cardValue === INFINITY_VALUE ? '∞' : String(cardValue);
}
