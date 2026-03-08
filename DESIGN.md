# Cabo 微信小程序游戏原型设计文档

## 一、游戏概述

**游戏名称**: Cabo  
**游戏类型**: 卡牌策略游戏  
**玩家人数**: 2-4 人  
**游戏目标**: 让面前 4 张牌总和尽量小，总分先到 100 分游戏结束，最低分获胜

---

## 二、系统架构设计

### 2.1 模块划分

```
cabo-wechat/
├── pages/
│   ├── home/          # 首页（房间创建/加入）
│   ├── room/          # 房间等待界面
│   ├── game/          # 游戏主界面
│   └── result/        # 结算界面
├── utils/
│   ├── card-utils.js      # 卡牌工具类
│   ├── game-engine.js     # 游戏核心引擎
│   └── score-utils.js     # 计分工具类
└── components/        # 可复用组件（待扩展）
    ├── card/          # 卡牌组件
    └── player/        # 玩家信息组件
```

### 2.2 核心类设计

```javascript
// 游戏核心状态机
GameState:
  - INIT: 游戏未开始
  - WAITING: 等待玩家
  - PLAYING: 游戏中
  - ROUND_END: 回合结束
  - GAME_END: 游戏结束

// 玩家状态
PlayerState:
  - id: 玩家 ID
  - name: 玩家名称
  - cards: Array[4]  // 4 张牌
  - totalScore: 总分
  - roundScore: 本轮得分
  - hasCalledCabo: 是否喊过 CABO
  - isCurrentTurn: 是否当前回合

// 卡牌结构
Card:
  - value: 0-13 数值
  - suit: 花色 (0-3)
  - isFaceUp: 是否明置
  - ownerId: 所属玩家 ID
```

---

## 三、数据结构设计

### 3.1 完整游戏状态

```javascript
const gameState = {
  // 基础信息
  roomId: '',
  players: [],  // 玩家数组
  currentPlayerIndex: 0,  // 当前玩家索引
  
  // 牌堆
  drawPile: [],  // 抽牌堆 (0-13 的数字牌)
  discardPile: [],  // 弃牌堆
  
  // 游戏阶段
  phase: 'DRAW',  // DRAW | ACTION | CABO | EXCHANGE
  roundNumber: 1,  // 当前轮数
  
  // 特殊状态
  caboCalled: false,  // 是否有人喊 CABO
  pendingPlayers: [],  // 还需行动的玩家
  specialAbilityActive: false,  // 特殊能力是否激活
  
  // 历史记录
  actionHistory: [],
  
  // 配置
  targetScore: 100,  // 目标分数
  resetUsed: false,  // 50 分重置是否已使用
}
```

### 3.2 玩家数据结构

```javascript
const player = {
  id: 'player_1',
  name: '玩家 1',
  avatar: '',
  
  // 手牌 (4 张)
  cards: [
    { value: 5, suit: 0, isFaceUp: false },  // 暗牌
    { value: 8, suit: 1, isFaceUp: true },   // 明牌
    { value: 0, suit: 2, isFaceUp: false },
    { value: 13, suit: 3, isFaceUp: false },
  ],
  
  // 分数
  totalScore: 0,      // 累计总分
  roundScore: 26,     // 当前轮得分 (4 张牌总和)
  
  // 状态
  hasCalledCabo: false,
  isCurrentTurn: false,
  canAct: true,
  
  // 统计
  caboCount: 0,  // 喊 CABO 次数
}
```

### 3.3 卡牌数据结构

```javascript
// 卡牌值映射
const CARD_VALUES = {
  0: { name: '0', special: false },
  1: { name: 'A', special: false },
  2: { name: '2', special: false },
  3: { name: '3', special: false },
  4: { name: '4', special: false },
  5: { name: '5', special: false },
  6: { name: '6', special: false },
  7: { name: '7', special: true, ability: 'peek_self' },
  8: { name: '8', special: true, ability: 'peek_self' },
  9: { name: '9', special: true, ability: 'spy' },
  10: { name: '10', special: true, ability: 'spy' },
  11: { name: 'J', special: true, ability: 'swap' },
  12: { name: 'Q', special: true, ability: 'swap' },
  13: { name: 'K', special: false },
}

// 花色映射
const SUITS = ['♠', '♥', '♣', '♦']
```

---

## 四、核心游戏逻辑

### 4.1 游戏流程

```javascript
/**
 * 游戏主流程
 */
async function startGame() {
  // 1. 初始化
  initializeGame()
  
  // 2. 发牌
  dealCards()
  
  // 3. 游戏主循环
  while (!isGameEnd()) {
    await playRound()
  }
  
  // 4. 结算
  calculateFinalScores()
  showResult()
}

/**
 * 回合流程
 */
async function playRound() {
  const player = getCurrentPlayer()
  
  // 阶段 1: 抽牌阶段
  const drawnCard = await drawPhase(player)
  
  // 阶段 2: 行动阶段
  const action = await actionPhase(player, drawnCard)
  
  // 阶段 3: 执行行动
  await executeAction(action)
  
  // 阶段 4: 检查回合结束
  if (checkRoundEnd()) {
    await endRound()
  } else {
    nextPlayer()
  }
}
```

