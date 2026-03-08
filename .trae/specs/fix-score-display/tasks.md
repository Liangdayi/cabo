# Tasks

- [x] Task 1: 移除实时手牌总和显示
  - [x] SubTask 1.1: 修改game.wxml，移除"当前手牌: xx分"显示
  - [x] SubTask 1.2: 修改game.js，移除myHandSum的数据绑定
- [x] Task 2: 添加历史手牌统计功能
  - [x] SubTask 2.1: 在game-engine.js中添加historyScores数组记录每次CABO结算后的手牌值
  - [x] SubTask 2.2: 在roundEnd时记录每个玩家的手牌值到历史记录
  - [x] SubTask 2.3: 在getState中返回historyScores
- [x] Task 3: 更新游戏界面显示历史统计
  - [x] SubTask 3.1: 修改game.js，添加historyScores数据绑定
  - [x] SubTask 3.2: 修改game.wxml，显示历史手牌统计（最近N次）
  - [x] SubTask 3.3: 无历史记录时显示"暂无记录"
# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
