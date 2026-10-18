/**
 * ==============================================================================
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡&뱅킹 플랫폼
 * 순수 JavaScript 로직 (script.js) - 프레임워크 없는 독립형 웹앱
 * ==============================================================================
 */

const STORAGE_KEY = 'cucumber_money_planet_v1';
const SHEET_URL_KEY = 'cucumber_sheet_url';

// 1. 가상 4대 기업 초기 데이터
const INITIAL_STOCKS = [
  { id: 'semiconductor', name: '오이반도체', icon: '⚡', price: 20, prevPrice: 20, minPrice: 6, maxPrice: 38, dividendRate: 1.5, risk: '보통', badge: '대형 기술주 · AI 로봇', desc: '학급 로봇/AI 급식 및 교실 장비를 만드는 대한민국 대표 대형 기술주' },
  { id: 'hynix', name: 'sk오이닉스', icon: '💾', price: 15, prevPrice: 15, minPrice: 5, maxPrice: 35, dividendRate: 2.0, risk: '약간 높음', badge: '반도체 부품 · 메모리', desc: '스마트 기기와 인공지능 메모리 반도체 부품 전문 제조사' },
  { id: 'hyundai', name: '현대오이차', icon: '🚗', price: 10, prevPrice: 10, minPrice: 5, maxPrice: 28, dividendRate: 3.5, risk: '낮음', badge: '친환경 모빌리티 · 청소차', desc: '학급 청소 및 자율주행 이동 로봇을 제작하는 친환경 미래 자동차주' },
  { id: 'pharma', name: '오이약품', icon: '💊', price: 8, prevPrice: 8, minPrice: 4, maxPrice: 32, dividendRate: 0.5, risk: '매우 높음', badge: '바이오 벤처 · 피로회복', desc: '신약 개발 및 학생 맞춤형 비타민 젤리를 연구하는 바이오주' }
];

// 2. 초기 학생 목록 (6명)
const INITIAL_STUDENTS = [
  { id: 's1', num: 1, name: '김민준', avatar: '🥒', pin: '1234', wallets: { cash: 65, savings: 80, invest: 45 }, portfolio: { semiconductor: { quantity: 2, avgBuyPrice: 20 } }, isTeller: true },
  { id: 's2', num: 2, name: '이서연', avatar: '⭐', pin: '2345', wallets: { cash: 50, savings: 120, invest: 30 }, portfolio: { hyundai: { quantity: 3, avgBuyPrice: 10 } }, isTeller: true },
  { id: 's3', num: 3, name: '박도윤', avatar: '🚀', pin: '3456', wallets: { cash: 40, savings: 60, invest: 70 }, portfolio: { hynix: { quantity: 2, avgBuyPrice: 15 } }, isTeller: true },
  { id: 's4', num: 4, name: '정지우', avatar: '🐼', pin: '4567', wallets: { cash: 70, savings: 50, invest: 20 }, portfolio: {}, isTeller: false },
  { id: 's5', num: 5, name: '최예준', avatar: '🦁', pin: '5678', wallets: { cash: 35, savings: 90, invest: 40 }, portfolio: { semiconductor: { quantity: 1, avgBuyPrice: 20 } }, isTeller: false },
  { id: 's6', num: 6, name: '한수아', avatar: '🐣', pin: '6789', wallets: { cash: 55, savings: 75, invest: 25 }, portfolio: { pharma: { quantity: 2, avgBuyPrice: 8 } }, isTeller: false }
];

// 3. 1인 1역할 기본 목록
const INITIAL_ROLES = [
  { role: '은행원', desc: '학급 은행 창구 입출금 및 통장 거래 내역 관리' },
  { role: '칠판당번', desc: '수업 후 칠판 닦기 및 분필·지우개 정리' },
  { role: '급식도우미', desc: '급식 배식 순서 안내 및 식사 예절 지도' },
  { role: '환경미화', desc: '교실 분리수거함 정리 및 환기 담당' },
  { role: '학습도우미', desc: '수업 준비물 점검 및 과제 제출함 관리' },
  { role: '에너지지킴이', desc: '쉬는 시간 전등 끄기 및 냉난방기 점검' }
];

// 4. 주간 뉴스 3세트
const PRESET_NEWS = [
  {
    id: 'n1',
    setNum: 1,
    title: '📌 1세트: 오이반도체 AI 급식 로봇 칩 성공! sk오이닉스 정전 생산차질',
    content: '오이반도체가 최첨단 AI 급식 배식 로봇 칩 개발에 전격 성공했습니다! 반면 sk오이닉스는 공장 정전으로 생산 차질을 빚고 있습니다.',
    edu: '💡 교육 포인트: 기술 개발 같은 호재는 주가를 올리고, 사고 같은 악재는 주가를 떨어뜨립니다.',
    effects: { semiconductor: 5, hynix: -3, hyundai: 0, pharma: 0 },
    badge: '산업혁신'
  },
  {
    id: 'n2',
    setNum: 2,
    title: '📌 2세트: 저금통 금리 인상! 현대오이차 친환경 셔틀 계약으로 고배당 기대',
    content: '학급 저금통 예금 금리가 인상되었습니다! 현대오이차가 친환경 셔틀 계약을 체결해 배당금 확대가 기대됩니다.',
    edu: '💡 교육 포인트: 금리가 오르면 안정적인 배당을 주는 기업에 돈이 몰리고 위험 바이오주는 약세를 보입니다.',
    effects: { semiconductor: 0, hynix: 0, hyundai: 3, pharma: -1 },
    badge: '금리·배당'
  },
  {
    id: 'n3',
    setNum: 3,
    title: '📌 3세트: 오이약품 피로회복 젤리 임상 3상 성공! 급식실 유통 계약 체결',
    content: '오이약품이 개발한 학생 피로회복 비타민 젤리가 임상 3상을 대성공하고 급식실 정기 유통 계약까지 체결되었습니다!',
    edu: '💡 교육 포인트: 바이오주는 신약 성공 소식 한 번에 2배 이상 폭등할 수 있는 고위험-고수익(High Risk, High Return) 특징을 가집니다.',
    effects: { pharma: 7, semiconductor: -2, hynix: 0, hyundai: 0 },
    badge: '바이오임상'
  }
];

// 초기 상태
let state = loadInitialState();
let currentStudentId = state.students[0]?.id || 's1';
let activeTab = 'roles';
let currentAssignments = [];
let passbookFilter = 'all';

// Sound Engine (Web Audio API - 외부 파일 없음)
const sound = {
  ctx: null,
  muted: false,
  getCtx() {
    if (this.muted) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  },
  coin() {
    const c = this.getCtx(); if (!c) return;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(987.77, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1318.51, c.currentTime + 0.12);
    g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.connect(g); g.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.35);
  },
  fanfare() {
    const c = this.getCtx(); if (!c) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const start = c.currentTime + idx * 0.08;
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.25, start); g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(g); g.connect(c.destination); osc.start(start); osc.stop(start + 0.3);
    });
  },
  success() {
    const c = this.getCtx(); if (!c) return;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(659.25, c.currentTime);
    osc.frequency.setValueAtTime(880, c.currentTime + 0.08);
    g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
    osc.connect(g); g.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.28);
  },
  click() {
    const c = this.getCtx(); if (!c) return;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.frequency.setValueAtTime(800, c.currentTime);
    g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.connect(g); g.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.04);
  },
  error() {
    const c = this.getCtx(); if (!c) return;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, c.currentTime);
    g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
    osc.connect(g); g.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.25);
  }
};

// Canvas 축하 콘페티
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const particles = [];
  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#e11d48'];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.alpha -= 0.015;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });
    if (alive && frame < 90) {
      frame++;
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  animate();
}

