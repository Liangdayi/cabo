App({
  globalData: {
    userInfo: null,
    gameHistory: []
  },

  onLaunch() {
    this.loadGameHistory()
  },

  loadGameHistory() {
    try {
      const history = wx.getStorageSync('gameHistory')
      if (history) {
        this.globalData.gameHistory = JSON.parse(history)
      }
    } catch (e) {
      console.error('加载游戏历史失败:', e)
    }
  },

  saveGameHistory(gameResult) {
    this.globalData.gameHistory.unshift(gameResult)
    if (this.globalData.gameHistory.length > 10) {
      this.globalData.gameHistory = this.globalData.gameHistory.slice(0, 10)
    }
    try {
      wx.setStorageSync('gameHistory', JSON.stringify(this.globalData.gameHistory))
    } catch (e) {
      console.error('保存游戏历史失败:', e)
    }
  }
})
