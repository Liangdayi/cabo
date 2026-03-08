// 房间页面逻辑
const app = getApp();

Page({
  data: {
    roomId: '',
    playerCount: 2,
    isCreator: false,
    isReady: false,
    canStartGame: false,
    players: []
  },

  onLoad: function(options) {
    const { roomId, playerCount = 2, isCreator = false } = options;
    
    this.setData({
      roomId,
      playerCount: parseInt(playerCount),
      isCreator: isCreator === 'true'
    });
    
    console.log('进入房间:', roomId, '玩家人数:', playerCount, '是否房主:', isCreator);
    
    // 模拟添加玩家（实际应该通过WebSocket连接）
    this.mockAddPlayers();
  },

  // 模拟添加玩家
  mockAddPlayers: function() {
    const players = [
      {
        id: 'player1',
        name: '玩家1',
        avatar: '',
        isReady: false
      },
      {
        id: 'player2',
        name: '玩家2',
        avatar: '',
        isReady: false
      }
    ];
    
    // 根据玩家人数添加更多玩家
    if (this.data.playerCount >= 3) {
      players.push({
        id: 'player3',
        name: '玩家3',
        avatar: '',
        isReady: false
      });
    }
    
    if (this.data.playerCount >= 4) {
      players.push({
        id: 'player4',
        name: '玩家4',
        avatar: '',
        isReady: false
      });
    }
    
    this.setData({ players });
  },

  // 切换准备状态
  toggleReady: function() {
    this.setData({
      isReady: !this.data.isReady
    });
    
    // 模拟更新玩家准备状态
    const updatedPlayers = [...this.data.players];
    updatedPlayers[0].isReady = this.data.isReady;
    this.setData({ players: updatedPlayers });
    
    // 检查是否所有玩家都已准备
    this.checkCanStartGame();
  },

  // 检查是否可以开始游戏
  checkCanStartGame: function() {
    // 测试模式：只要自己准备了就可以开始游戏
    const allReady = this.data.players[0].isReady;
    this.setData({ canStartGame: allReady });
  },

  // 开始游戏
  startGame: function() {
    if (!this.data.canStartGame) {
      wx.showToast({
        title: '等待所有玩家准备',
        icon: 'none'
      });
      return;
    }
    
    console.log('开始游戏');
    
    // 跳转到游戏页面
    wx.navigateTo({
      url: `/pages/game/game?roomId=${this.data.roomId}&playerCount=${this.data.playerCount}`
    });
  }
});