### 4.2 抽牌逻辑

```javascript
/**
 * 抽牌阶段
 */
async function drawPhase(player) {
  return new Promise((resolve) => {
    // 选项 1: 从抽牌堆抽牌
    const drawFromPile = () => {
      const card = drawPile.pop()
      card.isFaceUp = true  // 抽到的牌先看
      player.hand.tempCard = card
      
      // 检查是否可以发动特殊能力
      if (card.value >= 7 && card.value <= 12) {
        showAbilityChoice(card)
      }
      
      resolve(card)
    }
    
    // 选项 2: 捡弃牌堆
    const takeDiscard = () => {
      const card = discardPile.pop()
      // 必须用来交换
      player.hand.tempCard = card
      resolve(card)
    }
    
    // 选项 3: 喊 CABO
    const callCabo = () => {
      if (!player.hasCalledCabo) {
        player.hasCalledCabo = true
        gameState.caboCalled = true
        gameState.pendingPlayers = getAllOtherPlayers()
        resolve({ type: 'CABO' })
      }
    }
    
    showDrawChoices({ drawFromPile, takeDiscard, callCabo })
  })
}
```

### 4.3 交换逻辑

```javascript
/**
 * 交换卡牌逻辑
 */
async function exchangeCards(sourceCard, targetCards) {
  const player = getCurrentPlayer()
  
  // 单张交换
  if (targetCards.length === 1) {
    const targetCard = targetCards[0]
    
    // 验证数字是否相同
    if (sourceCard.value === targetCard.value) {
      // 交换成功
      swapCards(sourceCard, targetCard)
      return { success: true }
    } else {
      // 交换失败
      player.cards.push(sourceCard)
      return { success: false }
    }
  }
  
  // 多张交换 (1 换多)
  if (targetCards.length > 1) {
    const allSameValue = targetCards.every(c => c.value === sourceCard.value)
    
    if (allSameValue) {
      // 验证成功，替换
      replaceCards(sourceCard, targetCards)
      return { success: true }
    } else {
      // 验证失败
      player.cards.push(sourceCard)
      
      // 换 3 张以上失败要抽惩罚牌
      if (targetCards.length >= 3) {
        const penaltyCard = drawPile.pop()
        player.cards.push(penaltyCard)
      }
      
      return { success: false, penalty: targetCards.length >= 3 }
    }
  }
}

/**
 * 交换规则：
 * - 从抽牌堆来的牌：暗置交换
 * - 从弃牌堆来的牌：明置交换
 */
function swapCards(card1, card2) {
  const isFromDiscard = card2.fromDiscard
  
  // 交换卡牌
  const temp = { ...card1 }
  card1.value = card2.value
  card1.suit = card2.suit
  card2.value = temp.value
  card2.suit = temp.suit
  
  // 设置明暗状态
  if (!isFromDiscard) {
    card1.isFaceUp = false  // 抽牌堆来的暗置
  } else {
    card1.isFaceUp = true   // 弃牌堆来的明置
  }
}
```

### 4.4 特殊能力逻辑

```javascript
/**
 * 特殊能力 (7-12 弃牌时可用)
 */
const SpecialAbilities = {
  // 7/8: 偷看自己 1 张暗牌
  peek_self: async (player) => {
    const faceDownCards = player.cards.filter(c => !c.isFaceUp)
    if (faceDownCards.length > 0) {
      const card = await selectCard(faceDownCards)
      card.isFaceUp = true  // 临时翻开查看
      showCardValue(card)
      setTimeout(() => {
        card.isFaceUp = false  // 看完后盖回
      }, 2000)
    }
  },
  
  // 9/10: 间谍看别人 1 张暗牌
  spy: async (player, targetPlayer) => {
    const faceDownCards = targetPlayer.cards.filter(c => !c.isFaceUp)
    if (faceDownCards.length > 0) {
      const card = await selectCard(faceDownCards)
      showCardValueToPlayer(card, player)  // 只有发动者能看到
    }
  },
  
  // 11/12: 交换自己与他人 1 张牌
  swap: async (player, targetPlayer) => {
    const myCard = await selectCard(player.cards)
    const theirCard = await selectCard(targetPlayer.cards)
    
    // 交换，正反面不变
    const temp = { value: myCard.value, suit: myCard.suit }
    myCard.value = theirCard.value
    myCard.suit = theirCard.suit
    theirCard.value = temp.value
    theirCard.suit = temp.suit
  }
}

/**
 * 弃牌时检查是否可以发动能力
 */
function canUseAbility(card) {
  return card.value >= 7 && card.value <= 12
}

/**
 * 发动特殊能力
 */
async function useAbility(card, targets) {
  const ability = CARD_VALUES[card.value].ability
  await SpecialAbilities[ability](getCurrentPlayer(), targets)
}
```

---

## 五、计分系统

### 5.1 计分逻辑

