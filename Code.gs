/**
 * 분수 마스터 프로 - Google Apps Script 웹앱 진입점
 *
 * 라우팅
 *   기본:            기존 '분수 마스터 프로'  (index.html)
 *   ?mode=diablo :   디아블로풍 분수 던전     (diablo.html)
 *
 * 배포 방법
 * 1) script.google.com 에서 새 프로젝트 생성
 * 2) 이 파일 내용을 Code.gs 에 붙여넣기
 * 3) 파일 추가( + > HTML )로 'index' 와 'diablo' 라는 HTML 파일을 만들고,
 *    저장소의 index.html / diablo.html 내용을 각각 붙여넣기
 * 4) 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행: 나
 *    - 액세스 권한: 모든 사용자
 * 5) 생성된 웹 앱 URL 을 학생에게 공유
 *    - 디아블로 모드:  <URL>?mode=diablo
 */
function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) ? String(e.parameter.mode) : '';
  var file = (mode === 'diablo') ? 'diablo' : 'index';
  var title = (mode === 'diablo') ? '분수 던전: 디아블로' : '분수 마스터 프로';
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
