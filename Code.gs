/**
 * 분수 폭발! 스피드 게임 — Google Apps Script 진입점
 *
 * 사용법:
 *  1. 앱스크립트 프로젝트에 이 Code.gs 파일과 pop-game.html 파일을 같이 둡니다.
 *  2. 배포(Deploy) → 새 배포(New deployment) → 유형: 웹 앱
 *  3. 액세스: '본인' 또는 '모든 사용자' / 실행: '나' 선택 후 배포
 *  4. 발급된 URL을 학생들에게 공유
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('pop-game')
    .setTitle('분수 폭발! 스피드 게임')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