```javascript
/**
 * 计算一轮得分
 */
function calculateRoundScore(player) {
  return player.cards.reduce((sum, card) => sum + card.value, 0)
}

/**
 * 回合结束计分
 */
function endRoundScoring() {
  const scores = []
  
  // 找出最低分
  const minScore = Math.min(...players.map(p => calculateRoundScore(p)))
  
  players.forEach(player => {
    const playerScore = calculateRoundScore(player)
    
    if (player.hasCalledCabo) {
      if (playerScore === minScore) {
        // 喊 CABO 且全场最低 → 0 分
        player.roundScore = 0
      } else {
        // 喊 CABO 但有人更低 → 总和 +10 分
        player.roundScore = playerScore + 10
      }
    } else {
      // 其他人：按自己总和计分
      player.roundScore = playerScore
    }
    
    // 累加总分
    player.totalScore += player.roundScore
    
    scores.push({
      playerId: player.id,
      name: player.name,
      roundScore: player.roundScore,
      totalScore: player.totalScore,
      isCabo: player.hasCalledCabo
    })
  })
  
  return scores
}

/**
 * 检查游戏是否结束
 */
function isGameEnd() {
  // 有玩家总分 >= 100
  const hasPlayerReached100 = players.some(p => p.totalScore >= 100)
  
  if (hasPlayerReached100) {
    return true
  }
  
  // 牌堆抽空
  if (drawPile.length === 0) {
    return true
  }
  
  return false
}

/**
 * 特殊规则：总分刚好 100 分可重置为 50 分
 */
function applyResetRule(player) {
  if (player.totalScore === 100 && !gameState.resetUsed) {
    player.totalScore = 50
    gameState.resetUsed = true
    return true
  }
  return false
}

/**
 * 计算最终胜利者
 */
function determineWinner() {
  // 总分最低者获胜
  const minTotalScore = Math.min(...players.map(p => p.totalScore))
  
  // 平局情况：看最后一轮得分
  const tiedPlayers = players.filter(p => p.totalScore === minTotalScore)
  
  if (tiedPlayers.length === 1) {
    return tiedPlayers[0]
  } else {
    // 平局看最后一轮得分
    const minRoundScore = Math.min(...tiedPlayers.map(p => p.roundScore))
    return tiedPlayers.find(p => p.roundScore === minRoundScore)
  }
}
```

---

## 六、UI 界面设计

### 6.1 游戏主界面布局

```
┌─────────────────────────────────────┐
│  [返回]        CABO        [设置]   │  ← 顶部导航栏
├─────────────────────────────────────┤
│                                     │
│         玩家 2 (对手)                │
│         ┌──┬──┬──┬──┐               │
│         │░░│░░│░░│░░│  ← 暗牌       │
│         └──┴──┴──┴──┘               │
│         总分：45                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   弃牌堆          抽牌堆            │
│   ┌───┐          ┌───┐             │
│   │ 5 │          │░░ │             │
│   └───┘          └───┘             │
│   (可点击)       (可点击)           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         总分：32        轮次：3      │
│         ┌──┬──┬──┬──┐               │
│         │ 5│░░│ 0│ 8│  ← 自己的牌   │
│         └──┴──┴──┴──┘               │
│                                     │
│   [抽牌]  [捡弃牌]  [喊 CABO]       │  ← 行动按钮
│                                     │
├─────────────────────────────────────┤
│  玩家 1 (你)  [头像]  你的回合       │  ← 底部玩家信息
└─────────────────────────────────────┘
```

### 6.2 WXML 结构

```xml
<!-- pages/game/game.wxml -->
<view class="game-container">
  <!-- 顶部信息栏 -->
  <view class="header">
    <view class="room-id">房间号：{{roomId}}</view>
    <view class="round-info">第 {{roundNumber}} 轮</view>
  </view>
  
  <!-- 对手区域 -->
  <view class="opponents-area">
    <view wx:for="{{opponents}}" wx:key="id" class="opponent">
      <view class="player-info">
        <image src="{{item.avatar}}" class="avatar" />
        <text>{{item.name}}</text>
        <text class="score">总分：{{item.totalScore}}</text>
      </view>
      <view class="cards">
        <view wx:for="{{item.cards}}" wx:key="index" 
              class="card {{item.isFaceUp ? 'face-up' : 'face-down'}}">
          <view wx:if="{{item.isFaceUp}}">{{item.value}}</view>
        </view>
      </view>
    </view>
  </view>
  
  <!-- 中央牌堆区域 -->
  <view class="center-area">
    <view class="discard-pile" bindtap="onTakeDiscard">
      <view class="card-label">弃牌堆</view>
      <view class="card {{topDiscard ? 'face-up' : 'empty'}}">
        {{topDiscard ? topDiscard.value : ''}}
      </view>
      <view class="count">({{discardCount}})</view>
    </view>
    
    <view class="draw-pile" bindtap="onDrawFromPile">
      <view class="card-label">抽牌堆</view>
      <view class="card face-down"></view>
      <view class="count">({{drawPileCount}})</view>
    </view>
  </view>
  
  <!-- 自己区域 -->
  <view class="player-area">
    <view class="score-display">
      <text>当前轮得分：{{currentRoundScore}}</text>
      <text>总分：{{totalScore}}</text>
    </view>
    
    <view class="my-cards">
      <view wx:for="{{myCards}}" wx:key="index" 
            class="card {{item.isFaceUp ? 'face-up' : 'face-down'}}"
            bindtap="onCardTap" data-index="{{index}}">
        <view wx:if="{{item.isFaceUp}}">
          <text class="card-value">{{item.value}}</text>
          <text class="card-suit">{{item.suit}}</text>
        </view>
      </view>
    </view>
    
    <!-- 行动按钮 -->
    <view class="action-buttons" wx:if="{{isMyTurn}}">
      <button class="btn-draw" bindtap="onDraw">抽牌</button>
      <button class="btn-discard" bindtap="onTakeDiscard">捡弃牌</button>
      <button class="btn-cabo {{hasCalledCabo ? 'disabled' : ''}}" 
              bindtap="onCallCabo" 
              disabled="{{hasCalledCabo}}">喊 CABO</button>
    </view>
    
    <!-- 等待提示 -->
    <view class="waiting-message" wx:else>
      <text>等待 {{currentPlayerName}} 行动...</text>
    </view>
  </view>
  
  <!-- 特殊能力选择弹窗 -->
  <view class="ability-modal" wx:if="{{showAbilityModal}}">
    <view class="modal-content">
      <text>发动特殊能力：{{abilityName}}</text>
      <view class="ability-options">
        <button bindtap="onUseAbility">使用</button>
        <button bindtap="onSkipAbility">跳过</button>
      </view>
    </view>
  </view>
  
  <!-- 交换确认弹窗 -->
  <view class="exchange-modal" wx:if="{{showExchangeModal}}">
    <view class="modal-content">
      <text>选择要交换的牌</text>
      <view class="exchange-options">
        <view wx:for="{{exchangeCandidates}}" wx:key="index"
              class="card {{item.selected ? 'selected' : ''}}"
              bindtap="onSelectExchangeCard" data-index="{{index}}">
          {{item.value}}
        </view>
      </view>
      <button bindtap="onConfirmExchange">确认交换</button>
    </view>
  </view>
</view>
```

