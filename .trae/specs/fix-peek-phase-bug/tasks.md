# Tasks

- [x] Task 1: 修复偷看牌选择逻辑
  - [x] SubTask 1.1: 修改game-engine.js中selectPeekCard方法，选中后不允许取消
  - [x] SubTask 1.2: 修改game.wxml中卡牌点击事件，移除取消选择的交互

- [x] Task 2: 修复确认查看后牌的显示状态
  - [x] SubTask 2.1: 修改game-engine.js中endPeekPhase方法，确保牌暗置且记录已知
  - [x] SubTask 2.2: 修改game.js中updateUI方法，偷看阶段结束后牌显示为暗牌
  - [x] SubTask 2.3: 修改game.wxml，确保偷看阶段结束后不显示明牌

# Task Dependencies
- Task 2 depends on Task 1
