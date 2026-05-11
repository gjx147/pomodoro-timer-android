# Pomodoro Timer Android

番茄钟 Android 应用，基于 Capacitor + Material Design 3 构建。

![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF?style=flat-square)
![Android](https://img.shields.io/badge/Android-API%2024+-3DDC84?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.1-2E7D32?style=flat-square)

## 特性

**番茄模式** — 25 分钟专注 / 5 分钟短休息 / 每 4 个番茄后 15 分钟长休息

**游戏模式** — 40 分钟游戏 / 10 分钟休息

**Material Design 3** — MD3 色板系统、Segmented Button、Bottom Sheet、Material Switch，状态颜色随阶段动态切换（工作绿、短休息蓝、长休息紫、游戏橙、游戏休息青）

**精确计时** — 基于 `Date.now()` 时间戳校准，后台运行不漂移

**移动端适配** — 48px 最小触摸区域、振动反馈、Web Audio 提示音、Web Notification 通知

**双主题** — 浅色 / 深色主题，遵循 MD3 Light / Dark 色板规范

## 下载

前往 [Releases](https://github.com/gjx147/pomodoro-timer-android/releases/latest) 下载最新 APK。

## 开发

```bash
npm install              # 安装依赖
npx cap sync             # 同步 Web 资源到 Android
npx cap open android     # 用 Android Studio 打开（可选）
```

### 命令行构建 APK

需安装 Android SDK（Platform 34 + Build-Tools 34）：

```bash
export ANDROID_HOME=$LOCALAPPDATA/Android/Sdk
cd android && ./gradlew assembleDebug
```

输出：`android/app/build/outputs/apk/debug/app-debug.apk`

## 项目结构

```
www/                  # Web 资源（Material Design UI）
  index.html          # 页面结构
  styles.css          # MD3 样式 + 深色主题
  renderer.js         # 计时器逻辑
android/              # Capacitor 生成的 Android 项目
capacitor.config.json # Capacitor 配置
```

## 技术栈

Capacitor 6 · Vanilla JS · Material Design 3 · SVG Progress Ring · Web Audio API

## 相关项目

- [pomodoro-timer](https://github.com/gjx147/pomodoro-timer) — Electron 桌面版（Windows）

## License

MIT

---

powered by 郭建巡