### 6.3 WXSS 样式

```css
/* pages/game/game.wxss */
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
}

.opponents-area {
  flex: 1;
  padding: 20rpx;
}

.opponent {
  margin-bottom: 30rpx;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15rpx;
  color: #fff;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

.cards {
  display: flex;
  gap: 10rpx;
  margin-top: 15rpx;
}

.card {
  width: 80rpx;
  height: 120rpx;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  transition: all 0.3s;
}

.card.face-down {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-image: url('/images/card-back.png');
}

.card.face-up {
  background: #fff;
  color: #333;
}

.card-value {
  font-size: 36rpx;
  font-weight: bold;
}

.card-suit {
  font-size: 24rpx;
}

.center-area {
  display: flex;
  justify-content: center;
  gap: 60rpx;
  padding: 30rpx;
}

.discard-pile, .draw-pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
}

.card-label {
  margin-bottom: 10rpx;
  font-size: 24rpx;
}

.count {
  margin-top: 10rpx;
  font-size: 20rpx;
  opacity: 0.7;
}

.player-area {
  background: rgba(0, 0, 0, 0.2);
  padding: 30rpx;
}

.score-display {
  display: flex;
  justify-content: space-around;
  color: #fff;
  margin-bottom: 20rpx;
}

.my-cards {
  display: flex;
  justify-content: center;
  gap: 15rpx;
  margin-bottom: 30rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

.action-buttons button {
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
}

.btn-draw {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-discard {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.btn-cabo {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.btn-cabo.disabled {
  background: #ccc;
}

.waiting-message {
  text-align: center;
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx;
}

/* 弹窗样式 */
.ability-modal, .exchange-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 40rpx;
  border-radius: 20rpx;
  text-align: center;
}

.modal-content button {
  margin: 10rpx;
}

/* 动画效果 */
@keyframes flip {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(180deg); }
}

.card.flipping {
  animation: flip 0.3s ease-in-out;
}
```

---

## 七、游戏引擎实现

### 7.1 核心引擎代码结构

