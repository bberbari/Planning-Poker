export const AVAILABLE_EMOJIS = [
  '👨‍💻', '👩‍💻', '🦄', '🐱', '🦁', '🐉', '🦊', '🐺',
  '🐶', '🐼', '🐨', '🐯', '🦉', '🐸', '🦋', '🐝',
  '🦄', '🐴', '🦓', '🦒', '🐘', '🦏', '🐊', '🦈',
  '🐙', '🦑', '🦀', '🦐', '🐡', '🐠', '🐟', '🐬',
  '🦅', '🦆', '🦢', '🦜', '🦩', '🦚', '🦃', '🐓',
  '🦇', '🐁', '🐀', '🐹', '🐰', '🐿️', '🦔', '🦝',
  '🐻', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽',
  '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧',
  '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄',
  '🐎', '🐖', '🐗', '🐏', '🐑', '🐐', '🦌', '🐕',
  '🐩', '🐈', '🐈‍⬛', '🪶', '🦃', '🦤', '🦚', '🦜',
  '🦢', '🦩', '🦅', '🦆', '🦉', '🦇', '🐺', '🐗',
  '🦄', '🐴', '🦓', '🦒', '🐘', '🦏', '🐊', '🦈'
];

export function getRandomEmoji(): string {
  return AVAILABLE_EMOJIS[Math.floor(Math.random() * AVAILABLE_EMOJIS.length)];
}

export function validateEmoji(emoji: string): boolean {
  return AVAILABLE_EMOJIS.includes(emoji);
}
