// 结果页面逻辑
const { determineWinner } = require('../../utils/score-utils');

Page({
  data: {
    players: [],
    winnerName: '',
    winnerScore: 0
  },

  onLoad: function(options) {
    console.log('结果页面加载');
    
    // 模拟游戏结果数据
    this.mockGameResult();
  },

  // 模拟游戏结果
  mockGameResult: function() {
    const players = [
      {
        id: 'player1',
        name: '玩家1',
        avatar: '',
        roundScore: 15,
        score: 85,
        isWinner: false
      },
      {
        id: 'player2',
        name: '玩家2',
        avatar: '',
        roundScore: 10,
        score: 75,
        isWinner: true
      },
      {
        id: 'player3',
        name: '玩家3',
        avatar: '',
        roundScore: 20,
        score: 90,
        isWinner: false
      }
    ];
    
    // 确定获胜者
    const winner = determineWinner(players);
    const winnerIndex = players.findIndex(p => p.id === winner.id);
    players[winnerIndex].isWinner = true;
    
    this.setData({
      players: players,
      winnerName: winner.name,
      winnerScore: winner.score
    });
  },

  // 再来一局
  playAgain: function() {
    console.log('再来一局');
    
    // 跳转到房间页面
    wx.navigateTo({
      url: '/pages/room/room?roomId=' + Math.floor(100000 + Math.random() * 900000)
    });
  },

  // 返回首页
  backToHome: function() {
    console.log('返回首页');
    
    // 跳转到首页
    wx.navigateTo({
      url: '/pages/home/home'
    });
  }
});