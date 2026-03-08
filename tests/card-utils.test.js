const {
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
} = require('../../cabo-game/utils/card-utils')

describe('card-utils', () => {
  describe('CARD_DISPLAY常量', () => {
    test('应该包含正确的卡牌显示映射', () => {
      expect(CARD_DISPLAY[0]).toBe('0')
      expect(CARD_DISPLAY[1]).toBe('A')
      expect(CARD_DISPLAY[11]).toBe('J')
      expect(CARD_DISPLAY[12]).toBe('Q')
      expect(CARD_DISPLAY[13]).toBe('K')
    })

    test('应该包含所有数字卡牌', () => {
      for (let i = 2; i <= 10; i++) {
        expect(CARD_DISPLAY[i]).toBe(i.toString())
      }
    })
  })

  describe('SUITS常量', () => {
    test('应该包含4种花色', () => {
      expect(SUITS.length).toBe(4)
      expect(SUITS).toContain('♠')
      expect(SUITS).toContain('♥')
      expect(SUITS).toContain('♣')
      expect(SUITS).toContain('♦')
    })
  })

  describe('SUIT_COLORS常量', () => {
    test('应该包含正确的花色颜色映射', () => {
      expect(SUIT_COLORS[0]).toBe('#1a1a2e')
      expect(SUIT_COLORS[1]).toBe('#e74c3c')
      expect(SUIT_COLORS[2]).toBe('#2ecc71')
      expect(SUIT_COLORS[3]).toBe('#3498db')
    })
  })

  describe('ABILITY_NAMES常量', () => {
    test('应该包含正确的能力名称映射', () => {
      expect(ABILITY_NAMES[7]).toBe('偷看自己的牌')
      expect(ABILITY_NAMES[8]).toBe('偷看自己的牌')
      expect(ABILITY_NAMES[9]).toBe('查看对手的牌')
      expect(ABILITY_NAMES[10]).toBe('查看对手的牌')
      expect(ABILITY_NAMES[11]).toBe('交换牌')
      expect(ABILITY_NAMES[12]).toBe('交换牌')
    })
  })

  describe('ABILITY_TYPES常量', () => {
    test('应该包含正确的能力类型映射', () => {
      expect(ABILITY_TYPES[7]).toBe('peek_self')
      expect(ABILITY_TYPES[8]).toBe('peek_self')
      expect(ABILITY_TYPES[9]).toBe('spy')
      expect(ABILITY_TYPES[10]).toBe('spy')
      expect(ABILITY_TYPES[11]).toBe('swap')
      expect(ABILITY_TYPES[12]).toBe('swap')
    })
  })

  describe('getCardDisplayValue函数', () => {
    test('应该正确显示数字卡牌', () => {
      expect(getCardDisplayValue(0)).toBe('0')
      expect(getCardDisplayValue(2)).toBe('2')
      expect(getCardDisplayValue(10)).toBe('10')
    })

    test('应该正确显示字母卡牌', () => {
      expect(getCardDisplayValue(1)).toBe('A')
      expect(getCardDisplayValue(11)).toBe('J')
      expect(getCardDisplayValue(12)).toBe('Q')
      expect(getCardDisplayValue(13)).toBe('K')
    })

    test('应该处理无效值', () => {
      expect(getCardDisplayValue(99)).toBe('99')
      expect(getCardDisplayValue(-1)).toBe('-1')
    })
  })

  describe('getSuitSymbol函数', () => {
    test('应该返回正确的花色符号', () => {
      expect(getSuitSymbol(0)).toBe('♠')
      expect(getSuitSymbol(1)).toBe('♥')
      expect(getSuitSymbol(2)).toBe('♣')
      expect(getSuitSymbol(3)).toBe('♦')
    })

    test('应该处理无效花色', () => {
      expect(getSuitSymbol(99)).toBe('')
      expect(getSuitSymbol(-1)).toBe('')
    })
  })

  describe('getSuitColor函数', () => {
    test('应该返回正确的花色颜色', () => {
      expect(getSuitColor(0)).toBe('#1a1a2e')
      expect(getSuitColor(1)).toBe('#e74c3c')
      expect(getSuitColor(2)).toBe('#2ecc71')
      expect(getSuitColor(3)).toBe('#3498db')
    })

    test('应该处理无效花色', () => {
      expect(getSuitColor(99)).toBe('#333')
      expect(getSuitColor(-1)).toBe('#333')
    })
  })

  describe('hasAbility函数', () => {
    test('7-12的牌应有特殊能力', () => {
      for (let i = 7; i <= 12; i++) {
        expect(hasAbility(i)).toBe(true)
      }
    })

    test('其他牌不应有特殊能力', () => {
      expect(hasAbility(0)).toBe(false)
      expect(hasAbility(6)).toBe(false)
      expect(hasAbility(13)).toBe(false)
    })
  })

  describe('getAbilityType函数', () => {
    test('应该返回正确的能力类型', () => {
      expect(getAbilityType(7)).toBe('peek_self')
      expect(getAbilityType(8)).toBe('peek_self')
      expect(getAbilityType(9)).toBe('spy')
      expect(getAbilityType(10)).toBe('spy')
      expect(getAbilityType(11)).toBe('swap')
      expect(getAbilityType(12)).toBe('swap')
    })

    test('无能力的牌应返回null', () => {
      expect(getAbilityType(0)).toBeNull()
      expect(getAbilityType(6)).toBeNull()
      expect(getAbilityType(13)).toBeNull()
    })
  })

  describe('getAbilityName函数', () => {
    test('应该返回正确的能力名称', () => {
      expect(getAbilityName(7)).toBe('偷看自己的牌')
      expect(getAbilityName(9)).toBe('查看对手的牌')
      expect(getAbilityName(11)).toBe('交换牌')
    })

    test('无能力的牌应返回空字符串', () => {
      expect(getAbilityName(0)).toBe('')
      expect(getAbilityName(6)).toBe('')
      expect(getAbilityName(13)).toBe('')
    })
  })

  describe('getAbilityDescription函数', () => {
    test('应该返回正确的能力描述', () => {
      expect(getAbilityDescription(7)).toBe('偷看自己1张暗牌')
      expect(getAbilityDescription(8)).toBe('偷看自己1张暗牌')
      expect(getAbilityDescription(9)).toBe('查看对手1张暗牌')
      expect(getAbilityDescription(10)).toBe('查看对手1张暗牌')
      expect(getAbilityDescription(11)).toBe('与自己1张牌和对手1张牌交换')
      expect(getAbilityDescription(12)).toBe('与自己1张牌和对手1张牌交换')
    })

    test('无能力的牌应返回空字符串', () => {
      expect(getAbilityDescription(0)).toBe('')
      expect(getAbilityDescription(6)).toBe('')
      expect(getAbilityDescription(13)).toBe('')
    })
  })

  describe('generateRoomId函数', () => {
    test('应该生成6位数字字符串', () => {
      const roomId = generateRoomId()
      expect(roomId).toMatch(/^\d{6}$/)
    })

    test('应该生成不同的房间ID', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateRoomId())
      }
      expect(ids.size).toBeGreaterThan(90)
    })

    test('应该在100000-999999范围内', () => {
      for (let i = 0; i < 100; i++) {
        const roomId = parseInt(generateRoomId())
        expect(roomId).toBeGreaterThanOrEqual(100000)
        expect(roomId).toBeLessThanOrEqual(999999)
      }
    })
  })

  describe('calculateHandSum函数', () => {
    test('应该正确计算手牌总和', () => {
      const cards = [
        { value: 5 },
        { value: 3 },
        { value: 10 },
        { value: 2 }
      ]
      expect(calculateHandSum(cards)).toBe(20)
    })

    test('应该处理空数组', () => {
      expect(calculateHandSum([])).toBe(0)
    })

    test('应该处理单张牌', () => {
      expect(calculateHandSum([{ value: 7 }])).toBe(7)
    })

    test('应该处理包含0的牌', () => {
      const cards = [
        { value: 0 },
        { value: 5 },
        { value: 0 },
        { value: 3 }
      ]
      expect(calculateHandSum(cards)).toBe(8)
    })
  })

  describe('formatCard函数', () => {
    test('应该正确格式化卡牌', () => {
      expect(formatCard({ value: 5, suit: 0 })).toBe('5♠')
      expect(formatCard({ value: 1, suit: 1 })).toBe('A♥')
      expect(formatCard({ value: 13, suit: 2 })).toBe('K♣')
      expect(formatCard({ value: 0, suit: 3 })).toBe('0♦')
    })

    test('应该处理null值', () => {
      expect(formatCard(null)).toBe('')
    })

    test('应该处理undefined值', () => {
      expect(formatCard(undefined)).toBe('')
    })
  })

  describe('getCardColor函数', () => {
    test('红色花色应返回红色', () => {
      expect(getCardColor({ suit: 1 })).toBe('#e74c3c')
      expect(getCardColor({ suit: 3 })).toBe('#e74c3c')
    })

    test('黑色花色应返回深色', () => {
      expect(getCardColor({ suit: 0 })).toBe('#1a1a2e')
      expect(getCardColor({ suit: 2 })).toBe('#1a1a2e')
    })

    test('应该处理null值', () => {
      expect(getCardColor(null)).toBe('#333')
    })

    test('应该处理undefined值', () => {
      expect(getCardColor(undefined)).toBe('#333')
    })
  })

  describe('shuffleArray函数', () => {
    test('应该返回新数组', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled).not.toBe(original)
      expect(original).toEqual([1, 2, 3, 4, 5])
    })

    test('应该保持数组长度不变', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled.length).toBe(original.length)
    })

    test('应该保持元素不变', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      const sorted = [...shuffled].sort((a, b) => a - b)
      expect(sorted).toEqual(original)
    })

    test('应该处理空数组', () => {
      expect(shuffleArray([])).toEqual([])
    })

    test('应该处理单元素数组', () => {
      expect(shuffleArray([1])).toEqual([1])
    })
  })

  describe('delay函数', () => {
    test('应该延迟指定时间', async () => {
      const start = Date.now()
      await delay(100)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(90)
    })

    test('应该返回Promise', () => {
      const result = delay(0)
      expect(result).toBeInstanceOf(Promise)
    })
  })
})
