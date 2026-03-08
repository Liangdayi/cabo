const { generateRoomId } = require('../../utils/card-utils')

Page({
  data: {
    roomId: '',
    isCreator: false,
    isReady: false,
    canStart: false,
    players: []
  },

  onLoad(options) {
    const roomId = options.roomId || generateRoomId()
    const isCreator = options.isCreator === 'true'
    
    this.setData({ 
      roomId,
      isCreator
    })
    
    this.initLocalGame()
  },

  initLocalGame() {
    this.setData({
      players: [{
        id: 'player_0',
        name: '你',
        isReady: true
      }],
      canStart: true
    })
  },

  copyRoomId() {
    wx.setClipboardData({
      data: this.data.roomId,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  toggleReady() {
    this.setData({
      isReady: !this.data.isReady
    })
  },

  startGame() {
    if (!this.data.canStart) {
      wx.showToast({ title: '等待玩家准备', icon: 'none' })
      return
    }
    
    wx.navigateTo({
      url: `/pages/game/game?playerCount=${this.data.players.length}`
    })
  },

  leaveRoom() {
    wx.showModal({
      title: '离开房间',
      content: '确定要离开房间吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
