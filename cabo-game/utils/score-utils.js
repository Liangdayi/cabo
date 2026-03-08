function calculateRoundScore(players, caboCallerIndex) {
  const scores = []
  const handSums = players.map(p => 
    p.cards.reduce((sum, card) => sum + card.value, 0)
  )
  const minSum = Math.min(...handSums)
  
  players.forEach((player, index) => {
    const handSum = handSums[index]
    
    if (index === caboCallerIndex && caboCallerIndex !== -1) {
      if (handSum === minSum) {
        scores.push(0)
      } else {
        scores.push(handSum + 10)
      }
    } else {
      scores.push(handSum)
    }
  })
  
  return scores
}

function updateTotalScores(players, roundScores, canReset100) {
  let resetUsed = !canReset100
  
  players.forEach((player, index) => {
    player.totalScore += roundScores[index]
    
    if (!resetUsed && player.totalScore === 100) {
      player.totalScore = 50
      resetUsed = true
    }
  })
  
  return !resetUsed
}

function checkGameEnd(players, targetScore = 100) {
  return players.some(p => p.totalScore >= targetScore)
}

function determineWinner(players) {
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore)
  const minScore = sorted[0].totalScore
  const tied = sorted.filter(p => p.totalScore === minScore)
  
  if (tied.length === 1) {
    return tied[0]
  }
  
  const minRoundScore = Math.min(...tied.map(p => p.roundScore || 0))
  return tied.find(p => (p.roundScore || 0) === minRoundScore)
}

function generateScoreboard(players) {
  return players
    .map(p => ({
      id: p.id,
      name: p.name,
      handSum: p.cards.reduce((sum, card) => sum + card.value, 0),
      roundScore: p.roundScore || 0,
      totalScore: p.totalScore,
      calledCabo: p.hasCalledCabo || false
    }))
    .sort((a, b) => a.totalScore - b.totalScore)
}

function formatScore(score) {
  return score.toString().padStart(3, '0')
}

function getScoreColor(score) {
  if (score === 0) return '#29ffc6'
  if (score < 20) return '#4ecdc4'
  if (score < 50) return '#1a5f7a'
  if (score < 80) return '#ffd93d'
  return '#ff6b6b'
}

module.exports = {
  calculateRoundScore,
  updateTotalScores,
  checkGameEnd,
  determineWinner,
  generateScoreboard,
  formatScore,
  getScoreColor
}
