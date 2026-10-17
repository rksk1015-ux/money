/**
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼 (Vanilla JS)
 */

const STORAGE_KEY = 'cucumber_money_planet_v1';

// Initial Mock Data
const INITIAL_DATA = {
  students: [
    { id: 's1', name: '김민준', avatar: '🥒', pin: '1234', wallets: { cash: 65, savings: 80, invest: 45 }, portfolio: { semiconductor: { quantity: 2, avgBuyPrice: 20 } }, isTeller: true },
    { id: 's2', name: '이서연', avatar: '⭐', pin: '2345', wallets: { cash: 50, savings: 120, invest: 30 }, portfolio: { hyundai: { quantity: 3, avgBuyPrice: 10 } }, isTeller: true },
    { id: 's3', name: '박도윤', avatar: '🚀', pin: '3456', wallets: { cash: 40, savings: 60, invest: 70 }, portfolio: { hynix: { quantity: 2, avgBuyPrice: 15 } }, isTeller: true },
    { id: 's4', name: '정지우', avatar: '🐼', pin: '4567', wallets: { cash: 70, savings: 50, invest: 20 }, portfolio: {}, isTeller: false },
  ],
  stocks: [
    { id: 'semiconductor', name: '오이반도체', icon: '⚡', price: 20, prevPrice: 20, dividendRate: 1.5, risk: '보통', desc: '학급 로봇/AI 장비를 만드는 대형 기술주' },
    { id: 'hynix', name: 'sk오이닉스', icon: '💾', price: 15, prevPrice: 15, dividendRate: 2.0, risk: '약간 높음', desc: '메모리 및 스마트기기 부품 제조사' },
    { id: 'hyundai', name: '현대오이차', icon: '🚗', price: 10, prevPrice: 10, dividendRate: 3.5, risk: '낮음', desc: '학급 청소/이동 로봇 제조 친환경 자동차주' },
    { id: 'pharma', name: '오이약품', icon: '💊', price: 8, prevPrice: 8, dividendRate: 0.5, risk: '매우 높음', desc: '신약 개발 및 건강 보조제 바이오주' },
  ],
  transactions: [
    { id: 't1', studentId: 's1', studentName: '김민준', type: 'income', category: '월급', amount: 50, targetWallet: 'cash', description: '학급 회장 기본 월급 지급', timestamp: Date.now() - 86400000 },
  ],
  config: {
    teacherPin: '1234',
    tellerPin: '0000',
    interestRate: 3.0,
  }
};

let appState = loadState();
let currentStudentId = appState.students[0].id;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  render();
}

function getCurrentStudent() {
  return appState.students.find(s => s.id === currentStudentId) || appState.students[0];
}

function render() {
  const student = getCurrentStudent();
  if (!student) return;

  // Header
  document.getElementById('student-name-header').textContent = student.name;
  document.getElementById('student-avatar-header').textContent = student.avatar;

  // Wallets
  document.getElementById('cash-amount').textContent = (student.wallets.cash || 0).toLocaleString();
  document.getElementById('savings-amount').textContent = (student.wallets.savings || 0).toLocaleString();
  document.getElementById('invest-amount').textContent = (student.wallets.invest || 0).toLocaleString();

  // Stocks
  const stockContainer = document.getElementById('stock-list');
  if (stockContainer) {
    stockContainer.innerHTML = appState.stocks.map(s => `
      <div class="stock-item">
        <div>
          <div style="font-size:1.5rem">${s.icon}</div>
          <h4 style="font-weight:800; font-size:1.1rem; margin-top:4px;">${s.name}</h4>
          <p style="font-size:0.75rem; color:#64748b;">${s.desc}</p>
          <div class="price">${s.price} <span style="font-size:0.9rem; color:#64748b;">오이</span></div>
          <div style="font-size:0.75rem; color:#059669; font-weight:700;">배당률 ${s.dividendRate}% | 위험도: ${s.risk}</div>
        </div>
        <div style="display:flex; gap:6px; margin-top:12px;">
          <button class="btn-buy" style="flex:1" onclick="tradeStock('${s.id}', 'BUY')">매수</button>
          <button class="btn-sell" style="flex:1" onclick="tradeStock('${s.id}', 'SELL')">매도</button>
        </div>
      </div>
    `).join('');
  }

  // Passbook
  const txContainer = document.getElementById('tx-list');
  if (txContainer) {
    const studentTxs = appState.transactions.filter(t => t.studentId === student.id);
    txContainer.innerHTML = studentTxs.map(t => `
      <div style="padding:12px 0; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; background:#ecfdf5; color:#065f46; padding:2px 6px; border-radius:4px; font-weight:700;">${t.category}</span>
          <div style="font-weight:700; font-size:0.9rem; margin-top:4px;">${t.description}</div>
        </div>
        <div style="font-weight:800; font-size:1rem; color:${t.type === 'income' ? '#059669' : '#e11d48'};">
          ${t.type === 'income' ? '+' : '-'}${t.amount} 오이
        </div>
      </div>
    `).join('');
  }
}

// Transfer action
function openTransferModal() {
  const amount = prompt('현금 지갑에서 저금통(예금)으로 이체할 오이 금액을 입력하세요:');
  const num = parseInt(amount, 10);
  const student = getCurrentStudent();
  if (num > 0 && student.wallets.cash >= num) {
    student.wallets.cash -= num;
    student.wallets.savings += num;
    appState.transactions.unshift({
      id: 'tx-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      type: 'transfer',
      category: '예금이체',
      amount: num,
      description: '현금 지갑에서 저금통으로 이체',
      timestamp: Date.now()
    });
    saveState();
    alert(num + ' 오이가 저금통으로 안전하게 저금되었습니다!');
  }
}

// Simple trade action
function tradeStock(stockId, action) {
  const stock = appState.stocks.find(s => s.id === stockId);
  const student = getCurrentStudent();
  if (!stock || !student) return;

  if (action === 'BUY') {
    if (student.wallets.invest >= stock.price) {
      student.wallets.invest -= stock.price;
      student.portfolio[stockId] = student.portfolio[stockId] || { quantity: 0, avgBuyPrice: stock.price };
      student.portfolio[stockId].quantity += 1;
      appState.transactions.unshift({
        id: 'tx-' + Date.now(),
        studentId: student.id,
        studentName: student.name,
        type: 'stock_buy',
        category: '주식매수',
        amount: stock.price,
        description: `${stock.name} 1주 매수`,
        timestamp: Date.now()
      });
      saveState();
      alert(`${stock.name} 1주 매수 완료!`);
    } else {
      alert('투자 계좌 잔액이 부족합니다. 먼저 현금을 투자 계좌로 이체하세요.');
    }
  } else {
    if (student.portfolio[stockId] && student.portfolio[stockId].quantity > 0) {
      student.portfolio[stockId].quantity -= 1;
      student.wallets.invest += stock.price;
      appState.transactions.unshift({
        id: 'tx-' + Date.now(),
        studentId: student.id,
        studentName: student.name,
        type: 'stock_sell',
        category: '주식매도',
        amount: stock.price,
        description: `${stock.name} 1주 매도`,
        timestamp: Date.now()
      });
      saveState();
      alert(`${stock.name} 1주 매도 완료!`);
    } else {
      alert('보유 중인 주식이 없습니다.');
    }
  }
}

// Switch tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-btn-' + tabId).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.getElementById('content-' + tabId).style.display = 'block';
}

window.onload = function() {
  render();
};
