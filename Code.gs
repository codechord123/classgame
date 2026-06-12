/**
 * 분수 폭발! 스피드 게임 — Google Apps Script 진입점 + 공유 리더보드 백엔드
 *
 * ▶ 사용법
 *  1. 앱스크립트 프로젝트에 이 Code.gs 와 pop-game.html 을 같이 둡니다.
 *  2. 배포(Deploy) → 새 배포(New deployment) → 유형: 웹 앱
 *  3. 액세스: '모든 사용자' / 실행: '나(Me)' ★ 중요 — 그래야 5명이 같은 리더보드 공유
 *  4. 발급된 URL을 학생들에게 공유
 *
 * ▶ 리더보드 저장소
 *  PropertiesService(ScriptProperties)에 JSON으로 보관합니다.
 *  - 무료, 영구 저장, 외부 서비스 불필요
 *  - 최대 200개 기록 보관, Top 5는 클라이언트에서 표시
 *
 * ▶ 학급/모둠을 분리하고 싶다면
 *  URL 쿼리에 ?room=1반 처럼 붙이면 doGet이 그 값을 HTML에 전달하고
 *  submitScore/getLeaderboard에 방 이름을 함께 보내면 방별로 분리됩니다.
 */

const LB_PROP_KEY = 'LB_JSON_V1';
const LB_ADDSUB_PROP_KEY = 'LB_ADDSUB_JSON_V1';
const LB_RUNNER_PROP_KEY = 'LB_RUNNER_JSON_V1';
const LB_ESCAPE_PROP_KEY = 'LB_ESCAPE_JSON_V1';
const LB_ESCAPE_TIMED_PROP_KEY = 'LB_ESCAPE_TIMED_JSON_V1';
const LB_MAX = 200;
const TEACHER_PASSWORD = 'teacher1234'; // 선생님이 직접 원하는 비밀번호로 변경하세요

function doGet(e) {
  const game = (e && e.parameter && e.parameter.game) || '';
  if (game === 'addsub') {
    return HtmlService.createHtmlOutputFromFile('addsub-game')
      .setTitle('분수 덧셈뺄셈 폭발! 스피드 게임')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (game === 'runner') {
    return HtmlService.createHtmlOutputFromFile('runner-game')
      .setTitle('분수 러너! 통분·약분 달리기')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (game === 'escape') {
    return HtmlService.createHtmlOutputFromFile('escape-game')
      .setTitle('분수 방탈출! 7개 방 통분·약분')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('pop-game')
    .setTitle('분수 폭발! 스피드 게임')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 클라이언트에서 google.script.run.getLeaderboard() 로 호출
// 모든 기록(원자료)을 그대로 반환. 클라이언트가 모둠/개인 통계를 계산.
function getLeaderboard() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_PROP_KEY) || '[]';
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    return [];
  }
}

// 클라이언트에서 google.script.run.submitScore(name, team, time) 로 호출
// team: 1~5 (모둠 번호)
function submitScore(name, team, time) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) {}
  try {
    const raw = props.getProperty(LB_PROP_KEY) || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];

    const safeName = String(name || 'anon').slice(0, 16);
    const t = Number(time);
    const teamNum = Number(team) || 0;
    if (!isNaN(t) && t > 0) {
      list.push({ name: safeName, team: teamNum, time: t, date: Date.now() });
    }
    // 시간 순 정렬 후 최신 LB_MAX개만 유지 (오래된 기록 자동 정리)
    list.sort(function(a, b) { return a.time - b.time; });
    if (list.length > LB_MAX) list = list.slice(0, LB_MAX);

    props.setProperty(LB_PROP_KEY, JSON.stringify(list));
    return list;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// 클라이언트에서 google.script.run.clearLeaderboard(password) 로 호출
