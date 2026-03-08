// 牌堆工具函数

// 洗牌函数（Fisher-Yates算法）
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 初始化牌堆（0-13，共52张）
export function initializeDeck() {
  const deck = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= 13; j++) {
      deck.push(j);
    }
  }
  return shuffleDeck(deck);
}

// 获取牌的显示值
export function getCardDisplayValue(value) {
  switch (value) {
    case 0: return '0';
    case 1: return 'A';
    case 11: return 'J';
    case 12: return 'Q';
    case 13: return 'K';
    default: return value.toString();
  }
}

// 检查牌是否有特殊能力
export function hasSpecialAbility(value) {
  return value >= 7 && value <= 12;
}

// 获取特殊能力描述
export function getAbilityDescription(value) {
  switch (value) {
    case 7:
    case 8:
      return '偷看自己1张暗牌';
    case 9:
    case 10:
      return '间谍看别人1张暗牌';
    case 11:
    case 12:
      return '交换自己与他人1张牌';
    default:
      return '';
  }
}

// 计算牌的点数
export function getCardValue(value) {
  return value;
}

// 生成随机房间号
export function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 深拷贝游戏状态
export function deepCopyGameState(gameState) {
  return JSON.parse(JSON.stringify(gameState));
}

// 检查牌堆是否为空
export function isDeckEmpty(deck) {
  return deck.length === 0;
}

// 从牌堆顶部抽牌
export function drawFromDeck(deck) {
  return deck.pop();
}

// 向弃牌堆添加牌
export function addToDiscardPile(discardPile, card) {
  discardPile.push(card);
}

// 获取弃牌堆顶部牌
export function getTopDiscardCard(discardPile) {
  return discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
}