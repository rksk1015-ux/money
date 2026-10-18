/**
 * ==============================================================================
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼
 * Google Apps Script 스프레드시트 연동 백엔드 코드 (code.gs)
 * ==============================================================================
 *
 * [선생님을 위한 설치 및 배포 3단계 안내]
 * 1. 구글 스프레드시트(Google Sheets)를 엽니다.
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 code.gs 파일의 전체 내용을 붙여넣은 뒤 [저장(Ctrl+S)]합니다.
 * 4. 우측 상단 파란색 [배포] -> [새 배포] 클릭:
 *    - 유형 선택: '웹 앱' (Web App)
 *    - 설명: '오이 머니 플래닛 v3 (명단·잔액·주가 실시간 저장)'
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (※ 학생 기기에서 로그인 없이 통신 필수!)
 * 5. 배포 완료 후 생성된 [웹 앱 URL]을 복사하여,
 *    앱 상단의 [⚙️ 시트 URL 설정]에 붙여넣기만 하면 연동 완료!
 * ==============================================================================
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
    // 1. 학생 명단 시트 확인 및 로드 (번호, 이름, 현금, 저금통, 투자금, 역할, 은행원여부)
    var studentSheet = getOrCreateSheet(ss, '학생명단');
    var studentData = studentSheet.getDataRange().getValues();
    var students = [];

    if (studentData.length <= 1) {
      // 초기 기본 학생 6명 등록 (시트가 비어있을 때만 기본값 생성)
      var defaultStudents = [
        [1, '김민준', 65, 80, 45, '은행원', '은행원'],
        [2, '이서연', 50, 120, 30, '은행원', '은행원'],
        [3, '박도윤', 40, 60, 70, '은행원', '은행원'],
        [4, '정지우', 70, 50, 20, '칠판당번', '일반'],
        [5, '최예준', 35, 90, 40, '급식도우미', '일반'],
        [6, '한수아', 55, 75, 25, '환경미화', '일반']
      ];
      studentSheet.clear();
      studentSheet.appendRow(['번호', '이름', '현금(오이)', '저금통', '투자금', '현재역할', '은행원여부']);
      styleHeaderRow(studentSheet, '#2E7D32');
      defaultStudents.forEach(function(s) { studentSheet.appendRow(s); });
      studentData = studentSheet.getDataRange().getValues();
    }

    for (var i = 1; i < studentData.length; i++) {
      var num = parseInt(studentData[i][0], 10) || i;
      var name = String(studentData[i][1] || '').trim();
      var cash = studentData[i][2] !== undefined && studentData[i][2] !== '' ? Number(studentData[i][2]) : 50;
      var savings = studentData[i][3] !== undefined && studentData[i][3] !== '' ? Number(studentData[i][3]) : 0;
      var invest = studentData[i][4] !== undefined && studentData[i][4] !== '' ? Number(studentData[i][4]) : 0;
      var role = String(studentData[i][5] || '').trim();
      var isTellerStr = String(studentData[i][6] || '').trim().toLowerCase();
      var isTeller = isTellerStr === '은행원' || isTellerStr === 'true';

      if (name) {
        students.push({
          num: num,
          name: name,
          cash: cash,
          savings: savings,
          invest: invest,
          role: role,
          isTeller: isTeller
        });
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

    // 3. 주가 정보 시트 로드
    var stockSheet = getOrCreateSheet(ss, '주가정보');
    var stockData = stockSheet.getDataRange().getValues();
    var stocks = [];

    if (stockData.length <= 1) {
      var defaultStocks = [
        ['semiconductor', '오이반도체', 20, 20],
        ['hynix', 'sk오이닉스', 15, 15],
        ['hyundai', '현대오이차', 10, 10],
        ['pharma', '오이약품', 8, 8]
      ];
      stockSheet.clear();
      stockSheet.appendRow(['종목ID', '종목명', '현재주가', '이전주가']);
      styleHeaderRow(stockSheet, '#6A1B9A');
      defaultStocks.forEach(function(st) { stockSheet.appendRow(st); });
      stockData = stockSheet.getDataRange().getValues();
    }

    for (var sIdx = 1; sIdx < stockData.length; sIdx++) {
      var sId = String(stockData[sIdx][0] || '').trim();
      var sName = String(stockData[sIdx][1] || '').trim();
      var sPrice = Number(stockData[sIdx][2]) || 0;
      var sPrevPrice = Number(stockData[sIdx][3]) || sPrice;
      if (sId && sName && sPrice > 0) {
        stocks.push({ id: sId, name: sName, price: sPrice, prevPrice: sPrevPrice });
      }
    }

    // 4. 배정 결과 히스토리 시트 확인 및 로드
    var resultsSheet = getOrCreateSheet(ss, '배정결과');
    var resData = resultsSheet.getDataRange().getValues();
    var results = [];

    if (resData.length <= 1) {
      resultsSheet.clear();
      resultsSheet.appendRow(['배정일시', '번호', '학생이름', '배정역할', '역할설명']);
      styleHeaderRow(resultsSheet, '#D84315');
    } else {
      // 최신 배정 결과 최대 100건 로드
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
      results: results,
      stocks: stocks
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
    // 10초 락 획득 (동시 요청 충돌 방지)
    lock.waitLock(10000);

    var rawPostData = e.postData.contents;
    var payload = JSON.parse(rawPostData);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 학생 명단 저장 (새 명단, 잔액, 역할 등 변경사항을 시트에 영구 보존)
    if (Array.isArray(payload.students) && payload.students.length > 0) {
      var studentSheet = getOrCreateSheet(ss, '학생명단');
      studentSheet.clear();
      studentSheet.appendRow(['번호', '이름', '현금(오이)', '저금통', '투자금', '현재역할', '은행원여부']);
      styleHeaderRow(studentSheet, '#2E7D32');

      payload.students.forEach(function(s) {
        if (s && s.name) {
          studentSheet.appendRow([
            s.num || 0,
            String(s.name || ''),
            s.cash !== undefined ? s.cash : 50,
            s.savings !== undefined ? s.savings : 0,
            s.invest !== undefined ? s.invest : 0,
            String(s.role || ''),
            s.isTeller ? '은행원' : '일반'
          ]);
        }
      });
      studentSheet.autoResizeColumns(1, 7);
    }

    // 2. 역할 목록 저장
    if (Array.isArray(payload.roles) && payload.roles.length > 0) {
      var roleSheet = getOrCreateSheet(ss, '역할목록');
      roleSheet.clear();
      roleSheet.appendRow(['역할명', '설명']);
      styleHeaderRow(roleSheet, '#1565C0');

      payload.roles.forEach(function(r) {
        if (r && r.role) {
          roleSheet.appendRow([
            String(r.role || ''),
            String(r.desc || '')
          ]);
        }
      });
      roleSheet.autoResizeColumns(1, 2);
    }

    // 3. 주가 정보 저장 (선생님이 변경한 주가 보존)
    if (Array.isArray(payload.stocks) && payload.stocks.length > 0) {
      var stockSheet = getOrCreateSheet(ss, '주가정보');
      stockSheet.clear();
      stockSheet.appendRow(['종목ID', '종목명', '현재주가', '이전주가']);
      styleHeaderRow(stockSheet, '#6A1B9A');

      payload.stocks.forEach(function(st) {
        if (st && st.name) {
          stockSheet.appendRow([
            String(st.id || ''),
            String(st.name || ''),
            Number(st.price) || 0,
            Number(st.prevPrice) || 0
          ]);
        }
      });
      stockSheet.autoResizeColumns(1, 4);
    }

    // 4. 배정 결과 히스토리 추가
    if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
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
    }

    // 5. 전체 JSON 백업 시트도 함께 보존
    var backupSheet = getOrCreateSheet(ss, '전체데이터_백업');
    backupSheet.getRange(1, 1).setValue(JSON.stringify({
      savedAt: new Date().toISOString(),
      studentCount: (payload.students || []).length,
      roleCount: (payload.roles || []).length,
      assignmentCount: (payload.assignments || []).length
    }));
    backupSheet.getRange(1, 2).setValue(new Date());

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '학생 명단, 역할, 주가 및 배정 결과가 구글 스프레드시트에 성공적으로 저장(동기화)되었습니다.'
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
