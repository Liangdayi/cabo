const GameEngine = require('../../cabo-game/utils/game-engine')

describe('GameEngine', () => {
  let gameEngine

  beforeEach(() => {
    gameEngine = new GameEngine()
  })

  describe('游戏初始化', () => {
    test('应该成功创建游戏引擎实例', () => {
      expect(gameEngine).toBeDefined()
      expect(gameEngine.players).toEqual([])
      expect(gameEngine.drawPile).toEqual([])
      expect(gameEngine.discardPile).toEqual([])
      expect(gameEngine.gamePhase).toBe('waiting')
    })

    test('应该成功添加玩家', () => {
      const result1 = gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      const result2 = gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(gameEngine.players.length).toBe(2)
    })

    test('添加玩家不应超过4人', () => {
      gameEngine.addPlayer({ id: 'p1' })
      gameEngine.addPlayer({ id: 'p2' })
      gameEngine.addPlayer({ id: 'p3' })
      gameEngine.addPlayer({ id: 'p4' })
      const result = gameEngine.addPlayer({ id: 'p5' })
      
      expect(result).toBe(false)
      expect(gameEngine.players.length).toBe(4)
    })

    test('应该成功初始化牌堆', () => {
      gameEngine.initializeDeck()
      
      expect(gameEngine.drawPile.length).toBe(52)
      
      const values = {}
      gameEngine.drawPile.forEach(card => {
        values[card.value] = (values[card.value] || 0) + 1
      })
      
      for (let i = 0; i <= 13; i++) {
        expect(values[i]).toBe(4)
      }
    })

    test('应该成功开始游戏', () => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      
      const result = gameEngine.startGame()
      
      expect(result).toBe(true)
      expect(gameEngine.gamePhase).toBe('peek')
      expect(gameEngine.turnPhase).toBe('peek_select')
      expect(gameEngine.drawPile.length).toBe(43)
      expect(gameEngine.discardPile.length).toBe(1)
      
      gameEngine.players.forEach(player => {
        expect(player.cards.length).toBe(4)
        player.cards.forEach(card => {
          expect(card.isFaceUp).toBe(false)
        })
      })
    })

    test('少于2名玩家时不应开始游戏', () => {
      gameEngine.addPlayer({ id: 'player1' })
      const result = gameEngine.startGame()
      
      expect(result).toBe(false)
    })
  })

  describe('开局偷看牌功能', () => {
    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
    })

    test('应该成功选择偷看牌', () => {
      const result = gameEngine.selectPeekCard(0, 0)
      
      expect(result.success).toBe(true)
      expect(result.selectedCount).toBe(1)
      expect(gameEngine.players[0].cards[0].isPeeking).toBe(true)
    })

    test('选择已选择的牌应失败', () => {
      gameEngine.selectPeekCard(0, 0)
      const result = gameEngine.selectPeekCard(0, 0)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('已选择的牌不可取消')
    })

    test('不应允许选择超过2张牌', () => {
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      const result = gameEngine.selectPeekCard(0, 2)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('最多只能选择2张牌')
    })

    test('确认偷看牌前必须选择2张牌', () => {
      gameEngine.selectPeekCard(0, 0)
      const result = gameEngine.confirmPeekCards(0)
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('请选择2张牌')
    })

    test('应该成功确认偷看牌', () => {
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      const result = gameEngine.confirmPeekCards(0)
      
      expect(result.success).toBe(true)
      expect(gameEngine.turnPhase).toBe('peek_view')
    })

    test('偷看阶段结束后牌应暗置', () => {
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.players[0].cards.forEach(card => {
        expect(card.isFaceUp).toBe(false)
        expect(card.isPeeking).toBe(false)
      })
      
      expect(gameEngine.players[0].knownCards.length).toBe(2)
    })

    test('AI玩家应自动完成偷看', () => {
      gameEngine.reset()
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'ai1', name: 'AI玩家', isAI: true })
      gameEngine.startGame()
      
      expect(gameEngine.players[1].knownCards.length).toBe(2)
    })
  })

  describe('回合行动选择', () => {
    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.selectPeekCard(1, 0)
      gameEngine.selectPeekCard(1, 1)
      gameEngine.confirmPeekCards(1)
      gameEngine.endPeekPhase(1)
    })

    test('应该成功从抽牌堆抽牌', () => {
      const card = gameEngine.drawFromPile()
      
      expect(card).toBeDefined()
      expect(card.isFaceUp).toBe(true)
      expect(card.source).toBe('draw')
      expect(gameEngine.turnPhase).toBe('draw_action')
    })

    test('应该成功从弃牌堆捡牌', () => {
      const card = gameEngine.takeFromDiscard()
      
      expect(card).toBeDefined()
      expect(card.source).toBe('discard')
      expect(gameEngine.turnPhase).toBe('exchange')
    })

    test('抽牌堆为空时应返回null', () => {
      gameEngine.drawPile = []
      const card = gameEngine.drawFromPile()
      
      expect(card).toBeNull()
    })

    test('弃牌堆为空时应返回null', () => {
      gameEngine.discardPile = []
      const card = gameEngine.takeFromDiscard()
      
      expect(card).toBeNull()
    })
  })

  describe('单张交换功能', () => {
    let drawnCard

    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.selectPeekCard(1, 0)
      gameEngine.selectPeekCard(1, 1)
      gameEngine.confirmPeekCards(1)
      gameEngine.endPeekPhase(1)
      
      drawnCard = gameEngine.drawFromPile()
    })

    test('应该成功进行单张交换（抽牌堆来源）', () => {
      const result = gameEngine.exchangeCards(drawnCard, [0], true)
      
      expect(result.success).toBe(true)
      expect(gameEngine.players[0].cards[0].isFaceUp).toBe(false)
      expect(gameEngine.discardPile.length).toBe(2)
    })

    test('应该成功进行单张交换（弃牌堆来源）', () => {
      const discardedCard = gameEngine.takeFromDiscard()
      const result = gameEngine.exchangeCards(discardedCard, [1], false)
      
      expect(result.success).toBe(true)
      expect(gameEngine.players[0].cards[1].isFaceUp).toBe(true)
    })

    test('无效目标索引应失败', () => {
      const result = gameEngine.exchangeCards(drawnCard, [10], true)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('无效的目标牌')
    })

    test('空目标索引应失败', () => {
      const result = gameEngine.exchangeCards(drawnCard, [], true)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('请选择要交换的牌')
    })
  })

  describe('多张交换功能', () => {
    let drawnCard

    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.selectPeekCard(1, 0)
      gameEngine.selectPeekCard(1, 1)
      gameEngine.confirmPeekCards(1)
      gameEngine.endPeekPhase(1)
    })

    test('多张交换成功时应替换所有目标牌', () => {
      const targetValue = 5
      gameEngine.players[0].cards[0].value = targetValue
      gameEngine.players[0].cards[1].value = targetValue
      
      drawnCard = { value: targetValue, suit: 0, id: 'test-card' }
      const result = gameEngine.exchangeCards(drawnCard, [0, 1], true)
      
      expect(result.success).toBe(true)
    })

    test('多张交换失败时新牌应入队', () => {
      gameEngine.players[0].cards[0].value = 5
      gameEngine.players[0].cards[1].value = 7
      
      drawnCard = { value: 5, suit: 0, id: 'test-card' }
      const initialCardCount = gameEngine.players[0].cards.length
      const result = gameEngine.exchangeCards(drawnCard, [0, 1], true)
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('目标牌数字不一致')
      expect(gameEngine.players[0].cards.length).toBe(initialCardCount + 1)
    })

    test('多张交换失败（3张以上）应受惩罚', () => {
      gameEngine.players[0].cards[0].value = 5
      gameEngine.players[0].cards[1].value = 7
      gameEngine.players[0].cards[2].value = 9
      
      drawnCard = { value: 5, suit: 0, id: 'test-card' }
      const initialCardCount = gameEngine.players[0].cards.length
      const result = gameEngine.exchangeCards(drawnCard, [0, 1, 2], true)
      
      expect(result.success).toBe(false)
      expect(result.penalty).toBe(true)
      expect(gameEngine.players[0].cards.length).toBe(initialCardCount + 2)
    })
  })

  describe('特殊能力系统', () => {
    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.selectPeekCard(1, 0)
      gameEngine.selectPeekCard(1, 1)
      gameEngine.confirmPeekCards(1)
      gameEngine.endPeekPhase(1)
    })

    test('7/8能力应成功偷看自己的牌', () => {
      const card = { value: 7, suit: 0, id: 'test-7' }
      gameEngine.discardCard(card, true)
      
      const result = gameEngine.useAbility('peek_self', { cardIndex: 0 })
      
      expect(result.success).toBe(true)
      expect(result.card).toBeDefined()
      expect(gameEngine.players[0].cards[0].isKnown).toBe(true)
    })

    test('9/10能力应成功查看对手的牌', () => {
      const card = { value: 9, suit: 0, id: 'test-9' }
      gameEngine.discardCard(card, true)
      
      const result = gameEngine.useAbility('spy', { 
        playerIndex: 1, 
        cardIndex: 0 
      })
      
      expect(result.success).toBe(true)
      expect(result.card).toBeDefined()
    })

    test('11/12能力应成功交换牌', () => {
      const card = { value: 11, suit: 0, id: 'test-11' }
      gameEngine.discardCard(card, true)
      
      const myCardValue = gameEngine.players[0].cards[0].value
      const theirCardValue = gameEngine.players[1].cards[0].value
      
      const result = gameEngine.useAbility('swap', {
        myCardIndex: 0,
        targetPlayerIndex: 1,
        targetCardIndex: 0
      })
      
      expect(result.success).toBe(true)
      expect(gameEngine.players[0].cards[0].value).toBe(theirCardValue)
      expect(gameEngine.players[1].cards[0].value).toBe(myCardValue)
    })

    test('不发动能力时应直接丢弃', () => {
      const card = { value: 7, suit: 0, id: 'test-7' }
      const result = gameEngine.discardCard(card, false)
      
      expect(result.success).toBe(true)
      expect(result.ability).toBeNull()
      expect(gameEngine.discardPile[gameEngine.discardPile.length - 1].canPick).toBe(true)
    })

    test('发动能力后牌应标记为不可捡取', () => {
      const card = { value: 7, suit: 0, id: 'test-7' }
      gameEngine.discardCard(card, true)
      
      const topCard = gameEngine.discardPile[gameEngine.discardPile.length - 1]
      expect(topCard.canPick).toBe(false)
    })
  })

  describe('CABO喊叫机制', () => {
    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      gameEngine.selectPeekCard(0, 0)
      gameEngine.selectPeekCard(0, 1)
      gameEngine.confirmPeekCards(0)
      gameEngine.endPeekPhase(0)
      
      gameEngine.selectPeekCard(1, 0)
      gameEngine.selectPeekCard(1, 1)
      gameEngine.confirmPeekCards(1)
      gameEngine.endPeekPhase(1)
    })

    test('应该成功喊CABO', () => {
      const result = gameEngine.callCabo()
      
      expect(result.success).toBe(true)
      expect(gameEngine.caboCaller).toBe(0)
      expect(gameEngine.players[0].hasCalledCabo).toBe(true)
    })

    test('重复喊CABO应失败', () => {
      gameEngine.callCabo()
      const result = gameEngine.callCabo()
      
      expect(result.success).toBe(false)
      expect(result.reason).toBe('你已经喊过CABO了')
    })

    test('喊CABO后应设置剩余回合数', () => {
      gameEngine.callCabo()
      
      expect(gameEngine.remainingTurnsAfterCabo).toBe(1)
    })
  })

  describe('计分系统', () => {
    beforeEach(() => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
    })

    test('应该正确计算手牌总和', () => {
      gameEngine.players[0].cards = [
        { value: 5 },
        { value: 3 },
        { value: 10 },
        { value: 2 }
      ]
      
      const sum = gameEngine.calculateHandSum(gameEngine.players[0])
      expect(sum).toBe(20)
    })

    test('喊CABO成功应得0分', () => {
      gameEngine.players[0].cards = [
        { value: 1 },
        { value: 1 },
        { value: 1 },
        { value: 1 }
      ]
      gameEngine.players[1].cards = [
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 5 }
      ]
      
      gameEngine.players[0].hasCalledCabo = true
      gameEngine.caboCaller = 0
      gameEngine.endRound()
      
      expect(gameEngine.players[0].roundScore).toBe(0)
    })

    test('喊CABO失败应加10分惩罚', () => {
      gameEngine.players[0].cards = [
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 }
      ]
      gameEngine.players[1].cards = [
        { value: 1 },
        { value: 1 },
        { value: 1 },
        { value: 1 }
      ]
      
      gameEngine.players[0].hasCalledCabo = true
      gameEngine.caboCaller = 0
      gameEngine.endRound()
      
      expect(gameEngine.players[0].roundScore).toBe(50)
    })

    test('总分达到100分应可重置为50分', () => {
      gameEngine.players[0].totalScore = 95
      gameEngine.players[0].roundScore = 5
      gameEngine.canReset100 = true
      
      gameEngine.endRound()
      
      expect(gameEngine.players[0].totalScore).toBe(50)
      expect(gameEngine.canReset100).toBe(false)
    })

    test('总分达到100分应结束游戏', () => {
      gameEngine.players[0].totalScore = 100
      
      const result = gameEngine.checkGameEnd()
      
      expect(result).toBe(true)
    })
  })

  describe('游戏状态管理', () => {
    test('应该成功获取游戏状态', () => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      const state = gameEngine.getState()
      
      expect(state.players).toBeDefined()
      expect(state.drawPileCount).toBeDefined()
      expect(state.discardPile).toBeDefined()
      expect(state.currentPlayerIndex).toBeDefined()
      expect(state.gamePhase).toBeDefined()
    })

    test('应该正确判断玩家回合', () => {
      gameEngine.addPlayer({ id: 'player1', name: '玩家1' })
      gameEngine.addPlayer({ id: 'player2', name: '玩家2' })
      gameEngine.startGame()
      
      const isTurn = gameEngine.isPlayerTurn('player1')
      
      expect(typeof isTurn).toBe('boolean')
    })
  })

  describe('观察者模式', () => {
    test('应该成功添加观察者', () => {
      const callback = jest.fn()
      gameEngine.addObserver(callback)
      
      expect(gameEngine.observers.length).toBe(1)
    })

    test('应该成功通知观察者', () => {
      const callback = jest.fn()
      gameEngine.addObserver(callback)
      
      gameEngine.notify('TEST_EVENT', { data: 'test' })
      
      expect(callback).toHaveBeenCalledWith('TEST_EVENT', { data: 'test' })
    })
  })

  describe('游戏重置', () => {
    test('应该成功重置游戏', () => {
      gameEngine.addPlayer({ id: 'player1' })
      gameEngine.startGame()
      gameEngine.reset()
      
      expect(gameEngine.players).toEqual([])
      expect(gameEngine.drawPile).toEqual([])
      expect(gameEngine.discardPile).toEqual([])
      expect(gameEngine.gamePhase).toBe('waiting')
    })
  })
})