```javascript
// utils/game-engine.js

class GameEngine {
  constructor() {
    this.state = {
      players: [],
      drawPile: [],
      discardPile: [],
      currentPlayerIndex: 0,
      roundNumber: 1,
      caboCalled: false,
      pendingPlayers: [],
      phase: 'IDLE'
    }
    
    this.observers = []
  }
  
  // 初始化游戏
  init(playerConfigs) {
    this.state.players = playerConfigs.map(config => ({
      id: config.id,
      name: config.name,
      cards: [],
      totalScore: 0,
      roundScore: 0,
      hasCalledCabo: false
    }))
    
    this.createDeck()
    this.shuffleDeck()
    this.dealCards()
    
    this.notify('GAME_START', this.state)
  }
  
  // 创建牌堆
  createDeck() {
    this.state.drawPile = []
    for (let value = 0; value <= 13; value++) {
      for (let suit = 0; suit < 4; suit++) {
        this.state.drawPile.push({
          value,
          suit,
          isFaceUp: false
        })
      }
    }
  }
  
  // 洗牌
  shuffleDeck() {
    const pile = this.state.drawPile
    for (let i = pile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pile[i], pile[j]] = [pile[j], pile[i]]
    }
  }
  
  // 发牌
  dealCards() {
    this.state.players.forEach(player => {
      player.cards = []
      for (let i = 0; i < 4; i++) {
        const card = this.state.drawPile.pop()
        card.isFaceUp = false
        player.cards.push(card)
      }
    })
    
    // 翻一张牌到弃牌堆
    const firstDiscard = this.state.drawPile.pop()
    firstDiscard.isFaceUp = true
    this.state.discardPile.push(firstDiscard)
  }
  
  // 玩家行动
  async playerAction(action) {
    const player = this.getCurrentPlayer()
    
    switch (action.type) {
      case 'DRAW':
        await this.handleDraw(action)
        break
      case 'TAKE_DISCARD':
        await this.handleTakeDiscard(action)
        break
      case 'CALL_CABO':
        await this.handleCallCabo(player)
        break
      case 'USE_ABILITY':
        await this.handleAbility(action)
        break
    }
    
    this.checkRoundEnd()
    this.notify('STATE_UPDATE', this.state)
  }
  
  // 处理抽牌
  async handleDraw(action) {
    const player = this.getCurrentPlayer()
    const card = this.state.drawPile.pop()
    card.isFaceUp = true
    
    player.tempCard = card
    
    // 检查是否可以发动能力
    if (card.value >= 7 && card.value <= 12) {
      this.state.phase = 'ABILITY_CHOICE'
      this.notify('ABILITY_AVAILABLE', { card })
    } else {
      this.state.phase = 'EXCHANGE_CHOICE'
      this.notify('EXCHANGE_CHOICE', { card })
    }
  }
  
  // 处理捡弃牌
  async handleTakeDiscard(action) {
    const player = this.getCurrentPlayer()
    const card = this.state.discardPile.pop()
    
    player.tempCard = card
    this.state.phase = 'EXCHANGE_CHOICE'
    
    this.notify('EXCHANGE_CHOICE', { card, fromDiscard: true })
  }
  
  // 处理喊 CABO
  async handleCallCabo(player) {
    player.hasCalledCabo = true
    this.state.caboCalled = true
    
    // 其他玩家再玩一轮
    this.state.pendingPlayers = this.state.players.filter(p => p.id !== player.id)
    
    this.notify('CABO_CALLED', { player })
  }
  
  // 检查回合结束
  checkRoundEnd() {
    if (this.state.caboCalled && this.state.pendingPlayers.length === 0) {
      this.endRound()
      return true
    }
    
    if (this.state.drawPile.length === 0) {
      this.endRound()
      return true
    }
    
    return false
  }
  
  // 结束回合
  endRound() {
    const scores = this.calculateScores()
    this.notify('ROUND_END', { scores })
    
    // 检查游戏是否结束
    if (this.isGameEnd()) {
      this.endGame()
    } else {
      this.startNextRound()
    }
  }
  
  // 计算分数
  calculateScores() {
    const players = this.state.players
    const minScore = Math.min(...players.map(p => 
      p.cards.reduce((sum, c) => sum + c.value, 0)
    ))
    
    return players.map(player => {
      const handScore = player.cards.reduce((sum, c) => sum + c.value, 0)
      let roundScore
      
      if (player.hasCalledCabo) {
        roundScore = (handScore === minScore) ? 0 : (handScore + 10)
      } else {
        roundScore = handScore
      }
      
      player.roundScore = roundScore
      player.totalScore += roundScore
      
      // 检查 100 分重置规则
      if (player.totalScore === 100 && !this.state.resetUsed) {
        player.totalScore = 50
        this.state.resetUsed = true
      }
      
      return {
        playerId: player.id,
        name: player.name,
        roundScore,
        totalScore: player.totalScore,
        handScore
      }
    })
  }
  
  // 游戏结束
  endGame() {
    const winner = this.determineWinner()
    this.notify('GAME_END', { winner, finalScores: this.state.players })
  }
  
  // 确定胜利者
  determineWinner() {
    const minScore = Math.min(...this.state.players.map(p => p.totalScore))
    const tied = this.state.players.filter(p => p.totalScore === minScore)
    
    if (tied.length === 1) {
      return tied[0]
    }
    
    // 平局看最后一轮得分
    const minRoundScore = Math.min(...tied.map(p => p.roundScore))
    return tied.find(p => p.roundScore === minRoundScore)
  }
  
  // 工具方法
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex]
  }
  
  nextPlayer() {
    this.state.currentPlayerIndex = 
      (this.state.currentPlayerIndex + 1) % this.state.players.length
  }
  
  // 观察者模式
  subscribe(callback) {
    this.observers.push(callback)
  }
  
  notify(event, data) {
    this.observers.forEach(cb => cb(event, data))
  }
}

export default GameEngine
```

---

## 八、页面逻辑实现

### 8.1 game.js 完整实现