function clearLeaderboard(password) {
  if (String(password) !== TEACHER_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  PropertiesService.getScriptProperties().deleteProperty(LB_PROP_KEY);
  return [];
}

// ===== 분수 덧셈뺄셈 게임용 리더보드 (별도 저장소) =====

// 클라이언트에서 google.script.run.getLeaderboardAddsub() 로 호출
function getLeaderboardAddsub() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_ADDSUB_PROP_KEY) || '[]';
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    return [];
  }
}

// 클라이언트에서 google.script.run.submitScoreAddsub(name, team, time) 로 호출
function submitScoreAddsub(name, team, time) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) {}
  try {
    const raw = props.getProperty(LB_ADDSUB_PROP_KEY) || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];

    const safeName = String(name || 'anon').slice(0, 16);
    const t = Number(time);
    const teamNum = Number(team) || 0;
    if (!isNaN(t) && t > 0) {
      list.push({ name: safeName, team: teamNum, time: t, date: Date.now() });
    }
    list.sort(function(a, b) { return a.time - b.time; });
    if (list.length > LB_MAX) list = list.slice(0, LB_MAX);

    props.setProperty(LB_ADDSUB_PROP_KEY, JSON.stringify(list));
    return list;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// 클라이언트에서 google.script.run.clearLeaderboardAddsub(password) 로 호출
function clearLeaderboardAddsub(password) {
  if (String(password) !== TEACHER_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  PropertiesService.getScriptProperties().deleteProperty(LB_ADDSUB_PROP_KEY);
  return [];
}

// ===== 분수 러너 게임용 리더보드 (별도 저장소) =====

function getLeaderboardRunner() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_RUNNER_PROP_KEY) || '[]';
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    return [];
  }
}

function submitScoreRunner(name, team, time) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) {}
  try {
    const raw = props.getProperty(LB_RUNNER_PROP_KEY) || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];

    const safeName = String(name || 'anon').slice(0, 16);
    const t = Number(time);
    const teamNum = Number(team) || 0;
    if (!isNaN(t) && t > 0) {
      list.push({ name: safeName, team: teamNum, time: t, date: Date.now() });
    }
    list.sort(function(a, b) { return a.time - b.time; });
    if (list.length > LB_MAX) list = list.slice(0, LB_MAX);

    props.setProperty(LB_RUNNER_PROP_KEY, JSON.stringify(list));
    return list;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function clearLeaderboardRunner(password) {
  if (String(password) !== TEACHER_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  PropertiesService.getScriptProperties().deleteProperty(LB_RUNNER_PROP_KEY);
  return [];
}

// ===== 분수 방탈출 게임용 리더보드 (별도 저장소) =====

function getLeaderboardEscape() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_ESCAPE_PROP_KEY) || '[]';
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    return [];
  }
}

