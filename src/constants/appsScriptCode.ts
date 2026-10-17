export const APPS_SCRIPT_CODE = `/**
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼
 * Google Apps Script 스프레드시트 연동 백엔드 코드 (code.gs)
 * 
 * [배포 안내]
 * 1. 새 스프레드시트에서 [확장 프로그램] -> [Apps Script]
 * 2. 전체 코드 붙여넣고 저장(Ctrl+S)
 * 3. [배포] -> [새 배포] -> 유형: [웹 앱] -> 액세스 권한: [모든 사용자(Anyone)] -> 배포
 * 4. 생성된 웹 앱 URL을 복사하여 오이 머니 플래닛 상단 [⚙️ 시트 URL 설정]에 붙여넣기
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'PING') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '오이 머니 플래닛 구글 시트 연동 정상 작동 중입니다! 🥒'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // 1. 학생 명단 시트 확인 및 로드
    var studentSheet = getOrCreateSheet(ss, '학생명단');
    var studentData = studentSheet.getDataRange().getValues();
    var students = [];

    if (studentData.length <= 1) {
      var defaultStudents = [
        [1, '김민준'],
        [2, '이서연'],
        [3, '박도윤'],
        [4, '정지우'],
        [5, '최예준'],
        [6, '한수아']
      ];
      studentSheet.clear();
      studentSheet.appendRow(['번호', '이름']);
      styleHeaderRow(studentSheet, '#2E7D32');
      defaultStudents.forEach(function(s) { studentSheet.appendRow(s); });
      studentData = studentSheet.getDataRange().getValues();
    }

    for (var i = 1; i < studentData.length; i++) {
      var num = parseInt(studentData[i][0], 10) || i;
      var name = String(studentData[i][1] || '').trim();
      if (name) {
        students.push({ num: num, name: name });
      }
    }

    // 2. 역할 목록 시트 확인 및 로드
    var roleSheet = getOrCreateSheet(ss, '역할목록');
    var roleData = roleSheet.getDataRange().getValues();
    var roles = [];

    if (roleData.length <= 1) {
      var defaultRoles = [
        ['은행원', '학급 은행 창구 입출금 및 통장 거래 내역 관리'],
        ['칠판당번', '수업 후 칠판 닦기 및 분필·지우개 정리'],
        ['급식도우미', '급식 배식 순서 안내 및 식사 예절 지도'],
        ['환경미화', '교실 분리수거함 정리 및 환기 담당'],
        ['학습도우미', '수업 준비물 점검 및 과제 제출함 관리'],
        ['에너지지킴이', '쉬는 시간 전등 끄기 및 냉난방기 점검']
      ];
      roleSheet.clear();
      roleSheet.appendRow(['역할명', '설명']);
      styleHeaderRow(roleSheet, '#1565C0');
      defaultRoles.forEach(function(r) { roleSheet.appendRow(r); });
      roleData = roleSheet.getDataRange().getValues();
    }

    for (var j = 1; j < roleData.length; j++) {
      var rName = String(roleData[j][0] || '').trim();
      var rDesc = String(roleData[j][1] || '').trim();
      if (rName) {
        roles.push({ role: rName, desc: rDesc });
      }
    }

    // 3. 배정 결과 히스토리 시트 확인 및 로드
    var resultsSheet = getOrCreateSheet(ss, '배정결과');
    var resData = resultsSheet.getDataRange().getValues();
    var results = [];

    if (resData.length <= 1) {
      resultsSheet.clear();
      resultsSheet.appendRow(['배정일시', '번호', '학생이름', '배정역할', '역할설명']);
      styleHeaderRow(resultsSheet, '#D84315');
    } else {
      for (var k = 1; k < resData.length; k++) {
        var dateStr = String(resData[k][0] || '');
        var sNum = parseInt(resData[k][1], 10) || 0;
        var sName = String(resData[k][2] || '').trim();
        var sRole = String(resData[k][3] || '').trim();
        var sDesc = String(resData[k][4] || '').trim();
        if (sName && sRole) {
          results.push({
            date: dateStr,
            num: sNum,
            name: sName,
            role: sRole,
            desc: sDesc
          });
        }
      }
    }

    var outputResponse = {
      status: 'success',
      students: students,
      roles: roles,
      results: results
    };

    return ContentService.createTextOutput(JSON.stringify(outputResponse))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '시트 조회 중 오류 발생: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var rawPostData = e.postData.contents;
    var payload = JSON.parse(rawPostData);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 배정 결과 저장 (action: "saveResults")
    if (action === 'saveResults' && Array.isArray(payload.assignments)) {
      var resultsSheet = getOrCreateSheet(ss, '배정결과');
      if (resultsSheet.getLastRow() === 0) {
        resultsSheet.appendRow(['배정일시', '번호', '학생이름', '배정역할', '역할설명']);
        styleHeaderRow(resultsSheet, '#D84315');
      }

      var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

      payload.assignments.forEach(function(item) {
        if (item && item.name) {
          resultsSheet.appendRow([
            nowStr,
            item.num || 0,
            String(item.name || ''),
            String(item.role || ''),
            String(item.desc || '')
          ]);
        }
      });
      resultsSheet.autoResizeColumns(1, 5);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '배정 결과 ' + payload.assignments.length + '건이 구글 스프레드시트에 성공적으로 저장되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 전체 경제 데이터 백업 (action: "SAVE_ALL_DATA")
    if (action === 'SAVE_ALL_DATA' && payload.payload) {
      var data = payload.payload;
      var backupSheet = getOrCreateSheet(ss, '전체데이터_백업');
      backupSheet.getRange(1, 1).setValue(JSON.stringify(data));
      backupSheet.getRange(1, 2).setValue(new Date());

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '오이 머니 플래닛 전체 데이터가 백업되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '알 수 없는 action 요청입니다: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '서버 처리 오류: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function styleHeaderRow(sheet, hexColor) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  header.setBackground(hexColor);
  header.setFontColor('#FFFFFF');
  header.setFontWeight('bold');
  header.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}
`;
