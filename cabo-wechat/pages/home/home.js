// 首页逻辑
const { generateRoomId } = require('../../utils/card-utils');

Page({
  data: {
    selectedPlayerCount: 2,
    roomIdInput: ''
  },

  onLoad: function() {
    console.log('首页加载');
  },

  // 选择玩家人数
  selectPlayerCount: function(e) {
    const count = parseInt(e.currentTarget.dataset.count);
    this.setData({
      selectedPlayerCount: count
    });
  },

  // 输入房间号
  onRoomIdInput: function(e) {
    this.setData({
      roomIdInput: e.detail.value
    });
  },

  // 创建房间
  createRoom: function() {
    const roomId = generateRoomId();
    const playerCount = this.data.selectedPlayerCount;
    
    console.log('创建房间:', roomId, '玩家人数:', playerCount);
    
    // 跳转到房间页面
    wx.navigateTo({
      url: `/pages/room/room?roomId=${roomId}&playerCount=${playerCount}&isCreator=true`
    });
  },

  // 加入房间
  joinRoom: function() {
    const roomId = this.data.roomIdInput.trim();
    
    if (!roomId) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    
    console.log('加入房间:', roomId);
    
    // 跳转到房间页面
    wx.navigateTo({
      url: `/pages/room/room?roomId=${roomId}&isCreator=false`
    });
  }
});