import React from 'react';
import { Student } from '../types/economy';
import { ArrowLeftRight, Wallet, PiggyBank, TrendingUp, Info } from 'lucide-react';

interface WalletSummaryCardsProps {
  student: Student;
  savingsInterestRate: number;
  stockEvaluationAmount: number;
  onOpenTransferModal: () => void;
}

export const WalletSummaryCards: React.FC<WalletSummaryCardsProps> = ({
  student,
  savingsInterestRate,
  stockEvaluationAmount,
  onOpenTransferModal,
}) => {
  const cash = student.wallets.cash || 0;
  const savings = student.wallets.savings || 0;
  const invest = student.wallets.invest || 0;
  const totalAssets = cash + savings + invest + stockEvaluationAmount;

  return (
    <div className="space-y-4">
      {/* 3대 지갑 분리 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. 현금 지갑 👛 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-900/10 border border-emerald-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl p-2 bg-white/20 rounded-2xl backdrop-blur-sm">👛</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  언제든 바로 쓰는
                </span>
                <h3 className="text-lg font-black text-white">현금 지갑</h3>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white/20 text-xs font-semibold rounded-full border border-white/30 backdrop-blur-sm">
              즉시 사용
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {cash.toLocaleString()}
              </span>
              <span className="ml-1.5 text-lg font-bold text-emerald-100">오이</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-100/90">
            교실 매점, 간식, 벌금 납부, 학급 활동에 바로 사용할 수 있어요.
          </p>
        </div>

        {/* 2. 저금통 (예금) 🐷 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-orange-900/10 border border-amber-300/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl p-2 bg-white/20 rounded-2xl backdrop-blur-sm">🐷</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
                  이자가 쑥쑥 붙는
                </span>
                <h3 className="text-lg font-black text-white">저금통 (예금)</h3>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white/20 text-xs font-bold rounded-full border border-white/30 backdrop-blur-sm text-amber-100">
              이자 {savingsInterestRate.toFixed(1)}%
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {savings.toLocaleString()}
              </span>
              <span className="ml-1.5 text-lg font-bold text-amber-100">오이</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-100/90">
            원금이 안전하게 보호되며, 선생님이 정기적으로 예금 이자를 줍니다.
          </p>
        </div>

        {/* 3. 투자 계좌 📈 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 p-5 text-white shadow-lg shadow-indigo-900/10 border border-indigo-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl p-2 bg-white/20 rounded-2xl backdrop-blur-sm">📈</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                  주식 매매 대기금
                </span>
                <h3 className="text-lg font-black text-white">투자 계좌</h3>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white/20 text-xs font-semibold rounded-full border border-white/30 backdrop-blur-sm">
              예수금
            </span>
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <div>
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {invest.toLocaleString()}
              </span>
              <span className="ml-1.5 text-lg font-bold text-indigo-100">오이</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-indigo-100/90">
            가상 기업 주식을 사고팔 때 사용하는 투자 전용 머니예요.
          </p>
        </div>

      </div>

      {/* 종합 자산 바 & [이체하기] 액션 버튼 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-slate-600 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>현금: <strong className="text-slate-900">{cash.toLocaleString()}</strong> 오이</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>예금: <strong className="text-slate-900">{savings.toLocaleString()}</strong> 오이</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>투자금: <strong className="text-slate-900">{invest.toLocaleString()}</strong> 오이</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>주식평가: <strong className="text-slate-900">{stockEvaluationAmount.toLocaleString()}</strong> 오이</span>
          </div>
        </div>

        <button
          onClick={onOpenTransferModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 transition-all text-white font-bold text-sm shadow-sm"
        >
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span>지갑 간 이체하기</span>
        </button>
      </div>
    </div>
  );
};
