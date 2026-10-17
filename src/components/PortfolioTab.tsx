import React from 'react';
import { Student, StockCompany } from '../types/economy';
import { soundEffects } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Gift,
  Coins,
  Percent,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PortfolioTabProps {
  student: Student;
  stocks: StockCompany[];
  onOpenSellModal: (stock: StockCompany) => void;
  onClaimDividends: (totalDividends: number) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  student,
  stocks,
  onOpenSellModal,
  onClaimDividends,
}) => {
  const stockMap = React.useMemo(() => {
    const map: Record<string, StockCompany> = {};
    stocks.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [stocks]);

  // Calculate portfolio totals
  let totalInvested = 0;
  let totalCurrentValuation = 0;
  let totalExpectedDividends = 0;

  const holdingsList = Object.entries(student.portfolio)
    .filter(([_, holding]) => holding && holding.quantity > 0)
    .map(([compId, holding]) => {
      const stock = stockMap[compId];
      if (!stock) return null;

      const currentVal = holding.quantity * stock.price;
      const invested = holding.quantity * (holding.avgBuyPrice || stock.price);
      const profit = currentVal - invested;
      const profitRate = invested > 0 ? (profit / invested) * 100 : 0;
      
      // 배당금 계산: 보유평가액 * 배당률 / 100 (최소 1오이 올림/반올림)
      const dividend = Math.max(1, Math.round((currentVal * stock.dividendRate) / 100));

      totalInvested += invested;
      totalCurrentValuation += currentVal;
      totalExpectedDividends += dividend;

      return {
        stock,
        holding,
        invested,
        currentVal,
        profit,
        profitRate,
        dividend,
      };
    })
    .filter(Boolean) as Array<{
      stock: StockCompany;
      holding: { quantity: number; avgBuyPrice: number };
      invested: number;
      currentVal: number;
      profit: number;
      profitRate: number;
      dividend: number;
    }>;

  const totalProfit = totalCurrentValuation - totalInvested;
  const totalProfitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isTotalProfitPlus = totalProfit >= 0;

  const handleClaim = () => {
    if (totalExpectedDividends <= 0) return;
    soundEffects.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onClaimDividends(totalExpectedDividends);
  };

  return (
    <div className="space-y-6">
      
      {/* 포트폴리오 총 요약 카드 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/30 rounded-full border border-indigo-400/30 text-indigo-300">
                실시간 투자 분석
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {student.name} 학생의 주식 포트폴리오
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              보유 중인 주식의 실시간 가치와 평가손익을 확인하세요.
            </p>
          </div>

          {/* 배당금 수령 버튼 */}
          {holdingsList.length > 0 && (
            <button
              onClick={handleClaim}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 text-slate-950 font-black text-sm shadow-md transition-all self-start sm:self-auto"
            >
              <Gift className="w-4 h-4 text-slate-950" />
              <span>정기 배당금 ({totalExpectedDividends} 오이) 받기</span>
            </button>
          )}
        </div>

        {/* 3대 핵심 수치 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">총 주식 평가금액</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {totalCurrentValuation.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">오이</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">총 매입(투자) 원금</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-300">
                {totalInvested.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">오이</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">총 평가손익 (수익률)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-black flex items-center gap-0.5 ${
                  isTotalProfitPlus ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {isTotalProfitPlus ? '+' : ''}
                {totalProfit.toLocaleString()} 오이
              </span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ml-1.5 ${
                  isTotalProfitPlus ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {isTotalProfitPlus ? '+' : ''}
                {totalProfitRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 보유 종목 상세 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>보유 주식 종목 현황 ({holdingsList.length}종목)</span>
          </h3>
          <span className="text-xs text-slate-500">
            주가를 클릭하여 언제든 매도(현금화)할 수 있습니다.
          </span>
        </div>

        {holdingsList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <PieChart className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <h4 className="text-sm font-bold text-slate-700">보유 중인 주식이 없습니다.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              [주식 시장] 탭에서 원하는 가상 기업의 주식을 매수해 포트폴리오를 만들어보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holdingsList.map(({ stock, holding, invested, currentVal, profit, profitRate, dividend }) => {
              const isProfit = profit >= 0;

              return (
                <div
                  key={stock.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* 상단 종목명 & 보유 수량 */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border"
                          style={{
                            backgroundColor: `${stock.color}15`,
                            borderColor: `${stock.color}40`,
                          }}
                        >
                          {stock.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-mono">{stock.code}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {stock.themeBadge}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-900">{stock.name}</h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">보유 수량</span>
                        <span className="text-lg font-black text-indigo-700">{holding.quantity}주</span>
                      </div>
                    </div>

                    {/* 가격 & 손익 정보 박스 */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block">평균 매입단가</span>
                        <span className="font-bold text-slate-800">{holding.avgBuyPrice} 오이</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">현재 시장주가</span>
                        <span className="font-bold text-slate-800">{stock.price} 오이</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">총 평가금액</span>
                        <span className="font-bold text-slate-900">{currentVal.toLocaleString()} 오이</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">평가손익 (수익률)</span>
                        <span
                          className={`font-black flex items-center gap-0.5 ${
                            isProfit ? 'text-rose-600' : 'text-blue-600'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {profit} 오이 ({isProfit ? '+' : ''}{profitRate.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* 배당금 혜택 정보 */}
                    <div className="mt-3 flex items-center justify-between text-xs px-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        배당률 {stock.dividendRate}%
                      </span>
                      <span className="text-emerald-700 font-bold">
                        예상 배당금: +{dividend} 오이
                      </span>
                    </div>
                  </div>

                  {/* 매도 버튼 */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onOpenSellModal(stock)}
                      className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-blue-200"
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>{stock.name} 주식 매도하기 (차익 실현)</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
