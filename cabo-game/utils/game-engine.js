const CARD_ABILITIES = {
  PEEK_SELF: 'peek_self',
  SPY: 'spy',
  SWAP: 'swap'
}

const ABILITY_CARDS = {
  7: CARD_ABILITIES.PEEK_SELF,
  8: CARD_ABILITIES.PEEK_SELF,
  9: CARD_ABILITIES.SPY,
  10: CARD_ABILITIES.SPY,
  11: CARD_ABILITIES.SWAP,
  12: CARD_ABILITIES.SWAP
}

class GameEngine {
  constructor() {
    this.reset()
  }

  reset() {
    this.players = []
    this.drawPile = []
    this.discardPile = []
    this.currentPlayerIndex = 0
    this.roundNumber = 1
    this.gamePhase = 'waiting'
    this.turnPhase = 'action'
    this.caboCaller = null
    this.remainingTurnsAfterCabo = 0
    this.peekingPlayerIndex = 0
    this.canReset100 = true
    this.observers = []
  }

  addObserver(callback) {
    this.observers.push(callback)
  }

  notify(event, data) {
    this.observers.forEach(cb => cb(event, data))
  }

  initializeDeck() {
    this.drawPile = []
    for (let value = 0; value <= 13; value++) {
      for (let suit = 0; suit < 4; suit++) {
        this.drawPile.push({
          value: value,
          suit: suit,
          id: `${value}-${suit}-${Date.now()}-${Math.random()}`
        })
      }
    }
    this.shuffleDeck()
  }