// 상태 로드 및 저장
function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.students)) {
        return {
          students: parsed.students,
          roles: Array.isArray(parsed.roles) ? parsed.roles : INITIAL_ROLES,
          stocks: Array.isArray(parsed.stocks) ? parsed.stocks : INITIAL_STOCKS,
          news: Array.isArray(parsed.news) ? parsed.news : PRESET_NEWS,
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          results: Array.isArray(parsed.results) ? parsed.results : [],
          config: Object.assign({ teacherPin: '1234', tellerPin: '0000', interestRate: 3.0 }, parsed.config || {})
        };
      }
    }
  } catch (e) {}

  return {
    students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
    roles: JSON.parse(JSON.stringify(INITIAL_ROLES)),
    stocks: JSON.parse(JSON.stringify(INITIAL_STOCKS)),
    news: JSON.parse(JSON.stringify(PRESET_NEWS)),
    transactions: [
      { id: 't1', studentId: 's1', studentName: '김민준', type: 'income', category: '월급', amount: 50, target: 'cash', desc: '1인 1역할 은행원 월급 지급', by: '은행원 (이서연)', time: Date.now() - 3600000 }
    ],
    results: [],
    config: { teacherPin: '1234', tellerPin: '0000', interestRate: 3.0 }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function getCurrentStudent() {
  return state.students.find(s => s.id === currentStudentId) || state.students[0];
}

function getSheetUrl() {
  return localStorage.getItem(SHEET_URL_KEY) || '';
}

function showToast(msg, type = 'info') {
  const el = document.getElementById('toast-banner');
  if (!el) return;
  el.className = `toast-banner toast-${type}`;
  el.innerHTML = `<span>${msg}</span><button onclick="document.getElementById('toast-banner').style.display='none'" style="background:none;border:none;cursor:pointer;font-weight:700;">✕</button>`;
  el.style.display = 'flex';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

// 탭 전환
function switchTab(tabId) {
  sound.click();
  activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const targetBtn = document.getElementById(`tab-btn-${tabId}`);
  if (targetBtn) targetBtn.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const targetContent = document.getElementById(`content-${tabId}`);
  if (targetContent) targetContent.style.display = 'block';

  render();
}

// ==============================================================================
// 구글 스프레드시트 연동 핵심 함수 (GET & POST)
// ==============================================================================

// 1. [🔄 시트에서 명단/결과 불러오기] (GET)
async function fetchFromGoogleSheet(isSilent = false) {
  const url = getSheetUrl().trim();
  if (!url || !url.startsWith('http')) {
    if (!isSilent) {
      sound.error();
      showToast('구글 스프레드시트 웹앱 주소가 설정되지 않았습니다. [⚙️ 시트 URL 설정]을 눌러주세요.', 'info');
      openModal('sheet-url-modal');
    }
    return;
  }

  const btn = document.getElementById('btn-header-pull');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '불러오는 중...';
  }

  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json || json.status !== 'success') {
      throw new Error(json?.message || '시트 응답 상태가 success가 아닙니다.');
    }

    // students 객체 배열 파싱 (student.num, student.name)
    if (Array.isArray(json.students)) {
      const validStudents = [];
      json.students.forEach((item, idx) => {
        if (item && typeof item.name === 'string' && item.name.trim().length > 0) {
          const num = typeof item.num === 'number' ? item.num : parseInt(item.num, 10) || idx + 1;
          validStudents.push({ num: num, name: item.name.trim() });
        }
      });

      if (validStudents.length > 0) {
        // 기존 학생의 계좌 자산, PIN 보존 매칭
        const existingMap = new Map(state.students.map(s => [s.name, s]));
        state.students = validStudents.map(v => {
          const exist = existingMap.get(v.name);
          if (exist) {
            exist.num = v.num;
            return exist;
          }
          return {
            id: `s-sheet-${v.num}-${Date.now()}`,
            num: v.num,
            name: v.name,
            avatar: '🥒',
            pin: '1234',
            wallets: { cash: 50, savings: 0, invest: 0 },
            portfolio: {},
            isTeller: false
          };
        });
      }
    }

    // roles 객체 배열 파싱 (role.role, role.desc)
    if (Array.isArray(json.roles)) {
      const validRoles = [];
      json.roles.forEach(r => {
        if (r && typeof r.role === 'string' && r.role.trim().length > 0) {
          validRoles.push({
            role: r.role.trim(),
            desc: typeof r.desc === 'string' ? r.desc.trim() : '학급 역할'
          });
        }
      });
      if (validRoles.length > 0) {
        state.roles = validRoles;
      }
    }

    // results 배정 결과 히스토리 파싱
    if (Array.isArray(json.results)) {
      state.results = json.results.map(item => ({
        date: String(item.date || ''),
        num: Number(item.num) || 0,
        name: String(item.name || ''),
        role: String(item.role || ''),
        desc: String(item.desc || '')
      }));

      // 최신 결과 반영
      if (state.results.length > 0) {
        const latestDate = state.results[state.results.length - 1].date;
        const latestItems = state.results.filter(r => r.date === latestDate);
        if (latestItems.length > 0) {
          currentAssignments = latestItems.map(item => ({
            num: item.num,
            name: item.name,
            role: item.role,
            desc: item.desc
          }));
        }
      }
    }

    saveState();
    if (!isSilent) {
      sound.success();
      showToast(`✅ 시트에서 학생 ${state.students.length}명, 역할 ${state.roles.length}종을 성공적으로 불러왔습니다!`, 'success');
    }
  } catch (err) {
    if (!isSilent) {
      sound.error();
      showToast(`❌ 시트 불러오기 오류: ${err.message} (기존 데이터가 보존됩니다)`, 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔄 시트에서 명단/결과 불러오기';
    }
  }
}

