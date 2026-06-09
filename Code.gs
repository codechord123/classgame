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
