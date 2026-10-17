export const APPS_SCRIPT_CODE = `/**
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼
 * Google Apps Script 스프레드시트 연동 백엔드 코드 (code.gs)
 * 
 * [배포 안내]
 * 1. 새 스프레드시트에서 [확장 프로그램] -> [Apps Script]
 * 2. 전체 코드 붙여넣고 저장(Ctrl+S)
 * 3. [배포] -> [새 배포] -> 유형: [웹 앱] -> 액세스 권한: [모든 사용자(Anyone)] -> 배포
 * 4. 생성된 웹 앱 URL을 복사하여 오이 머니 플래닛 [선생님 관리] -> [구글 시트 연동]에 붙여넣기
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
    lock.waitLock(10000);

    var rawPostData = e.postData.contents;
    var payload = JSON.parse(rawPostData);
    var action = payload.action;
    var data = payload.payload;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'SAVE_ALL_DATA' && data) {
      saveAllDataToSheets(ss, data);
      
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
  styleHeaderRow(studentSheet, '#2E7D32');

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

  // 3. 거래_통장기록부 시트
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
`;