function submitScoreEscape(name, team, time) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) {}
  try {
    const raw = props.getProperty(LB_ESCAPE_PROP_KEY) || '[]';
    let list = [];
    try { list = JSON.parse(raw); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];

    const safeName = String(name || 'anon').slice(0, 16);
    const t = Number(time);
    const teamNum = Number(team);
    const teamSafe = isNaN(teamNum) ? 0 : teamNum;
    if (!isNaN(t) && t > 0) {
      const idx = list.findIndex(function(e) { return e.name === safeName && Number(e.team) === teamSafe; });
      const entry = { name: safeName, team: teamSafe, time: t, date: Date.now() };
      if (idx === -1) {
        list.push(entry);
      } else if (t < list[idx].time) {
        list[idx] = entry; // 기록을 경신한 경우에만 갱신
      }
    }
    list.sort(function(a, b) { return a.time - b.time; });
    if (list.length > LB_MAX) list = list.slice(0, LB_MAX);

    props.setProperty(LB_ESCAPE_PROP_KEY, JSON.stringify(list));
    return list;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function clearLeaderboardEscape(password) {
  if (String(password) !== TEACHER_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  PropertiesService.getScriptProperties().deleteProperty(LB_ESCAPE_PROP_KEY);
  return [];
}

// ===== 분수 방탈출: 시간 제한 도전 모드 리더보드 (모드별로 분리: '10'/'7'/'5') =====

function getLeaderboardEscapeTimed(mode) {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_ESCAPE_TIMED_PROP_KEY) || '{}';
    const obj = JSON.parse(raw);
    const list = obj[String(mode)];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

function submitScoreEscapeTimed(name, team, mode, rooms, time) {
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) {}
  try {
    const raw = props.getProperty(LB_ESCAPE_TIMED_PROP_KEY) || '{}';
    let obj = {};
    try { obj = JSON.parse(raw); } catch (e) { obj = {}; }
    const m = String(mode);
    let list = Array.isArray(obj[m]) ? obj[m] : [];

    const safeName = String(name || 'anon').slice(0, 16);
    const rooms_ = Math.floor(Number(rooms));
    const t = Number(time);
    const teamNum = Number(team);
    const teamSafe = isNaN(teamNum) ? 0 : teamNum;
    if (!isNaN(rooms_) && rooms_ >= 0 && !isNaN(t) && t >= 0) {
      const idx = list.findIndex(function(e) { return e.name === safeName && Number(e.team) === teamSafe; });
      const entry = { name: safeName, team: teamSafe, rooms: rooms_, time: t, date: Date.now() };
      if (idx === -1) {
        list.push(entry);
      } else {
        const old = list[idx];
        const better = rooms_ > old.rooms || (rooms_ === old.rooms && t < old.time);
        if (better) list[idx] = entry; // 기록을 경신한 경우에만 갱신
      }
    }
    list.sort(function(a, b) { return (b.rooms - a.rooms) || (a.time - b.time); });
    if (list.length > LB_MAX) list = list.slice(0, LB_MAX);

    obj[m] = list;
    props.setProperty(LB_ESCAPE_TIMED_PROP_KEY, JSON.stringify(obj));
    return list;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function clearLeaderboardEscapeTimed(password) {
  if (String(password) !== TEACHER_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  PropertiesService.getScriptProperties().deleteProperty(LB_ESCAPE_TIMED_PROP_KEY);
  return {};
}

// ===== 분수 방탈출: 관리자(선생님) 설정 - 통분 힌트 비용 / 오답 페널티 =====

const ESCAPE_ADMIN_PASSWORD = 'class0504';
const LB_ESCAPE_SETTINGS_PROP_KEY = 'LB_ESCAPE_SETTINGS_V1';
const DEFAULT_ESCAPE_SETTINGS = { hintCostMs: 25000, penaltyMs: 8000 };

function getEscapeSettings() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LB_ESCAPE_SETTINGS_PROP_KEY);
    if (!raw) return DEFAULT_ESCAPE_SETTINGS;
    const obj = JSON.parse(raw);
    const hintCostMs = Number(obj.hintCostMs);
    const penaltyMs = Number(obj.penaltyMs);
    return {
      hintCostMs: !isNaN(hintCostMs) && hintCostMs >= 0 ? hintCostMs : DEFAULT_ESCAPE_SETTINGS.hintCostMs,
      penaltyMs: !isNaN(penaltyMs) && penaltyMs >= 0 ? penaltyMs : DEFAULT_ESCAPE_SETTINGS.penaltyMs,
    };
  } catch (err) {
    return DEFAULT_ESCAPE_SETTINGS;
  }
}

function setEscapeSettings(password, hintCostMs, penaltyMs) {
  if (String(password) !== ESCAPE_ADMIN_PASSWORD) {
    throw new Error('비밀번호가 틀렸습니다.');
  }
  const h = Number(hintCostMs);
  const p = Number(penaltyMs);
  const settings = {
    hintCostMs: !isNaN(h) && h >= 0 ? h : DEFAULT_ESCAPE_SETTINGS.hintCostMs,
    penaltyMs: !isNaN(p) && p >= 0 ? p : DEFAULT_ESCAPE_SETTINGS.penaltyMs,
  };
  PropertiesService.getScriptProperties().setProperty(LB_ESCAPE_SETTINGS_PROP_KEY, JSON.stringify(settings));
  return settings;
}
