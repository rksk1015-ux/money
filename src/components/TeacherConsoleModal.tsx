import React, { useState } from 'react';
import {
  Student,
  StockCompany,
  StockNews,
  EconomyConfig,
  PRESET_NEWS,
} from '../types/economy';
import { soundEffects } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  X,
  Users,
  Percent,
  TrendingUp,
  Building2,
  Database,
  UserPlus,
  Trash2,
  KeyRound,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sheet,
  Download,
  Upload,
  RefreshCw,
  Gift,
  Coins,
  Send,
  HelpCircle,
} from 'lucide-react';

interface TeacherConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  stocks: StockCompany[];
  news: StockNews[];
  config: EconomyConfig;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateStocks: (stocks: StockCompany[]) => void;
  onUpdateConfig: (config: EconomyConfig) => void;
  onPublishNews: (newsItem: StockNews) => void;
  onDistributeInterest: (interestRate: number) => void;
  onDistributeBonus: (
    targetStudentId: 'ALL' | string,
    amount: number,
    description: string
  ) => void;
  onOpenGoogleSheetsGuide: () => void;
  onSyncGoogleSheets: (action: 'push' | 'pull') => Promise<{ success: boolean; message: string }>;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => void;
  onResetDefaults: () => void;
}

export const TeacherConsoleModal: React.FC<TeacherConsoleModalProps> = ({
  isOpen,
  onClose,
  students,
  stocks,
  news,
  config,
  onUpdateStudents,
  onUpdateStocks,
  onUpdateConfig,
  onPublishNews,
  onDistributeInterest,
  onDistributeBonus,
  onOpenGoogleSheetsGuide,
  onSyncGoogleSheets,
  onExportJson,
  onImportJson,
  onResetDefaults,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'students' | 'finance' | 'stocks' | 'tellers' | 'backup'>('students');

  // Student creation form
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentNumber, setNewStudentNumber] = useState<string>(String(students.length + 1));
  const [newStudentCash, setNewStudentCash] = useState<string>('50');

  // Bonus form
  const [bonusTarget, setBonusTarget] = useState<'ALL' | string>('ALL');
  const [bonusAmount, setBonusAmount] = useState<string>('20');
  const [bonusReason, setBonusReason] = useState<string>('학급 경제 활성화 지원 보너스');

  // Custom news authoring
  const [newsTitle, setNewsTitle] = useState<string>('');
  const [newsContent, setNewsContent] = useState<string>('');
  const [newsEducation, setNewsEducation] = useState<string>('');
  const [newsStockEffects, setNewsStockEffects] = useState<Record<string, number>>({
    semiconductor: 0,
    hynix: 0,
    hyundai: 0,
    pharma: 0,
  });

  // Google Sheets sync state
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [gasUrlInput, setGasUrlInput] = useState<string>(config.googleAppsScriptUrl || '');

  // Password change state
  const [isChangingTeacherPin, setIsChangingTeacherPin] = useState<boolean>(false);
  const [newTeacherPin, setNewTeacherPin] = useState<string>('');

  if (!isOpen) return null;

  // Teacher password validation
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === config.teacherPin) {
      soundEffects.playSuccess();
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      soundEffects.playError();
      setAuthError('선생님 관리 비밀번호가 올바르지 않습니다. (초기값: 1234)');
    }
  };

  // Add new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newId = `student-${Date.now()}`;
    const cashVal = parseInt(newStudentCash, 10) || 0;
    const numVal = parseInt(newStudentNumber, 10) || students.length + 1;

    const avatars = ['🥒', '⭐', '🚀', '🐼', '🦁', '🐥', '🦊', '🐱', '🐶', '🦄'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newStud: Student = {
      id: newId,
      name: newStudentName.trim(),
      studentNumber: numVal,
      avatar: randomAvatar,
      pin: '1234', // 기본 비밀번호 1234
      wallets: {
        cash: cashVal,
        savings: 0,
        invest: 0,
      },
      portfolio: {},
      isTeller: false,
    };

    onUpdateStudents([...students, newStud]);
    soundEffects.playSuccess();
    setNewStudentName('');
    setNewStudentNumber(String(students.length + 2));
    setNewStudentCash('50');
  };

  // Delete student
  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`정말 ${name} 학생을 명단에서 삭제하시겠습니까?`)) {
      onUpdateStudents(students.filter((s) => s.id !== id));
      soundEffects.playClick();
    }
  };

  // Reset student PIN to 1234
  const handleResetStudentPin = (id: string, name: string) => {
    const updated = students.map((s) => (s.id === id ? { ...s, pin: '1234' } : s));
    onUpdateStudents(updated);
    soundEffects.playClick();
    alert(`${name} 학생의 비밀번호가 [1234]로 초기화되었습니다.`);
  };

  // Toggle bank teller role (max 3)
  const handleToggleTeller = (id: string) => {
    soundEffects.playClick();
    const currentTellersCount = students.filter((s) => s.isTeller).length;
    const target = students.find((s) => s.id === id);
    if (!target) return;

    if (!target.isTeller && currentTellersCount >= 3) {
      alert('은행원은 최대 3명까지만 지정할 수 있습니다.');
      return;
    }

    const updated = students.map((s) =>
      s.id === id ? { ...s, isTeller: !s.isTeller } : s
    );
    onUpdateStudents(updated);
  };

  // Adjust stock price manually
  const handleUpdateStockPrice = (compId: string, newPrice: number) => {
    soundEffects.playClick();
    const bounded = Math.max(4, Math.min(40, newPrice));
    const updated = stocks.map((s) => {
      if (s.id === compId) {
        return {
          ...s,
          prevPrice: s.price,
          price: bounded,
          history: [...s.history, { price: bounded, timestamp: Date.now() }],
        };
      }
      return s;
    });
    onUpdateStocks(updated);
  };

  // Trigger preset scenario
  const handleTriggerPresetNews = (presetItem: StockNews) => {
    soundEffects.playSuccess();
    try {
      confetti({ particleCount: 35, spread: 50 });
    } catch {
      // ignore
    }

    // Update stock prices according to preset effects
    const updatedStocks = stocks.map((s) => {
      const delta = presetItem.effects[s.id] || 0;
      const nextPrice = Math.max(4, Math.min(40, s.price + delta));
      return {
        ...s,
        prevPrice: s.price,
        price: nextPrice,
        history: [...s.history, { price: nextPrice, timestamp: Date.now() }],
      };
    });

    onUpdateStocks(updatedStocks);
    onPublishNews({
      ...presetItem,
      id: `news-${Date.now()}`,
      appliedAt: Date.now(),
    });

    alert(`[${presetItem.title}] 뉴스가 발행되고 4대 종목 주가에 즉시 반영되었습니다!`);
  };

  // Publish custom news
  const handlePublishCustomNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      alert('뉴스 제목과 내용을 입력해주세요.');
      return;
    }

    const customNews: StockNews = {
      id: `news-${Date.now()}`,
      title: newsTitle.trim(),
      content: newsContent.trim(),
      educationPoint: newsEducation.trim() || '💡 시장의 호재와 악재가 주가에 어떻게 영향을 주는지 살펴보세요.',
      effects: newsStockEffects,
      badge: '선생님뉴스',
      appliedAt: Date.now(),
    };

    // Apply stock delta
    const updatedStocks = stocks.map((s) => {
      const delta = newsStockEffects[s.id] || 0;
      const nextPrice = Math.max(4, Math.min(40, s.price + delta));
      return {
        ...s,
        prevPrice: s.price,
        price: nextPrice,
        history: [...s.history, { price: nextPrice, timestamp: Date.now() }],
      };
    });

    onUpdateStocks(updatedStocks);
    onPublishNews(customNews);

    soundEffects.playSuccess();
    try {
      confetti({ particleCount: 40, spread: 60 });
    } catch {
      // ignore
    }

    setNewsTitle('');
    setNewsContent('');
    setNewsEducation('');
    setNewsStockEffects({ semiconductor: 0, hynix: 0, hyundai: 0, pharma: 0 });
    alert('선생님 뉴스가 성공적으로 발행되었습니다!');
  };

  // Google Sheets sync actions
  const handleSyncPush = async () => {
    soundEffects.playClick();
    setIsSyncing(true);
    setSyncStatusMsg('구글 스프레드시트로 전송 중...');
    const result = await onSyncGoogleSheets('push');
    setIsSyncing(false);
    setSyncStatusMsg(result.message);
  };

  const handleSyncPull = async () => {
    soundEffects.playClick();
    setIsSyncing(true);
    setSyncStatusMsg('구글 스프레드시트에서 데이터 불러오는 중...');
    const result = await onSyncGoogleSheets('pull');
    setIsSyncing(false);
    setSyncStatusMsg(result.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
              🛠️
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                선생님 최고 관리자 콘솔
              </h2>
              <span className="text-xs text-emerald-200">
                학생 자산 총괄 · 저금통 이자 조절 · 주가 및 뉴스 제어 · 구글 시트 연동
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1단계: 선생님 마스터 비밀번호 인증 */}
        {!isAuthenticated ? (
          <form onSubmit={handleAuth} className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                선생님 관리 비밀번호를 입력해주세요
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                학급 경제 시스템 전체를 총괄하는 관리자 전용 화면입니다.
              </p>
            </div>

            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                placeholder="비밀번호 (초기값: 1234)"
                className="w-full text-center text-2xl font-black tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                autoFocus
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                * 처음 사용 시 초기 비밀번호는 <strong>1234</strong> 입니다.
              </span>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-5 h-5" />
              <span>관리자 콘솔 입장</span>
            </button>
          </form>
        ) : (
          /* 2단계: 선생님 관리 대시보드 */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* 탭 네비게이션 */}
            <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
              {[
                { id: 'students', label: '👥 학생 계정 관리', icon: Users },
                { id: 'finance', label: '💰 금융 & 이자 조절', icon: Percent },
                { id: 'stocks', label: '📈 주식 & 뉴스 제어', icon: TrendingUp },
                { id: 'tellers', label: '🏦 은행원 지정', icon: Building2 },
                { id: 'backup', label: '📊 백업 & 구글 시트', icon: Database },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab(t.id as any);
                  }}
                  className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap border-t border-x ${
                    activeTab === t.id
                      ? 'bg-white border-slate-200 text-emerald-800 shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 탭 내용 영역 */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: 학생 계정 관리 */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  {/* 신규 학생 등록 카드 */}
                  <form
                    onSubmit={handleAddStudent}
                    className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3"
                  >
                    <h4 className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-700" />
                      <span>신규 학생 등록 (초기 오이 자산 설정 / 주간 월급 항목 없음)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          번호
                        </label>
                        <input
                          type="number"
                          value={newStudentNumber}
                          onChange={(e) => setNewStudentNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          placeholder="번호"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          학생 이름
                        </label>
                        <input
                          type="text"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          placeholder="예: 홍길동"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          초기 현금 지갑 자산 (오이)
                        </label>
                        <input
                          type="number"
                          value={newStudentCash}
                          onChange={(e) => setNewStudentCash(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 ml-auto"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>학생 추가하기</span>
                    </button>
                  </form>

                  {/* 전체 학생 목록 테이블 */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>전체 학생 명단 ({students.length}명)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        * 초기 학생 PIN은 1234이며 분실 시 초기화 가능
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="p-3">번호</th>
                            <th className="p-3">이름</th>
                            <th className="p-3">비밀번호</th>
                            <th className="p-3">👛 현금</th>
                            <th className="p-3">🐷 저금통</th>
                            <th className="p-3">📈 투자</th>
                            <th className="p-3">역할</th>
                            <th className="p-3 text-right">관리</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-500">
                                {s.studentNumber || '-'}
                              </td>
                              <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="text-base">{s.avatar || '🥒'}</span>
                                <span>{s.name}</span>
                              </td>
                              <td className="p-3 font-mono font-semibold text-slate-600">
                                {s.pin}
                              </td>
                              <td className="p-3 font-bold text-emerald-700">
                                {s.wallets.cash} 오이
                              </td>
                              <td className="p-3 font-bold text-amber-700">
                                {s.wallets.savings} 오이
                              </td>
                              <td className="p-3 font-bold text-indigo-700">
                                {s.wallets.invest} 오이
                              </td>
                              <td className="p-3">
                                {s.isTeller ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                                    ★ 은행원
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">일반</span>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentPin(s.id, s.name)}
                                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                                  title="비밀번호 1234로 초기화"
                                >
                                  비번리셋
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(s.id, s.name)}
                                  className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold"
                                  title="학생 삭제"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 금융 & 이자 조절 */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                  {/* 예금 이자율 설정 및 일괄 지급 */}
                  <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐷</span>
                        <div>
                          <h4 className="text-sm font-black text-amber-950">
                            저금통 예금 이자율 설정 및 일괄 지급
                          </h4>
                          <span className="text-xs text-amber-900/80">
                            학생들의 저금통(예금) 잔액에 비례하여 이자를 계산하고 지급합니다.
                          </span>
                        </div>
                      </div>
                      <span className="text-base font-black text-amber-800 bg-amber-200/80 px-3 py-1 rounded-xl">
                        현재 이율: {config.savingsInterestRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0.5"
                        max="10.0"
                        step="0.5"
                        value={config.savingsInterestRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateConfig({ ...config, savingsInterestRate: val });
                        }}
                        className="flex-1 accent-amber-600"
                      />
                      <span className="text-sm font-bold text-amber-950 min-w-[50px]">
                        {config.savingsInterestRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* 일괄 지급 버튼 */}
                    <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                      <span className="text-xs text-amber-900">
                        전체 학생 저금통 총액:{' '}
                        <strong>
                          {students.reduce((acc, s) => acc + (s.wallets.savings || 0), 0)}
                        </strong>{' '}
                        오이
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDistributeInterest(config.savingsInterestRate);
                          soundEffects.playFanfare();
                          try {
                            confetti({ particleCount: 45, spread: 60 });
                          } catch {
                            // ignore
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>전체 학생 저금통 이자 일괄 지급 실행</span>
                      </button>
                    </div>
                  </div>

                  {/* 보너스 / 지원금 지급 또는 차감 */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>학생별 자유로운 보너스 지급 및 차감</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          대상 학생
                        </label>
                        <select
                          value={bonusTarget}
                          onChange={(e) => setBonusTarget(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        >
                          <option value="ALL">★ 전체 학생 일괄 지급</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.wallets.cash} 오이)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          금액 (오이)
                        </label>
                        <input
                          type="number"
                          value={bonusAmount}
                          onChange={(e) => setBonusAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          지급 사유
                        </label>
                        <input
                          type="text"
                          value={bonusReason}
                          onChange={(e) => setBonusReason(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseInt(bonusAmount, 10) || 0;
                          if (amt <= 0) return;
                          onDistributeBonus(bonusTarget, amt, bonusReason);
                          soundEffects.playCoin();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Coins className="w-4 h-4" />
                        <span>보너스 지급하기 (+)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseInt(bonusAmount, 10) || 0;
                          if (amt <= 0) return;
                          onDistributeBonus(bonusTarget, -amt, bonusReason);
                          soundEffects.playClick();
                        }}
                        className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all"
                      >
                        차감 (-)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: 주식 & 뉴스 제어 */}
              {activeTab === 'stocks' && (
                <div className="space-y-6">
                  
                  {/* 자동 주가 변동 토글 및 안내 */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-indigo-950 uppercase">
                        주식 자동 변동 토글 (On/Off 제어)
                      </h4>
                      <p className="text-xs text-indigo-900/80 mt-0.5">
                        활성화 시 매일/시간에 따라 5~30오이 범위 내에서 주가가 소폭 자동 등락합니다.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoStockFluctuation}
                        onChange={(e) => {
                          soundEffects.playClick();
                          onUpdateConfig({
                            ...config,
                            autoStockFluctuation: e.target.checked,
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* 4대 종목 주가 수동 조절 콘솔 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase">
                      4대 기업 주가 수동 조절 (주당 5~30오이 범위)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stocks.map((stock) => (
                        <div
                          key={stock.id}
                          className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{stock.icon}</span>
                            <div>
                              <strong className="text-xs text-slate-900 block">{stock.name}</strong>
                              <span className="text-[10px] text-slate-400">현재: {stock.price} 오이</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateStockPrice(stock.id, stock.price - 1)}
                              className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="4"
                              max="38"
                              value={stock.price}
                              onChange={(e) =>
                                handleUpdateStockPrice(stock.id, parseInt(e.target.value, 10) || stock.price)
                              }
                              className="w-14 text-center py-1 bg-white border border-slate-300 rounded-lg text-xs font-black"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStockPrice(stock.id, stock.price + 1)}
                              className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 주간 주식 뉴스 3세트 원클릭 즉시 실행 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase">
                      주간 뉴스 3세트 원클릭 시나리오 실행 (교육용)
                    </h4>
                    <div className="space-y-2">
                      {PRESET_NEWS.map((pNews, idx) => (
                        <div
                          key={pNews.id}
                          className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-50 transition-all text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{pNews.title}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {pNews.content}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTriggerPresetNews(pNews)}
                            className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs active:scale-95 transition-all shadow-xs"
                          >
                            시나리오 적용
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 커스텀 뉴스 작성 및 발행 폼 */}
                  <form
                    onSubmit={handlePublishCustomNews}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <h4 className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>선생님 커스텀 경제 뉴스 발행</span>
                    </h4>

                    <div>
                      <input
                        type="text"
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        placeholder="뉴스 제목 (예: 현대오이차 신형 청소로봇 교실 도입)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div>
                      <textarea
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                        placeholder="뉴스 본문 내용..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={newsEducation}
                        onChange={(e) => setNewsEducation(e.target.value)}
                        placeholder="선생님의 경제 한마디 (교육 포인트)..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    {/* 종목별 주가 영향치 설정 */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">
                        종목별 주가 변동 (+/- 오이)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {stocks.map((s) => (
                          <div key={s.id} className="bg-white p-2 rounded-lg border text-center">
                            <span className="text-[10px] text-slate-500 block">{s.name}</span>
                            <input
                              type="number"
                              value={newsStockEffects[s.id] || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setNewsStockEffects({ ...newsStockEffects, [s.id]: val });
                              }}
                              className="w-full text-center font-bold text-xs"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      뉴스 즉시 발행 및 주가 반영하기
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: 은행원 지정 */}
              {activeTab === 'tellers' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <h4 className="text-xs font-black text-amber-950 uppercase">
                      학급 은행원 학생 지정 (최대 3명)
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      은행원으로 지정된 학생은 [은행 창구] 메뉴에서 학급 친구들의 월급을 입금하고 통장 거래 내역을 기록할 수 있습니다.
                    </p>
                  </div>

                  {/* 은행원 비밀번호 변경 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <strong className="text-xs text-slate-900 block">은행원 전용 창구 비밀번호</strong>
                      <span className="text-xs text-slate-500">
                        현재 비밀번호: <code className="bg-white px-2 py-0.5 rounded border font-bold text-slate-800">{config.tellerPin}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="새 비밀번호 입력"
                        id="new-teller-pin-input"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('new-teller-pin-input') as HTMLInputElement;
                          if (el && el.value.trim()) {
                            onUpdateConfig({ ...config, tellerPin: el.value.trim() });
                            soundEffects.playClick();
                            alert(`은행원 비밀번호가 [${el.value.trim()}]로 변경되었습니다.`);
                            el.value = '';
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                      >
                        변경
                      </button>
                    </div>
                  </div>

                  {/* 은행원 체크리스트 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {students.map((s) => {
                      const isTeller = !!s.isTeller;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleTeller(s.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isTeller
                              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{s.avatar}</span>
                            <div>
                              <strong className="text-xs text-slate-900 block">{s.name}</strong>
                              <span className="text-[10px] text-slate-400">
                                {isTeller ? '★ 공인 은행원' : '일반 학생'}
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isTeller}
                            onChange={() => {}} // handled by parent div click
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: 백업 & 구글 시트 연동 */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  
                  {/* 구글 스프레드시트 연동 카드 */}
                  <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sheet className="w-6 h-6 text-emerald-700" />
                        <div>
                          <h4 className="text-sm font-black text-emerald-950">
                            구글 스프레드시트 실시간 동기화 (Apps Script)
                          </h4>
                          <span className="text-xs text-emerald-800">
                            Google Sheets와 연동하면 선생님 구글 계정에 모든 학생 통장 및 주식이 안전하게 백업됩니다.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenGoogleSheetsGuide}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-all flex items-center gap-1 shadow-xs"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>code.gs 코드 복사 및 가이드</span>
                      </button>
                    </div>

                    {/* URL 인풋 */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Google Apps Script 웹 앱 URL (배포 URL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={gasUrlInput}
                          onChange={(e) => setGasUrlInput(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            onUpdateConfig({ ...config, googleAppsScriptUrl: gasUrlInput });
                            alert('Google Apps Script URL이 저장되었습니다.');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                        >
                          URL 저장
                        </button>
                      </div>
                    </div>

                    {/* 동기화 버튼들 */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/80">
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={handleSyncPush}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>지금 구글 시트로 백업하기 (Push)</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={handleSyncPull}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>구글 시트에서 불러오기 (Pull)</span>
                      </button>
                    </div>

                    {syncStatusMsg && (
                      <div className="p-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-medium">
                        {syncStatusMsg}
                      </div>
                    )}
                  </div>

                  {/* 오프라인 JSON 백업 및 복원 */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-slate-600" />
                      <span>파일 백업 (JSON 다운로드 및 업로드)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      학기 말이나 컴퓨터 포맷 전, 전체 데이터를 파일로 안전하게 PC에 저장해 둘 수 있습니다.
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          onExportJson();
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>전체 데이터 JSON 다운로드</span>
                      </button>

                      <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>JSON 파일로부터 복원</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const content = evt.target?.result as string;
                                if (content) {
                                  try {
                                    onImportJson(content);
                                    soundEffects.playSuccess();
                                    alert('백업 데이터가 성공적으로 복원되었습니다.');
                                  } catch (err) {
                                    alert('파일 형식이 올바르지 않습니다.');
                                  }
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 선생님 비밀번호 변경 & 초기화 위험 구역 */}
                  <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-3">
                    <h4 className="text-xs font-black text-rose-950 uppercase">
                      보안 및 시스템 초기화
                    </h4>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <strong className="text-xs text-slate-900 block">선생님 관리 비밀번호 변경</strong>
                        <span className="text-[11px] text-slate-500">현재 PIN: {config.teacherPin}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="password"
                          value={newTeacherPin}
                          onChange={(e) => setNewTeacherPin(e.target.value)}
                          placeholder="새 4자리 비밀번호"
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTeacherPin.trim().length >= 4) {
                              onUpdateConfig({ ...config, teacherPin: newTeacherPin.trim() });
                              soundEffects.playClick();
                              alert(`선생님 비밀번호가 [${newTeacherPin.trim()}]로 변경되었습니다.`);
                              setNewTeacherPin('');
                            } else {
                              alert('4자리 이상의 비밀번호를 입력해주세요.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                        >
                          저장
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('정말 모든 데이터를 새 학기 기본 상태로 초기화하시겠습니까? (되돌릴 수 없습니다)')) {
                            onResetDefaults();
                            soundEffects.playClick();
                            alert('신학기 초기 데이터로 리셋되었습니다.');
                          }
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline"
                      >
                        신학기 데이터 전체 초기화 (기본값 복구)
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
