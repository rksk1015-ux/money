import React, { useState } from 'react';
import { StockCompany, Student } from '../types/economy';
import { soundEffects } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Coins,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface StockMarketTabProps {
  stocks: StockCompany[];
  student: Student;
  onTradeStock: (
    companyId: string,
    action: 'BUY' | 'SELL',
    quantity: number,
    pricePerShare: number
  ) => void;
}

export const StockMarketTab: React.FC<StockMarketTabProps> = ({
  stocks,
  student,
  onTradeStock,
}) => {
  const [selectedStock, setSelectedStock] = useState<StockCompany | null>(null);
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [tradeError, setTradeError] = useState<string>('');

  const investBalance = student.wallets.invest || 0;

  const openTradeModal = (stock: StockCompany, action: 'BUY' | 'SELL') => {
    soundEffects.playClick();
    setSelectedStock(stock);
    setTradeAction(action);
    setTradeQty(1);
    setTradeError('');
  };

  const closeTradeModal = () => {
    soundEffects.playClick();
    setSelectedStock(null);
  };

  const currentHolding = selectedStock
    ? student.portfolio[selectedStock.id]?.quantity || 0
    : 0;

  const maxBuyQty = selectedStock ? Math.floor(investBalance / selectedStock.price) : 0;
  const maxSellQty = currentHolding;

  const handleQtyChange = (qty: number) => {
    soundEffects.playClick();
    const bounded = Math.max(1, qty);
    setTradeQty(bounded);
    setTradeError('');
  };

  const executeTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    if (tradeAction === 'BUY') {
      const totalCost = tradeQty * selectedStock.price;
      if (totalCost > investBalance) {
        setTradeError(`투자 계좌 잔액(${investBalance} 오이)이 부족합니다. [이체하기]로 예수금을 충전하세요!`);
        soundEffects.playError();
        return;
      }
      onTradeStock(selectedStock.id, 'BUY', tradeQty, selectedStock.price);
      soundEffects.playSuccess();
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } else {
      if (tradeQty > currentHolding) {
        setTradeError(`보유 수량(${currentHolding}주)보다 많이 매도할 수 없습니다.`);
        soundEffects.playError();
        return;
      }
      onTradeStock(selectedStock.id, 'SELL', tradeQty, selectedStock.price);
      soundEffects.playSell();
      try {
        confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }

    setSelectedStock(null);
  };

  // Sparkline SVG renderer
  const renderSparkline = (history: Array<{ price: number }>, color: string) => {
    if (!history || history.length < 2) return null;
    const prices = history.map((h) => h.price);
    const min = Math.min(...prices) * 0.9;
    const max = Math.max(...prices) * 1.1;
    const width = 120;
    const height = 40;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-white/20 rounded-full border border-white/30 text-white">
              가상 모의 주식 거래소
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            오이 머니 4대 가상 기업 주식 시장
          </h2>
          <p className="text-xs text-indigo-100/90 mt-0.5">
            투자 계좌 예수금으로 주식을 사서 기업 성장과 배당금 수익을 함께 누려보세요!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
          <span className="text-[11px] text-indigo-200 block">내 투자 계좌 잔액</span>
          <span className="text-lg font-black text-amber-300">
            {investBalance.toLocaleString()} 오이
          </span>
        </div>
      </div>

      {/* 4대 기업 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stocks.map((stock) => {
          const change = stock.price - stock.prevPrice;
          const changePercent = stock.prevPrice ? (change / stock.prevPrice) * 100 : 0;
          const isUp = change > 0;
          const isDown = change < 0;
          const userShares = student.portfolio[stock.id]?.quantity || 0;

          // 한국식 주식 컬러: 상승 = 빨강(red), 하락 = 파랑(blue)
          const trendColor = isUp ? 'text-rose-600' : isDown ? 'text-blue-600' : 'text-slate-600';
          const trendBg = isUp ? 'bg-rose-50 border-rose-200' : isDown ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200';
          const strokeColor = isUp ? '#e11d48' : isDown ? '#2563eb' : '#64748b';

          return (
            <div
              key={stock.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* 기업 헤더 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border"
                      style={{ backgroundColor: `${stock.color}15`, borderColor: `${stock.color}40` }}
                    >
                      {stock.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-mono font-medium">{stock.code}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {stock.themeBadge}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {stock.name}
                      </h3>
                    </div>
                  </div>

                  {/* 주가 변동 뱃지 */}
                  <div className={`px-2.5 py-1 rounded-xl border text-right font-black text-xs ${trendBg} ${trendColor}`}>
                    <div className="flex items-center justify-end gap-0.5">
                      {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                      {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                      <span>
                        {isUp ? '+' : ''}
                        {change} 오이 ({isUp ? '+' : ''}{changePercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 현재가 및 미니 차트 */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">현재 주가 (1주당)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{stock.price}</span>
                      <span className="text-sm font-bold text-slate-600">오이</span>
                    </div>
                  </div>

                  <div className="pr-2">
                    {renderSparkline(stock.history, strokeColor)}
                  </div>
                </div>

                {/* 기업 설명 & 배당률 & 위험도 */}
                <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {stock.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>배당률 {stock.dividendRate}%</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                    위험도: <strong className="text-slate-900">{stock.riskLevel}</strong>
                  </div>
                  {userShares > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold ml-auto">
                      보유: {userShares}주 ({(userShares * stock.price).toLocaleString()} 오이)
                    </div>
                  )}
                </div>
              </div>

              {/* 매수 / 매도 버튼 */}
              <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openTradeModal(stock, 'BUY')}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>매수 (사기)</span>
                </button>
                <button
                  onClick={() => openTradeModal(stock, 'SELL')}
                  disabled={userShares <= 0}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                    userShares > 0
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>매도 (팔기)</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 매수 / 매도 모달 */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            
            {/* 헤더 */}
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                tradeAction === 'BUY'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedStock.icon}</span>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {selectedStock.name} 주식 {tradeAction === 'BUY' ? '매수하기' : '매도하기'}
                  </h3>
                  <span className="text-xs text-white/80">현재가: {selectedStock.price} 오이</span>
                </div>
              </div>
              <button
                onClick={closeTradeModal}
                className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 */}
            <form onSubmit={executeTrade} className="p-6 space-y-4">
              
              {/* 내 잔액 및 보유수량 현황 */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>내 투자 계좌 예수금:</span>
                  <strong className="text-slate-900">{investBalance.toLocaleString()} 오이</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>현재 보유한 {selectedStock.name}:</span>
                  <strong className="text-indigo-700">{currentHolding} 주</strong>
                </div>
                {tradeAction === 'BUY' && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>최대 구매 가능 수량:</span>
                    <strong>{maxBuyQty} 주</strong>
                  </div>
                )}
              </div>

              {/* 주문 수량 입력 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  주문할 주식 수량
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(tradeQty - 1)}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xl font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={tradeQty}
                    onChange={(e) => handleQtyChange(parseInt(e.target.value, 10) || 1)}
                    className="flex-1 text-center text-2xl font-black py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(tradeQty + 1)}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xl font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* 빠른 수량 버튼 */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQtyChange(q)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {q}주
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const maxPossible = tradeAction === 'BUY' ? maxBuyQty : maxSellQty;
                      handleQtyChange(Math.max(1, maxPossible));
                    }}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 ml-auto"
                  >
                    최대(MAX)
                  </button>
                </div>
              </div>

              {/* 결제 예상 금액 */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {tradeAction === 'BUY' ? '총 필요 오이' : '총 정산 예상 오이'}
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    {(tradeQty * selectedStock.price).toLocaleString()}
                  </span>
                  <span className="ml-1 text-sm font-bold text-slate-600">오이</span>
                </div>
              </div>

              {/* 에러 메시지 */}
              {tradeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{tradeError}</span>
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                  tradeAction === 'BUY'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {tradeQty}주 {tradeAction === 'BUY' ? '즉시 매수하기' : '즉시 매도하기'}
                </span>
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