```javascript
// pages/game/game.js

import GameEngine from '../../utils/game-engine'
import { calculateHandScore } from '../../utils/score-utils'

Page({
  data: {
    // 游戏状态
    roomId: '',
    roundNumber: 1,
    isMyTurn: false,
    
    // 玩家信息
    myPlayerId: '',
    myCards: [],
    myTotalScore: 0,
    myRoundScore: 0,
    hasCalledCabo: false,
    
    // 对手信息
    opponents: [],
    currentPlayerName: '',
    
    // 牌堆信息
    drawPileCount: 0,
    discardPileCount: 0,
    topDiscard: null,
    
    // UI 状态
    showAbilityModal: false,
    showExchangeModal: false,
    abilityName: '',
    exchangeCandidates: [],
    
    // 临时状态
    tempCard: null,
    selectedExchangeCards: []
  },
  
  gameEngine: null,
  
  onLoad(options) {
    const { roomId, playerId } = options
    this.data.roomId = roomId
    this.data.myPlayerId = playerId
    
    // 初始化游戏引擎
    this.gameEngine = new GameEngine()
    this.gameEngine.subscribe(this.onGameStateUpdate.bind(this))
    
    // 从服务器获取游戏状态
    this.loadGameFromServer(roomId, playerId)
  },
  
  // 从服务器加载游戏
  async loadGameFromServer(roomId, playerId) {
    try {
      const res = await wx.request({
        url: `/api/game/${roomId}`,
        method: 'GET'
      })
      
      const gameState = res.data
      
      // 初始化引擎
      this.gameEngine.init(gameState.players)
      this.gameEngine.state = gameState
      
      this.updateUI(gameState)
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },
  
  // 游戏状态更新
  onGameStateUpdate(event, data) {
    console.log('Game event:', event, data)
    
    switch (event) {
      case 'GAME_START':
        this.updateUI(data)
        break
        
      case 'ABILITY_AVAILABLE':
        this.showAbilityChoice(data.card)
        break
        
      case 'EXCHANGE_CHOICE':
        this.showExchangeChoice(data)
        break
        
      case 'CABO_CALLED':
        wx.showToast({ 
          title: `${data.player.name} 喊了 CABO!`,
          icon: 'none',
          duration: 2000
        })
        break
        
      case 'ROUND_END':
        this.showRoundEnd(data.scores)
        break
        
      case 'GAME_END':
        this.showGameEnd(data)
        break
    }
    
    this.updateUI(data)
  },
  
  // 更新 UI
  updateUI(gameState) {
    const myPlayer = gameState.players.find(p => p.id === this.data.myPlayerId)
    const opponents = gameState.players.filter(p => p.id !== this.data.myPlayerId)
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    
    this.setData({
      roundNumber: gameState.roundNumber,
      isMyTurn: currentPlayer.id === this.data.myPlayerId,
      currentPlayerName: currentPlayer.name,
      
      myCards: myPlayer.cards,
      myTotalScore: myPlayer.totalScore,
      myRoundScore: calculateHandScore(myPlayer.cards),
      hasCalledCabo: myPlayer.hasCalledCabo,
      
      opponents: opponents.map(op => ({
        id: op.id,
        name: op.name,
        totalScore: op.totalScore,
        cards: op.cards.map(c => ({
          value: c.isFaceUp ? c.value : '?',
          isFaceUp: c.isFaceUp
        }))
      })),
      
      drawPileCount: gameState.drawPile.length,
      discardPileCount: gameState.discardPile.length,
      topDiscard: gameState.discardPile[gameState.discardPile.length - 1] || null
    })
  },
  
  // 显示能力选择
  showAbilityChoice(card) {
    const abilityNames = {
      7: '偷看自己的暗牌',
      8: '偷看自己的暗牌',
      9: '查看对手的暗牌',
      10: '查看对手的暗牌',
      11: '交换牌',
      12: '交换牌'
    }
    
    this.setData({
      abilityName: abilityNames[card.value],
      showAbilityModal: true
    })
  },
  
  // 显示交换选择
  showExchangeChoice({ card, fromDiscard }) {
    this.setData({
      tempCard: card,
      exchangeCandidates: this.data.myCards.map((c, i) => ({
        ...c,
        index: i,
        selected: false
      })),
      showExchangeModal: true
    })
  },
  
  // 行动：抽牌
  onDraw() {
    if (!this.data.isMyTurn) return
    
    wx.request({
      url: '/api/game/action',
      method: 'POST',
      data: {
        roomId: this.data.roomId,
        playerId: this.data.myPlayerId,
        action: { type: 'DRAW' }
      }
    })
  },
  
  // 行动：捡弃牌
  onTakeDiscard() {
    if (!this.data.isMyTurn) return
    
    wx.request({
      url: '/api/game/action',
      method: 'POST',
      data: {
        roomId: this.data.roomId,
        playerId: this.data.myPlayerId,
        action: { type: 'TAKE_DISCARD' }
      }
    })
  },
  
  // 行动：喊 CABO
  onCallCabo() {
    if (!this.data.isMyTurn || this.data.hasCalledCabo) return
    
    wx.showModal({
      title: '确认喊 CABO',
      content: '喊 CABO 后，其他玩家将进行最后一轮。确认吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: '/api/game/action',
            method: 'POST',
            data: {
              roomId: this.data.roomId,
              playerId: this.data.myPlayerId,
              action: { type: 'CALL_CABO' }
            }
          })
        }
      }
    })
  },
  
  // 使用特殊能力
  onUseAbility() {
    const { tempCard } = this.data
    
    wx.request({
      url: '/api/game/action',
      method: 'POST',
      data: {
        roomId: this.data.roomId,
        playerId: this.data.myPlayerId,
        action: { 
          type: 'USE_ABILITY',
          cardValue: tempCard.value
        }
      },
      success: () => {
        this.setData({ showAbilityModal: false })
      }
    })
  },
  
  // 跳过特殊能力
  onSkipAbility() {
    this.setData({ showAbilityModal: false })
    
    // 直接进入交换选择
    this.gameEngine.playerAction({ type: 'SKIP_ABILITY' })
  },
  
  // 选择交换的牌
  onSelectExchangeCard(e) {
    const index = e.currentTarget.dataset.index
    const candidates = this.data.exchangeCandidates
    
    candidates[index].selected = !candidates[index].selected
    
    this.setData({ exchangeCandidates: candidates })
  },
  
  // 确认交换
  onConfirmExchange() {
    const { tempCard, exchangeCandidates } = this.data
    const selectedCards = exchangeCandidates.filter(c => c.selected)
    
    if (selectedCards.length === 0) {
      wx.showToast({ title: '请选择要交换的牌', icon: 'none' })
      return
    }
    
    wx.request({
      url: '/api/game/action',
      method: 'POST',
      data: {
        roomId: this.data.roomId,
        playerId: this.data.myPlayerId,
        action: {
          type: 'EXCHANGE',
          tempCard,
          targetCards: selectedCards
        }
      },
      success: () => {
        this.setData({ 
          showExchangeModal: false,
          tempCard: null
        })
      }
    })
  },
  
  // 点击自己的牌
  onCardTap(e) {
    const index = e.currentTarget.dataset.index
    const card = this.data.myCards[index]
    
    // 只能查看自己的暗牌
    if (!card.isFaceUp && this.data.isMyTurn) {
      wx.showToast({ 
        title: `这张牌是 ${card.value}`,
        icon: 'none',
        duration: 1500
      })
    }
  },
  
  // 显示回合结束
  showRoundEnd(scores) {
    const myScore = scores.find(s => s.playerId === this.data.myPlayerId)
    
    wx.showModal({
      title: '回合结束',
      content: `本轮得分：${myScore.roundScore}\n总分：${myScore.totalScore}`,
      showCancel: false,
      success: () => {
        // 继续游戏
      }
    })
  },
  
  // 显示游戏结束
  showGameEnd({ winner, finalScores }) {
    const isWinner = winner.id === this.data.myPlayerId
    
    wx.showModal({
      title: isWinner ? '🎉 恭喜获胜!' : '游戏结束',
      content: `获胜者：${winner.name}\n\n最终排名:\n${this.formatScores(finalScores)}`,
      showCancel: false,
      success: () => {
        // 返回首页或结算页面
        wx.navigateTo({
          url: `/pages/result/result?roomId=${this.data.roomId}&winnerId=${winner.id}`
        })
      }
    })
  },
  
  // 格式化分数显示
  formatScores(scores) {
    return scores
      .sort((a, b) => a.totalScore - b.totalScore)
      .map((s, i) => `${i + 1}. ${s.name}: ${s.totalScore}分`)
      .join('\n')
  },
  
  onUnload() {
    // 清理
    if (this.gameEngine) {
      this.gameEngine = null
    }
  }
})
```

