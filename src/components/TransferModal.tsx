import React, { useState } from 'react';
import { Student, WalletType } from '../types/economy';
import { soundEffects } from '../services/sound';
import { X, ArrowRight, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface TransferModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (from: WalletType, to: WalletType, amount: number) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  student,
  isOpen,
  onClose,
  onTransfer,
}) => {
  const [sourceWallet, setSourceWallet] = useState<WalletType>('cash');
  const [targetWallet, setTargetWallet] = useState<WalletType>('savings');
  const [amountStr, setAmountStr] = useState<string>('10');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const walletLabels: Record<WalletType, { name: string; emoji: string; desc: string }> = {
    cash: { name: '현금 지갑', emoji: '👛', desc: '자유롭게 쓰는 돈' },
    savings: { name: '저금통 (예금)', emoji: '🐷', desc: '이자가 붙는 안전한 돈' },
    invest: { name: '투자 계좌', emoji: '📈', desc: '주식 매매 전용 예수금' },
  };

  const currentSourceBalance = student.wallets[sourceWallet] || 0;
  const currentTargetBalance = student.wallets[targetWallet] || 0;
  const numAmount = parseInt(amountStr, 10) || 0;

  const handleSourceChange = (wallet: WalletType) => {
    soundEffects.playClick();
    setSourceWallet(wallet);
    if (wallet === targetWallet) {
      const candidates: WalletType[] = ['cash', 'savings', 'invest'];
      const alt = candidates.find((c) => c !== wallet) || 'savings';
      setTargetWallet(alt);
    }
    setErrorMsg('');
  };

  const handleTargetChange = (wallet: WalletType) => {
    soundEffects.playClick();
    setTargetWallet(wallet);
    setErrorMsg('');
  };

  const handleQuickAdd = (addVal: number) => {
    soundEffects.playClick();
    const next = Math.min(currentSourceBalance, (parseInt(amountStr, 10) || 0) + addVal);
    setAmountStr(String(next));
    setErrorMsg('');
  };

  const handleSetMax = () => {
    soundEffects.playClick();
    setAmountStr(String(currentSourceBalance));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('이체할 오이 금액을 1 이상 입력해주세요.');
      soundEffects.playError();
      return;
    }
    if (numAmount > currentSourceBalance) {
      setErrorMsg(`보내는 지갑의 잔액(${currentSourceBalance} 오이)을 초과할 수 없습니다.`);
      soundEffects.playError();
      return;
    }

    onTransfer(sourceWallet, targetWallet, numAmount);
    soundEffects.playCoin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">지갑 간 오이 이체하기</h2>
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

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 출금 지갑 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              1. 출금 지갑 (어디서 보낼까요?)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'savings', 'invest'] as WalletType[]).map((w) => {
                const info = walletLabels[w];
                const isSelected = sourceWallet === w;
                return (
                  <button
                    key={`from-${w}`}
                    type="button"
                    onClick={() => handleSourceChange(w)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-xl">{info.emoji}</span>
                    <span className="text-xs font-bold text-slate-900 mt-1">{info.name}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                      {student.wallets[w] || 0} 오이
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 중앙 화살표 구분 */}
          <div className="flex items-center justify-center -my-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
              <ArrowRight className="w-4 h-4 text-emerald-600 rotate-90 sm:rotate-0" />
            </div>
          </div>

          {/* 입금 지갑 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">
              2. 입금 지갑 (어디로 옮길까요?)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'savings', 'invest'] as WalletType[]).map((w) => {
                const info = walletLabels[w];
                const isSelected = targetWallet === w;
                const isDisabled = sourceWallet === w;
                return (
                  <button
                    key={`to-${w}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTargetChange(w)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                        : isSelected
                        ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-xl">{info.emoji}</span>
                    <span className="text-xs font-bold text-slate-900 mt-1">{info.name}</span>
                    <span className="text-[11px] font-semibold text-teal-700 mt-0.5">
                      {student.wallets[w] || 0} 오이
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 이체 금액 입력 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500">
                3. 이체할 오이 금액
              </label>
              <span className="text-xs text-slate-500">
                출금 가능: <strong className="text-emerald-700">{currentSourceBalance}</strong> 오이
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max={currentSourceBalance}
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full text-2xl font-black px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-14 text-slate-900"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                오이
              </span>
            </div>

            {/* 빠른 금액 추가 버튼 */}
            <div className="flex items-center gap-1.5 mt-2">
              {[5, 10, 20, 50].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => handleQuickAdd(add)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all"
                >
                  +{add}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSetMax}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 transition-all ml-auto"
              >
                전액(MAX)
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 이체 실행 버튼 */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 transition-all text-white font-extrabold text-base shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{numAmount.toLocaleString()} 오이 즉시 이체하기</span>
          </button>

        </form>
      </div>
    </div>
  );
};
