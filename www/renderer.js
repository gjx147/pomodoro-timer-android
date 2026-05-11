// ============================================
// 番茄钟 Android — 渲染进程 (Material Design)
// ============================================

const WORK_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const POMODOROS_FOR_LONG_BREAK = 4;

const GAME_WORK_TIME = 40 * 60;
const GAME_BREAK_TIME = 10 * 60;

const STATE = { WORK: 'work', SHORT_BREAK: 'short_break', LONG_BREAK: 'long_break' };
const MODE = { POMODORO: 'pomodoro', GAME: 'game' };

const LABELS = {
  pomodoro_work: '专注时间',
  pomodoro_short_break: '短休息',
  pomodoro_long_break: '长休息',
  game_work: '游戏时间',
  game_break: '游戏休息'
};

const STATE_COLORS = {
  pomodoro_work: '#2E7D32',
  pomodoro_short_break: '#1565C0',
  pomodoro_long_break: '#7B1FA2',
  game_work: '#E65100',
  game_break: '#00838F'
};

const STATE_COLORS_DARK = {
  pomodoro_work: '#81C784',
  pomodoro_short_break: '#64B5F6',
  pomodoro_long_break: '#CE93D8',
  game_work: '#FFB74D',
  game_break: '#4DD0E1'
};

let currentMode = MODE.POMODORO;
let currentState = STATE.WORK;
let timeRemaining = WORK_TIME;
let totalTime = WORK_TIME;
let isRunning = false;
let pomodoroCount = 0;
let timerInterval = null;
let soundEnabled = true;
let vibrateEnabled = true;
let isDark = false;

// Date-based 精确计时
let startedAt = 0;
let pausedRemaining = 0;

const $ = (id) => document.getElementById(id);

const minutesEl = $('minutes');
const secondsEl = $('seconds');
const timerLabel = $('timerLabel');
const timerProgress = $('timerProgress');
const startBtn = $('startBtn');
const startBtnText = $('startBtnText');
const playIcon = $('playIcon');
const pauseIcon = $('pauseIcon');
const resetBtn = $('resetBtn');
const skipBtn = $('skipBtn');
const pomodoroIndicator = $('pomodoroIndicator');
const dotElements = $('pomodoroDots').querySelectorAll('.pdot');
const settingsBtn = $('settingsBtn');
const scrim = $('scrim');
const settingsPanel = $('settingsPanel');
const soundCheckbox = $('soundEnabled');
const vibrateCheckbox = $('vibrateEnabled');
const pomodoroModeBtn = $('pomodoroMode');
const gameModeBtn = $('gameMode');
const themeSelector = $('themeSelector');

const CIRCUMFERENCE = 2 * Math.PI * 88;
timerProgress.style.strokeDasharray = CIRCUMFERENCE;

// ============================================
// 核心函数
// ============================================

function getTotalTime() {
  if (currentMode === MODE.GAME) {
    return currentState === STATE.WORK ? GAME_WORK_TIME : GAME_BREAK_TIME;
  }
  return currentState === STATE.WORK ? WORK_TIME :
         currentState === STATE.SHORT_BREAK ? SHORT_BREAK_TIME : LONG_BREAK_TIME;
}

function getStateKey() {
  return `${currentMode}_${currentState}`;
}

function getStateColor() {
  const colors = isDark ? STATE_COLORS_DARK : STATE_COLORS;
  return colors[getStateKey()];
}

function refreshUI() {
  timerLabel.textContent = LABELS[getStateKey()];
  updateStateColor();
  updateDisplay();
  updatePomodoroVisibility();
}

function updateDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  minutesEl.textContent = minutes.toString().padStart(2, '0');
  secondsEl.textContent = seconds.toString().padStart(2, '0');
  timerProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - timeRemaining / totalTime);
}

function updateStateColor() {
  const color = getStateColor();
  document.documentElement.style.setProperty('--state-color', color);
}

function updatePomodoroVisibility() {
  pomodoroIndicator.style.display = currentMode === MODE.GAME ? 'none' : '';
}

function updatePomodoroDots() {
  dotElements.forEach((dot, i) => {
    dot.classList.toggle('filled', i < pomodoroCount % POMODOROS_FOR_LONG_BREAK);
  });
}

function playSound() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

