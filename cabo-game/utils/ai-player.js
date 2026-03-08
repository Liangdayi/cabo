const { calculateHandSum, hasAbility, getAbilityType } = require('./card-utils')

class AIPlayer {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty
  }

  makeDecision(gameState, playerIndex) {
    const player = gameState.players[playerIndex]
    const handSum = calculateHandSum(player.cards)
    const topDiscard = gameState.topDiscard

    const decision = {
      action: null,
      targetIndices: [],
      useAbility: false,
      abilityTargets: null
    }

    if (this.shouldCallCabo(gameState, playerIndex, handSum)) {
      decision.action = 'call_cabo'
      return decision
    }

    if (topDiscard && topDiscard.canPick && this.shouldTakeFromDiscard(topDiscard, player)) {
      decision.action = 'take_discard'
      decision.targetIndices = this.selectExchangeTarget(player, topDiscard)
      return decision
    }

    decision.action = 'draw'
    return decision
  }

  shouldCallCabo(gameState, playerIndex, handSum) {
    const player = gameState.players[playerIndex]
    
    if (player.hasCalledCabo) return false
    if (gameState.caboCaller !== null) return false

    const otherSums = gameState.players
      .filter((_, i) => i !== playerIndex)
      .map(p => this.estimateHandSum(p))

    const estimatedMin = Math.min(...otherSums)
    
    if (this.difficulty === 'easy') {
      return handSum <= 10 && Math.random() > 0.5
    } else if (this.difficulty === 'hard') {
      return handSum < estimatedMin && handSum <= 15
    } else {
      return handSum <= estimatedMin && handSum <= 12
    }
  }

  estimateHandSum(player) {
    const knownSum = player.knownCards.reduce((sum, index) => {
      return sum + (player.cards[index] ? player.cards[index].value : 7)
    }, 0)
    
    const unknownCount = 4 - player.knownCards.length
    const averageValue = 6.5
    
    return knownSum + (unknownCount * averageValue)
  }

  shouldTakeFromDiscard(topDiscard, player) {
    if (!topDiscard || !topDiscard.canPick) return false

    const discardValue = topDiscard.value
    
    const hasMatchingCards = player.cards.some(card => card.value === discardValue)
    
    const highCardIndex = player.cards.findIndex(card => card.value > discardValue && card.value > 7)
    
    return hasMatchingCards || highCardIndex !== -1
  }

  selectExchangeTarget(player, newCard) {
    const targets = []
    
    const matchingIndices = player.cards
      .map((card, index) => ({ card, index }))
      .filter(item => item.card.value === newCard.value)
      .map(item => item.index)

    if (matchingIndices.length > 0) {
      if (this.difficulty === 'hard' && matchingIndices.length >= 2) {
        return matchingIndices.slice(0, 2)
      }
      return [matchingIndices[0]]
    }

    const sortedIndices = player.cards
      .map((card, index) => ({ card, index }))
      .sort((a, b) => b.card.value - a.card.value)
      .map(item => item.index)

    return [sortedIndices[0]]
  }

  decideAfterDraw(card, player) {
    const decision = {
      action: null,
      targetIndices: [],
      useAbility: false,
      abilityTargets: null
    }

    if (hasAbility(card.value)) {
      const shouldUseAbility = this.shouldUseAbility(card, player)
      if (shouldUseAbility) {
        decision.action = 'use_ability'
        decision.useAbility = true
        decision.abilityTargets = this.selectAbilityTargets(card, player)
        return decision
      }
    }

    const matchingIndices = player.cards
      .map((c, i) => ({ card: c, index: i }))
      .filter(item => item.card.value === card.value)
      .map(item => item.index)

    if (matchingIndices.length > 0) {
      decision.action = 'exchange'
      decision.targetIndices = matchingIndices
      return decision
    }

    const highCardIndex = player.cards.findIndex(c => c.value > card.value && c.value >= 10)
    
    if (highCardIndex !== -1) {
      decision.action = 'exchange'
      decision.targetIndices = [highCardIndex]
      return decision
    }

    decision.action = 'discard'
    return decision
  }

  shouldUseAbility(card, player) {
    const abilityType = getAbilityType(card.value)
    
    if (this.difficulty === 'easy') {
      return Math.random() > 0.7
    }

    switch (abilityType) {
      case 'peek_self':
        const unknownCards = player.cards.filter(c => !c.isKnown && !c.isFaceUp)
        return unknownCards.length > 0
      case 'spy':
        return true
      case 'swap':
        const highCard = player.cards.find(c => c.value >= 10)
        return !!highCard
      default:
        return false
    }
  }

  selectAbilityTargets(card, player, gameState) {
    const abilityType = getAbilityType(card.value)
    
    switch (abilityType) {
      case 'peek_self':
        const unknownIndices = player.cards
          .map((c, i) => ({ card: c, index: i }))
          .filter(item => !item.card.isKnown && !item.card.isFaceUp)
          .map(item => item.index)
        return {
          cardIndex: unknownIndices[0] || 0
        }

      case 'spy':
        if (!gameState) return { playerIndex: 1, cardIndex: 0 }
        const otherPlayers = gameState.players.filter((_, i) => 
          i !== gameState.currentPlayerIndex
        )
        const targetPlayerIndex = gameState.players.findIndex(p => 
          p.id === otherPlayers[0].id
        )
        return {
          playerIndex: targetPlayerIndex,
          cardIndex: Math.floor(Math.random() * 4)
        }

      case 'swap':
        const myHighCard = player.cards
          .map((c, i) => ({ card: c, index: i }))
          .sort((a, b) => b.card.value - a.card.value)[0]
        
        if (!gameState) {
          return {
            myCardIndex: myHighCard ? myHighCard.index : 0,
            targetPlayerIndex: 1,
            targetCardIndex: 0
          }
        }

        const otherPlayer = gameState.players.find((_, i) => 
          i !== gameState.currentPlayerIndex
        )
        const targetPlayerIdx = gameState.players.indexOf(otherPlayer)
        
        return {
          myCardIndex: myHighCard ? myHighCard.index : 0,
          targetPlayerIndex: targetPlayerIdx,
          targetCardIndex: Math.floor(Math.random() * 4)
        }

      default:
        return null
    }
  }
}

module.exports = AIPlayer
