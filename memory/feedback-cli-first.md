---
name: CLI优先而非GUI自动化
description: GUI操控能力不熟练，默认应优先使用CLI而非pyautogui等界面自动化方式
type: feedback
originSessionId: 4bbbea76-bc2a-4b84-b1d7-6510ffa18fb0
---
默认优先使用CLI方式完成任务，而非GUI自动化（pyautogui/pygetwindow等）。

**Why:** GUI自动化尝试（火绒垃圾清理）花费了一个多小时仍未成功，暴露了对Windows GUI自动化（尤其是UAC权限问题、DirectX渲染截图、窗口定位）的熟练度不足。

**How to apply:** 接到任务时先考虑是否有CLI/终端/PowerShell/API方式实现。仅当明确无CLI替代方案且用户特别要求时才尝试GUI自动化方式。
