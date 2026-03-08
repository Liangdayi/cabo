const app = getApp()

Page({
  data: {
    isWinner: false,
    rankings: [],
    gameStats: {
      rounds: 0,
      myTotalScore: 0,
      caboCount: 0,
      abilityCount: 0
    }
  },

  onLoad(options) {
    const winnerId = options.winnerId
    const scores = JSON.parse(options.scores || '[]')
    
    if (scores.length > 0) {
      const sorted = [...scores].sort((a, b) => a.totalScore - b.totalScore)
      const isWinner = sorted[0].id === 'player_0'
      
      this.setData({
        rankings: sorted,
        isWinner: isWinner,
        gameStats: {
          rounds: parseInt(options.rounds) || 1,
          myTotalScore: scores.find(s => s.id === 'player_0')?.totalScore || 0,
          caboCount: parseInt(options.caboCount) || 0,
          abilityCount: parseInt(options.abilityCount) || 0
        }
      })
      
      this.saveGameResult(isWinner, scores.find(s => s.id === 'player_0')?.totalScore || 0)
    }
  },

  saveGameResult(isWinner, score) {
    const result = {
      isWinner: isWinner,
      score: score,
      date: new Date().toLocaleDateString('zh-CN')
    }
    app.saveGameHistory(result)
  },

  playAgain() {
    wx.redirectTo({
      url: '/pages/home/home'
    })
  },

  backToHome() {
    wx.navigateBack({
      delta: 2
    })
  }
})