---

## 九、辅助工具函数

### 9.1 卡牌工具函数

```javascript
// utils/card-utils.js

/**
 * 创建一副完整的牌 (0-13, 每种 4 张)
 */
export function createDeck() {
  const deck = []
  for (let value = 0; value <= 13; value++) {
    for (let suit = 0; suit < 4; suit++) {
      deck.push({
        value,
        suit,
        isFaceUp: false
      })
    }
  }
  return deck
}

/**
 * 洗牌 (Fisher-Yates 算法)
 */
export function shuffle(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 计算手牌总分
 */
export function calculateHandScore(cards) {
  return cards.reduce((sum, card) => sum + card.value, 0)
}

/**
 * 检查卡牌是否可以发动特殊能力
 */
export function canUseAbility(card) {
  return card.value >= 7 && card.value <= 12
}

/**
 * 获取特殊能力类型
 */
export function getAbilityType(cardValue) {
  if (cardValue === 7 || cardValue === 8) return 'PEEK_SELF'
  if (cardValue === 9 || cardValue === 10) return 'SPY'
  if (cardValue === 11 || cardValue === 12) return 'SWAP'
  return null
}

/**
 * 获取卡牌显示名称
 */
export function getCardName(card) {
  const values = ['0', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suits = ['♠', '♥', '♣', '♦']
  
  return `${values[card.value]}${suits[card.suit]}`
}

/**
 * 验证交换是否合法
 */
export function validateExchange(sourceCard, targetCards) {
  if (targetCards.length === 0) {
    return { valid: false, reason: '未选择目标牌' }
  }
  
  // 检查所有目标牌是否数字相同
  const allSame = targetCards.every(c => c.value === sourceCard.value)
  
  if (!allSame) {
    return {
      valid: false,
      reason: '目标牌数字不一致',
      penalty: targetCards.length >= 3
    }
  }
  
  return { valid: true }
}
```

### 9.2 计分工具函数

