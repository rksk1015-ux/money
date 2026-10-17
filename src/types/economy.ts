export type WalletType = 'cash' | 'savings' | 'invest';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  pin: string; // 4자리 숫자
  wallets: {
    cash: number;    // 👛 현금 지갑
    savings: number; // 🐷 저금통 (예금, 이자 발생)
    invest: number;  // 📈 투자 계좌 (주식 매매 대기 예수금)
  };
  portfolio: Record<string, {
    quantity: number;
    avgBuyPrice: number;
    totalInvested: number;
  }>;
  isTeller?: boolean; // 지정 은행원 여부
  studentNumber?: number;
}

export interface StockCompany {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  themeBadge: string;
  description: string;
  price: number;       // 현재가 (5~30 오이)
  prevPrice: number;   // 전일가/변동 전 가격
  minPrice: number;    // 하한가 (최저 4 오이)
  maxPrice: number;    // 상한가 (최고 40 오이)
  dividendRate: number;// 기본 배당률 (%)
  riskLevel: '보통' | '약간 높음' | '낮음' | '매우 높음';
  features: string;
  history: Array<{ price: number; timestamp: number }>;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'stock_buy'
  | 'stock_sell'
  | 'dividend'
  | 'interest';

export interface TransactionRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: TransactionType;
  category: '월급' | '보너스' | '벌금' | '예금이체' | '주식매수' | '주식매도' | '배당금' | '이자수익' | '기타';
  amount: number;
  targetWallet: WalletType;
  sourceWallet?: WalletType;
  description: string;
  processedBy: '은행원' | '선생님' | '학생본인' | '시스템';
  tellerName?: string;
  timestamp: number;
}

export interface StockNews {
  id: string;
  setNumber?: number;
  title: string;
  content: string;
  educationPoint: string;
  effects: Record<string, number>; // companyId -> 가격 변동 (+/- 오이)
  badge: '산업혁신' | '금리·배당' | '바이오임상' | '학급속보' | '선생님뉴스';
  appliedAt?: number;
}

export interface StudentRole {
  role: string;
  desc: string;
}

export interface StudentSheetItem {
  num: number;
  name: string;
}

export interface AssignmentItem {
  num: number;
  name: string;
  role: string;
  desc: string;
}

export interface AssignmentResult {
  date: string;
  num: number;
  name: string;
  role: string;
  desc: string;
}

export interface EconomyConfig {
  teacherPin: string;
  tellerPin: string;
  savingsInterestRate: number; // 기본 3.0%
  autoStockFluctuation: boolean;
  googleAppsScriptUrl: string;
  lastInterestPaidAt?: number;
  lastDividendPaidAt?: number;
}

export interface AppState {
  students: Student[];
  stocks: StockCompany[];
  news: StockNews[];
  transactions: TransactionRecord[];
  config: EconomyConfig;
  roles?: StudentRole[];
  assignmentResults?: AssignmentResult[];
}

export const INITIAL_ROLES: StudentRole[] = [
  { role: '은행원', desc: '학급 은행 창구 입출금 및 통장 거래 내역 관리' },
  { role: '칠판당번', desc: '수업 후 칠판 닦기 및 분필·지우개 정리' },
  { role: '급식도우미', desc: '급식 배식 순서 안내 및 식사 예절 지도' },
  { role: '환경미화', desc: '교실 분리수거함 정리 및 환기 담당' },
  { role: '학습도우미', desc: '수업 준비물 점검 및 과제 제출함 관리' },
  { role: '에너지지킴이', desc: '쉬는 시간 전등 끄기 및 냉난방기 점검' },
];

