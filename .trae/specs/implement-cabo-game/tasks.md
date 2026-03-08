# Tasks

## 第一阶段：核心游戏引擎完善

- [x] Task 1: 完善游戏引擎核心逻辑
  - [x] SubTask 1.1: 修复游戏初始化逻辑，确保正确发牌（所有牌暗置）和设置弃牌堆起始牌
  - [x] SubTask 1.2: 实现开局偷看牌阶段，玩家可选择2张暗牌查看10秒后自动暗置
  - [x] SubTask 1.3: 实现完整的回合制流程（DRAW → ACTION → EXCHANGE → NEXT）
  - [x] SubTask 1.4: 实现牌堆抽空检测和回合结束判定
  - [x] SubTask 1.5: 实现CABO喊叫后的额外回合机制
  - [x] SubTask 1.6: 添加游戏状态观察者模式支持

- [x] Task 2: 实现交换规则系统
  - [x] SubTask 2.1: 实现单张交换逻辑（抽牌堆来源：暗置；弃牌堆来源：明置）
  - [x] SubTask 2.2: 实现多张交换逻辑（用抽来/捡来的1张换自己多张同数字牌）
  - [x] SubTask 2.3: 实现多张交换验证逻辑（验证目标牌是否与抽来/捡来的牌同数字）
  - [x] SubTask 2.4: 实现交换失败处理（新牌入队）
  - [x] SubTask 2.5: 实现交换失败惩罚机制（换3张以上失败多抽1张惩罚牌）

- [x] Task 3: 实现抽牌后行动选择系统
  - [x] SubTask 3.1: 实现抽牌后的三种选择：交换、直接丢弃、发动技能
  - [x] SubTask 3.2: 实现7/8能力（发动时偷看自己1张暗牌，之后牌标记"不可捡取"）
  - [x] SubTask 3.3: 实现9/10能力（发动时间谍看别人1张暗牌，之后牌标记"不可捡取"）
  - [x] SubTask 3.4: 实现11/12能力（发动时交换自己与他人1张牌，之后牌标记"不可捡取"）
  - [x] SubTask 3.5: 实现直接丢弃7-12牌（不发动能力，牌可被正常捡取）
  - [x] SubTask 3.6: 实现弃牌堆"不可捡取"标记机制

## 第二阶段：计分系统完善

- [x] Task 4: 完善计分逻辑
  - [x] SubTask 4.1: 实现CABO计分规则（喊CABO且最低得0分，否则+10分）
  - [x] SubTask 4.2: 实现普通计分规则（手牌总和）
  - [x] SubTask 4.3: 实现100分重置规则（总分刚好100可重置为50，全局1次）
  - [x] SubTask 4.4: 实现游戏结束判定（总分≥100）
  - [x] SubTask 4.5: 实现平局判定（比较最后一轮得分）

## 第三阶段：AI对手系统

- [x] Task 5: 实现AI对手逻辑
  - [x] SubTask 5.1: 实现AI基础决策框架
  - [x] SubTask 5.2: 实现AI抽牌/捡牌决策逻辑
  - [x] SubTask 5.3: 实现AI喊CABO决策逻辑
  - [x] SubTask 5.4: 实现AI特殊能力使用决策
  - [x] SubTask 5.5: 实现AI交换决策逻辑

## 第四阶段：用户界面重构

- [x] Task 6: 重构游戏主界面
  - [x] SubTask 6.1: 按原型设计重构游戏主界面布局（对手区、中央牌堆、自己手牌区）
  - [x] SubTask 6.2: 实现卡牌组件（暗牌、明牌、选中状态）
  - [x] SubTask 6.3: 实现操作面板（抽牌、捡弃牌、喊CABO按钮）
  - [x] SubTask 6.4: 实现抽牌后的操作选择弹窗
  - [x] SubTask 6.5: 实现特殊能力选择弹窗

- [x] Task 7: 完善首页界面
  - [x] SubTask 7.1: 按原型设计重构首页布局
  - [x] SubTask 7.2: 实现开始对局按钮
  - [x] SubTask 7.3: 实现规则说明弹窗
  - [x] SubTask 7.4: 实现玩家人数选择

- [x] Task 8: 完善房间和结算页面
  - [x] SubTask 8.1: 实现房间等待界面
  - [x] SubTask 8.2: 实现游戏结算界面
  - [x] SubTask 8.3: 实现分数展示和排名

## 第五阶段：动画和交互优化

- [x] Task 9: 添加游戏动画效果
  - [x] SubTask 9.1: 实现卡牌翻转动画
  - [x] SubTask 9.2: 实现卡牌移动动画
  - [x] SubTask 9.3: 实现操作反馈动画
  - [x] SubTask 9.4: 实现回合切换提示

- [x] Task 10: 优化用户体验
  - [x] SubTask 10.1: 添加操作提示和引导
  - [x] SubTask 10.2: 实现游戏状态保存和恢复
  - [x] SubTask 10.3: 添加音效反馈（可选）
  - [x] SubTask 10.4: 优化加载性能

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 1, Task 2, Task 3, Task 4
- Task 6 depends on Task 1, Task 2, Task 3, Task 4
- Task 7 can run in parallel with Task 1-5
- Task 8 depends on Task 4
- Task 9 depends on Task 6
- Task 10 depends on Task 6, Task 9
