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
    peekViewingCards: [],
    flyingCards: []
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
    console.log('onDrawFromPile called')
    if (!this.data.isMyTurn || this.data.turnPhase !== 'action') {
      console.log('Cannot draw: not my turn or wrong phase')
      return
    }
    
    const card = this.gameEngine.drawFromPile()
    console.log('Drawn card:', card)
    if (card) {
      const animatedCard = {
        ...card,
        displayValue: getCardDisplayValue(card.value),
        suitSymbol: getSuitSymbol(card.suit),
        color: getCardColor(card),
        hasAbility: hasAbility(card.value),
        abilityName: getAbilityName(card.value),
        isFaceUp: true
      }
      
      // 触发抽牌飞行动画
      console.log('Triggering animateDrawToHand')
      this.animateDrawToHand(animatedCard)
      
      // 延迟显示操作面板，等待动画完成（800ms动画 + 100ms缓冲）
      setTimeout(() => {
        console.log('Showing action sheet after animation')
        this.setData({
          drawnCard: animatedCard,
          showActionSheet: true,
          exchangeFromDiscard: false
        })
      }, 900)
    }
  },

  onTakeFromDiscard() {
    console.log('onTakeFromDiscard called')
    if (!this.data.isMyTurn || this.data.turnPhase !== 'action') {
      console.log('Cannot take: not my turn or wrong phase')
      return
    }
    
    if (!this.data.topDiscard || !this.data.topDiscard.canPick) {
      wx.showToast({ title: '无法捡取此牌', icon: 'none' })
      return
    }
    
    const card = this.gameEngine.takeFromDiscard()
    console.log('Taken card:', card)
    if (card) {
      const animatedCard = {
        ...card,
        displayValue: getCardDisplayValue(card.value),
        suitSymbol: getSuitSymbol(card.suit),
        color: getCardColor(card),
        hasAbility: false,
        abilityName: '',
        isFaceUp: true
      }
      
      // 触发捡牌飞行动画
      console.log('Triggering animateDiscardToHand')
      this.animateDiscardToHand(animatedCard)
      
      // 延迟显示操作面板，等待动画完成（800ms动画 + 100ms缓冲）
      setTimeout(() => {
        console.log('Showing action sheet after animation')
        this.setData({
          drawnCard: animatedCard,
          showActionSheet: true,
          exchangeFromDiscard: true
        })
      }, 900)
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
    // 重置所有卡牌的选中状态
    const myCards = this.data.myCards.map(card => ({
      ...card,
      isSelected: false
    }))
    
    this.setData({ 
      showActionSheet: false,
      showExchangeModal: true,
      selectedExchangeIndices: [],
      myCards: myCards
    })
  },

  onActionDiscard() {
    console.log('onActionDiscard called')
    const card = this.data.drawnCard
    
    // 先隐藏操作面板，让用户看到飞行动画
    this.setData({ showActionSheet: false })
    
    // 触发弃牌飞行动画（从抽牌堆/当前位置飞到弃牌堆）
    const animatedCard = {
      ...card,
      isFaceUp: true
    }
    console.log('Triggering animateDrawToDiscard')
    this.animateDrawToDiscard(animatedCard)
    
    // 动画完成后执行弃牌逻辑（600ms动画 + 100ms缓冲）
    setTimeout(() => {
      console.log('Executing discard logic after animation')
      this.gameEngine.discardCard({
        value: card.value,
        suit: card.suit,
        id: card.id
      }, false)
      this.setData({ 
        drawnCard: null
      })
    }, 700)
  },

  onActionUseAbility() {
    const card = this.data.drawnCard
    
    // 添加技能动画
    const animatedCard = {
      ...card,
      animation: 'card-ability'
    }
    
    this.setData({ 
      showAbilityModal: true,
      abilityCard: animatedCard,
      abilityType: getAbilityType(card.value)
    })
    
    // 清除动画类名，以便下次动画可以重新触发
    setTimeout(() => {
      if (this.data.abilityCard) {
        const updatedCard = { ...this.data.abilityCard }
        delete updatedCard.animation
        this.setData({ abilityCard: updatedCard })
      }
    }, 800)
  },

  onSelectExchangeCard(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    console.log('onSelectExchangeCard called, index:', index, 'type:', typeof index)
    
    let selected = [...this.data.selectedExchangeIndices]
    // 确保数组中的都是数字类型
    selected = selected.map(i => parseInt(i))
    
    if (selected.includes(index)) {
      selected = selected.filter(i => i !== index)
      console.log('Deselected card', index, 'current selection:', selected)
    } else {
      selected.push(index)
      console.log('Selected card', index, 'current selection:', selected)
    }
    
    // 更新 myCards 中每张卡牌的 isSelected 属性
    const myCards = this.data.myCards.map((card, i) => ({
      ...card,
      isSelected: selected.includes(i)
    }))
    
    this.setData({ 
      selectedExchangeIndices: selected,
      myCards: myCards
    }, () => {
      console.log('selectedExchangeIndices updated:', this.data.selectedExchangeIndices)
      console.log('myCards updated, isSelected states:', this.data.myCards.map(c => c.isSelected))
    })
  },

  async onConfirmExchange() {
    const card = this.data.drawnCard
    const indices = this.data.selectedExchangeIndices
    
    if (indices.length === 0) {
      wx.showToast({ title: '请选择要交换的牌', icon: 'none' })
      return
    }
    
    // 获取被交换的旧卡牌信息
    const targetIndex = indices[0] // 简化处理，只处理第一张选中的牌
    const oldCard = this.data.myCards[targetIndex]
    
    // 准备新卡牌信息
    const newCard = {
      ...card,
      displayValue: getCardDisplayValue(card.value),
      suitSymbol: getSuitSymbol(card.suit),
      color: getCardColor(card),
      isFaceUp: true
    }
    
    // 准备旧卡牌信息
    const oldCardInfo = oldCard ? {
      ...oldCard,
      isFaceUp: oldCard.isFaceUp || false
    } : null
    
    // 触发交换飞行动画
    if (oldCardInfo) {
      await this.animateExchange(newCard, oldCardInfo, targetIndex)
    }
    
    // 动画完成后执行交换逻辑
    setTimeout(() => {
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
      
      // 更新UI
      this.updateUI()
    }, 800)
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

  // ============ 飞行动画方法 ============
  
  // 创建飞行动画
  createFlyingCard(card, fromRect, toRect, options = {}) {
    console.log('createFlyingCard called:', { fromRect, toRect, options })
    
    const id = 'fly_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const duration = options.duration || 800
    const scale = options.scale || 1
    const rotate = options.rotate || 0
    
    // 计算卡牌尺寸（用于居中对齐）
    const cardWidth = 70 // px (140rpx ≈ 70px)
    const cardHeight = 90 // px (180rpx ≈ 90px)
    
    // 计算起始位置（居中）
    const startX = fromRect.left + (fromRect.width || cardWidth) / 2 - cardWidth / 2
    const startY = fromRect.top + (fromRect.height || cardHeight) / 2 - cardHeight / 2
    
    // 计算目标位置（居中）
    const targetX = toRect.left + (toRect.width || cardWidth) / 2 - cardWidth / 2
    const targetY = toRect.top + (toRect.height || cardHeight) / 2 - cardHeight / 2
    
    console.log('Flying card positions:', { startX, startY, targetX, targetY })
    
    const flyingCard = {
      id: id,
      type: card.isFaceUp ? 'card-front' : 'card-back',
      isFaceUp: card.isFaceUp || false,
      displayValue: card.displayValue || getCardDisplayValue(card.value),
      suitSymbol: card.suitSymbol || getSuitSymbol(card.suit),
      color: card.color || getCardColor(card),
      // 起始位置
      currentX: startX,
      currentY: startY,
      // 目标位置
      targetX: targetX,
      targetY: targetY,
      // 动画状态
      flying: false,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      opacity: 1,
      duration: duration
    }
    
    // 添加到飞行动画数组
    const flyingCards = [...this.data.flyingCards, flyingCard]
    this.setData({ flyingCards }, () => {
      console.log('Flying card added to data, count:', flyingCards.length)
    })
    
    // 下一帧开始动画
    setTimeout(() => {
      console.log('Starting flight animation for card:', id)
      // 找到当前卡牌并更新位置
      const currentCards = this.data.flyingCards
      const cardIndex = currentCards.findIndex(c => c.id === id)
      if (cardIndex >= 0) {
        const updatedCards = [...currentCards]
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          currentX: updatedCards[cardIndex].targetX,
          currentY: updatedCards[cardIndex].targetY,
          flying: true,
          transform: `scale(1) rotate(0deg)`,
          opacity: options.fadeOut ? 0 : 1
        }
        this.setData({ flyingCards: updatedCards }, () => {
          console.log('Flight animation started, moving to:', updatedCards[cardIndex].targetX, updatedCards[cardIndex].targetY)
        })
      }
    }, 100)
    
    // 动画结束后移除
    setTimeout(() => {
      console.log('Removing flying card:', id)
      const updatedFlyingCards = this.data.flyingCards.filter(c => c.id !== id)
      this.setData({ flyingCards: updatedFlyingCards })
    }, duration + 200)
    
    return id
  },
  
  // 获取元素位置
  getElementRect(selector) {
    return new Promise((resolve) => {
      const query = wx.createSelectorQuery()
      query.select(selector).boundingClientRect()
      query.exec((res) => {
        resolve(res[0] || null)
      })
    })
  },
  
  // 抽牌飞行动画 - 从抽牌堆飞到个人牌区
  async animateDrawToHand(card, targetCardIndex = -1) {
    console.log('animateDrawToHand called with card:', card)
    const drawPileRect = await this.getElementRect('.draw-pile .pile-card')
    console.log('drawPileRect:', drawPileRect)
    if (!drawPileRect) {
      console.log('Cannot get draw pile rect')
      return
    }
    
    // 计算目标位置（个人牌区中心）
    const myCardsRect = await this.getElementRect('.my-cards')
    console.log('myCardsRect:', myCardsRect)
    let targetRect = myCardsRect
    
    // 如果有指定目标卡牌位置，使用具体位置
    if (targetCardIndex >= 0) {
      const cardSelector = `.my-cards .card:nth-child(${targetCardIndex + 1})`
      const cardRect = await this.getElementRect(cardSelector)
      if (cardRect) {
        targetRect = cardRect
      }
    }
    
    if (!targetRect) {
      // 如果无法获取位置，使用默认值
      const sysInfo = wx.getSystemInfoSync()
      targetRect = {
        left: sysInfo.windowWidth / 2 - 60,
        top: sysInfo.windowHeight - 200,
        width: 60,
        height: 80
      }
    }
    
    console.log('Creating flying card from', drawPileRect, 'to', targetRect)
    this.createFlyingCard(card, drawPileRect, targetRect, {
      duration: 800,
      scale: 0.8,
      rotate: -10,
      fadeOut: true
    })
  },
  
  // 弃牌飞行动画 - 从个人牌区飞到弃牌堆
  async animateHandToDiscard(card, fromCardIndex = -1) {
    const discardPileRect = await this.getElementRect('.discard-pile .pile-card')
    if (!discardPileRect) return
    
    // 计算起始位置（个人牌区）
    let fromRect = null
    if (fromCardIndex >= 0) {
      const cardSelector = `.my-cards .card:nth-child(${fromCardIndex + 1})`
      fromRect = await this.getElementRect(cardSelector)
    }
    
    if (!fromRect) {
      fromRect = await this.getElementRect('.my-cards')
    }
    
    if (!fromRect) {
      // 如果无法获取位置，使用默认值
      const sysInfo = wx.getSystemInfoSync()
      fromRect = {
        left: sysInfo.windowWidth / 2 - 60,
        top: sysInfo.windowHeight - 200,
        width: 60,
        height: 80
      }
    }
    
    this.createFlyingCard(card, fromRect, discardPileRect, {
      duration: 700,
      scale: 1,
      rotate: 0,
      fadeOut: true
    })
  },
  
  // 直接弃牌飞行动画 - 从抽牌堆飞到弃牌堆
  async animateDrawToDiscard(card) {
    const drawPileRect = await this.getElementRect('.draw-pile .pile-card')
    const discardPileRect = await this.getElementRect('.discard-pile .pile-card')
    
    if (!drawPileRect || !discardPileRect) return
    
    this.createFlyingCard(card, drawPileRect, discardPileRect, {
      duration: 600,
      scale: 1,
      rotate: 0,
      fadeOut: true
    })
  },
  
  // 捡牌飞行动画 - 从弃牌堆飞到个人牌区
  async animateDiscardToHand(card, targetCardIndex = -1) {
    const discardPileRect = await this.getElementRect('.discard-pile .pile-card')
    if (!discardPileRect) return
    
    // 计算目标位置（个人牌区）
    let targetRect = null
    if (targetCardIndex >= 0) {
      const cardSelector = `.my-cards .card:nth-child(${targetCardIndex + 1})`
      targetRect = await this.getElementRect(cardSelector)
    }
    
    if (!targetRect) {
      targetRect = await this.getElementRect('.my-cards')
    }
    
    if (!targetRect) {
      const sysInfo = wx.getSystemInfoSync()
      targetRect = {
        left: sysInfo.windowWidth / 2 - 60,
        top: sysInfo.windowHeight - 200,
        width: 60,
        height: 80
      }
    }
    
    this.createFlyingCard(card, discardPileRect, targetRect, {
      duration: 800,
      scale: 0.9,
      rotate: 5,
      fadeOut: true
    })
  },
  
  // 交换飞行动画 - 双向飞行
  async animateExchange(newCard, oldCard, targetCardIndex) {
    // 新卡牌飞入
    await this.animateExchangeIn(newCard, targetCardIndex)
    
    // 旧卡牌飞出到弃牌区
    setTimeout(() => {
      this.animateExchangeOut(oldCard, targetCardIndex)
    }, 200)
  },
  
  // 交换飞入动画
  async animateExchangeIn(card, targetCardIndex) {
    const drawPileRect = await this.getElementRect('.draw-pile .pile-card')
    if (!drawPileRect) return
    
    let targetRect = null
    if (targetCardIndex >= 0) {
      const cardSelector = `.my-cards .card:nth-child(${targetCardIndex + 1})`
      targetRect = await this.getElementRect(cardSelector)
    }
    
    if (!targetRect) {
      targetRect = await this.getElementRect('.my-cards')
    }
    
    if (!targetRect) {
      const sysInfo = wx.getSystemInfoSync()
      targetRect = {
        left: sysInfo.windowWidth / 2 - 60,
        top: sysInfo.windowHeight - 200,
        width: 60,
        height: 80
      }
    }
    
    this.createFlyingCard(card, drawPileRect, targetRect, {
      duration: 800,
      scale: 0.8,
      rotate: -15,
      fadeOut: true
    })
  },
  
  // 交换飞出动画
  async animateExchangeOut(card, fromCardIndex) {
    const discardPileRect = await this.getElementRect('.discard-pile .pile-card')
    if (!discardPileRect) return
    
    let fromRect = null
    if (fromCardIndex >= 0) {
      const cardSelector = `.my-cards .card:nth-child(${fromCardIndex + 1})`
      fromRect = await this.getElementRect(cardSelector)
    }
    
    if (!fromRect) {
      fromRect = await this.getElementRect('.my-cards')
    }
    
    if (!fromRect) {
      const sysInfo = wx.getSystemInfoSync()
      fromRect = {
        left: sysInfo.windowWidth / 2 - 60,
        top: sysInfo.windowHeight - 200,
        width: 60,
        height: 80
      }
    }
    
    this.createFlyingCard(card, fromRect, discardPileRect, {
      duration: 700,
      scale: 1,
      rotate: 0,
      fadeOut: true
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