// 4개 가상 기업 초기 데이터 (사양서 명시)
export const INITIAL_STOCKS: StockCompany[] = [
  {
    id: 'semiconductor',
    name: '오이반도체',
    code: '005930-OI',
    icon: '⚡',
    color: '#3b82f6', // blue
    themeBadge: '대형 기술주 · AI 장비',
    description: '학급 로봇/AI 급식 및 교실 장비를 만드는 대한민국 대표 대형 기술주',
    price: 20,
    prevPrice: 20,
    minPrice: 6,
    maxPrice: 38,
    dividendRate: 1.5,
    riskLevel: '보통',
    features: '변동성 보통, 안정적 성장형 기술주',
    history: [
      { price: 18, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { price: 19, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { price: 20, timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      { price: 20, timestamp: Date.now() },
    ],
  },
  {
    id: 'hynix',
    name: 'sk오이닉스',
    code: '000660-OI',
    icon: '💾',
    color: '#ea580c', // orange
    themeBadge: '반도체 부품 · 메모리',
    description: '스마트 기기와 인공지능 메모리 반도체 부품 전문 제조사',
    price: 15,
    prevPrice: 15,
    minPrice: 5,
    maxPrice: 35,
    dividendRate: 2.0,
    riskLevel: '약간 높음',
    features: '변동성 약간 높음, 가파른 주가 상승 기대주',
    history: [
      { price: 14, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { price: 16, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { price: 15, timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      { price: 15, timestamp: Date.now() },
    ],
  },
  {
    id: 'hyundai',
    name: '현대오이차',
    code: '005380-OI',
    icon: '🚗',
    color: '#059669', // emerald
    themeBadge: '친환경 모빌리티 · 청소로봇',
    description: '학급 청소 및 자율주행 이동 로봇을 제작하는 친환경 미래 자동차주',
    price: 10,
    prevPrice: 10,
    minPrice: 5,
    maxPrice: 28,
    dividendRate: 3.5,
    riskLevel: '낮음',
    features: '변동성 낮음, 안정적 고배당 방어주',
    history: [
      { price: 9, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { price: 10, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { price: 10, timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      { price: 10, timestamp: Date.now() },
    ],
  },
  {
    id: 'pharma',
    name: '오이약품',
    code: '207940-OI',
    icon: '💊',
    color: '#dc2626', // red
    themeBadge: '바이오 벤처 · 피로회복제',
    description: '신약 개발 및 학생 맞춤형 건강 보조제/피로회복 젤리를 연구하는 바이오주',
    price: 8,
    prevPrice: 8,
    minPrice: 4,
    maxPrice: 32,
    dividendRate: 0.5,
    riskLevel: '매우 높음',
    features: '변동성 매우 높음, 성공 시 대박 실패 시 위험(High Risk, High Return)',
    history: [
      { price: 7, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { price: 9, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { price: 8, timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      { price: 8, timestamp: Date.now() },
    ],
  },
];

// 요구사항 5번 명시: 주간 주식 뉴스 3세트
export const PRESET_NEWS: StockNews[] = [
  {
    id: 'news-preset-1',
    setNumber: 1,
    title: '📌 1세트: 오이반도체 AI 급식 로봇 칩 성공! sk오이닉스 정전 생산차질',
    content: '오이반도체가 최첨단 AI 급식 배식 로봇 칩 개발에 전격 성공했습니다! 반면 경쟁사인 sk오이닉스는 핵심 생산 공장의 갑작스러운 정전으로 부품 생산에 차질을 빚고 있습니다.',
    educationPoint: '💡 교육 포인트: 신기술 개발 성공 같은 호재는 기업 가치를 높여 주가가 상승하고, 공장 사고 같은 악재는 생산을 방해해 주가가 하락한다는 원리를 이해해 보아요.',
    effects: {
      semiconductor: 5, // 20 -> 25 (+25%)
      hynix: -3,        // 15 -> 12 (-20%)
      hyundai: 0,
      pharma: 0,
    },
    badge: '산업혁신',
  },
  {
    id: 'news-preset-2',
    setNumber: 2,
    title: '📌 2세트: 저금통 금리 인상! 현대오이차 친환경 셔틀 계약으로 고배당 기대',
    content: '학급 저금통 예금 금리가 인상되었습니다! 안전자산 선호 심리가 높아진 가운데, 현대오이차가 학교 친환경 셔틀버스 대량 납품 계약을 체결하여 배당금 확대가 기대됩니다.',
    educationPoint: '💡 교육 포인트: 금리가 오르면 안정적인 배당을 주는 기업(현대오이차)으로 돈이 몰리고, 위험성이 높은 바이오주(오이약품)는 투자 심리가 위축되어 약세를 보입니다.',
    effects: {
      semiconductor: 0,
      hynix: 0,
      hyundai: 3,  // 10 -> 13 (+30%)
      pharma: -1,  // 8 -> 7 (-12.5%)
    },
    badge: '금리·배당',
  },
  {
    id: 'news-preset-3',
    setNumber: 3,
    title: '📌 3세트: 오이약품 피로회복 젤리 임상 3상 대성공! 급식실 유통 계약 체결',
    content: '오이약품이 극비리에 개발하던 학생 피로회복 비타민 젤리가 임상 3상 시험을 완벽 통과했습니다! 전교 급식실 정기 유통 계약까지 체결되며 기대감이 폭발하고 있습니다.',
    educationPoint: '💡 교육 포인트: 바이오주는 평소 실적이 없어도 신약 성공 소식 한 번에 주가가 2배로 폭등할 수 있습니다(High Risk, High Return). 시장 자금이 쏠리며 타 종목에서 자금이 빠져나가기도 합니다.',
    effects: {
      pharma: 7,         // 7 -> 14 (+100% 떡상)
      semiconductor: -2,  // 25 -> 23 (-8%) 자금 이동
      hynix: 0,
      hyundai: 0,
    },
    badge: '바이오임상',
  },
];

// 초기 학생 목록 (초등학교 1개 반 6명 샘플, 3명 은행원 지정 가능)
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: '김민준',
    studentNumber: 1,
    avatar: '🥒',
    pin: '1234',
    wallets: {
      cash: 65,
      savings: 80,
      invest: 45,
    },
    portfolio: {
      semiconductor: { quantity: 2, avgBuyPrice: 20, totalInvested: 40 },
    },
    isTeller: true, // 은행원 1
  },
  {
    id: 'student-2',
    name: '이서연',
    studentNumber: 2,
    avatar: '⭐',
    pin: '2345',
    wallets: {
      cash: 50,
      savings: 120,
      invest: 30,
    },
    portfolio: {
      hyundai: { quantity: 3, avgBuyPrice: 10, totalInvested: 30 },
    },
    isTeller: true, // 은행원 2
  },
  {
    id: 'student-3',
    name: '박도윤',
    studentNumber: 3,
    avatar: '🚀',
    pin: '3456',
    wallets: {
      cash: 40,
      savings: 60,
      invest: 70,
    },
    portfolio: {
      hynix: { quantity: 2, avgBuyPrice: 15, totalInvested: 30 },
      pharma: { quantity: 3, avgBuyPrice: 8, totalInvested: 24 },
    },
    isTeller: true, // 은행원 3
  },
  {
    id: 'student-4',
    name: '정지우',
    studentNumber: 4,
    avatar: '🐼',
    pin: '4567',
    wallets: {
      cash: 70,
      savings: 50,
      invest: 20,
    },
    portfolio: {},
    isTeller: false,
  },
  {
    id: 'student-5',
    name: '최예준',
    studentNumber: 5,
    avatar: '🦁',
    pin: '5678',
    wallets: {
      cash: 35,
      savings: 90,
      invest: 40,
    },
    portfolio: {
      semiconductor: { quantity: 1, avgBuyPrice: 20, totalInvested: 20 },
      hyundai: { quantity: 2, avgBuyPrice: 10, totalInvested: 20 },
    },
    isTeller: false,
  },
  {
    id: 'student-6',
    name: '한수아',
    studentNumber: 6,
    avatar: '🐣',
    pin: '6789',
    wallets: {
      cash: 55,
      savings: 75,
      invest: 25,
    },
    portfolio: {
      pharma: { quantity: 2, avgBuyPrice: 8, totalInvested: 16 },
    },
    isTeller: false,
  },
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-1',
    studentId: 'student-1',
    studentName: '김민준',
    type: 'income',
    category: '월급',
    amount: 50,
    targetWallet: 'cash',
    description: '1학기 2주차 학급 회장 기본 월급 지급',
    processedBy: '은행원',
    tellerName: '이서연',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'tx-2',
    studentId: 'student-1',
    studentName: '김민준',
    type: 'transfer',
    category: '예금이체',
    amount: 30,
    sourceWallet: 'cash',
    targetWallet: 'savings',
    description: '현금 지갑에서 저금통(예금)으로 저축',
    processedBy: '학생본인',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'tx-3',
    studentId: 'student-2',
    studentName: '이서연',
    type: 'income',
    category: '보너스',
    amount: 20,
    targetWallet: 'cash',
    description: '급식실 바른 줄서기 도우미 활동 보너스',
    processedBy: '선생님',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
  },
];

export const DEFAULT_CONFIG: EconomyConfig = {
  teacherPin: '1234',
  tellerPin: '0000',
  savingsInterestRate: 3.0, // 연 3.0%
  autoStockFluctuation: false,
  googleAppsScriptUrl: '',
};
