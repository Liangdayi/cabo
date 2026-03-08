App({
  onLaunch: function() {
    console.log('Cabo卡波小程序启动');
    // 初始化游戏引擎
    this.globalData.gameEngine = {
      isInitialized: false,
      currentRoom: null,
      players: [],
      gameState: null
    };
  },
  onShow: function() {
    console.log('Cabo卡波小程序显示');
  },
  onHide: function() {
    console.log('Cabo卡波小程序隐藏');
  },
  globalData: {
    userInfo: null,
    gameEngine: null
  }
});