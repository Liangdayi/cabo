const CARD_DISPLAY = {
  0: '0',
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K'
}

const SUITS = ['♠', '♥', '♣', '♦']
const SUIT_COLORS = {
  0: '#1a1a2e',
  1: '#e74c3c',
  2: '#2ecc71',
  3: '#3498db'
}

const ABILITY_NAMES = {
  7: '偷看自己的牌',
  8: '偷看自己的牌',
  9: '查看对手的牌',
  10: '查看对手的牌',
  11: '交换牌',
  12: '交换牌'
}

const ABILITY_TYPES = {
  7: 'peek_self',
  8: 'peek_self',
  9: 'spy',
  10: 'spy',
  11: 'swap',
  12: 'swap'
}

function getCardDisplayValue(value) {
  return CARD_DISPLAY[value] || value.toString()
}

function getSuitSymbol(suit) {
  return SUITS[suit] || ''
}

function getSuitColor(suit) {
  return SUIT_COLORS[suit] || '#333'
}

function hasAbility(value) {
  return value >= 7 && value <= 12
}

function getAbilityType(value) {
  return ABILITY_TYPES[value] || null
}

function getAbilityName(value) {
  return ABILITY_NAMES[value] || ''
}

function getAbilityDescription(value) {
  switch (value) {
    case 7:
    case 8:
      return '偷看自己1张暗牌'
    case 9:
    case 10:
      return '查看对手1张暗牌'
    case 11:
    case 12:
      return '与自己1张牌和对手1张牌交换'
    default:
      return ''
  }
}

function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function calculateHandSum(cards) {
  return cards.reduce((sum, card) => sum + card.value, 0)
}

function formatCard(card) {
  if (!card) return ''
  return `${getCardDisplayValue(card.value)}${getSuitSymbol(card.suit)}`
}

function getCardColor(card) {
  if (!card) return '#333'
  return card.suit === 1 || card.suit === 3 ? '#e74c3c' : '#1a1a2e'
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  CARD_DISPLAY,
  SUITS,
  SUIT_COLORS,
  ABILITY_NAMES,
  ABILITY_TYPES,
  getCardDisplayValue,
  getSuitSymbol,
  getSuitColor,
  hasAbility,
  getAbilityType,
  getAbilityName,
  getAbilityDescription,
  generateRoomId,
  calculateHandSum,
  formatCard,
  getCardColor,
  shuffleArray,
  delay
}