// 2. [💾 배정 결과 구글 시트에 저장] (POST - CORS Preflight 차단 방지)
async function saveAssignmentsToGoogleSheet() {
  const url = getSheetUrl().trim();
  if (!url || !url.startsWith('http')) {
    sound.error();
    showToast('구글 스프레드시트 웹앱 주소가 설정되지 않았습니다. [⚙️ 시트 URL 설정]을 눌러주세요.', 'info');
    openModal('sheet-url-modal');
    return;
  }

  if (currentAssignments.length === 0) {
    alert('저장할 1인 1역할 배정 결과가 없습니다. 먼저 [🎲 랜덤 배정하기]를 실행하세요.');
    return;
  }

  const btn = document.getElementById('btn-header-push');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '저장 중...';
  }

  // assignments 항목: { num: student.num, name: student.name, role: selectedRole.role, desc: selectedRole.desc }
  const assignments = currentAssignments.map(a => ({
    num: typeof a.num === 'number' ? a.num : parseInt(a.num, 10) || 0,
    name: String(a.name || ''),
    role: String(a.role || ''),
    desc: String(a.desc || '')
  }));

  try {
    // text/plain;charset=utf-8 헤더로 CORS Preflight 차단 방지
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveResults',
        assignments: assignments
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const newItems = assignments.map(a => ({
      date: nowStr,
      num: a.num,
      name: a.name,
      role: a.role,
      desc: a.desc
    }));

    state.results = [...state.results, ...newItems];

    // 은행원으로 배정된 학생은 isTeller 활성화
    const tellers = new Set(assignments.filter(a => a.role === '은행원').map(a => a.name));
    state.students.forEach(s => {
      s.isTeller = tellers.has(s.name);
    });

    saveState();
    sound.fanfare();
    triggerConfetti();
    showToast(`✅ 배정 결과 ${assignments.length}건이 구글 스프레드시트에 성공적으로 저장되었습니다!`, 'success');
  } catch (err) {
    sound.error();
    showToast(`❌ 저장 실패: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 배정 결과 구글 시트에 저장';
    }
  }
}

// 1인 1역할 랜덤 배정
function randomAssignRoles() {
  if (state.students.length === 0 || state.roles.length === 0) {
    alert('학생 명단 또는 역할 목록이 없습니다.');
    return;
  }
  sound.fanfare();
  triggerConfetti();

  const shuffled = [...state.roles].sort(() => Math.random() - 0.5);
  currentAssignments = state.students.map((s, idx) => {
    const r = shuffled[idx % shuffled.length];
    return {
      num: s.num,
      name: s.name,
      role: r.role,
      desc: r.desc
    };
  });

  render();
}

// 역할 명단 직접 수정
function startEditRoles() {
  sound.click();
  document.getElementById('edit-students-text').value = state.students.map(s => s.name).join('\n');
  document.getElementById('edit-roles-text').value = state.roles.map(r => r.role).join('\n');
  document.getElementById('role-edit-box').style.display = 'block';
}

function saveEditRoles() {
  sound.success();
  const sText = document.getElementById('edit-students-text').value;
  const rText = document.getElementById('edit-roles-text').value;

  const sLines = sText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const rLines = rText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const existingMap = new Map(state.students.map(s => [s.name, s]));
  state.students = sLines.map((name, idx) => {
    const exist = existingMap.get(name);
    if (exist) {
      exist.num = idx + 1;
      return exist;
    }
    return {
      id: `s-man-${idx}-${Date.now()}`,
      num: idx + 1,
      name: name,
      avatar: '🥒',
      pin: '1234',
      wallets: { cash: 50, savings: 0, invest: 0 },
      portfolio: {},
      isTeller: false
    };
  });

  const origRoleMap = new Map(state.roles.map(r => [r.role, r]));
  state.roles = rLines.map(role => {
    const orig = origRoleMap.get(role);
    return {
      role: role,
      desc: orig?.desc || '학급 역할 활동'
    };
  });

  document.getElementById('role-edit-box').style.display = 'none';
  saveState();
}

// ==============================================================================
// 렌더링 함수
// ==============================================================================
function render() {
  const student = getCurrentStudent();
  if (!student) return;

  // 헤더 학생 정보 (날짜 없음)
  document.getElementById('header-avatar').textContent = student.avatar || '🥒';
  document.getElementById('header-student-name').textContent = student.name;
  const tellerBadge = document.getElementById('header-teller-badge');
  if (tellerBadge) tellerBadge.style.display = student.isTeller ? 'inline-block' : 'none';

  // 총 자산 계산
  const stockVal = Object.entries(student.portfolio || {}).reduce((sum, [cId, hold]) => {
    const st = state.stocks.find(s => s.id === cId);
    return sum + (hold?.quantity || 0) * (st?.price || 0);
  }, 0);
  const totalNet = (student.wallets.cash || 0) + (student.wallets.savings || 0) + (student.wallets.invest || 0) + stockVal;
  document.getElementById('header-total-assets').textContent = totalNet.toLocaleString();

  // 지갑 3종 카드
  const cashAmountEl = document.getElementById('cash-amount');
  const cashVal = student.wallets.cash || 0;
  cashAmountEl.textContent = cashVal.toLocaleString();
  if (cashVal < 0) {
    cashAmountEl.style.color = '#fecaca'; // 마이너스 잔액 강조
  } else {
    cashAmountEl.style.color = '#ffffff';
  }
  document.getElementById('savings-amount').textContent = (student.wallets.savings || 0).toLocaleString();
  document.getElementById('invest-amount').textContent = (student.wallets.invest || 0).toLocaleString();
  document.getElementById('savings-rate-badge').textContent = `이자 ${state.config.interestRate.toFixed(1)}%`;

  // 자산 바
  const barCashEl = document.getElementById('bar-cash');
  barCashEl.textContent = cashVal.toLocaleString();
  if (cashVal < 0) {
    barCashEl.style.color = '#e11d48';
  } else {
    barCashEl.style.color = 'inherit';
  }
  document.getElementById('bar-savings').textContent = (student.wallets.savings || 0).toLocaleString();
  document.getElementById('bar-invest').textContent = (student.wallets.invest || 0).toLocaleString();
  document.getElementById('bar-stocks').textContent = stockVal.toLocaleString();

  // 1. 1인 1역할 배정 탭 렌더링
  if (activeTab === 'roles') {
    document.getElementById('role-student-count').textContent = `${state.students.length}명`;
    document.getElementById('role-kind-count').textContent = `${state.roles.length}종`;
    document.getElementById('role-assigned-count').textContent = `${currentAssignments.length}명`;
    document.getElementById('role-current-url').textContent = getSheetUrl() || '미설정 (상단 [⚙️ 시트 URL 설정]에서 입력)';

    // 학생별 배정 카드 (textContent 적용)
    const assignMap = new Map(currentAssignments.map(a => [a.num, a]));
    const roleGrid = document.getElementById('role-card-grid');
    if (roleGrid) {
      roleGrid.innerHTML = state.students.map(s => {
        const a = assignMap.get(s.num);
        const assignedRole = a ? a.role : '';
        const assignedDesc = a ? a.desc : '';

        const options = state.roles.map(r => `<option value="${r.role}" ${r.role === assignedRole ? 'selected' : ''}>${r.role}</option>`).join('');

        return `
          <div class="role-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="background:#d1fae5; color:#065f46; font-weight:800; padding:2px 7px; border-radius:6px; font-size:0.75rem;">#${s.num}</span>
                  <strong style="font-size:0.95rem;">${s.name}</strong>
                </div>
                ${s.isTeller ? '<span class="teller-tag">은행원</span>' : ''}
              </div>
              <div style="margin-top:10px;">
                <label style="font-size:0.7rem; color:#64748b; font-weight:700;">담당 역할</label>
                <select onchange="changeRoleManual(${s.num}, this.value)">
                  <option value="">-- 역할 선택 --</option>
                  ${options}
                </select>
              </div>
              ${assignedDesc ? `<p style="margin-top:8px; font-size:0.72rem; color:#475569; background:#f8fafc; padding:6px; border-radius:8px; border:1px solid #f1f5f9;">💡 ${assignedDesc}</p>` : ''}
            </div>
            <div style="margin-top:10px; padding-top:6px; border-top:1px solid #f1f5f9; font-size:0.72rem; display:flex; justify-content:space-between;">
              <span style="color:#94a3b8;">배정 상태:</span>
              <strong style="color:${assignedRole ? '#059669' : '#94a3b8'};">${assignedRole ? `배정 완료 (${assignedRole})` : '미배정'}</strong>
            </div>
          </div>
        `;
      }).join('');
    }

    // 시트 배정 결과 히스토리 표
    const historyTbody = document.getElementById('role-history-tbody');
    if (historyTbody) {
      if (state.results.length === 0) {
        historyTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:#94a3b8;">저장된 배정 결과가 없습니다.</td></tr>';
      } else {
        historyTbody.innerHTML = state.results.slice(-15).reverse().map(r => `
          <tr>
            <td style="color:#64748b; font-size:0.75rem;">${r.date || '-'}</td>
            <td style="font-weight:700;">#${r.num}</td>
            <td style="font-weight:800;">${r.name}</td>
            <td><span style="background:#e0e7ff; color:#3730a3; padding:2px 7px; border-radius:6px; font-weight:700; font-size:0.75rem;">${r.role}</span></td>
            <td style="color:#475569;">${r.desc || '-'}</td>
          </tr>
        `).join('');
      }
    }
  }

  // 2. 통장 내역 탭
  if (activeTab === 'passbook') {
    const listEl = document.getElementById('tx-list');
    if (listEl) {
      const myTxs = state.transactions
        .filter(t => t.studentId === student.id)
        .filter(t => {
          if (passbookFilter === 'all') return true;
          if (passbookFilter === 'income') return t.type === 'income' || t.type === 'dividend' || t.type === 'interest';
          if (passbookFilter === 'expense') return t.type === 'expense';
          if (passbookFilter === 'transfer') return t.type === 'transfer';
          if (passbookFilter === 'stock') return t.type === 'stock_buy' || t.type === 'stock_sell';
          return true;
        });

      if (myTxs.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:32px; color:#94a3b8; font-weight:700;">거래 내역이 없습니다.</div>';
      } else {
        listEl.innerHTML = myTxs.map(t => {
          const isIncome = t.type === 'income' || t.type === 'dividend' || t.type === 'interest';
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f1f5f9;">
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:0.7rem; font-weight:800; background:#f1f5f9; padding:2px 6px; border-radius:6px;">${t.category}</span>
                  <span style="font-size:0.72rem; color:#94a3b8;">${new Date(t.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style="font-weight:800; font-size:0.9rem; margin-top:4px;">${t.desc}</div>
                <div style="font-size:0.72rem; color:#64748b;">처리자: ${t.by || '본인'}</div>
              </div>
              <div style="font-size:1.1rem; font-weight:900; color:${isIncome ? '#059669' : '#e11d48'};">
                ${isIncome ? '+' : '-'}${t.amount} 오이
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // 3. 주식 시장 탭
  if (activeTab === 'market') {
    document.getElementById('market-invest-balance').textContent = `${(student.wallets.invest || 0).toLocaleString()} 오이`;
    const stockContainer = document.getElementById('stock-cards-container');
    if (stockContainer) {
      stockContainer.innerHTML = state.stocks.map(st => {
        const hold = student.portfolio[st.id]?.quantity || 0;
        const diff = st.price - st.prevPrice;
        const diffPercent = st.prevPrice ? ((diff / st.prevPrice) * 100).toFixed(1) : '0.0';
        const isUp = diff > 0;
        const isDown = diff < 0;

        return `
          <div class="stock-card">
            <div>
              <div class="stock-top">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.8rem;">${st.icon}</span>
                  <div>
                    <span style="font-size:0.68rem; color:#64748b; font-weight:700;">${st.badge}</span>
                    <h4 class="stock-name">${st.name}</h4>
                  </div>
                </div>
                <span style="font-size:0.75rem; font-weight:800; padding:2px 7px; border-radius:8px; background:${isUp ? '#ffe4e6' : isDown ? '#dbeafe' : '#f1f5f9'}; color:${isUp ? '#e11d48' : isDown ? '#2563eb' : '#64748b'};">
                  ${isUp ? '▲ +' : isDown ? '▼ ' : ''}${diff} (${diffPercent}%)
                </span>
              </div>
              <div class="stock-price ${isUp ? 'price-up' : isDown ? 'price-down' : ''}">${st.price} <span style="font-size:0.9rem; color:#64748b; font-weight:700;">오이</span></div>
              <p style="font-size:0.75rem; color:#475569; background:#f8fafc; padding:8px; border-radius:10px; margin-bottom:8px;">${st.desc}</p>
              <div style="font-size:0.72rem; color:#059669; font-weight:800;">배당률 ${st.dividendRate}% | 위험도: ${st.risk} | 보유: <strong>${hold}주</strong></div>
            </div>
            <div style="display:flex; gap:8px; margin-top:14px;">
              <button class="btn-buy" onclick="openTradeModal('${st.id}', 'BUY')">매수 (사기)</button>
              <button class="btn-sell" ${hold <= 0 ? 'disabled' : ''} onclick="openTradeModal('${st.id}', 'SELL')">매도 (팔기)</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. 주식 뉴스 탭
  if (activeTab === 'news') {
    const newsContainer = document.getElementById('news-list-container');
    if (newsContainer) {
      newsContainer.innerHTML = state.news.map(n => `
        <div class="white-box">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
            <span style="background:#ecfdf5; color:#065f46; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:99px;">${n.badge}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">학급 속보</span>
          </div>
          <h3 style="font-size:1.1rem; font-weight:900; color:#0f172a; margin-bottom:6px;">${n.title}</h3>
          <p style="font-size:0.85rem; color:#334155; line-height:1.5; margin-bottom:12px;">${n.content}</p>
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:10px; border-radius:12px; font-size:0.8rem; color:#92400e; font-weight:700;">
            ${n.edu}
          </div>
        </div>
      `).join('');
    }
  }

  // 5. 내 포트폴리오 탭
  if (activeTab === 'portfolio') {
    let totalInvested = 0;
    let totalVal = 0;
    let expectedDiv = 0;

    const items = Object.entries(student.portfolio || {})
      .filter(([_, h]) => h && h.quantity > 0)
      .map(([cId, h]) => {
        const st = state.stocks.find(s => s.id === cId);
        if (!st) return null;
        const curVal = h.quantity * st.price;
        const invested = h.quantity * (h.avgBuyPrice || st.price);
        const profit = curVal - invested;
        const profitRate = invested > 0 ? ((profit / invested) * 100).toFixed(1) : '0.0';
        const div = Math.max(1, Math.round((curVal * st.dividendRate) / 100));

        totalInvested += invested;
        totalVal += curVal;
        expectedDiv += div;

        return { st, h, curVal, invested, profit, profitRate, div };
      }).filter(Boolean);

    const totalProfit = totalVal - totalInvested;
    const totalRate = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : '0.0';

    document.getElementById('port-val').textContent = `${totalVal.toLocaleString()} 오이`;
    document.getElementById('port-invested').textContent = `${totalInvested.toLocaleString()} 오이`;
    document.getElementById('port-profit').textContent = `${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()} 오이 (${totalProfit >= 0 ? '+' : ''}${totalRate}%)`;
    document.getElementById('port-profit').style.color = totalProfit >= 0 ? '#e11d48' : '#2563eb';
    document.getElementById('port-dividend-btn').textContent = `🎁 정기 배당금 (${expectedDiv} 오이) 받기`;

    const portGrid = document.getElementById('portfolio-grid');
    if (portGrid) {
      if (items.length === 0) {
        portGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:#94a3b8; font-weight:700;">보유 중인 주식이 없습니다. [주식 시장]에서 매수해 보세요!</div>';
      } else {
        portGrid.innerHTML = items.map(it => `
          <div class="role-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.5rem;">${it.st.icon}</span>
                <strong style="font-size:1rem;">${it.st.name}</strong>
              </div>
              <span style="font-weight:900; color:#4338ca; font-size:1.1rem;">${it.h.quantity}주</span>
            </div>
            <div style="margin:10px 0; background:#f8fafc; padding:8px; border-radius:10px; font-size:0.75rem;">
              <div>평단가: <strong>${it.h.avgBuyPrice} 오이</strong> | 현재가: <strong>${it.st.price} 오이</strong></div>
              <div>평가액: <strong>${it.curVal.toLocaleString()} 오이</strong></div>
              <div>손익: <strong style="color:${it.profit >= 0 ? '#e11d48' : '#2563eb'};">${it.profit >= 0 ? '+' : ''}${it.profit} 오이 (${it.profitRate}%)</strong></div>
            </div>
            <button class="btn-sell" onclick="openTradeModal('${it.st.id}', 'SELL')">${it.st.name} 매도하기</button>
          </div>
        `).join('');
      }
    }
  }
}

// 수동 역할 변경
function changeRoleManual(num, roleName) {
  sound.click();
  const targetRole = state.roles.find(r => r.role === roleName) || { role: roleName, desc: '학급 역할' };
  const idx = currentAssignments.findIndex(a => a.num === num);
  if (idx >= 0) {
    currentAssignments[idx].role = targetRole.role;
    currentAssignments[idx].desc = targetRole.desc;
  } else {
    const s = state.students.find(st => st.num === num);
    currentAssignments.push({
      num: num,
      name: s?.name || '',
      role: targetRole.role,
      desc: targetRole.desc
    });
  }
  render();
}

// 배당금 수령
function claimDividends() {
  const student = getCurrentStudent();
  let totalDiv = 0;
  Object.entries(student.portfolio || {}).forEach(([cId, h]) => {
    const st = state.stocks.find(s => s.id === cId);
    if (st && h && h.quantity > 0) {
      totalDiv += Math.max(1, Math.round((h.quantity * st.price * st.dividendRate) / 100));
    }
  });

  if (totalDiv <= 0) {
    alert('수령할 배당금이 없습니다.');
    return;
  }

  student.wallets.cash += totalDiv;
  state.transactions.unshift({
    id: `t-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    type: 'dividend',
    category: '배당금',
    amount: totalDiv,
    target: 'cash',
    desc: '보유 주식 분기 배당금 입금',
    by: '시스템',
    time: Date.now()
  });

  saveState();
  sound.fanfare();
  triggerConfetti();
  alert(`${totalDiv} 오이 배당금이 현금 지갑으로 입금되었습니다!`);
}

// ==============================================================================
// 지갑 이체 모달
// ==============================================================================
function openTransferModal() {
  sound.click();
  const student = getCurrentStudent();
  document.getElementById('transfer-from-cash').textContent = `${student.wallets.cash} 오이`;
  document.getElementById('transfer-from-savings').textContent = `${student.wallets.savings} 오이`;
  document.getElementById('transfer-from-invest').textContent = `${student.wallets.invest} 오이`;
  document.getElementById('transfer-amount-input').value = '10';
  openModal('transfer-modal');
}

function executeTransfer() {
  const student = getCurrentStudent();
  const from = document.querySelector('input[name="transfer-from"]:checked').value;
  const to = document.querySelector('input[name="transfer-to"]:checked').value;
  const amt = parseInt(document.getElementById('transfer-amount-input').value, 10) || 0;

  if (from === to) {
    alert('출금 지갑과 입금 지갑이 같습니다.');
    sound.error();
    return;
  }
  if (amt <= 0) {
    alert('1 오이 이상 입력하세요.');
    sound.error();
    return;
  }
  if (student.wallets[from] < amt) {
    alert('보내는 지갑의 잔액이 부족합니다.');
    sound.error();
    return;
  }

  student.wallets[from] -= amt;
  student.wallets[to] += amt;

  const names = { cash: '현금 지갑', savings: '저금통', invest: '투자 계좌' };
  state.transactions.unshift({
    id: `t-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    type: 'transfer',
    category: '예금이체',
    amount: amt,
    target: to,
    desc: `${names[from]}에서 ${names[to]}으로 이체`,
    by: '학생본인',
    time: Date.now()
  });

  saveState();
  sound.coin();
  closeModal('transfer-modal');
}

// ==============================================================================
// 주식 거래 모달 (매수 / 매도)
// ==============================================================================
let currentTradeStockId = null;
let currentTradeAction = 'BUY';

function openTradeModal(stockId, action) {
  sound.click();
  currentTradeStockId = stockId;
  currentTradeAction = action;
  const st = state.stocks.find(s => s.id === stockId);
  const student = getCurrentStudent();
  const hold = student.portfolio[stockId]?.quantity || 0;

  document.getElementById('trade-modal-title').textContent = `${st.name} ${action === 'BUY' ? '매수하기' : '매도하기'}`;
  document.getElementById('trade-stock-icon').textContent = st.icon;
  document.getElementById('trade-stock-price').textContent = `${st.price} 오이`;
  document.getElementById('trade-invest-bal').textContent = `${student.wallets.invest} 오이`;
  document.getElementById('trade-hold-qty').textContent = `${hold} 주`;
  document.getElementById('trade-qty-input').value = '1';
  updateTradeTotal();
  openModal('trade-modal');
}

function updateTradeTotal() {
  const st = state.stocks.find(s => s.id === currentTradeStockId);
  const qty = parseInt(document.getElementById('trade-qty-input').value, 10) || 1;
  document.getElementById('trade-total-cost').textContent = `${(qty * st.price).toLocaleString()} 오이`;
}

function executeTrade() {
  const st = state.stocks.find(s => s.id === currentTradeStockId);
  const student = getCurrentStudent();
  const qty = parseInt(document.getElementById('trade-qty-input').value, 10) || 1;
  const total = qty * st.price;
  const hold = student.portfolio[st.id]?.quantity || 0;

  if (currentTradeAction === 'BUY') {
    if (student.wallets.invest < total) {
      alert(`투자 계좌 잔액(${student.wallets.invest} 오이)이 부족합니다. [이체하기]로 충전하세요.`);
      sound.error();
      return;
    }
    student.wallets.invest -= total;
    const curHolding = student.portfolio[st.id] || { quantity: 0, avgBuyPrice: st.price, totalInvested: 0 };
    const nextQty = curHolding.quantity + qty;
    const nextInvested = (curHolding.totalInvested || 0) + total;
    student.portfolio[st.id] = {
      quantity: nextQty,
      avgBuyPrice: Math.round(nextInvested / nextQty),
      totalInvested: nextInvested
    };

    state.transactions.unshift({
      id: `t-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      type: 'stock_buy',
      category: '주식매수',
      amount: total,
      target: 'invest',
      desc: `${st.name} ${qty}주 매수 (주당 ${st.price}오이)`,
      by: '본인',
      time: Date.now()
    });

    saveState();
    sound.success();
    triggerConfetti();
  } else {
    if (hold < qty) {
      alert(`보유 수량(${hold}주)보다 많이 매도할 수 없습니다.`);
      sound.error();
      return;
    }
    student.wallets.invest += total;
    student.portfolio[st.id].quantity -= qty;

    state.transactions.unshift({
      id: `t-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      type: 'stock_sell',
      category: '주식매도',
      amount: total,
      target: 'invest',
      desc: `${st.name} ${qty}주 매도 (주당 ${st.price}오이)`,
      by: '본인',
      time: Date.now()
    });

    saveState();
    sound.coin();
  }

  closeModal('trade-modal');
}

// ==============================================================================
// 은행 창구 및 학생 4자리 비밀번호 승인 모달
// ==============================================================================
let pendingBankTx = null;

function openBankModal() {
  sound.click();
  const select = document.getElementById('bank-target-student');
  select.innerHTML = state.students.map(s => `<option value="${s.id}">#${s.num} ${s.name} (현금 ${s.wallets.cash}오이)</option>`).join('');

  const tellers = state.students.filter(s => s.isTeller);
  const tellerSelect = document.getElementById('bank-teller-select');
  tellerSelect.innerHTML = tellers.map(t => `<option value="${t.name}">${t.name} (은행원)</option>`).join('');

  document.getElementById('bank-auth-section').style.display = 'block';
  document.getElementById('bank-form-section').style.display = 'none';
  openModal('bank-modal');
}

function verifyTellerLogin() {
  const pin = document.getElementById('bank-teller-pin-input').value;
  if (pin === state.config.tellerPin) {
    sound.success();
    document.getElementById('bank-auth-section').style.display = 'none';
    document.getElementById('bank-form-section').style.display = 'block';
  } else {
    sound.error();
    alert('은행원 비밀번호가 일치하지 않습니다. (초기값: 0000)');
  }
}

function startStudentBankAuth() {
  const sId = document.getElementById('bank-target-student').value;
  const cat = document.getElementById('bank-category-select').value;
  const desc = document.getElementById('bank-desc-input').value.trim();
  const amt = parseInt(document.getElementById('bank-amount-input').value, 10) || 0;
  const tellerName = document.getElementById('bank-teller-select').value;
  const student = state.students.find(s => s.id === sId);

  if (!desc || amt <= 0) {
    alert('사유와 금액을 올바르게 입력하세요.');
    sound.error();
    return;
  }

  pendingBankTx = { sId, cat, desc, amt, tellerName, studentName: student.name };
  document.getElementById('student-pin-target-name').textContent = student.name;
  document.getElementById('student-pin-amount-info').textContent = `${amt} 오이 (${cat})`;
  studentPinBuffer = '';
  updatePinDots();
  closeModal('bank-modal');
  openModal('student-pin-modal');
}

let studentPinBuffer = '';
function pressStudentKeypad(val) {
  sound.click();
  if (val === 'DEL') {
    studentPinBuffer = studentPinBuffer.slice(0, -1);
  } else if (studentPinBuffer.length < 4) {
    studentPinBuffer += val;
  }
  updatePinDots();

  if (studentPinBuffer.length === 4) {
    const student = state.students.find(s => s.id === pendingBankTx.sId);
    if (studentPinBuffer === student.pin) {
      sound.fanfare();
      triggerConfetti();

      const isInc = pendingBankTx.cat !== '벌금';
      student.wallets.cash = isInc ? student.wallets.cash + pendingBankTx.amt : student.wallets.cash - pendingBankTx.amt;

      state.transactions.unshift({
        id: `t-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        type: isInc ? 'income' : 'expense',
        category: pendingBankTx.cat,
        amount: pendingBankTx.amt,
        target: 'cash',
        desc: pendingBankTx.desc,
        by: `은행원 (${pendingBankTx.tellerName})`,
        time: Date.now()
      });

      saveState();
      closeModal('student-pin-modal');
      alert(`🎉 [${student.name}] 학생의 ${pendingBankTx.cat} ${pendingBankTx.amt} 오이 거래가 정상 승인되었습니다!`);
    } else {
      sound.error();
      alert('비밀번호가 일치하지 않습니다. 다시 입력하세요.');
      studentPinBuffer = '';
      updatePinDots();
    }
  }
}

function updatePinDots() {
  [0, 1, 2, 3].forEach(idx => {
    const dot = document.getElementById(`pin-dot-${idx}`);
    if (dot) dot.style.background = studentPinBuffer.length > idx ? '#059669' : '#e2e8f0';
  });
}

// ==============================================================================
// 선생님 관리자 모달
// ==============================================================================
function openTeacherModal() {
  sound.click();
  document.getElementById('teacher-auth-box').style.display = 'block';
  document.getElementById('teacher-dashboard').style.display = 'none';
  document.getElementById('teacher-pin-input').value = '';
  openModal('teacher-modal');
}

function verifyTeacherLogin() {
  const pin = document.getElementById('teacher-pin-input').value;
  if (pin === state.config.teacherPin) {
    sound.success();
    document.getElementById('teacher-auth-box').style.display = 'none';
    document.getElementById('teacher-dashboard').style.display = 'block';
    renderTeacherStocks();
    renderTeacherTable();
  } else {
    sound.error();
    alert('선생님 관리 비밀번호가 올바르지 않습니다. (초기값: 1234)');
  }
}

// 선생님 주가 직접 조절 렌더링
function renderTeacherStocks() {
  const container = document.getElementById('teacher-stocks-grid');
  if (!container) return;
  container.innerHTML = state.stocks.map(st => {
    const diff = st.price - st.prevPrice;
    const isUp = diff > 0;
    const isDown = diff < 0;
    return `
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:10px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-weight:900; font-size:0.85rem;">${st.icon} ${st.name}</span>
            <span style="font-size:0.68rem; font-weight:800; padding:1px 5px; border-radius:4px; background:${isUp ? '#ffe4e6' : isDown ? '#dbeafe' : '#f1f5f9'}; color:${isUp ? '#e11d48' : isDown ? '#2563eb' : '#64748b'};">
              ${isUp ? '▲ +' : isDown ? '▼ ' : ''}${diff}
            </span>
          </div>
          <div style="font-size:0.68rem; color:#64748b; margin-bottom:6px;">${st.badge}</div>
        </div>

        <div>
          <div style="display:flex; align-items:center; gap:4px; margin:6px 0;">
            <span style="font-size:0.72rem; font-weight:700; color:#475569;">주가:</span>
            <input type="number" id="input-stock-price-${st.id}" min="1" max="200" value="${st.price}" style="width:58px; padding:3px 5px; border-radius:6px; border:1px solid #cbd5e1; font-weight:900; font-size:0.95rem; text-align:center; color:#0f172a;" onchange="teacherSetStockPrice('${st.id}', this.value)" />
            <span style="font-size:0.75rem; font-weight:800;">오이</span>
            <button style="padding:4px 6px; border-radius:6px; background:#059669; color:white; border:none; font-weight:800; font-size:0.72rem; cursor:pointer;" onclick="teacherSetStockPrice('${st.id}', document.getElementById('input-stock-price-${st.id}').value)">적용</button>
          </div>
          <div style="display:flex; gap:3px;">
            <button style="flex:1; padding:3px 0; font-size:0.68rem; border-radius:4px; background:#fee2e2; border:1px solid #fecaca; color:#991b1b; font-weight:800; cursor:pointer;" onclick="teacherStepStockPrice('${st.id}', -5)">-5</button>
            <button style="flex:1; padding:3px 0; font-size:0.68rem; border-radius:4px; background:#fee2e2; border:1px solid #fecaca; color:#991b1b; font-weight:800; cursor:pointer;" onclick="teacherStepStockPrice('${st.id}', -1)">-1</button>
            <button style="flex:1; padding:3px 0; font-size:0.68rem; border-radius:4px; background:#dcfce7; border:1px solid #bbf7d0; color:#166534; font-weight:800; cursor:pointer;" onclick="teacherStepStockPrice('${st.id}', 1)">+1</button>
            <button style="flex:1; padding:3px 0; font-size:0.68rem; border-radius:4px; background:#dcfce7; border:1px solid #bbf7d0; color:#166534; font-weight:800; cursor:pointer;" onclick="teacherStepStockPrice('${st.id}', 5)">+5</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function teacherSetStockPrice(stockId, newPrice) {
  const st = state.stocks.find(s => s.id === stockId);
  if (!st) return;
  const p = parseInt(newPrice, 10);
  if (isNaN(p) || p < 1) {
    alert('주가는 1 오이 이상이어야 합니다.');
    return;
  }
  const oldPrice = st.price;
  st.prevPrice = oldPrice;
  st.price = p;
  saveState();
  sound.fanfare();
  triggerConfetti();
  showToast(`📈 [${st.name}] 주가가 ${oldPrice}오이 ➔ ${p}오이로 변경되었습니다!`, 'success');
  renderTeacherStocks();
  render();
}

function teacherStepStockPrice(stockId, step) {
  const st = state.stocks.find(s => s.id === stockId);
  if (!st) return;
  const nextPrice = Math.max(1, st.price + step);
  teacherSetStockPrice(stockId, nextPrice);
}

// 선생님 학생 자산 직접 편집 및 관리 테이블
function renderTeacherTable() {
  const tbody = document.getElementById('teacher-student-tbody');
  if (!tbody) return;
  tbody.innerHTML = state.students.map(s => {
    const isNeg = (s.wallets.cash || 0) < 0;
    return `
      <tr>
        <td style="font-weight:700;">#${s.num}</td>
        <td style="font-weight:800;">${s.avatar || '🥒'} ${s.name}</td>
        <td style="font-mono; color:#059669; font-weight:700;">${s.pin}</td>
        <td>
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
            <input type="number" value="${s.wallets.cash}" style="width:68px; padding:3px 5px; border-radius:6px; border:1px solid ${isNeg ? '#ef4444' : '#cbd5e1'}; font-weight:800; font-size:0.85rem; color:${isNeg ? '#dc2626' : '#0f172a'}; background:${isNeg ? '#fff1f2' : '#ffffff'};" onchange="teacherUpdateStudentCash('${s.id}', this.value)" title="엔터 또는 입력 시 즉시 변경 (마이너스 가능)" />
            <span style="font-size:0.75rem; font-weight:700; color:${isNeg ? '#dc2626' : '#64748b'};">오이</span>
            <button style="padding:2px 5px; font-size:0.7rem; border-radius:4px; background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; font-weight:800; cursor:pointer;" onclick="teacherAdjustCash('${s.id}', 10, '선생님 칭찬 보너스')" title="10오이 보너스">+10</button>
            <button style="padding:2px 5px; font-size:0.7rem; border-radius:4px; background:#fef2f2; border:1px solid #fecdd3; color:#991b1b; font-weight:800; cursor:pointer;" onclick="teacherAdjustCash('${s.id}', -10, '선생님 규칙 위반 벌금')" title="10오이 차감 (마이너스 가능)">-10</button>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:3px;">
            <input type="number" min="0" value="${s.wallets.savings}" style="width:60px; padding:3px 5px; border-radius:6px; border:1px solid #cbd5e1; font-weight:800; font-size:0.85rem;" onchange="teacherUpdateStudentSavings('${s.id}', this.value)" title="저금통 잔액 직접 변경" />
            <span style="font-size:0.72rem; color:#64748b;">오이</span>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:3px;">
            <input type="number" min="0" value="${s.wallets.invest}" style="width:60px; padding:3px 5px; border-radius:6px; border:1px solid #cbd5e1; font-weight:800; font-size:0.85rem;" onchange="teacherUpdateStudentInvest('${s.id}', this.value)" title="투자 예수금 직접 변경" />
            <span style="font-size:0.72rem; color:#64748b;">오이</span>
          </div>
        </td>
        <td style="text-align:center;">
          <input type="checkbox" ${s.isTeller ? 'checked' : ''} onchange="toggleTellerRole('${s.id}')">
        </td>
        <td>
          <button style="padding:3px 7px; font-size:0.7rem; border-radius:6px; background:#f1f5f9; border:1px solid #cbd5e1; cursor:pointer; font-weight:700;" onclick="resetStudentPin('${s.id}')">비번리셋</button>
        </td>
      </tr>
    `;
  }).join('');
}

function teacherUpdateStudentCash(sId, newAmount) {
  const s = state.students.find(st => st.id === sId);
  if (!s) return;
  const val = parseInt(newAmount, 10);
  if (isNaN(val)) return;
  const oldVal = s.wallets.cash;
  s.wallets.cash = val; // 음수(마이너스)도 완전히 허용!
  const diff = val - oldVal;
  state.transactions.unshift({
    id: `t-${Date.now()}`,
    studentId: s.id,
    studentName: s.name,
    type: diff >= 0 ? 'income' : 'expense',
    category: '선생님조정',
    amount: Math.abs(diff),
    target: 'cash',
    desc: `선생님 자산 직접 변경 (${oldVal}오이 ➔ ${val}오이)`,
    by: '선생님',
    time: Date.now()
  });
  saveState();
  sound.coin();
  showToast(`[${s.name}] 현금 지갑이 ${val} 오이로 변경되었습니다.`, 'success');
  renderTeacherTable();
  render();
}

function teacherUpdateStudentSavings(sId, newAmount) {
  const s = state.students.find(st => st.id === sId);
  if (!s) return;
  const val = parseInt(newAmount, 10);
  if (isNaN(val)) return;
  s.wallets.savings = Math.max(0, val);
  saveState();
  showToast(`[${s.name}] 저금통 잔액이 ${s.wallets.savings} 오이로 변경되었습니다.`, 'info');
  renderTeacherTable();
  render();
}

function teacherUpdateStudentInvest(sId, newAmount) {
  const s = state.students.find(st => st.id === sId);
  if (!s) return;
  const val = parseInt(newAmount, 10);
  if (isNaN(val)) return;
  s.wallets.invest = Math.max(0, val);
  saveState();
  showToast(`[${s.name}] 투자 예수금이 ${s.wallets.invest} 오이로 변경되었습니다.`, 'info');
  renderTeacherTable();
  render();
}

function toggleTellerRole(sId) {
  sound.click();
  const s = state.students.find(st => st.id === sId);
  if (s) {
    s.isTeller = !s.isTeller;
    saveState();
    renderTeacherTable();
  }
}

function resetStudentPin(sId) {
  const s = state.students.find(st => st.id === sId);
  if (s) {
    s.pin = '1234';
    saveState();
    sound.click();
    alert(`${s.name} 학생의 비밀번호가 1234로 초기화되었습니다.`);
    renderTeacherTable();
  }
}

function addStudentTeacher() {
  const name = document.getElementById('new-student-name').value.trim();
  const cash = parseInt(document.getElementById('new-student-cash').value, 10) || 50;
  if (!name) return;

  state.students.push({
    id: `s-${Date.now()}`,
    num: state.students.length + 1,
    name: name,
    avatar: '🥒',
    pin: '1234',
    wallets: { cash: cash, savings: 0, invest: 0 },
    portfolio: {},
    isTeller: false
  });

  document.getElementById('new-student-name').value = '';
  saveState();
  sound.success();
  renderTeacherTable();
}

function distributeSavingsInterest() {
  sound.fanfare();
  triggerConfetti();
  const rate = state.config.interestRate;
  state.students.forEach(s => {
    if (s.wallets.savings > 0) {
      const interest = Math.max(1, Math.round((s.wallets.savings * rate) / 100));
      s.wallets.savings += interest;
      state.transactions.unshift({
        id: `t-${Date.now()}-${s.id}`,
        studentId: s.id,
        studentName: s.name,
        type: 'interest',
        category: '이자수익',
        amount: interest,
        target: 'savings',
        desc: `저금통 예금 정기 이자 (${rate.toFixed(1)}%) 입금`,
        by: '선생님',
        time: Date.now()
      });
    }
  });

  saveState();
  alert(`전체 학생 저금통에 예금 이자(${rate}%)가 지급되었습니다!`);
}

function applyPresetNews(idx) {
  sound.fanfare();
  triggerConfetti();
  const n = PRESET_NEWS[idx];
  state.stocks.forEach(st => {
    const delta = n.effects[st.id] || 0;
    st.prevPrice = st.price;
    st.price = Math.max(st.minPrice, Math.min(st.maxPrice, st.price + delta));
  });
  state.news.unshift(Object.assign({}, n, { id: `n-${Date.now()}` }));
  saveState();
  alert(`[${n.title}] 뉴스가 발행되고 4대 종목 주가에 즉시 반영되었습니다!`);
}

function updateInterestRate(newRate) {
  const val = parseFloat(newRate);
  if (!isNaN(val) && val >= 0) {
    state.config.interestRate = val;
    saveState();
    showToast(`저금통 예금 이자율이 ${val.toFixed(1)}%로 설정되었습니다.`, 'info');
  }
}

function teacherAdjustCash(sId, delta, reason) {
  const s = state.students.find(st => st.id === sId);
  if (!s) return;
  s.wallets.cash = s.wallets.cash + delta; // 마이너스 허용
  state.transactions.unshift({
    id: `t-${Date.now()}`,
    studentId: s.id,
    studentName: s.name,
    type: delta >= 0 ? 'income' : 'expense',
    category: delta >= 0 ? '보너스' : '벌금',
    amount: Math.abs(delta),
    target: 'cash',
    desc: reason || (delta >= 0 ? '선생님 격려 보너스 지급' : '선생님 지도 벌금 차감'),
    by: '선생님',
    time: Date.now()
  });
  saveState();
  sound.coin();
  renderTeacherTable();
  render();
}

function setPassbookFilter(f) {
  sound.click();
  passbookFilter = f;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`filter-btn-${f}`);
  if (btn) btn.classList.add('active');
  render();
}

function toggleSound() {
  sound.muted = !sound.muted;
  const btn = document.getElementById('btn-sound-toggle');
  if (btn) btn.innerHTML = sound.muted ? '🔇 소리 끔' : '🔊 소리 켬';
  showToast(sound.muted ? '효과음이 비활성화되었습니다.' : '효과음이 활성화되었습니다.', 'info');
}

function openStudentSelectModal() {
  sound.click();
  const grid = document.getElementById('student-select-grid');
  if (grid) {
    grid.innerHTML = state.students.map(s => `
      <div class="role-card" style="cursor:pointer; text-align:center; padding:14px; border:${s.id === currentStudentId ? '2px solid #059669; background:#ecfdf5;' : '1px solid #e2e8f0;'}" onclick="selectStudent('${s.id}')">
        <div style="font-size:2.2rem; margin-bottom:4px;">${s.avatar || '🥒'}</div>
        <div style="font-weight:900; font-size:1rem; color:#0f172a;">${s.name} ${s.isTeller ? '<span class="teller-tag">은행원</span>' : ''}</div>
        <div style="font-size:0.78rem; color:#64748b; margin-top:4px;">출석번호 #${s.num} · 현금 ${s.wallets.cash} 오이</div>
        <div style="font-size:0.72rem; color:#059669; font-weight:800; margin-top:4px; background:rgba(5,150,105,0.1); padding:2px 8px; border-radius:6px; display:inline-block;">개인PIN: ${s.pin}</div>
      </div>
    `).join('');
  }
  openModal('student-select-modal');
}

function selectStudent(sId) {
  sound.click();
  currentStudentId = sId;
  closeModal('student-select-modal');
  render();
  const s = getCurrentStudent();
  showToast(`🥒 [${s.name}] 학생 계정으로 전환되었습니다.`, 'success');
}

function openSheetUrlModal() {
  sound.click();
  const inp = document.getElementById('sheet-url-input');
  if (inp) inp.value = getSheetUrl();
  openModal('sheet-url-modal');
}

function saveSheetUrlModal() {
  sound.success();
  const inp = document.getElementById('sheet-url-input');
  const val = inp ? inp.value.trim() : '';
  if (val && !val.startsWith('http')) {
    alert('올바른 웹 앱 URL (https://script.google.com/macros/s/...)을 입력해 주세요.');
    return;
  }
  localStorage.setItem(SHEET_URL_KEY, val);
  closeModal('sheet-url-modal');
  showToast(val ? '✅ 구글 시트 URL이 성공적으로 저장되었습니다.' : '시트 URL이 초기화되었습니다.', 'success');
  render();
}

function setTransferAmount(amt) {
  sound.click();
  const student = getCurrentStudent();
  const from = document.querySelector('input[name="transfer-from"]:checked')?.value || 'cash';
  const inp = document.getElementById('transfer-amount-input');
  if (!inp) return;
  if (amt === 'ALL') {
    inp.value = student.wallets[from] || 0;
  } else {
    inp.value = amt;
  }
}

function setTradeQty(q) {
  sound.click();
  const inp = document.getElementById('trade-qty-input');
  if (!inp) return;
  inp.value = q;
  updateTradeTotal();
}

const APPS_SCRIPT_CODE = `/**
 * [오이 머니 플래닛] 초등학교 학급 경제 스톡 & 뱅킹 플랫폼
 * Google Apps Script 스프레드시트 연동 백엔드 코드 (code.gs)
 * 
 * [배포 안내]
 * 1. 새 스프레드시트에 [확장 프로그램] -> [Apps Script] 진입
 * 2. 기존 코드를 지우고 본 코드 붙여넣기 후 저장 (Ctrl+S)
 * 3. [배포] -> [새 배포] -> [웹 앱] 선택
 * 4. 액세스 권한: "모든 사용자(Anyone)" 로 배포 후 웹 앱 URL 복사
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    var studentSheet = getOrCreateSheet(ss, '학생명단');
    var studentData = studentSheet.getDataRange().getValues();
    var students = [];

    if (studentData.length <= 1) {
      var defaultStudents = [[1, '김민준'], [2, '이서연'], [3, '박도윤'], [4, '정지우'], [5, '최예준'], [6, '한수아']];
      studentSheet.clear();
      studentSheet.appendRow(['번호', '이름']);
      styleHeaderRow(studentSheet, '#2E7D32');
      defaultStudents.forEach(function(s) { studentSheet.appendRow(s); });
      studentData = studentSheet.getDataRange().getValues();
    }

    for (var i = 1; i < studentData.length; i++) {
      var num = parseInt(studentData[i][0], 10) || i;
      var name = String(studentData[i][1] || '').trim();
      if (name) students.push({ num: num, name: name });
    }

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
      if (rName) roles.push({ role: rName, desc: rDesc });
    }

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
          results.push({ date: dateStr, num: sNum, name: sName, role: sRole, desc: sDesc });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      students: students,
      roles: roles,
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '시트 처리 오류: ' + err.toString()
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

    if (action === 'saveResults' && Array.isArray(payload.assignments)) {
      var resultsSheet = getOrCreateSheet(ss, '배정결과');
      if (resultsSheet.getLastRow() === 0) {
        resultsSheet.appendRow(['배정일시', '번호', '학생이름', '배정역할', '역할설명']);
        styleHeaderRow(resultsSheet, '#D84315');
      }

      var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
      payload.assignments.forEach(function(item) {
        if (item && item.name) {
          resultsSheet.appendRow([nowStr, item.num || 0, String(item.name || ''), String(item.role || ''), String(item.desc || '')]);
        }
      });
      resultsSheet.autoResizeColumns(1, 5);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: '배정 결과 ' + payload.assignments.length + '건이 구글 스프레드시트에 성공적으로 저장되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '알 수 없는 요청입니다.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function styleHeaderRow(sheet, hexColor) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  header.setBackground(hexColor);
  header.setFontColor('#FFFFFF');
  header.setFontWeight('bold');
  header.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}`;

function openCodeGuideModal() {
  sound.click();
  const codeEl = document.getElementById('code-gs-display');
  if (codeEl) codeEl.textContent = APPS_SCRIPT_CODE;
  openModal('code-guide-modal');
}

function copyAppsScriptCode() {
  sound.click();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
      sound.fanfare();
      triggerConfetti();
      alert('📋 code.gs 코드가 클립보드에 복사되었습니다!\n구글 스프레드시트 [확장 프로그램] -> [Apps Script]에 붙여넣으세요.');
    }).catch(() => fallbackCopy());
  } else {
    fallbackCopy();
  }
}

function fallbackCopy() {
  const ta = document.createElement('textarea');
  ta.value = APPS_SCRIPT_CODE;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  sound.fanfare();
  triggerConfetti();
  alert('📋 code.gs 코드가 클립보드에 복사되었습니다!');
}

// ==============================================================================
// 모달 공통 제어
// ==============================================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

function closeModal(id) {
  sound.click();
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

// 전역 window 바인딩 (인라인 HTML 이벤트 완벽 지원)
window.switchTab = switchTab;
window.fetchFromGoogleSheet = fetchFromGoogleSheet;
window.saveAssignmentsToGoogleSheet = saveAssignmentsToGoogleSheet;
window.randomAssignRoles = randomAssignRoles;
window.startEditRoles = startEditRoles;
window.saveEditRoles = saveEditRoles;
window.changeRoleManual = changeRoleManual;
window.claimDividends = claimDividends;
window.openTransferModal = openTransferModal;
window.executeTransfer = executeTransfer;
window.setTransferAmount = setTransferAmount;
window.openTradeModal = openTradeModal;
window.updateTradeTotal = updateTradeTotal;
window.executeTrade = executeTrade;
window.setTradeQty = setTradeQty;
window.openBankModal = openBankModal;
window.verifyTellerLogin = verifyTellerLogin;
window.startStudentBankAuth = startStudentBankAuth;
window.pressStudentKeypad = pressStudentKeypad;
window.openTeacherModal = openTeacherModal;
window.verifyTeacherLogin = verifyTeacherLogin;
window.renderTeacherTable = renderTeacherTable;
window.toggleTellerRole = toggleTellerRole;
window.resetStudentPin = resetStudentPin;
window.addStudentTeacher = addStudentTeacher;
window.distributeSavingsInterest = distributeSavingsInterest;
window.applyPresetNews = applyPresetNews;
window.openModal = openModal;
window.closeModal = closeModal;
window.setPassbookFilter = setPassbookFilter;
window.toggleSound = toggleSound;
window.openStudentSelectModal = openStudentSelectModal;
window.selectStudent = selectStudent;
window.openSheetUrlModal = openSheetUrlModal;
window.saveSheetUrlModal = saveSheetUrlModal;
window.openCodeGuideModal = openCodeGuideModal;
window.copyAppsScriptCode = copyAppsScriptCode;
window.teacherAdjustCash = teacherAdjustCash;
window.updateInterestRate = updateInterestRate;
window.renderTeacherStocks = renderTeacherStocks;
window.teacherSetStockPrice = teacherSetStockPrice;
window.teacherStepStockPrice = teacherStepStockPrice;
window.teacherUpdateStudentCash = teacherUpdateStudentCash;
window.teacherUpdateStudentSavings = teacherUpdateStudentSavings;
window.teacherUpdateStudentInvest = teacherUpdateStudentInvest;

// 윈도우 로드 시 자동 실행
window.onload = function() {
  render();
  const savedUrl = getSheetUrl();
  if (savedUrl && savedUrl.startsWith('http')) {
    fetchFromGoogleSheet(true); // 자동 백그라운드 동기화
  }
};

