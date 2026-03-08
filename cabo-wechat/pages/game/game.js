// 游戏主页面逻辑
const GameEngine = require('../../utils/game-engine');
const { getCardDisplayValue, hasSpecialAbility, getAbilityDescription } = require('../../utils/card-utils');

Page({
  data: {
    roomId: '',
    playerCount: 2,
    gameEngine: null,
    currentRound: 1,
    currentPlayerName: '',
    remainingCards: 0,
    otherPlayers: [],
    myHandCards: [],
    myScore: 0,
    topDiscardCard: null,
    showAbilityModal: false,
    abilityDescription: '',
    selectedCardIndex: -1,
    drawnCard: null
  },

  onLoad: function(options) {
    const { roomId, playerCount = 2 } = options;
    
    this.setData({
      roomId,
      playerCount: parseInt(playerCount)
    });
    
    console.log('开始游戏:', roomId, '玩家人数:', playerCount);
    
    // 初始化游戏引擎
    this.initGameEngine();
  },

  // 初始化游戏引擎
  initGameEngine: function() {
    const gameEngine = new GameEngine();
    
    // 添加玩家
    for (let i = 1; i <= this.data.playerCount; i++) {
      gameEngine.addPlayer({
        id: `player${i}`,
        name: `玩家${i}`,
        avatar: ''
      });
    }
    
    // 发牌
    gameEngine.dealCards();
    
    // 玩家偷看2张牌
    for (let i = 0; i < this.data.playerCount; i++) {
      gameEngine.playerPeekCards(i, [0, 1]);
    }
    
    this.setData({ gameEngine });
    this.updateGameState();
  },

  // 更新游戏状态
  updateGameState: function() {
    const gameState = this.data.gameEngine.getGameState();
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 分离自己和其他玩家
    const otherPlayers = gameState.players.filter((_, index) => index !== 0);
    
    this.setData({
      currentRound: gameState.currentRound,
      currentPlayerName: currentPlayer.name,
      remainingCards: gameState.deck.length,
      otherPlayers: otherPlayers,
      myHandCards: gameState.players[0].handCards,
      myScore: gameState.players[0].score,
      topDiscardCard: gameState.discardPile.length > 0 ? gameState.discardPile[gameState.discardPile.length - 1] : null
    });
  },

  // 从抽牌堆抽牌
  drawFromDeck: function() {
    const card = this.data.gameEngine.drawCard();
    if (card === null) {
      wx.showToast({
        title: '牌堆已空',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ drawnCard: card });
    
    // 显示抽到的牌，让玩家选择是弃掉还是交换
    wx.showModal({
      title: '抽到的牌',
      content: `你抽到了 ${card}`,
      cancelText: '弃掉',
      confirmText: '交换',
      success: (res) => {
        if (res.confirm) {
          // 交换
          this.showSwapOptions(card, 'deck');
        } else if (res.cancel) {
          // 弃掉
          if (hasSpecialAbility(card)) {
            // 7-12可发动能力
            this.setData({
              showAbilityModal: true,
              abilityDescription: getAbilityDescription(card)
            });
          } else {
            // 直接弃掉
            this.data.gameEngine.discardCard(card);
            this.setData({ drawnCard: null });
            this.updateGameState();
          }
        }
      }
    });
  },

  // 从弃牌堆抽牌
  drawFromDiscard: function() {
    const topCard = this.data.topDiscardCard;
    if (!topCard) return;
    
    // 必须用来交换
    this.showSwapOptions(topCard, 'discard');
  },

  // 显示交换选项
  showSwapOptions: function(card, fromPileType) {
    // 显示选择交换牌的弹窗
    const handCards = this.data.myHandCards;
    const cardOptions = handCards.map((handCard, index) => {
      let displayValue = '暗牌';
      if (handCard.isFaceUp || handCard.isKnown) {
        displayValue = handCard.value;
      }
      return `位置 ${index + 1}: ${displayValue}`;
    });
    
    wx.showActionSheet({
      itemList: cardOptions,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        this.data.gameEngine.swapCard(0, selectedIndex, card, fromPileType);
        this.setData({ drawnCard: null });
        this.updateGameState();
      },
      fail: (res) => {
        console.log('选择失败', res);
        this.setData({ drawnCard: null });
      }
    });
  },

  // 选择卡片
  selectCard: function(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedCardIndex: index });
  },

  // 喊CABO
  callCabo: function() {
    this.data.gameEngine.callCabo(0);
    wx.showToast({
      title: '已喊CABO！',
      icon: 'success'
    });
    this.updateGameState();
  },

  // 使用特殊能力
  useAbility: function() {
    const card = this.data.drawnCard;
    if (card) {
      // 根据不同的能力类型处理
      switch (card) {
        case 7:
        case 8:
          // 偷看自己1张暗牌
          this.peekOwnCard();
          break;
        case 9:
        case 10:
          // 间谍看别人1张暗牌
          this.peekOtherCard();
          break;
        case 11:
        case 12:
          // 交换自己与他人1张牌
          this.swapWithOther();
          break;
      }
    }
  },

  // 偷看自己1张暗牌
  peekOwnCard: function() {
    const handCards = this.data.myHandCards;
    const unknownCards = handCards.map((card, index) => {
      if (!card.isKnown && !card.isFaceUp) {
        return `位置 ${index + 1}`;
      }
      return null;
    }).filter(item => item !== null);
    
    if (unknownCards.length === 0) {
      wx.showToast({ title: '没有暗牌可以偷看', icon: 'none' });
      this.discardDrawnCard();
      return;
    }
    
    wx.showActionSheet({
      itemList: unknownCards,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        const actualIndex = handCards.findIndex((card, index) => {
          return !card.isKnown && !card.isFaceUp;
        });
        this.data.gameEngine.useAbility(this.data.drawnCard, 0, actualIndex);
        this.discardDrawnCard();
      },
      fail: () => {
        this.discardDrawnCard();
      }
    });
  },

  // 间谍看别人1张暗牌
  peekOtherCard: function() {
    const otherPlayers = this.data.otherPlayers;
    if (otherPlayers.length === 0) {
      wx.showToast({ title: '没有其他玩家', icon: 'none' });
      this.discardDrawnCard();
      return;
    }
    
    const playerOptions = otherPlayers.map((player, index) => {
      return `${player.name}`;
    });
    
    wx.showActionSheet({
      itemList: playerOptions,
      success: (res) => {
        const selectedPlayerIndex = res.tapIndex + 1; // 自己是0，其他玩家从1开始
        wx.showToast({ title: `你看到了${otherPlayers[selectedPlayerIndex - 1].name}的一张暗牌`, icon: 'none' });
        this.discardDrawnCard();
      },
      fail: () => {
        this.discardDrawnCard();
      }
    });
  },

  // 交换自己与他人1张牌
  swapWithOther: function() {
    const otherPlayers = this.data.otherPlayers;
    if (otherPlayers.length === 0) {
      wx.showToast({ title: '没有其他玩家', icon: 'none' });
      this.discardDrawnCard();
      return;
    }
    
    const playerOptions = otherPlayers.map((player, index) => {
      return `${player.name}`;
    });
    
    wx.showActionSheet({
      itemList: playerOptions,
      success: (res) => {
        const selectedPlayerIndex = res.tapIndex + 1;
        wx.showToast({ title: `你与${otherPlayers[selectedPlayerIndex - 1].name}交换了一张牌`, icon: 'none' });
        this.discardDrawnCard();
      },
      fail: () => {
        this.discardDrawnCard();
      }
    });
  },

  // 弃掉抽到的牌
  discardDrawnCard: function() {
    if (this.data.drawnCard) {
      this.data.gameEngine.discardCard(this.data.drawnCard);
      this.setData({ drawnCard: null });
    }
    this.closeAbilityModal();
    this.updateGameState();
  },

  // 关闭特殊能力弹窗
  closeAbilityModal: function() {
    // 如果有抽到的牌，直接弃掉
    if (this.data.drawnCard) {
      this.data.gameEngine.discardCard(this.data.drawnCard);
      this.setData({ drawnCard: null });
      this.updateGameState();
    }
    this.setData({ showAbilityModal: false, abilityDescription: '' });
  },

  // 结束回合
  endTurn: function() {
    this.data.gameEngine.nextPlayer();
    this.updateGameState();
  }
});