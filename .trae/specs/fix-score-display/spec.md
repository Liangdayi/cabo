# 修复手牌分数显示逻辑 Spec

## Why
当前游戏直接显示玩家手牌总和，破坏了游戏的核心乐趣——未知性。玩家应该通过记忆和策略来推测自己的手牌情况，而不是直接看到实时分数。

## What Changes
- 移除实时手牌总和显示
- 新增累积统计功能：记录每次喊CABO结算后的手牌值
- 显示历史手牌值统计，而非当前手牌总和

## Impact
- Affected specs: 游戏界面显示逻辑
- Affected code: 
  - `pages/game/game.wxml` - 移除实时手牌显示，添加历史统计显示
  - `pages/game/game.js` - 修改数据绑定逻辑
  - `utils/game-engine.js` - 添加历史手牌记录功能

## ADDED Requirements

### Requirement: 历史手牌统计
系统应记录并显示玩家每次喊CABO结算后的手牌值历史。

#### Scenario: 记录CABO结算手牌值
- **WHEN** 某玩家喊CABO并完成回合结算
- **THEN** 系统记录该玩家结算时的手牌总和
- **AND** 该记录显示在游戏界面中

#### Scenario: 显示历史手牌统计
- **WHEN** 玩家查看游戏界面
- **THEN** 显示"历史手牌值"列表（最近N次CABO结算后的手牌值）
- **AND** 不显示当前手牌的实时总和

#### Scenario: 无历史记录时显示
- **WHEN** 游戏刚开始，尚未有CABO结算记录
- **THEN** 显示"历史手牌值：暂无记录"或空状态

## MODIFIED Requirements

### Requirement: 游戏界面显示
移除实时手牌总和显示，改为显示历史手牌统计。

#### Scenario: 玩家信息区域
- **WHEN** 玩家查看自己的信息区域
- **THEN** 显示总分、历史手牌值（非当前手牌总和）
- **AND** 不泄露当前手牌的实时分数信息

## REMOVED Requirements

### Requirement: 实时手牌总和显示
**Reason**: 破坏游戏乐趣，玩家应通过记忆和策略推测手牌情况
**Migration**: 改为显示历史手牌统计
