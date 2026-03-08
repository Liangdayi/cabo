const GameEngine = require('../../utils/game-engine')
const AIPlayer = require('../../utils/ai-player')
const { 
  getCardDisplayValue, 
  getSuitSymbol, 
  getCardColor, 
  hasAbility, 
  getAbilityType, 
  getAbilityName,
  calculateHandSum
} = require('../../utils/card-utils')

Page({
  data: {
    roundNumber: 1,
    currentPlayerName: '',
    isMyTurn: false,
    myCards: [],
    myTotalScore: 0,
    historyScores: [],
    hasCalledCabo: false,
    opponents: [],
    drawPileCount: 0,
    topDiscard: null,
    gamePhase: '',
    turnPhase: '',
    showActionSheet: false,
    drawnCard: null,
    exchangeFromDiscard: false,
    showAbilityModal: false,
    abilityCard: null,
    abilityType: '',
    showExchangeModal: false,
    exchangeCard: null,
    selectedExchangeIndices: [],
    showPeekModal: false,
    peekCard: null,
    peekCardIndex: -1,
    showSpyModal: false,
    spyTargetPlayerIndex: -1,
    spyCard: null,
    showSpyCardSelectModal: false,
    spyTargetCards: [],
    showSwapModal: false,
    swapMyCardIndex: -1,
    swapTargetPlayerIndex: -1,
    swapTargetCardIndex: -1,
    showAbilityResultModal: false,
    abilityResultData: null,
    showResultModal: false,
    resultData: null,
    showRoundEndModal: false,
    roundEndData: null,
    showGameEndModal: false,
    gameEndData: null,
    message: '',
    showMessage: false,
    showPeekPhase: false,
    peekMessage: '',
    peekSelectedCount: 0,
    peekCountdown: 3,
    peekViewingCards: []
  },

  onLoad(options) {
    const playerCount = parseInt(options.playerCount) || 2
    
    this.gameEngine = new GameEngine()
    this.gameEngine.addObserver(this.handleGameEvent.bind(this))
    
    this.initGame(playerCount)
  },

  initGame(playerCount) {
    this.gameEngine.addPlayer({
      id: 'player_0',
      name: '你',
      isAI: false
    })

    for (let i = 1; i < playerCount; i++) {
      this.gameEngine.addPlayer({
        id: `player_${i}`,
        name: `AI ${i}`,
        isAI: true
      })
    }

    this.gameEngine.startGame()
    this.updateUI()
  },

  handleGameEvent(event, data) {
    console.log('Game Event:', event, data)
    
    switch (event) {
      case 'GAME_START':
        this.showMessage('游戏开始！')
        break
        
      case 'PEEK_PHASE_START':
        if (data.playerIndex === 0) {
          this.setData({
            showPeekPhase: true,
            peekMessage: data.message,
            peekSelectedCount: 0,
            peekCountdown: 3,
            peekViewingCards: []
          })
        } else {
          this.showMessage(`玩家 ${data.playerIndex + 1} 正在偷看牌...`)
        }
        break
        
      case 'PEEK_CARD_SELECTED':
        this.setData({
          peekSelectedCount: data.selectedCount
        })
        this.updateUI()
        break
        
      case 'PEEK_CARDS_CONFIRMED':
        this.setData({
          peekViewingCards: data.cards.map(c => ({
            index: c.index,
            displayValue: getCardDisplayValue(c.card.value),
            suitSymbol: getSuitSymbol(c.card.suit),
            color: getCardColor(c.card)
          })),
          peekCountdown: 3,
          turnPhase: 'peek_view'
        })

        if (this.peekTimer) {
          clearInterval(this.peekTimer)
        }

        this.peekTimer = setInterval(() => {
          const newCount = this.data.peekCountdown - 1
          this.setData({ peekCountdown: newCount })
          
          if (newCount <= 0) {
            clearInterval(this.peekTimer)
            this.peekTimer = null
            this.gameEngine.endPeekPhase(0)
          }
        }, 1000)
        break
        
      case 'ALL_PEEK_COMPLETE':
        this.setData({
          showPeekPhase: false,
          peekViewingCards: []
        })
        this.showMessage('所有玩家已完成偷看，游戏开始！')
        this.updateUI()
        break
        
      case 'TURN_CHANGE':
        this.updateUI()
        if (data.currentPlayer.isAI) {
          this.processAITurn()
        }
        break
        
      case 'CARD_DRAWN':
        this.updateUI()
        break
        
      case 'CARD_TAKEN_FROM_DISCARD':
        this.updateUI()
        break
        
      case 'EXCHANGE_COMPLETE':
        this.showMessage('交换成功！')
        this.updateUI()
        break
        
      case 'EXCHANGE_FAILED':
        const msg = data.penalty ? '交换失败，罚抽1张牌！' : '交换失败！'
        this.showMessage(msg)
        this.updateUI()
        break
        
      case 'CARD_DISCARDED':
        this.showMessage('已弃牌')
        this.updateUI()
        break
        
      case 'ABILITY_PEEK_SELF':
        if (data.player.id === 'player_0') {
          this.setData({
            showPeekModal: true,
            peekCard: data.card,
            peekCardIndex: data.cardIndex
          })
        } else {
          this.showMessage(`${data.player.name} 查看了自己的牌`)
        }
        break
        
      case 'ABILITY_SPY':
        if (data.player.id === 'player_0') {
          this.setData({
            showSpyModal: true,
            spyCard: data.card,
            spyTargetPlayerIndex: data.targetPlayer.id
          })
        } else {
          this.showMessage(`${data.player.name} 查看了对手的牌`)
        }
        break
        
      case 'ABILITY_SWAP':
        if (data.player && data.player.id !== 'player_0') {
          this.showMessage(`${data.player.name} 交换了牌`)
        }
        this.updateUI()
        break
        
      case 'CABO_CALLED':
        this.showMessage(`${data.player.name} 喊了 CABO！`)
        this.updateUI()
        break
        
      case 'ROUND_END':
        this.setData({
          showRoundEndModal: true,
          roundEndData: data.scores
        })
        break
        
      case 'GAME_END':
        this.setData({
          showGameEndModal: true,
          gameEndData: {
            winner: data.winner,
            scores: data.finalScores
          }
        })
        break
        
      case 'NEW_ROUND':
        this.showMessage(`第 ${data.roundNumber} 轮开始！`)
        this.updateUI()
        break
    }
  },

  onPeekCardTap(e) {
    const index = e.currentTarget.dataset.index
    const result = this.gameEngine.selectPeekCard(0, index)
    if (!result.success && result.message) {
      wx.showToast({ title: result.message, icon: 'none' })
    }
  },

  onConfirmPeekCards() {
    const result = this.gameEngine.confirmPeekCards(0)
    if (!result.success) {
      wx.showToast({ title: result.message || '请选择2张牌', icon: 'none' })
    }
  },

  startPeekCountdown(cards) {
    this.setData({
      peekViewingCards: cards.map(c => ({
        index: c.index,
        displayValue: getCardDisplayValue(c.card.value),
        suitSymbol: getSuitSymbol(c.card.suit),
        color: getCardColor(c.card)
      })),
      peekCountdown: 3
    })

    if (this.peekTimer) {
      clearInterval(this.peekTimer)
    }

    this.peekTimer = setInterval(() => {
      const newCount = this.data.peekCountdown - 1
      this.setData({ peekCountdown: newCount })
      
      if (newCount <= 0) {
        clearInterval(this.peekTimer)
        this.peekTimer = null
        this.gameEngine.endPeekPhase(0)
      }
    }, 1000)
  },

  updateUI() {
    const state = this.gameEngine.getState()
    const myPlayer = state.players[0]
    const opponents = state.players.slice(1)
    const currentPlayer = state.currentPlayer
    const isMyTurn = currentPlayer && currentPlayer.id === 'player_0'
    
    this.setData({
      roundNumber: state.roundNumber,
      currentPlayerName: currentPlayer ? currentPlayer.name : '',
      isMyTurn: isMyTurn,
      myCards: myPlayer.cards.map((card, index) => ({
        ...card,
        index: index,
        displayValue: card.isFaceUp || card.isPeeking ? getCardDisplayValue(card.value) : '?',
        suitSymbol: card.isFaceUp || card.isPeeking ? getSuitSymbol(card.suit) : '',
        color: card.isFaceUp || card.isPeeking ? getCardColor(card) : '#666'
      })),
      myTotalScore: myPlayer.totalScore,
      historyScores: myPlayer.historyScores || [],
      hasCalledCabo: myPlayer.hasCalledCabo,
      opponents: opponents.map(op => ({
        id: op.id,
        name: op.name,
        totalScore: op.totalScore,
        cardCount: op.cards.length,
        cards: op.cards.map(c => ({
          isFaceUp: c.isFaceUp,
          value: c.isFaceUp ? getCardDisplayValue(c.value) : '?'
        }))
      })),
      drawPileCount: state.drawPileCount,
      topDiscard: state.topDiscard ? {
        ...state.topDiscard,
        displayValue: getCardDisplayValue(state.topDiscard.value),
        suitSymbol: getSuitSymbol(state.topDiscard.suit),
        color: getCardColor(state.topDiscard),
        canPick: state.topDiscard.canPick,
        hasAbility: hasAbility(state.topDiscard.value),
        abilityName: getAbilityName(state.topDiscard.value)
      } : null,
      gamePhase: state.gamePhase,
      turnPhase: state.turnPhase
    })
  },

  showMessage(msg) {
    this.setData({ message: msg, showMessage: true })
    setTimeout(() => {
      this.setData({ showMessage: false })
    }, 2000)
  },

  onDrawFromPile() {
    if (!this.data.isMyTurn || this.data.turnPhase !== 'action') {
      return
    }
    
    const card = this.gameEngine.drawFromPile()
    if (card) {
      this.setData({
        drawnCard: {
          ...card,
          displayValue: getCardDisplayValue(card.value),
          suitSymbol: getSuitSymbol(card.suit),
          color: getCardColor(card),
          hasAbility: hasAbility(card.value),
          abilityName: getAbilityName(card.value)
        },
        showActionSheet: true,
        exchangeFromDiscard: false
      })
    }
  },

  onTakeFromDiscard() {
    if (!this.data.isMyTurn || this.data.turnPhase !== 'action') {
      return
    }
    
    if (!this.data.topDiscard || !this.data.topDiscard.canPick) {
      wx.showToast({ title: '无法捡取此牌', icon: 'none' })
      return
    }
    
    const card = this.gameEngine.takeFromDiscard()
    if (card) {
      this.setData({
        drawnCard: {
          ...card,
          displayValue: getCardDisplayValue(card.value),
          suitSymbol: getSuitSymbol(card.suit),
          color: getCardColor(card),
          hasAbility: false,
          abilityName: ''
        },
        showActionSheet: true,
        exchangeFromDiscard: true
      })
    }
  },

  onCallCabo() {
    if (!this.data.isMyTurn || this.data.turnPhase !== 'action') {
      return
    }
    
    if (this.data.hasCalledCabo) {
      wx.showToast({ title: '你已经喊过CABO了', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '确认喊CABO',
      content: '确定要喊CABO吗？喊完后其他玩家将进行最后一轮。',
      success: (res) => {
        if (res.confirm) {
          this.gameEngine.callCabo()
        }
      }
    })
  },

  onActionExchange() {
    this.setData({ 
      showActionSheet: false,
      showExchangeModal: true,
      selectedExchangeIndices: []
    })
  },

  onActionDiscard() {
    const card = this.data.drawnCard
    
    this.gameEngine.discardCard({
      value: card.value,
      suit: card.suit,
      id: card.id
    }, false)
    this.setData({ 
      showActionSheet: false,
      drawnCard: null
    })
  },

  onActionUseAbility() {
    const card = this.data.drawnCard
    this.setData({ 
      showAbilityModal: true,
      abilityCard: card,
      abilityType: getAbilityType(card.value)
    })
  },

  onSelectExchangeCard(e) {
    const index = e.currentTarget.dataset.index
    let selected = [...this.data.selectedExchangeIndices]
    
    if (selected.includes(index)) {
      selected = selected.filter(i => i !== index)
    } else {
      selected.push(index)
    }
    
    this.setData({ selectedExchangeIndices: selected })
  },

  onConfirmExchange() {
    const card = this.data.drawnCard
    const indices = this.data.selectedExchangeIndices
    
    if (indices.length === 0) {
      wx.showToast({ title: '请选择要交换的牌', icon: 'none' })
      return
    }
    
    const result = this.gameEngine.exchangeCards({
      value: card.value,
      suit: card.suit,
      id: card.id
    }, indices, !this.data.exchangeFromDiscard)
    
    this.setData({ 
      showExchangeModal: false,
      drawnCard: null,
      selectedExchangeIndices: []
    })
  },

  onCancelExchange() {
    this.setData({ 
      showExchangeModal: false,
      showActionSheet: true
    })
  },

  onUseAbility() {
    const card = this.data.abilityCard
    const abilityType = this.data.abilityType
    
    this.setData({
      showAbilityModal: false,
      showActionSheet: false
    })
    
    switch (abilityType) {
      case 'peek_self':
        this.setData({ showPeekModal: true })
        break
      case 'spy':
        this.setData({ showSpyModal: true })
        break
      case 'swap':
        this.setData({ showSwapModal: true })
        break
    }
  },

  onSkipAbility() {
    const card = this.data.drawnCard || this.data.abilityCard
    
    this.gameEngine.discardCard({
      value: card.value,
      suit: card.suit,
      id: card.id
    }, false)
    
    this.setData({
      showAbilityModal: false,
      showActionSheet: false,
      drawnCard: null,
      abilityCard: null
    })
  },

  onSelectPeekCard(e) {
    const index = e.currentTarget.dataset.index
    const myCards = this.data.myCards
    const card = myCards[index]
    
    if (card.isFaceUp) {
      wx.showToast({ title: '这张牌已经是明牌了', icon: 'none' })
      return
    }
    
    this.gameEngine.discardCard({
      value: this.data.abilityCard.value,
      suit: this.data.abilityCard.suit,
      id: this.data.abilityCard.id
    }, true)
    
    const result = this.gameEngine.useAbility('peek_self', { cardIndex: index })
    
    this.setData({
      showPeekModal: false,
      abilityCard: null,
      showAbilityResultModal: true,
      abilityResultData: {
        type: 'peek_self',
        title: '偷看自己的牌',
        card: {
          value: result.card.value,
          suit: result.card.suit,
          displayValue: getCardDisplayValue(result.card.value),
          suitSymbol: getSuitSymbol(result.card.suit),
          color: getCardColor(result.card)
        },
        cardIndex: index
      }
    })
  },

  onSelectSpyTarget(e) {
    const playerIndex = e.currentTarget.dataset.playerIndex
    const targetPlayer = this.data.opponents.find((_, i) => i + 1 === playerIndex)
    
    if (!targetPlayer) {
      wx.showToast({ title: '无效的对手', icon: 'none' })
      return
    }
    
    const targetCards = targetPlayer.cards.map((card, index) => ({
      index: index,
      isFaceUp: card.isFaceUp,
      displayValue: card.isFaceUp ? card.value : '?'
    }))
    
    this.setData({
      showSpyModal: false,
      spyTargetPlayerIndex: playerIndex,
      showSpyCardSelectModal: true,
      spyTargetCards: targetCards
    })
  },

  onSelectSpyCard(e) {
    const cardIndex = e.currentTarget.dataset.index
    const playerIndex = this.data.spyTargetPlayerIndex
    
    this.gameEngine.discardCard({
      value: this.data.abilityCard.value,
      suit: this.data.abilityCard.suit,
      id: this.data.abilityCard.id
    }, true)
    
    const result = this.gameEngine.useAbility('spy', { 
      playerIndex: playerIndex,
      cardIndex: cardIndex
    })
    
    const targetPlayer = this.data.opponents.find((_, i) => i + 1 === playerIndex)
    
    this.setData({
      showSpyCardSelectModal: false,
      abilityCard: null,
      spyTargetPlayerIndex: -1,
      spyTargetCards: [],
      showAbilityResultModal: true,
      abilityResultData: {
        type: 'spy',
        title: '查看对手的牌',
        targetName: targetPlayer ? targetPlayer.name : '对手',
        card: {
          value: result.card.value,
          suit: result.card.suit,
          displayValue: getCardDisplayValue(result.card.value),
          suitSymbol: getSuitSymbol(result.card.suit),
          color: getCardColor(result.card)
        },
        cardIndex: cardIndex
      }
    })
  },

  onCloseSpyCardSelectModal() {
    this.setData({
      showSpyCardSelectModal: false,
      spyTargetPlayerIndex: -1,
      spyTargetCards: [],
      showSpyModal: true
    })
  },

  onSelectSwapMyCard(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ swapMyCardIndex: index })
  },

  onSelectSwapTarget(e) {
    const { playerIndex, cardIndex } = e.currentTarget.dataset
    this.setData({ 
      swapTargetPlayerIndex: parseInt(playerIndex),
      swapTargetCardIndex: parseInt(cardIndex)
    })
  },

  onConfirmSwap() {
    const { swapMyCardIndex, swapTargetPlayerIndex, swapTargetCardIndex } = this.data
    
    if (swapMyCardIndex < 0 || swapTargetPlayerIndex < 0 || swapTargetCardIndex < 0) {
      wx.showToast({ title: '请选择要交换的牌', icon: 'none' })
      return
    }
    
    this.gameEngine.discardCard({
      value: this.data.abilityCard.value,
      suit: this.data.abilityCard.suit,
      id: this.data.abilityCard.id
    }, true)
    
    this.gameEngine.useAbility('swap', {
      myCardIndex: swapMyCardIndex,
      targetPlayerIndex: swapTargetPlayerIndex,
      targetCardIndex: swapTargetCardIndex
    })
    
    this.setData({
      showSwapModal: false,
      abilityCard: null,
      swapMyCardIndex: -1,
      swapTargetPlayerIndex: -1,
      swapTargetCardIndex: -1
    })
  },

  onClosePeekModal() {
    this.setData({ showPeekModal: false })
    this.updateUI()
  },

  onCloseSpyModal() {
    this.setData({ showSpyModal: false })
  },

  onCloseSwapModal() {
    this.setData({ showSwapModal: false })
  },

  onCloseAbilityResultModal() {
    this.setData({ 
      showAbilityResultModal: false,
      abilityResultData: null
    })
    this.updateUI()
  },

  onCardTap(e) {
    const index = e.currentTarget.dataset.index
    const card = this.data.myCards[index]
    
    if (card.isKnown) {
      wx.showToast({
        title: `这张牌是 ${card.displayValue}`,
        icon: 'none'
      })
    }
  },

  onCloseRoundEndModal() {
    this.setData({ showRoundEndModal: false })
    this.gameEngine.startNextRoundAfterConfirm()
  },

  onCloseGameEndModal() {
    this.setData({ showGameEndModal: false })
    wx.navigateBack()
  },

  processAITurn() {
    setTimeout(() => {
      const ai = new AIPlayer('normal')
      const currentPlayerIndex = this.gameEngine.currentPlayerIndex
      const decision = ai.makeDecision(this.gameEngine.getState(), currentPlayerIndex)
      
      this.executeAIDecision(decision)
    }, 1000)
  },

  executeAIDecision(decision) {
    switch (decision.action) {
      case 'draw':
        const card = this.gameEngine.drawFromPile()
        if (card) {
          setTimeout(() => {
            const ai = new AIPlayer('normal')
            const currentPlayer = this.gameEngine.getCurrentPlayer()
            const afterDrawDecision = ai.decideAfterDraw(card, currentPlayer)
            
            if (afterDrawDecision.action === 'use_ability') {
              this.gameEngine.discardCard(card, true)
              this.gameEngine.useAbility(getAbilityType(card.value), afterDrawDecision.abilityTargets || {})
            } else if (afterDrawDecision.action === 'discard') {
              this.gameEngine.discardCard(card, false)
            } else if (afterDrawDecision.action === 'exchange') {
              this.gameEngine.exchangeCards(card, afterDrawDecision.targetIndices || [0], true)
            }
          }, 500)
        }
        break
        
      case 'take_discard':
        const discardCard = this.gameEngine.takeFromDiscard()
        if (discardCard) {
          setTimeout(() => {
            this.gameEngine.exchangeCards(discardCard, decision.targetIndices || [0], false)
          }, 500)
        }
        break
        
      case 'call_cabo':
        this.gameEngine.callCabo()
        break
    }
  },

  onBackToHome() {
    wx.showModal({
      title: '返回首页',
      content: '确定要退出当前游戏吗？游戏进度将不会保存。',
      confirmText: '确定退出',
      cancelText: '继续游戏',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack({
            delta: 1
          })
        }
      }
    })
  },

  onUnload() {
    if (this.peekTimer) {
      clearInterval(this.peekTimer)
    }
    if (this.gameEngine) {
      this.gameEngine.observers = []
    }
  }
})
