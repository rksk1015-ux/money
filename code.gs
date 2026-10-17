/**
 * ==============================================================================
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼
 * Google Apps Script 스프레드시트 연동 백엔드 코드 (code.gs)
 * ==============================================================================
 *
 * [선생님을 위한 설치 및 배포 3단계 안내]
 * 1. 새 구글 스프레드시트(Google Sheets)를 생성합니다. (예: "2026학년도 우리반 오이 머니 플래닛")
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 code.gs 파일의 전체 내용을 붙여넣은 뒤 [저장(Ctrl+S)]합니다.
 * 4. 우측 상단 파란색 [배포] -> [새 배포] 클릭:
 *    - 유형 선택: '웹 앱' (Web App)
 *    - 설명: '오이 머니 플래닛 v1'
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (※ 초등학생들이 학교 컴퓨터에서 로그인 없이 바로 통신할 수 있도록 필수!)
 * 5. 배포 완료 후 나타나는 [웹 앱 URL] (https://script.google.com/macros/s/.../exec)을 복사하여,
 *    오이 머니 플래닛 앱의 [선생님 관리] -> [구글 시트 연동]에 붙여넣으면 실시간 동기화 완료!
 * ==============================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'GET_ALL_DATA';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'PING') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '오이 머니 플래닛 구글 시트 연동 정상 작동 중입니다! 🥒'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 백업 시트에서 전체 JSON 불러오기
  var backupSheet = getOrCreateSheet(ss, '전체데이터_백업');
  var rawJson = backupSheet.getRange(1, 1).getValue();

  if (!rawJson) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'empty',
      message: '시트에 저장된 데이터가 없습니다.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var parsed = JSON.parse(rawJson);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: parsed
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '데이터 파싱 실패: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 동시 쓰기 충돌 방지 (초등학생들이 동시에 거래할 때 안전 보장)
    lock.waitLock(10000);

    var rawPostData = e.postData.contents;
    var payload = JSON.parse(rawPostData);
    var action = payload.action;
    var data = payload.payload;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'SAVE_ALL_DATA' && data) {
      saveAllDataToSheets(ss, data);
      
      // 원본 전체 JSON 백업 시트에 보관
      var backupSheet = getOrCreateSheet(ss, '전체데이터_백업');
      backupSheet.getRange(1, 1).setValue(JSON.stringify(data));
      backupSheet.getRange(1, 2).setValue(new Date());

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '학생 자산, 거래내역, 주식 현황이 스프레드시트에 완벽히 기록되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'unknown_action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 4개의 직관적인 스프레드시트 탭으로 정리하여 저장
 */
function saveAllDataToSheets(ss, data) {
  var students = data.students || [];
  var stocks = data.stocks || [];
  var transactions = data.transactions || [];

  // 1. 학생_자산현황 시트
  var studentSheet = getOrCreateSheet(ss, '학생_자산현황');
  studentSheet.clear();
  var studentHeaders = [
    '학번/번호', '이름', '통장 비밀번호', '👛 현금 지갑', '🐷 저금통(예금)',
    '📈 투자 계좌', '📊 주식 평가액', '💰 총 순자산', '은행원 여부', '보유 주식 상세'
  ];
  studentSheet.appendRow(studentHeaders);
  styleHeaderRow(studentSheet, '#2E7D32'); // 오이 그린 컬러

  var stockPriceMap = {};
  stocks.forEach(function(s) { stockPriceMap[s.id] = s.price; });

  students.forEach(function(s, idx) {
    var stockVal = 0;
    var stockDetails = [];
    if (s.portfolio) {
      for (var compId in s.portfolio) {
        var item = s.portfolio[compId];
        var curPrice = stockPriceMap[compId] || 0;
        var val = (item.quantity || 0) * curPrice;
        stockVal += val;
        if (item.quantity > 0) {
          stockDetails.push(compId + ': ' + item.quantity + '주 (평단 ' + item.avgBuyPrice + '오이)');
        }
      }
    }
    var total = (s.wallets.cash || 0) + (s.wallets.savings || 0) + (s.wallets.invest || 0) + stockVal;

    studentSheet.appendRow([
      s.studentNumber || (idx + 1),
      s.name,
      s.pin,
      s.wallets.cash || 0,
      s.wallets.savings || 0,
      s.wallets.invest || 0,
      stockVal,
      total,
      s.isTeller ? '★ 지정 은행원' : '일반 학생',
      stockDetails.join(' | ') || '없음'
    ]);
  });
  studentSheet.autoResizeColumns(1, 10);

  // 2. 가상_주식현황 시트
  var stockSheet = getOrCreateSheet(ss, '가상_주식현황');
  stockSheet.clear();
  var stockHeaders = ['종목코드', '기업명', '현재 주가(오이)', '이전 주가', '변동률(%)', '기본 배당률(%)', '위험도', '특징 및 업종'];
  stockSheet.appendRow(stockHeaders);
  styleHeaderRow(stockSheet, '#1565C0');

  stocks.forEach(function(stock) {
    var changePercent = stock.prevPrice ? (((stock.price - stock.prevPrice) / stock.prevPrice) * 100).toFixed(1) + '%' : '0%';
    stockSheet.appendRow([
      stock.code,
      stock.name,
      stock.price,
      stock.prevPrice,
      changePercent,
      stock.dividendRate + '%',
      stock.riskLevel,
      stock.themeBadge + ' - ' + stock.features
    ]);
  });
  stockSheet.autoResizeColumns(1, 8);

  // 3. 거래_통장기록부 시트 (최신 100건 누적)
  var txSheet = getOrCreateSheet(ss, '거래_통장기록부');
  txSheet.clear();
  var txHeaders = ['거래ID', '거래일시', '학생이름', '유형', '카테고리', '금액(오이)', '대상 지갑', '출처 지갑', '상세 사유/항목', '처리자'];
  txSheet.appendRow(txHeaders);
  styleHeaderRow(txSheet, '#D84315');

  var sortedTx = transactions.slice().sort(function(a, b) { return b.timestamp - a.timestamp; });
  sortedTx.forEach(function(tx) {
    var dateStr = new Date(tx.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    var walletName = tx.targetWallet === 'cash' ? '현금 지갑' : tx.targetWallet === 'savings' ? '저금통(예금)' : '투자 계좌';
    var srcWalletName = tx.sourceWallet ? (tx.sourceWallet === 'cash' ? '현금' : tx.sourceWallet === 'savings' ? '저금통' : '투자계좌') : '-';

    txSheet.appendRow([
      tx.id,
      dateStr,
      tx.studentName,
      tx.type,
      tx.category,
      tx.amount,
      walletName,
      srcWalletName,
      tx.description,
      tx.processedBy + (tx.tellerName ? ' (' + tx.tellerName + ')' : '')
    ]);
  });
  txSheet.autoResizeColumns(1, 10);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function styleHeaderRow(sheet, hexColor) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setBackground(hexColor);
  header.setFontColor('#FFFFFF');
  header.setFontWeight('bold');
  header.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}