```javascript
// utils/score-utils.js

/**
 * 计算回合得分
 */
export function calculateRoundScore(player, minHandScore) {
  const handScore = calculateHandScore(player.cards)
  
  if (player.hasCalledCabo) {
    return handScore === minHandScore ? 0 : handScore + 10
  }
  
  return handScore
}

/**
 * 应用 100 分重置规则
 */
export function applyResetRule(player, resetUsed) {
  if (player.totalScore === 100 && !resetUsed) {
    player.totalScore = 50
    return true
  }
  return false
}

/**
 * 确定获胜者
 */
export function determineWinner(players) {
  // 按总分排序
  const sorted = [...players].sort((a, b) => a.totalScore - b.totalScore)
  
  const minScore = sorted[0].totalScore
  const tied = sorted.filter(p => p.totalScore === minScore)
  
  if (tied.length === 1) {
    return tied[0]
  }
  
  // 平局看最后一轮得分
  const minRoundScore = Math.min(...tied.map(p => p.roundScore))
  return tied.find(p => p.roundScore === minRoundScore)
}

/**
 * 生成计分板
 */
export function generateScoreboard(players) {
  return players
    .map(p => ({
      id: p.id,
      name: p.name,
      handScore: calculateHandScore(p.cards),
      roundScore: p.roundScore,
      totalScore: p.totalScore,
      hasCalledCabo: p.hasCalledCabo
    }))
    .sort((a, b) => a.totalScore - b.totalScore)
}
```

---

## 十、交互流程图

### 10.1 玩家回合流程

```
开始回合
    ↓
显示行动选项
    ↓
玩家选择 ──→ [抽牌] ──→ 抽 1 张牌
    │                    ↓
    │                 查看牌面
    │                    ↓
    │                 是 7-12? ──是─→ 发动能力？
    │                    │              ↓
    │                   否             执行能力
    │                    │              ↓
    │                    ↓         进入交换阶段
    │              进入交换阶段
    │
    ├─→ [捡弃牌] ──→ 拿取弃牌
    │                    ↓
    │              必须交换
    │
    └─→ [喊 CABO] ──→ 检查是否已喊过
                         ↓
                       否 ──→ 标记 CABO
                         ↓
                    其他玩家再玩一轮
                         ↓
                      回合结束
```

### 10.2 交换流程

```
进入交换阶段
    ↓
选择要交换的牌 (0-3 张)
    ↓
确认交换
    ↓
验证 ──→ 成功 ──→ 替换牌
    │              ↓
    │           新牌暗置/明置
    │              ↓
    │           回合结束
    │
    └─→ 失败 ──→ 新牌加入手牌
                   ↓
                 换 3 张以上？
                   ↓
                是 ──→ 抽惩罚牌
                   ↓
                回合结束
```

---

## 十一、技术要点

### 11.1 性能优化

1. **卡牌渲染优化**: 使用虚拟列表渲染大量卡牌
2. **状态管理**: 使用观察者模式减少不必要的数据更新
3. **动画优化**: 使用 CSS3 动画代替 JS 动画

### 11.2 网络同步

1. **WebSocket 实时通信**: 用于多人游戏状态同步
2. **乐观更新**: 本地先更新 UI，再等待服务器确认
3. **断线重连**: 保存游戏状态，支持重新连接

### 11.3 数据安全

1. **暗牌保护**: 服务器只发送必要的卡牌信息
2. **操作验证**: 服务器端验证所有操作合法性
3. **防作弊**: 关键逻辑在服务器端执行

---

## 十二、后续扩展

### 12.1 功能扩展

- [ ] 添加 AI 对手（单人模式）
- [ ] 添加好友系统
- [ ] 添加排行榜
- [ ] 添加成就系统
- [ ] 添加皮肤和卡牌背面图案

### 12.2 玩法扩展

- [ ] 添加变体规则
- [ ] 添加排位赛模式
- [ ] 添加锦标赛模式
- [ ] 添加 2v2 组队模式

---

## 十三、文件清单

```
cabo-wechat/
├── pages/
│   ├── game/
│   │   ├── game.js          # 游戏主逻辑
│   │   ├── game.wxml        # 游戏界面
│   │   ├── game.wxss        # 游戏样式
│   │   └── game.json        # 游戏配置
│   ├── home/
│   │   └── ...              # 首页
│   ├── room/
│   │   └── ...              # 房间页面
│   └── result/
│       └── ...              # 结算页面
├── utils/
│   ├── card-utils.js        # 卡牌工具
│   ├── game-engine.js       # 游戏引擎
│   └── score-utils.js       # 计分工具
├── components/
│   ├── card/
│   │   ├── card.js
│   │   ├── card.wxml
│   │   └── card.wxss
│   └── player/
│       └── ...
├── images/
│   ├── card-back.png        # 卡牌背面
│   └── suits/               # 花色图标
└── app.js
```

---

这个设计文档完整描述了 Cabo 卡牌游戏的原型设计，包括：

✅ **完整的游戏规则实现**  
✅ **清晰的数据结构设计**  
✅ **模块化的代码架构**  
✅ **详细的 UI 布局设计**  
✅ **核心游戏逻辑代码**  
✅ **计分和胜利判定系统**  
✅ **交互流程图**  
✅ **技术要点和扩展方向**

你可以根据这个设计文档开始实现游戏！
