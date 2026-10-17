import React, { useState, useMemo } from 'react';
import { TransactionRecord, Student } from '../types/economy';
import { soundEffects } from '../services/sound';
import {
  FileText,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Coins,
  TrendingUp,
  Tag,
  User,
  Clock,
} from 'lucide-react';

interface PassbookTabProps {
  student: Student;
  transactions: TransactionRecord[];
}

export const PassbookTab: React.FC<PassbookTabProps> = ({
  student,
  transactions,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter transactions belonging to this student
  const studentTransactions = useMemo(() => {
    return transactions.filter((t) => t.studentId === student.id);
  }, [transactions, student.id]);

  const filteredTransactions = useMemo(() => {
    return studentTransactions
      .filter((t) => {
        if (filterType === 'all') return true;
        if (filterType === 'income') return t.type === 'income' || t.type === 'dividend' || t.type === 'interest';
        if (filterType === 'expense') return t.type === 'expense';
        if (filterType === 'transfer') return t.type === 'transfer';
        if (filterType === 'stock') return t.type === 'stock_buy' || t.type === 'stock_sell';
        return true;
      })
      .filter((t) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.processedBy && t.processedBy.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [studentTransactions, filterType, searchTerm]);

  // Statistics
  const totalIncome = studentTransactions
    .filter((t) => t.type === 'income' || t.type === 'dividend' || t.type === 'interest')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = studentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '월급':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '보너스':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '벌금':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case '예금이체':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case '주식매수':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '주식매도':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case '배당금':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '이자수익':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getWalletName = (w: string) => {
    if (w === 'cash') return '👛 현금';
    if (w === 'savings') return '🐷 저금통';
    if (w === 'invest') return '📈 투자';
    return w;
  };

  return (
    <div className="space-y-4">
      
      {/* 통장 헤더 & 통계 요약 바 */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📗</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/30 rounded-full border border-emerald-400/30 text-emerald-200">
                실시간 디지털 통장
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {student.name} 학생의 오이 통장 기록부
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              은행원 창구 입출금, 이체, 주식 매매 내역이 투명하게 기록됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[11px] text-emerald-200 block">누적 입금(수입)</span>
              <span className="text-base font-extrabold text-emerald-300">
                +{totalIncome.toLocaleString()} 오이
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[11px] text-rose-200 block">누적 지출/벌금</span>
              <span className="text-base font-extrabold text-rose-300">
                -{totalExpense.toLocaleString()} 오이
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 탭 & 검색 */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* 필터 버튼들 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: '전체' },
            { id: 'income', label: '입금·월급' },
            { id: 'expense', label: '출금·벌금' },
            { id: 'transfer', label: '지갑이체' },
            { id: 'stock', label: '주식거래' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                soundEffects.playClick();
                setFilterType(f.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 검색 인풋 */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="사유 또는 항목 검색..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 거래 내역 리스트 */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <p className="text-sm font-semibold">내역이 없습니다.</p>
            <p className="text-xs mt-1 text-slate-400">은행 창구를 방문하거나 주식을 거래해 보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income' || tx.type === 'dividend' || tx.type === 'interest';
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';
              const isStockBuy = tx.type === 'stock_buy';
              const isStockSell = tx.type === 'stock_sell';

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* 아이콘 */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold shadow-sm ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : isExpense
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isTransfer
                          ? 'bg-teal-100 text-teal-700 border border-teal-200'
                          : isStockBuy
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {isIncome && <ArrowDownLeft className="w-5 h-5" />}
                      {isExpense && <ArrowUpRight className="w-5 h-5" />}
                      {isTransfer && <ArrowLeftRight className="w-5 h-5" />}
                      {isStockBuy && '📉'}
                      {isStockSell && '📈'}
                    </div>

                    {/* 거래 상세 정보 */}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                            tx.category
                          )}`}
                        >
                          {tx.category}
                        </span>
                        {isTransfer ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {getWalletName(tx.sourceWallet || '')} ➔ {getWalletName(tx.targetWallet)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {getWalletName(tx.targetWallet)}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                          • {formatTime(tx.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {tx.description}
                      </h4>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>처리자: {tx.processedBy}</span>
                        {tx.tellerName && (
                          <span className="text-emerald-700 font-medium">({tx.tellerName})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 금액 표시 */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : isTransfer
                          ? 'text-teal-600'
                          : isStockSell
                          ? 'text-indigo-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {tx.amount.toLocaleString()} <span className="text-xs font-bold">오이</span>
                    </div>
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
