@echo off
echo ========================================
echo Cabo Game 测试用例
echo ========================================
echo.
echo 测试文件位置:
echo - tests\game-engine.test.js
echo - tests\card-utils.test.js  
echo - tests\score-utils.test.js
echo.
echo 测试覆盖范围:
echo.
echo 1. GameEngine 测试:
echo    - 游戏初始化
echo    - 开局偷看牌功能
echo    - 回合行动选择
echo    - 单张/多张交换功能
echo    - 特殊能力系统 (7/8/9/10/11/12)
echo    - CABO喊叫机制
echo    - 计分系统
echo    - 游戏状态管理
echo.
echo 2. Card Utils 测试:
echo    - 卡牌显示值转换
echo    - 花色符号和颜色
echo    - 特殊能力判断
echo    - 手牌计算
echo    - 卡牌格式化
echo    - 数组洗牌
echo.
echo 3. Score Utils 测试:
echo    - 回合分数计算
echo    - 总分更新
echo    - 游戏结束判定
echo    - 获胜者确定
echo    - 计分板生成
echo    - 100分重置机制
echo.
echo ========================================
echo.
echo 要运行测试，请确保已安装 Node.js 和 npm
echo 然后执行: npm test
echo.
pause