  shuffleDeck() {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]]
    }
  }

  addPlayer(playerInfo) {
    if (this.players.length >= 4) {
      return false
    }
    
    const player = {
      id: playerInfo.id || `player_${this.players.length}`,
      name: playerInfo.name || `玩家${this.players.length + 1}`,
      avatar: playerInfo.avatar || '',
      cards: [],
      knownCards: [],
      totalScore: 0,
      roundScore: 0,
      hasCalledCabo: false,
      isAI: playerInfo.isAI || false,
      historyScores: []
    }
    
    this.players.push(player)
    return true
  }

  startGame() {
    if (this.players.length < 2) {
      return false
    }

    this.initializeDeck()
    this.dealCards()
    
    const firstDiscard = this.drawPile.pop()
    firstDiscard.isFaceUp = true
    firstDiscard.canPick = true
    this.discardPile.push(firstDiscard)
    
    this.gamePhase = 'peek'
    this.turnPhase = 'peek_select'
    this.currentPlayerIndex = 0
    this.peekingPlayerIndex = 0
    
    this.notify('GAME_START', this.getState())
    this.startPeekPhaseForCurrentPlayer()
    
    return true
  }

  startPeekPhaseForCurrentPlayer() {
    const currentPlayer = this.getCurrentPlayer()
    if (currentPlayer.isAI) {
      this.autoPeekForAI(this.currentPlayerIndex)
    } else {
      this.notify('PEEK_PHASE_START', { 
        message: '你可以选择查看2张牌',
        playerIndex: this.currentPlayerIndex
      })
    }
  }

  autoPeekForAI(playerIndex) {
    const player = this.players[playerIndex]
    if (!player || !player.isAI) return false
    
    const randomIndices = []
    while (randomIndices.length < 2) {
      const index = Math.floor(Math.random() * 4)
      if (!randomIndices.includes(index)) {
        randomIndices.push(index)
      }
    }
    
    randomIndices.forEach(index => {
      player.cards[index].isKnown = true
      if (!player.knownCards.includes(index)) {
        player.knownCards.push(index)
      }
    })
    
    this.moveToNextPeekingPlayer()
    return true
  }

  dealCards() {
    this.players.forEach(player => {
      player.cards = []
      player.knownCards = []
      
      for (let i = 0; i < 4; i++) {
        const card = this.drawPile.pop()
        card.isFaceUp = false
        card.isKnown = false
        card.isPeeking = false
        player.cards.push(card)
      }
    })
  }

  selectPeekCard(playerIndex, cardIndex) {
    const player = this.players[playerIndex]
    if (!player || this.gamePhase !== 'peek') return { success: false }
    if (cardIndex < 0 || cardIndex >= player.cards.length) return { success: false }
    
    if (player.cards[cardIndex].isPeeking) {
      return { success: false, message: '已选择的牌不可取消' }
    }
    
    const peekingCards = player.cards.filter(c => c.isPeeking)
    if (peekingCards.length >= 2) {
      return { success: false, message: '最多只能选择2张牌' }
    }
    
    player.cards[cardIndex].isPeeking = true
    
    const selectedCount = player.cards.filter(c => c.isPeeking).length
    this.notify('PEEK_CARD_SELECTED', { 
      playerIndex, 
      cardIndex, 
      selectedCount,
      card: player.cards[cardIndex]
    })
    
    return { success: true, selectedCount }
  }

  confirmPeekCards(playerIndex) {
    const player = this.players[playerIndex]
    if (!player || this.gamePhase !== 'peek') return { success: false }
    
    const peekingCards = player.cards.filter(c => c.isPeeking)
    if (peekingCards.length !== 2) {
      return { success: false, message: '请选择2张牌' }
    }
    
    this.turnPhase = 'peek_view'
    this.notify('PEEK_CARDS_CONFIRMED', { 
      playerIndex,
      cards: peekingCards.map((c, i) => ({
        index: player.cards.indexOf(c),
        card: c
      }))
    })
    
    return { success: true }
  }

  endPeekPhase(playerIndex) {
    const player = this.players[playerIndex]
    if (!player) return false
    
    player.cards.forEach((card, index) => {
      if (card.isPeeking) {
        card.isKnown = true
        if (!player.knownCards.includes(index)) {
          player.knownCards.push(index)
        }
        card.isPeeking = false
      }
      card.isFaceUp = false
    })
    
    this.moveToNextPeekingPlayer()
    
    return true
  }

  moveToNextPeekingPlayer() {
    this.peekingPlayerIndex++
    
    if (this.peekingPlayerIndex >= this.players.length) {
      this.gamePhase = 'playing'
      this.turnPhase = 'action'
      this.currentPlayerIndex = Math.floor(Math.random() * this.players.length)
      
      this.notify('ALL_PEEK_COMPLETE', {})
      this.notify('TURN_CHANGE', { 
        currentPlayer: this.getCurrentPlayer(),
        roundNumber: this.roundNumber
      })
    } else {
      this.currentPlayerIndex = this.peekingPlayerIndex
      this.startPeekPhaseForCurrentPlayer()
    }
  }

  peekInitialCards(playerIndex, cardIndices) {
    const player = this.players[playerIndex]
    if (!player || cardIndices.length !== 2) return false
    
    cardIndices.forEach(index => {
      if (index >= 0 && index < 4) {
        player.cards[index].isKnown = true
        if (!player.knownCards.includes(index)) {
          player.knownCards.push(index)
        }
      }
    })
    
    return true
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex]
  }

  drawFromPile() {
    if (this.drawPile.length === 0) {
      return null
    }
    
    const card = this.drawPile.pop()
    card.isFaceUp = true
    card.source = 'draw'
    
    this.turnPhase = 'draw_action'
    this.notify('CARD_DRAWN', { card: card, player: this.getCurrentPlayer() })
    
    return card
  }

  takeFromDiscard() {
    if (this.discardPile.length === 0) {
      return null
    }
    
    const topCard = this.discardPile[this.discardPile.length - 1]
    if (!topCard.canPick) {
      return null
    }
    
    const card = this.discardPile.pop()
    card.source = 'discard'
    
    this.turnPhase = 'exchange'
    this.notify('CARD_TAKEN_FROM_DISCARD', { card: card, player: this.getCurrentPlayer() })
    
    return card
  }

  exchangeCards(card, targetIndices, fromPile = true) {
    const player = this.getCurrentPlayer()
    if (!player || !card) {
      return { success: false, reason: '无效操作' }
    }

    if (targetIndices.length === 0) {
      return { success: false, reason: '请选择要交换的牌' }
    }

    if (targetIndices.length === 1) {
      return this.singleExchange(card, targetIndices[0], fromPile)
    } else {
      return this.multipleExchange(card, targetIndices, fromPile)
    }
  }

  singleExchange(card, targetIndex, fromPile) {
    const player = this.getCurrentPlayer()
    
    if (targetIndex < 0 || targetIndex >= player.cards.length) {
      return { success: false, reason: '无效的目标牌' }
    }

    const oldCard = player.cards[targetIndex]
    this.discardPile.push({
      ...oldCard,
      isFaceUp: true,
      canPick: true
    })

    player.cards[targetIndex] = {
      ...card,
      isFaceUp: false,
      isKnown: false
    }

    this.endTurn()
    this.notify('EXCHANGE_COMPLETE', { 
      player: player, 
      newCard: player.cards[targetIndex],
      discardedCard: oldCard
    })

    return { success: true }
  }

  multipleExchange(card, targetIndices, fromPile) {
    const player = this.getCurrentPlayer()
    const targetCards = targetIndices.map(i => player.cards[i])
    
    const allSameValue = targetCards.every(c => c.value === card.value)
    
    if (!allSameValue) {
      player.cards.push({
        ...card,
        isFaceUp: false,
        isKnown: false
      })

      let penalty = false
      if (targetIndices.length >= 3 && this.drawPile.length > 0) {
        const penaltyCard = this.drawPile.pop()
        penaltyCard.isFaceUp = false
        penaltyCard.isKnown = false
        player.cards.push(penaltyCard)
        penalty = true
      }

      this.endTurn()
      this.notify('EXCHANGE_FAILED', { 
        player: player, 
        penalty: penalty 
      })

      return { 
        success: false, 
        reason: '目标牌数字不一致',
        penalty: penalty
      }
    }

    targetIndices.forEach(index => {
      const oldCard = player.cards[index]
      this.discardPile.push({
        ...oldCard,
        isFaceUp: true,
        canPick: true
      })

      player.cards[index] = {
        ...card,
        isFaceUp: false,
        isKnown: false
      }
    })

    this.endTurn()
    this.notify('EXCHANGE_COMPLETE', { 
      player: player, 
      exchangedCount: targetIndices.length
    })

    return { success: true }
  }

  discardCard(card, useAbility = false) {
    const player = this.getCurrentPlayer()
    
    const discardedCard = {
      ...card,
      isFaceUp: true,
      canPick: !useAbility
    }
    
    this.discardPile.push(discardedCard)
    
    if (useAbility && ABILITY_CARDS[card.value]) {
      this.turnPhase = 'ability'
      return {
        success: true,
        ability: ABILITY_CARDS[card.value],
        card: card
      }
    }

    this.endTurn()
    this.notify('CARD_DISCARDED', { 
      player: player, 
      card: card,
      abilityUsed: useAbility
    })

    return { success: true, ability: null }
  }

  useAbility(ability, targets) {
    const player = this.getCurrentPlayer()
    let result = { success: true }

    switch (ability) {
      case CARD_ABILITIES.PEEK_SELF:
        result = this.executePeekSelf(targets.cardIndex)
        break
      case CARD_ABILITIES.SPY:
        result = this.executeSpy(targets.playerIndex, targets.cardIndex)
        break
      case CARD_ABILITIES.SWAP:
        result = this.executeSwap(targets.myCardIndex, targets.targetPlayerIndex, targets.targetCardIndex)
        break
    }

    this.endTurn()
    return result
  }

  executePeekSelf(cardIndex) {
    const player = this.getCurrentPlayer()
    
    if (cardIndex < 0 || cardIndex >= player.cards.length) {
      return { success: false, reason: '无效的牌索引' }
    }

    const card = player.cards[cardIndex]
    card.isKnown = true
    if (!player.knownCards.includes(cardIndex)) {
      player.knownCards.push(cardIndex)
    }

    this.notify('ABILITY_PEEK_SELF', { 
      player: player, 
      card: card,
      cardIndex: cardIndex
    })

    return { success: true, card: card }
  }

  executeSpy(targetPlayerIndex, cardIndex) {
    const currentPlayer = this.getCurrentPlayer()
    const targetPlayer = this.players[targetPlayerIndex]
    
    if (!targetPlayer || targetPlayer.id === currentPlayer.id) {
      return { success: false, reason: '无效的目标玩家' }
    }

    if (cardIndex < 0 || cardIndex >= targetPlayer.cards.length) {
      return { success: false, reason: '无效的牌索引' }
    }

    const card = targetPlayer.cards[cardIndex]

    this.notify('ABILITY_SPY', { 
      player: currentPlayer,
      targetPlayer: targetPlayer,
      card: card,
      cardIndex: cardIndex
    })

    return { success: true, card: card }
  }

  executeSwap(myCardIndex, targetPlayerIndex, targetCardIndex) {
    const currentPlayer = this.getCurrentPlayer()
    const targetPlayer = this.players[targetPlayerIndex]
    
    if (!targetPlayer || targetPlayer.id === currentPlayer.id) {
      return { success: false, reason: '无效的目标玩家' }
    }

    if (myCardIndex < 0 || myCardIndex >= currentPlayer.cards.length) {
      return { success: false, reason: '无效的自己牌索引' }
    }

    if (targetCardIndex < 0 || targetCardIndex >= targetPlayer.cards.length) {
      return { success: false, reason: '无效的目标牌索引' }
    }

    const myCard = currentPlayer.cards[myCardIndex]
    const theirCard = targetPlayer.cards[targetCardIndex]

    const myCardFaceUp = myCard.isFaceUp
    const theirCardFaceUp = theirCard.isFaceUp

    currentPlayer.cards[myCardIndex] = {
      value: theirCard.value,
      suit: theirCard.suit,
      id: theirCard.id,
      isFaceUp: myCardFaceUp,
      isKnown: currentPlayer.knownCards.includes(myCardIndex)
    }

    targetPlayer.cards[targetCardIndex] = {
      value: myCard.value,
      suit: myCard.suit,
      id: myCard.id,
      isFaceUp: theirCardFaceUp,
      isKnown: targetPlayer.knownCards.includes(targetCardIndex)
    }

    this.notify('ABILITY_SWAP', { 
      player: currentPlayer,
      targetPlayer: targetPlayer,
      myCardIndex: myCardIndex,
      targetCardIndex: targetCardIndex
    })

    return { success: true }
  }

  callCabo() {
    const player = this.getCurrentPlayer()
    
    if (player.hasCalledCabo) {
      return { success: false, reason: '你已经喊过CABO了' }
    }

    player.hasCalledCabo = true
    this.caboCaller = this.currentPlayerIndex
    this.remainingTurnsAfterCabo = this.players.length - 1

    this.notify('CABO_CALLED', { player: player })
    
    this.endTurn()
    
    return { success: true }
  }

  endTurn() {
    if (this.caboCaller !== null) {
      this.remainingTurnsAfterCabo--
      if (this.remainingTurnsAfterCabo <= 0) {
        this.endRound()
        return
      }
    }

    if (this.drawPile.length === 0) {
      this.endRound()
      return
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
    this.turnPhase = 'action'

    this.notify('TURN_CHANGE', { 
      currentPlayer: this.getCurrentPlayer(),
      roundNumber: this.roundNumber
    })
  }

  calculateHandSum(player) {
    return player.cards.reduce((sum, card) => sum + card.value, 0)
  }

  endRound() {
    const handSums = this.players.map(p => this.calculateHandSum(p))
    const minSum = Math.min(...handSums)

    this.players.forEach((player, index) => {
      const handSum = handSums[index]
      
      if (player.hasCalledCabo) {
        if (handSum === minSum) {
          player.roundScore = 0
        } else {
          player.roundScore = handSum
        }
      } else {
        player.roundScore = handSum
      }

      player.totalScore += player.roundScore

      if (this.canReset100 && player.totalScore === 100) {
        player.totalScore = 50
        this.canReset100 = false
      }

      player.historyScores.push({
        round: this.roundNumber,
        score: handSum
      })
      
      if (player.historyScores.length > 5) {
        player.historyScores.shift()
      }
    })

    this.notify('ROUND_END', {
      roundNumber: this.roundNumber,
      scores: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handSum: this.calculateHandSum(p),
        roundScore: p.roundScore,
        totalScore: p.totalScore,
        calledCabo: p.hasCalledCabo
      }))
    })

    if (this.checkGameEnd()) {
      this.endGame()
    } else {
      this.startNextRound()
    }
  }

  checkGameEnd() {
    return this.players.some(p => p.totalScore >= 100)
  }

  endGame() {
    this.gamePhase = 'ended'
    
    const winner = this.determineWinner()
    
    this.notify('GAME_END', {
      winner: winner,
      finalScores: this.players.map(p => ({
        id: p.id,
        name: p.name,
        totalScore: p.totalScore,
        roundScore: p.roundScore
      }))
    })
  }

  determineWinner() {
    const minScore = Math.min(...this.players.map(p => p.totalScore))
    const tied = this.players.filter(p => p.totalScore === minScore)

    if (tied.length === 1) {
      return tied[0]
    }

    const minRoundScore = Math.min(...tied.map(p => p.roundScore))
    return tied.find(p => p.roundScore === minRoundScore)
  }

  startNextRound() {
    this.roundNumber++
    this.initializeDeck()
    this.dealCards()
    
    const startPlayerIndex = this.getLowestScorePlayerIndex()
    this.currentPlayerIndex = startPlayerIndex
    
    const firstDiscard = this.drawPile.pop()
    firstDiscard.isFaceUp = true
    firstDiscard.canPick = true
    this.discardPile = [firstDiscard]
    
    this.caboCaller = null
    this.remainingTurnsAfterCabo = 0
    this.turnPhase = 'action'

    this.players.forEach(player => {
      player.hasCalledCabo = false
      player.roundScore = 0
    })

    this.notify('NEW_ROUND', {
      roundNumber: this.roundNumber,
      startPlayer: this.getCurrentPlayer()
    })
  }

  getLowestScorePlayerIndex() {
    let minScore = Infinity
    let minIndex = 0
    
    this.players.forEach((player, index) => {
      if (player.totalScore < minScore) {
        minScore = player.totalScore
        minIndex = index
      }
    })
    
    return minIndex
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        cards: p.cards,
        knownCards: p.knownCards,
        totalScore: p.totalScore,
        roundScore: p.roundScore,
        hasCalledCabo: p.hasCalledCabo,
        isAI: p.isAI
      })),
      drawPileCount: this.drawPile.length,
      discardPile: this.discardPile,
      topDiscard: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayer: this.getCurrentPlayer(),
      roundNumber: this.roundNumber,
      gamePhase: this.gamePhase,
      turnPhase: this.turnPhase,
      caboCaller: this.caboCaller,
      remainingTurnsAfterCabo: this.remainingTurnsAfterCabo,
      canReset100: this.canReset100
    }
  }

  isPlayerTurn(playerId) {
    const currentPlayer = this.getCurrentPlayer()
    return currentPlayer && currentPlayer.id === playerId
  }
}

module.exports = GameEngine
