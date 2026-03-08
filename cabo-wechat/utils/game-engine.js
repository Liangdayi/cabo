// 游戏引擎核心逻辑

class GameEngine {
  constructor() {
    this.resetGame();
  }

  // 重置游戏状态
  resetGame() {
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.currentRound = 1;
    this.gamePhase = 'waiting'; // waiting, playing, ended
    this.turnPhase = 'action'; // action, swap, ability
    this.roundExtraTurns = 0;
    this.hasCaboPlayer = false;
    this.caboPlayerIndex = -1;
    this.canUseAbility = false;
    this.abilityUsed = false;
    this.canReset100 = true;
  }

  // 初始化牌堆（0-13，共52张）
  initializeDeck() {
    this.deck = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= 13; j++) {
        this.deck.push(j);
      }
    }
    this.shuffleDeck();
  }

  // 洗牌（Fisher-Yates算法）
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  // 添加玩家
  addPlayer(playerInfo) {
    if (this.players.length >= 4) {
      return false; // 最多4人
    }
    
    const player = {
      id: playerInfo.id,
      name: playerInfo.name,
      avatar: playerInfo.avatar,
      handCards: [],
      knownCards: [],
      score: 0,
      isReady: false,
      isCabo: false
    };
    
    this.players.push(player);
    return true;
  }

  // 发牌
  dealCards() {
    this.initializeDeck();
    
    // 每人发4张牌
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      player.handCards = [];
      player.knownCards = [];
      
      for (let j = 0; j < 4; j++) {
        const card = this.deck.pop();
        player.handCards.push({
          value: card,
          isFaceUp: false,
          isKnown: false
        });
      }
    }
  }

  // 玩家偷看2张牌
  playerPeekCards(playerIndex, cardIndices) {
    const player = this.players[playerIndex];
    if (cardIndices.length !== 2) {
      return false;
    }
    
    cardIndices.forEach(index => {
      if (index >= 0 && index < 4) {
        player.handCards[index].isKnown = true;
        player.knownCards.push(index);
      }
    });
    
    return true;
  }

  // 抽牌
  drawCard() {
    if (this.deck.length === 0) {
      return null; // 牌堆空了
    }
    return this.deck.pop();
  }

  // 弃牌
  discardCard(card) {
    this.discardPile.push(card);
  }

  // 交换牌
  swapCard(playerIndex, targetCardIndex, newCard, fromPileType) {
    const player = this.players[playerIndex];
    if (targetCardIndex < 0 || targetCardIndex >= 4) {
      return false;
    }
    
    const oldCard = player.handCards[targetCardIndex];
    this.discardPile.push(oldCard);
    
    player.handCards[targetCardIndex] = {
      value: newCard,
      isFaceUp: fromPileType === 'discard', // 弃牌堆来的是明置
      isKnown: player.knownCards.includes(targetCardIndex)
    };
    
    return true;
  }

  // 多张交换
  swapMultipleCards(playerIndex, cardIndices, newCard) {
    const player = this.players[playerIndex];
    const targetCards = cardIndices.map(index => player.handCards[index]);
    
    // 验证所有目标牌是否同数字
    const isSameValue = targetCards.every(card => card.value === newCard);
    if (!isSameValue) {
      // 验证失败，新牌放入队尾
      this.deck.unshift(newCard);
      
      // 换3张以上失败要多抽1张惩罚
      if (cardIndices.length >= 3) {
        const penaltyCard = this.drawCard();
        if (penaltyCard !== null) {
          this.discardPile.push(penaltyCard);
        }
      }
      return false;
    }
    
    // 验证成功，替换所有目标牌
    cardIndices.forEach(index => {
      const oldCard = player.handCards[index];
      this.discardPile.push(oldCard);
      
      player.handCards[index] = {
        value: newCard,
        isFaceUp: false,
        isKnown: player.knownCards.includes(index)
      };
    });
    
    return true;
  }

  // 喊CABO
  callCabo(playerIndex) {
    this.players[playerIndex].isCabo = true;
    this.hasCaboPlayer = true;
    this.caboPlayerIndex = playerIndex;
    this.roundExtraTurns = this.players.length - 1;
  }

  // 使用特殊能力
  useAbility(cardValue, playerIndex, targetIndex = null) {
    switch (cardValue) {
      case 7:
      case 8:
        // 偷看自己1张暗牌
        if (targetIndex !== null && targetIndex >= 0 && targetIndex < 4) {
          this.players[playerIndex].handCards[targetIndex].isKnown = true;
          if (!this.players[playerIndex].knownCards.includes(targetIndex)) {
            this.players[playerIndex].knownCards.push(targetIndex);
          }
        }
        break;
        
      case 9:
      case 10:
        // 间谍看别人1张暗牌
        if (targetIndex !== null && targetIndex >= 0 && targetIndex < this.players.length) {
          // 这里需要在UI层面处理，只对使用能力的玩家显示
        }
        break;
        
      case 11:
      case 12:
        // 交换自己与他人1张牌
        if (targetIndex !== null && targetIndex >= 0 && targetIndex < this.players.length && targetIndex !== playerIndex) {
          // 这里需要在UI层面处理交换逻辑
        }
        break;
    }
  }

  // 计算玩家当前手牌总和
  calculateHandSum(playerIndex) {
    const player = this.players[playerIndex];
    return player.handCards.reduce((sum, card) => sum + card.value, 0);
  }

  // 计算本轮得分
  calculateRoundScore() {
    const scores = this.players.map((player, index) => {
      const sum = this.calculateHandSum(index);
      if (player.isCabo) {
        // 检查是否是全场最低
        const minSum = Math.min(...this.players.map(p => this.calculateHandSum(this.players.indexOf(p))));
        if (sum === minSum) {
          return 0; // 喊CABO且全场最低
        } else {
          return sum + 10; // 喊CABO但有人更低
        }
      }
      return sum; // 其他人
    });
    
    return scores;
  }

  // 结束一轮
  endRound() {
    const roundScores = this.calculateRoundScore();
    
    // 更新玩家总分
    this.players.forEach((player, index) => {
      player.score += roundScores[index];
      
      // 特殊规则：总分刚好100分，可重置为50分（全局仅1次）
      if (this.canReset100 && player.score === 100) {
        player.score = 50;
        this.canReset100 = false;
      }
    });
    
    // 检查游戏是否结束
    const maxScore = Math.max(...this.players.map(p => p.score));
    if (maxScore >= 100) {
      this.gamePhase = 'ended';
    } else {
      // 准备下一轮
      this.currentRound++;
      this.resetRound();
    }
  }

  // 重置回合
  resetRound() {
    this.initializeDeck();
    this.discardPile = [];
    this.dealCards();
    this.currentPlayerIndex = this.getLowestScorePlayerIndex();
    this.turnPhase = 'action';
    this.roundExtraTurns = 0;
    this.hasCaboPlayer = false;
    this.caboPlayerIndex = -1;
    this.canUseAbility = false;
    this.abilityUsed = false;
  }

  // 获取最低分玩家索引
  getLowestScorePlayerIndex() {
    let minScore = Infinity;
    let minIndex = 0;
    
    this.players.forEach((player, index) => {
      if (player.score < minScore) {
        minScore = player.score;
        minIndex = index;
      }
    });
    
    return minIndex;
  }

  // 下一个玩家
  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  // 检查游戏是否结束
  isGameEnded() {
    return this.gamePhase === 'ended';
  }

  // 获取游戏状态
  getGameState() {
    return {
      players: this.players,
      deck: this.deck,
      discardPile: this.discardPile,
      currentPlayerIndex: this.currentPlayerIndex,
      currentRound: this.currentRound,
      gamePhase: this.gamePhase,
      turnPhase: this.turnPhase,
      roundExtraTurns: this.roundExtraTurns,
      hasCaboPlayer: this.hasCaboPlayer,
      caboPlayerIndex: this.caboPlayerIndex,
      canUseAbility: this.canUseAbility,
      abilityUsed: this.abilityUsed,
      canReset100: this.canReset100
    };
  }
}