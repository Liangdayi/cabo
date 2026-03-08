// 计分工具函数

// 计算玩家手牌总和
export function calculateHandSum(handCards) {
  return handCards.reduce((sum, card) => sum + card.value, 0);
}

// 计算本轮得分
export function calculateRoundScore(players, caboPlayerIndex) {
  const scores = [];
  const handSums = players.map(player => calculateHandSum(player.handCards));
  const minSum = Math.min(...handSums);
  
  players.forEach((player, index) => {
    const sum = handSums[index];
    if (index === caboPlayerIndex) {
      // 喊CABO的玩家
      if (sum === minSum) {
        scores.push(0); // 喊CABO且全场最低
      } else {
        scores.push(sum + 10); // 喊CABO但有人更低
      }
    } else {
      scores.push(sum); // 其他玩家
    }
  });
  
  return scores;
}

// 更新玩家总分
export function updatePlayerScores(players, roundScores, canReset100) {
  const updatedPlayers = [...players];
  let updatedCanReset100 = canReset100;
  
  updatedPlayers.forEach((player, index) => {
    player.score += roundScores[index];
    
    // 特殊规则：总分刚好100分，可重置为50分（全局仅1次）
    if (updatedCanReset100 && player.score === 100) {
      player.score = 50;
      updatedCanReset100 = false;
    }
  });
  
  return { players: updatedPlayers, canReset100: updatedCanReset100 };
}

// 检查游戏是否结束
export function isGameEnded(players) {
  const maxScore = Math.max(...players.map(player => player.score));
  return maxScore >= 100;
}

// 确定游戏获胜者
export function determineWinner(players) {
  let minScore = Infinity;
  let winners = [];
  
  // 找出最低分玩家
  players.forEach(player => {
    if (player.score < minScore) {
      minScore = player.score;
      winners = [player];
    } else if (player.score === minScore) {
      winners.push(player);
    }
  });
  
  // 如果平局，比较最后一轮得分（这里简化处理，实际应该记录每轮得分）
  if (winners.length > 1) {
    // 假设最后一轮得分就是当前手牌总和
    const lastRoundSums = winners.map(player => calculateHandSum(player.handCards));
    const minLastRoundSum = Math.min(...lastRoundSums);
    const finalWinners = winners.filter((player, index) => lastRoundSums[index] === minLastRoundSum);
    return finalWinners[0];
  }
  
  return winners[0];
}

// 格式化得分显示
export function formatScore(score) {
  return score.toString().padStart(3, '0');
}

// 获取得分颜色
export function getScoreColor(score) {
  if (score === 0) return '#57C5B6'; // 绿色
  if (score < 20) return '#159895'; // 青色
  if (score < 50) return '#1A5F7A'; // 蓝色
  if (score < 80) return '#FFD700'; // 金色
  return '#FF6B6B'; // 红色
}

// 计算剩余牌数
export function calculateRemainingCards(deck) {
  return deck.length;
}

// 检查是否可以喊CABO
export function canCallCabo(players) {
  return players.some(player => player.isCabo) === false;
}

// 检查玩家是否可以使用特殊能力
export function canUseAbility(cardValue) {
  return cardValue >= 7 && cardValue <= 12;
}