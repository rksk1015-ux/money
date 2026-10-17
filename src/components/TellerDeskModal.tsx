import React, { useState } from 'react';
import { Student, TransactionRecord } from '../types/economy';
import { soundEffects } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  Building2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Coins,
  ShieldAlert,
  Printer,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface TellerDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  tellerPin: string;
  onExecuteTellerTransaction: (
    studentId: string,
    tellerName: string,
    type: 'income' | 'expense',
    category: '월급' | '보너스' | '벌금' | '기타',
    amount: number,
    description: string
  ) => void;
}

export const TellerDeskModal: React.FC<TellerDeskModalProps> = ({
  isOpen,
  onClose,
  students,
  tellerPin,
  onExecuteTellerTransaction,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedTellerStudentId, setSelectedTellerStudentId] = useState<string>('');
  const [inputTellerPin, setInputTellerPin] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Transaction form state
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [category, setCategory] = useState<'월급' | '보너스' | '벌금' | '기타'>('월급');
  const [description, setDescription] = useState<string>('1인 1역할 학급 청소 당번 월급 지급');
  const [amountStr, setAmountStr] = useState<string>('50');

  // Student PIN verification step
  const [isVerifyingStudentPin, setIsVerifyingStudentPin] = useState<boolean>(false);
  const [studentPinInput, setStudentPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Receipt modal state after success
  const [completedReceipt, setCompletedReceipt] = useState<{
    studentName: string;
    tellerName: string;
    category: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
  } | null>(null);

  if (!isOpen) return null;

  // Filter tellers
  const tellerCandidates = students.filter((s) => s.isTeller);
  const currentTeller = students.find((s) => s.id === selectedTellerStudentId);
  const targetStudent = students.find((s) => s.id === targetStudentId);

  // Teller login verification
  const handleTellerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTellerStudentId) {
      setAuthError('오늘 근무하는 은행원 학생을 선택해주세요.');
      soundEffects.playError();
      return;
    }
    if (inputTellerPin !== tellerPin) {
      setAuthError('은행원 비밀번호가 일치하지 않습니다. (선생님께 문의하세요)');
      soundEffects.playError();
      return;
    }

    soundEffects.playSuccess();
    setIsAuthenticated(true);
    setAuthError('');
  };

  // Preset description suggestions
  const setPresetCategory = (cat: '월급' | '보너스' | '벌금' | '기타') => {
    soundEffects.playClick();
    setCategory(cat);
    if (cat === '월급') {
      setDescription('1인 1역할 학급 당번 정기 월급 지급');
      setAmountStr('50');
    } else if (cat === '보너스') {
      setDescription('학급 바른 생활 및 과제 우수 보너스');
      setAmountStr('20');
    } else if (cat === '벌금') {
      setDescription('과제 미제출 / 지각 학급 규칙 벌금');
      setAmountStr('10');
    } else {
      setDescription('기타 학급 경제 활동 수기 입력');
      setAmountStr('10');
    }
  };

  // Open Student PIN verification pad
  const handleProceedToStudentAuth = () => {
    if (!targetStudent) {
      alert('거래할 학생을 선택해주세요.');
      soundEffects.playError();
      return;
    }
    const num = parseInt(amountStr, 10) || 0;
    if (num <= 0) {
      alert('금액을 1 이상 입력해주세요.');
      soundEffects.playError();
      return;
    }
    if (!description.trim()) {
      alert('지급/차감 사유를 입력해주세요.');
      soundEffects.playError();
      return;
    }

    if (category === '벌금' && targetStudent.wallets.cash < num) {
      alert(`해당 학생의 현금 지갑 잔액(${targetStudent.wallets.cash} 오이)이 부족합니다.`);
      soundEffects.playError();
      return;
    }

    soundEffects.playClick();
    setStudentPinInput('');
    setPinError('');
    setIsVerifyingStudentPin(true);
  };

  // Number pad input handler for student PIN
  const handleKeypadPress = (val: string) => {
    soundEffects.playClick();
    if (val === 'DEL') {
      setStudentPinInput((prev) => prev.slice(0, -1));
      setPinError('');
      return;
    }
    if (studentPinInput.length >= 4) return;
    const nextPin = studentPinInput + val;
    setStudentPinInput(nextPin);
    setPinError('');

    // Auto check when 4 digits reached
    if (nextPin.length === 4) {
      validateAndFinishTrade(nextPin);
    }
  };

  const validateAndFinishTrade = (pinToCheck: string) => {
    if (!targetStudent || !currentTeller) return;

    if (pinToCheck !== targetStudent.pin) {
      setPinError('비밀번호 4자리가 일치하지 않습니다. 다시 입력해주세요.');
      soundEffects.playError();
      setStudentPinInput('');
      return;
    }

    // Success!
    const numAmount = parseInt(amountStr, 10) || 0;
    const txType = category === '벌금' ? 'expense' : 'income';

    onExecuteTellerTransaction(
      targetStudent.id,
      currentTeller.name,
      txType,
      category,
      numAmount,
      description
    );

    soundEffects.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    setCompletedReceipt({
      studentName: targetStudent.name,
      tellerName: currentTeller.name,
      category,
      amount: numAmount,
      description,
      type: txType,
    });

    setIsVerifyingStudentPin(false);
    setStudentPinInput('');
    // Reset form for next customer
    setAmountStr('50');
  };

  const handleCloseAll = () => {
    soundEffects.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm">
              🏦
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                오이 머니 은행 창구 (은행원 전용)
              </h2>
              <span className="text-xs font-semibold text-amber-950/80">
                월급 지급 · 보너스 입금 · 학생 비밀번호 4자리 직접 승인제
              </span>
            </div>
          </div>
          <button
            onClick={handleCloseAll}
            className="p-1.5 rounded-full hover:bg-black/10 transition-all text-slate-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1단계: 은행원 로그인 화면 */}
        {!isAuthenticated ? (
          <form onSubmit={handleTellerLogin} className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-md mx-auto">
              <span className="text-4xl inline-block mb-2">🧑‍💼</span>
              <h3 className="text-xl font-black text-slate-900">
                오늘의 지정 은행원을 선택해 주세요
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                학급 은행원으로 임명된 학생만 창구 업무를 처리할 수 있습니다.
              </p>
            </div>

            {/* 은행원 후보 목록 (선생님이 지정한 최대 3명) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500">
                근무자 선택 ({tellerCandidates.length}명 등록됨)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tellerCandidates.length === 0 ? (
                  <div className="col-span-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center font-medium">
                    선생님 관리 메뉴에서 먼저 은행원 학생을 지정해 주세요!
                  </div>
                ) : (
                  tellerCandidates.map((teller) => {
                    const isSelected = selectedTellerStudentId === teller.id;
                    return (
                      <button
                        key={teller.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setSelectedTellerStudentId(teller.id);
                          setAuthError('');
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <span className="text-2xl">{teller.avatar || '🥒'}</span>
                        <span className="text-sm font-bold text-slate-900">{teller.name}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          공인 은행원
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 은행원 비밀번호 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                은행원 보안 비밀번호
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputTellerPin}
                  onChange={(e) => {
                    setInputTellerPin(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="은행원 비밀번호 (초기값: 0000)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                * 초기 비밀번호는 0000이며, 선생님 관리에서 변경할 수 있습니다.
              </span>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedTellerStudentId}
              className={`w-full py-3.5 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                selectedTellerStudentId
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>은행 창구 업무 시작하기</span>
            </button>
          </form>
        ) : (
          /* 2단계: 은행원 업무 데스크 (입출금 처리) */
          <div className="p-6 space-y-6">
            
            {/* 상단 근무자 표시 바 */}
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-bold">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentTeller?.avatar}</span>
                <span>근무 중인 은행원: <strong>{currentTeller?.name}</strong></span>
              </div>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsAuthenticated(false);
                }}
                className="text-slate-600 hover:text-slate-900 text-xs underline"
              >
                근무자 교대
              </button>
            </div>

            {/* 거래할 학생 선택 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500">
                  1. 거래 방문 학생 선택
                </label>
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="학생 이름 검색..."
                  className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                {students
                  .filter((s) => !studentSearch || s.name.includes(studentSearch))
                  .map((s) => {
                    const isSelected = targetStudentId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setTargetStudentId(s.id);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl block">{s.avatar || '🥒'}</span>
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          {s.wallets.cash} 오이
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 거래 종류 (월급, 보너스, 벌금, 기타) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                2. 거래 구분
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['월급', '보너스', '벌금', '기타'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      category === cat
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat === '월급' && '💼 '}
                    {cat === '보너스' && '🎁 '}
                    {cat === '벌금' && '⚠️ '}
                    {cat === '기타' && '📝 '}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 내역(사유) 직접 작성 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                3. 통장에 기록될 사유(항목)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 1학기 3주차 급식당번 월급"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
            </div>

            {/* 금액 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                4. 거래 금액 (오이)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full text-2xl font-black px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-14 text-slate-900"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  오이
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {[10, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setAmountStr(String((parseInt(amountStr, 10) || 0) + val));
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setAmountStr('0');
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 ml-auto"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 거래 확인 및 학생 비밀번호 인증 진행 버튼 */}
            <button
              type="button"
              onClick={handleProceedToStudentAuth}
              disabled={!targetStudent}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                targetStudent
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-98 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <KeyRound className="w-5 h-5 text-slate-950" />
              <span>
                {targetStudent ? `${targetStudent.name} 학생 비밀번호 4자리 입력 후 승인` : '거래 학생을 선택해주세요'}
              </span>
            </button>

          </div>
        )}

      </div>

      {/* 3단계: 학생 본인 직접 4자리 비밀번호 입력 키패드 모달 */}
      {isVerifyingStudentPin && targetStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 space-y-5">
            
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto shadow-sm">
              {targetStudent.avatar || '🥒'}
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                학생 통장 본인 인증
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {targetStudent.name} 학생, 비밀번호를 눌러주세요!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                거래 금액: <strong className="text-slate-900">{amountStr} 오이</strong> ({category})
              </p>
            </div>

            {/* PIN 도트 표시기 */}
            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = studentPinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all ${
                      isFilled ? 'bg-emerald-600 scale-125' : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {pinError}
              </div>
            )}

            {/* 귀여운 터치 숫자 키패드 */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 text-xl font-black transition-all shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setIsVerifyingStudentPin(false);
                }}
                className="py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 text-xl font-black transition-all shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('DEL')}
                className="py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 text-sm font-bold transition-all"
              >
                지움
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4단계: 거래 완료 영수증 팝업 */}
      {completedReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 space-y-4 relative overflow-hidden">
            
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                은행 거래가 완료되었습니다!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                학생의 현금 지갑과 통장 내역에 즉시 기록되었습니다.
              </p>
            </div>

            {/* 영수증 박스 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-medium">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">거래 학생</span>
                <strong className="text-slate-900">{completedReceipt.studentName}</strong>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">담당 은행원</span>
                <strong className="text-slate-900">{completedReceipt.tellerName}</strong>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">거래 구분</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]">
                  {completedReceipt.category}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">기록 사유</span>
                <span className="text-slate-800 text-right max-w-[170px] truncate">
                  {completedReceipt.description}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-black">
                <span>거래 금액</span>
                <span className={completedReceipt.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                  {completedReceipt.type === 'income' ? '+' : '-'}
                  {completedReceipt.amount} 오이
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundEffects.playClick();
                setCompletedReceipt(null);
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm shadow-sm transition-all"
            >
              다음 거래 진행하기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