function vibrate() {
  if (!vibrateEnabled) return;
  try {
    navigator.vibrate([200, 100, 200]);
  } catch (e) {}
}

function showNotification() {
  const isWork = currentState === STATE.WORK;
  const modeLabel = currentMode === MODE.GAME ? '游戏' : '专注';
  const title = isWork ? `${modeLabel}结束！` : '休息结束！';
  const body = isWork ? '该休息一下了' : `继续${modeLabel}吧`;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') new Notification(title, { body });
      });
    }
  } catch (e) {}
}

function transitionToBreak() {
  const isLongBreak = currentMode === MODE.POMODORO && pomodoroCount % POMODOROS_FOR_LONG_BREAK === 0;
  currentState = isLongBreak ? STATE.LONG_BREAK : STATE.SHORT_BREAK;
  timeRemaining = totalTime = getTotalTime();
}

function switchState() {
  if (currentState !== STATE.WORK) {
    currentState = STATE.WORK;
    timeRemaining = totalTime = getTotalTime();
    refreshUI();
    return;
  }

  if (currentMode === MODE.POMODORO) {
    pomodoroCount++;
    updatePomodoroDots();
  }

  transitionToBreak();
  refreshUI();
}

function tick() {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  timeRemaining = Math.max(0, pausedRemaining - elapsed);
  updateDisplay();

  if (timeRemaining <= 0) {
    stopTimer();
    playSound();
    vibrate();
    showNotification();
    switchState();
  }
}

// ============================================
// 计时器控制
// ============================================

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtnText.textContent = '暂停';
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
  startBtn.classList.add('paused-state');
  pausedRemaining = timeRemaining;
  startedAt = Date.now();
  timerInterval = setInterval(tick, 200);
}

function stopTimer() {
  if (!isRunning) return;
  isRunning = false;
  startBtnText.textContent = '开始';
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
  startBtn.classList.remove('paused-state');
  clearInterval(timerInterval);
  timerInterval = null;
  if (startedAt) {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    timeRemaining = Math.max(0, pausedRemaining - elapsed);
    updateDisplay();
  }
}

function reset() {
  stopTimer();
  currentState = STATE.WORK;
  timeRemaining = totalTime = getTotalTime();
  refreshUI();
}

function skip() {
  stopTimer();
  switchState();
}

// ============================================
// 模式切换
// ============================================

function switchMode(mode) {
  if (mode === currentMode) return;
  stopTimer();
  currentMode = mode;
  currentState = STATE.WORK;
  pomodoroCount = 0;
  timeRemaining = totalTime = getTotalTime();
  pomodoroModeBtn.classList.toggle('seg-btn-active', mode === MODE.POMODORO);
  gameModeBtn.classList.toggle('seg-btn-active', mode === MODE.GAME);
  refreshUI();
  updatePomodoroDots();
}

// ============================================
// 设置面板（Bottom Sheet）
// ============================================

function openSettings() {
  scrim.classList.remove('hidden');
  settingsPanel.classList.remove('hidden');
}

function closeSettings() {
  scrim.classList.add('hidden');
  settingsPanel.classList.add('hidden');
}

function setTheme(dark) {
  isDark = dark;
  document.body.classList.toggle('dark', dark);
  updateStateColor();
  const btns = themeSelector.querySelectorAll('.seg-btn');
  btns[0].classList.toggle('seg-btn-active', !dark);
  btns[1].classList.toggle('seg-btn-active', dark);
}

// ============================================
// 事件绑定
// ============================================

startBtn.addEventListener('click', () => isRunning ? stopTimer() : startTimer());
resetBtn.addEventListener('click', reset);
skipBtn.addEventListener('click', skip);
pomodoroModeBtn.addEventListener('click', () => switchMode(MODE.POMODORO));
gameModeBtn.addEventListener('click', () => switchMode(MODE.GAME));

settingsBtn.addEventListener('click', openSettings);
scrim.addEventListener('click', closeSettings);

soundCheckbox.addEventListener('change', (e) => soundEnabled = e.target.checked);
vibrateCheckbox.addEventListener('change', (e) => vibrateEnabled = e.target.checked);

themeSelector.querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.value === 'dark'));
});

// 请求通知权限
try {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
} catch (e) {}

// ============================================
// 初始化
// ============================================

refreshUI();
updatePomodoroDots();
