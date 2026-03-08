const {
  calculateRoundScore,
  updateTotalScores,
  checkGameEnd,
  determineWinner,
  generateScoreboard,
  formatScore,
  getScoreColor
} = require('../../cabo-game/utils/score-utils')

describe('score-utils', () => {
  describe('calculateRoundScore函数', () => {
    test('应该正确计算普通玩家的回合分数', () => {
      const players = [
        { cards: [{ value: 5 }, { value: 3 }, { value: 2 }, { value: 1 }] },
        { cards: [{ value: 10 }, { value: 10 }, { value: 5 }, { value: 5 }] }
      ]
      
      const scores = calculateRoundScore(players, -1)
      
      expect(scores[0]).toBe(11)
      expect(scores[1]).toBe(30)
    })

    test('喊CABO成功应得0分', () => {
      const players = [
        { cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
        { cards: [{ value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }] }
      ]
      
      const scores = calculateRoundScore(players, 0)
      
      expect(scores[0]).toBe(0)
    })

    test('喊CABO失败应加10分惩罚', () => {
      const players = [
        { cards: [{ value: 10 }, { value: 10 }, { value: 10 }, { value: 10 }] },
        { cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] }
      ]
      
      const scores = calculateRoundScore(players, 0)
      
      expect(scores[0]).toBe(50)
    })

    test('喊CABO但不是最低分应得手牌分+10', () => {
      const players = [
        { cards: [{ value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }] },
        { cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
        { cards: [{ value: 3 }, { value: 3 }, { value: 3 }, { value: 3 }] }
      ]
      
      const scores = calculateRoundScore(players, 0)
      
      expect(scores[0]).toBe(30)
    })

    test('多人平局时喊CABO者应得0分', () => {
      const players = [
        { cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
        { cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] }
      ]
      
      const scores = calculateRoundScore(players, 0)
      
      expect(scores[0]).toBe(0)
      expect(scores[1]).toBe(4)
    })
  })

  describe('updateTotalScores函数', () => {
    test('应该正确更新总分', () => {
      const players = [
        { totalScore: 10 },
        { totalScore: 20 }
      ]
      const roundScores = [5, 10]
      
      const canReset = updateTotalScores(players, roundScores, true)
      
      expect(players[0].totalScore).toBe(15)
      expect(players[1].totalScore).toBe(30)
      expect(canReset).toBe(true)
    })

    test('总分达到100分应重置为50分', () => {
      const players = [
        { totalScore: 95 },
        { totalScore: 20 }
      ]
      const roundScores = [5, 10]
      
      const canReset = updateTotalScores(players, roundScores, true)
      
      expect(players[0].totalScore).toBe(50)
      expect(canReset).toBe(false)
    })

    test('重置机会只能使用一次', () => {
      const players = [
        { totalScore: 95 },
        { totalScore: 95 }
      ]
      const roundScores = [5, 5]
      
      const canReset = updateTotalScores(players, roundScores, true)
      
      expect(players[0].totalScore).toBe(50)
      expect(players[1].totalScore).toBe(100)
      expect(canReset).toBe(false)
    })

    test('已使用重置机会后不应再次重置', () => {
      const players = [
        { totalScore: 95 }
      ]
      const roundScores = [5]
      
      const canReset1 = updateTotalScores(players, roundScores, false)
      
      expect(players[0].totalScore).toBe(100)
      expect(canReset1).toBe(false)
    })

    test('总分超过100分不应重置', () => {
      const players = [
        { totalScore: 96 }
      ]
      const roundScores = [10]
      
      const canReset = updateTotalScores(players, roundScores, true)
      
      expect(players[0].totalScore).toBe(106)
      expect(canReset).toBe(true)
    })
  })

  describe('checkGameEnd函数', () => {
    test('总分达到100分应结束游戏', () => {
      const players = [
        { totalScore: 100 },
        { totalScore: 50 }
      ]
      
      expect(checkGameEnd(players)).toBe(true)
    })

    test('总分超过100分应结束游戏', () => {
      const players = [
        { totalScore: 105 }
      ]
      
      expect(checkGameEnd(players)).toBe(true)
    })

    test('总分低于100分不应结束游戏', () => {
      const players = [
        { totalScore: 99 },
        { totalScore: 50 }
      ]
      
      expect(checkGameEnd(players)).toBe(false)
    })

    test('应该支持自定义目标分数', () => {
      const players = [
        { totalScore: 50 }
      ]
      
      expect(checkGameEnd(players, 50)).toBe(true)
      expect(checkGameEnd(players, 100)).toBe(false)
    })
  })

  describe('determineWinner函数', () => {
    test('应该返回总分最低的玩家', () => {
      const players = [
        { id: 'p1', totalScore: 30 },
        { id: 'p2', totalScore: 20 },
        { id: 'p3', totalScore: 40 }
      ]
      
      const winner = determineWinner(players)
      
      expect(winner.id).toBe('p2')
    })

    test('平局时应比较最后一轮得分', () => {
      const players = [
        { id: 'p1', totalScore: 20, roundScore: 10 },
        { id: 'p2', totalScore: 20, roundScore: 5 },
        { id: 'p3', totalScore: 20, roundScore: 15 }
      ]
      
      const winner = determineWinner(players)
      
      expect(winner.id).toBe('p2')
    })

    test('总分和最后一轮得分都平局时应返回第一个玩家', () => {
      const players = [
        { id: 'p1', totalScore: 20, roundScore: 5 },
        { id: 'p2', totalScore: 20, roundScore: 5 }
      ]
      
      const winner = determineWinner(players)
      
      expect(winner.id).toBe('p1')
    })

    test('应该处理无roundScore的玩家', () => {
      const players = [
        { id: 'p1', totalScore: 20 },
        { id: 'p2', totalScore: 20, roundScore: 5 }
      ]
      
      const winner = determineWinner(players)
      
      expect(winner.id).toBe('p1')
    })
  })

  describe('generateScoreboard函数', () => {
    test('应该生成正确的计分板', () => {
      const players = [
        {
          id: 'p1',
          name: '玩家1',
          cards: [{ value: 5 }, { value: 3 }],
          totalScore: 30,
          roundScore: 8,
          hasCalledCabo: true
        },
        {
          id: 'p2',
          name: '玩家2',
          cards: [{ value: 10 }, { value: 10 }],
          totalScore: 20,
          roundScore: 20,
          hasCalledCabo: false
        }
      ]
      
      const scoreboard = generateScoreboard(players)
      
      expect(scoreboard.length).toBe(2)
      expect(scoreboard[0].id).toBe('p2')
      expect(scoreboard[1].id).toBe('p1')
    })

    test('应该按总分排序', () => {
      const players = [
        { id: 'p1', name: '玩家1', cards: [], totalScore: 50, roundScore: 0 },
        { id: 'p2', name: '玩家2', cards: [], totalScore: 20, roundScore: 0 },
        { id: 'p3', name: '玩家3', cards: [], totalScore: 30, roundScore: 0 }
      ]
      
      const scoreboard = generateScoreboard(players)
      
      expect(scoreboard[0].totalScore).toBe(20)
      expect(scoreboard[1].totalScore).toBe(30)
      expect(scoreboard[2].totalScore).toBe(50)
    })

    test('应该包含所有必要字段', () => {
      const players = [
        {
          id: 'p1',
          name: '玩家1',
          cards: [{ value: 5 }],
          totalScore: 30,
          roundScore: 5,
          hasCalledCabo: true
        }
      ]
      
      const scoreboard = generateScoreboard(players)
      
      expect(scoreboard[0]).toHaveProperty('id')
      expect(scoreboard[0]).toHaveProperty('name')
      expect(scoreboard[0]).toHaveProperty('handSum')
      expect(scoreboard[0]).toHaveProperty('roundScore')
      expect(scoreboard[0]).toHaveProperty('totalScore')
      expect(scoreboard[0]).toHaveProperty('calledCabo')
    })

    test('应该正确计算手牌总和', () => {
      const players = [
        {
          id: 'p1',
          name: '玩家1',
          cards: [{ value: 5 }, { value: 3 }, { value: 2 }],
          totalScore: 0,
          roundScore: 0
        }
      ]
      
      const scoreboard = generateScoreboard(players)
      
      expect(scoreboard[0].handSum).toBe(10)
    })

    test('应该处理空手牌', () => {
      const players = [
        {
          id: 'p1',
          name: '玩家1',
          cards: [],
          totalScore: 0,
          roundScore: 0
        }
      ]
      
      const scoreboard = generateScoreboard(players)
      
      expect(scoreboard[0].handSum).toBe(0)
    })
  })

  describe('formatScore函数', () => {
    test('应该格式化为3位数字', () => {
      expect(formatScore(0)).toBe('000')
      expect(formatScore(5)).toBe('005')
      expect(formatScore(50)).toBe('050')
      expect(formatScore(100)).toBe('100')
    })

    test('应该处理大数字', () => {
      expect(formatScore(999)).toBe('999')
      expect(formatScore(1000)).toBe('1000')
    })
  })

  describe('getScoreColor函数', () => {
    test('0分应返回绿色', () => {
      expect(getScoreColor(0)).toBe('#29ffc6')
    })

    test('低于20分应返回青色', () => {
      expect(getScoreColor(10)).toBe('#4ecdc4')
      expect(getScoreColor(19)).toBe('#4ecdc4')
    })

    test('20-49分应返回深青色', () => {
      expect(getScoreColor(20)).toBe('#1a5f7a')
      expect(getScoreColor(49)).toBe('#1a5f7a')
    })

    test('50-79分应返回黄色', () => {
      expect(getScoreColor(50)).toBe('#ffd93d')
      expect(getScoreColor(79)).toBe('#ffd93d')
    })

    test('80分及以上应返回红色', () => {
      expect(getScoreColor(80)).toBe('#ff6b6b')
      expect(getScoreColor(100)).toBe('#ff6b6b')
    })
  })

  describe('计分系统集成测试', () => {
    test('完整回合计分流程', () => {
      const players = [
        {
          id: 'p1',
          name: '玩家1',
          cards: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
          totalScore: 0,
          roundScore: 0,
          hasCalledCabo: true
        },
        {
          id: 'p2',
          name: '玩家2',
          cards: [{ value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }],
          totalScore: 0,
          roundScore: 0,
          hasCalledCabo: false
        }
      ]
      
      const roundScores = calculateRoundScore(players, 0)
      const canReset = updateTotalScores(players, roundScores, true)
      const scoreboard = generateScoreboard(players)
      
      expect(roundScores[0]).toBe(0)
      expect(roundScores[1]).toBe(20)
      expect(players[0].totalScore).toBe(0)
      expect(players[1].totalScore).toBe(20)
      expect(scoreboard[0].id).toBe('p1')
      expect(canReset).toBe(true)
    })

    test('游戏结束判定流程', () => {
      const players = [
        { id: 'p1', totalScore: 95, roundScore: 0 },
        { id: 'p2', totalScore: 90, roundScore: 0 }
      ]
      
      expect(checkGameEnd(players)).toBe(false)
      
      players[0].totalScore = 100
      expect(checkGameEnd(players)).toBe(true)
      
      const winner = determineWinner(players)
      expect(winner.id).toBe('p2')
    })

    test('100分重置流程', () => {
      const players = [
        { totalScore: 95 }
      ]
      const roundScores = [5]
      
      let canReset = updateTotalScores(players, roundScores, true)
      expect(players[0].totalScore).toBe(50)
      expect(canReset).toBe(false)
      
      players[0].totalScore = 95
      const roundScores2 = [5]
      canReset = updateTotalScores(players, roundScores2, canReset)
      expect(players[0].totalScore).toBe(100)
      expect(canReset).toBe(false)
    })
  })
})
