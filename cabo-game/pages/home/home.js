const app = getApp()

Page({
  data: {
    playerCount: 2,
    showRulesModal: false,
    gameHistory: []
  },

  onLoad() {
    this.loadGameHistory()
  },

  onShow() {
    this.loadGameHistory()
  },

  loadGameHistory() {
    const history = app.globalData.gameHistory || []
    this.setData({ gameHistory: history.slice(0, 5) })
  },

  selectPlayerCount(e) {
    const count = parseInt(e.currentTarget.dataset.count)
    this.setData({ playerCount: count })
  },

  startGame() {
    wx.navigateTo({
      url: `/pages/game/game?playerCount=${this.data.playerCount}`
    })
  },

  showRules() {
    this.setData({ showRulesModal: true })
  },

  hideRules() {
    this.setData({ showRulesModal: false })
  }
})
