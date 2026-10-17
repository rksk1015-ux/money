import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Student,
  StockCompany,
  StockNews,
  EconomyConfig,
  WalletType,
  TransactionRecord,
} from './types/economy';
import { storageService } from './services/storage';
import { soundEffects } from './services/sound';
import { APPS_SCRIPT_CODE } from './constants/appsScriptCode';

import { Header } from './components/Header';
import { WalletSummaryCards } from './components/WalletSummaryCards';
import { TransferModal } from './components/TransferModal';
import { PassbookTab } from './components/PassbookTab';
import { StockMarketTab } from './components/StockMarketTab';
import { StockNewsTab } from './components/StockNewsTab';
import { PortfolioTab } from './components/PortfolioTab';
import { TellerDeskModal } from './components/TellerDeskModal';
import { TeacherConsoleModal } from './components/TeacherConsoleModal';
import { GoogleSheetsGuideModal } from './components/GoogleSheetsGuideModal';
import { StudentLoginModal } from './components/StudentLoginModal';

import {
  FileText,
  TrendingUp,
  Newspaper,
  PieChart,
  Coins,
  ArrowLeftRight,
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => storageService.loadInitialState());
  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    return appState.students[0]?.id || '';
  });

  // Active Main Tab: 'passbook' | 'market' | 'news' | 'portfolio'
  const [activeTab, setActiveTab] = useState<'passbook' | 'market' | 'news' | 'portfolio'>('market');

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isTellerDeskOpen, setIsTellerDeskOpen] = useState<boolean>(false);
  const [isTeacherConsoleOpen, setIsTeacherConsoleOpen] = useState<boolean>(false);
  const [isGoogleSheetsGuideOpen, setIsGoogleSheetsGuideOpen] = useState<boolean>(false);
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState<boolean>(false);

  // Google Sheets sync state
  const [isSheetSyncing, setIsSheetSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());

  // Subscribe to multi-window BroadcastChannel sync
  useEffect(() => {
    const unsubscribe = storageService.subscribe((syncedState) => {
      setAppState(syncedState);
    });
    return () => unsubscribe();
  }, []);

  // Save on state change
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      storageService.saveState(next, true);
      return next;
    });
  }, []);

  // Background random subtle fluctuation timer when teacher turns ON autoStockFluctuation
  useEffect(() => {
    if (!appState.config.autoStockFluctuation) return;

    const interval = setInterval(() => {
      updateState((prev) => {
        const updatedStocks = prev.stocks.map((stock) => {
          // 40% chance to tick this stock
          if (Math.random() > 0.4) return stock;
          // delta between -1 and +1
          const deltas = [-1, 0, 1];
          const delta = deltas[Math.floor(Math.random() * deltas.length)];
          const nextPrice = Math.max(stock.minPrice, Math.min(stock.maxPrice, stock.price + delta));
          if (nextPrice === stock.price) return stock;

          return {
            ...stock,
            prevPrice: stock.price,
            price: nextPrice,
            history: [...stock.history.slice(-15), { price: nextPrice, timestamp: Date.now() }],
          };
        });

        return {
          ...prev,
          stocks: updatedStocks,
        };
      });
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, [appState.config.autoStockFluctuation, updateState]);

  // Current logged in student
  const currentStudent = useMemo(() => {
    return appState.students.find((s) => s.id === currentStudentId) || appState.students[0] || null;
  }, [appState.students, currentStudentId]);

  // Calculate stock evaluation amount for current student
  const stockEvaluationAmount = useMemo(() => {
    if (!currentStudent) return 0;
    const stockMap: Record<string, number> = {};
    appState.stocks.forEach((s) => {
      stockMap[s.id] = s.price;
    });

    return Object.entries(currentStudent.portfolio).reduce((acc, [compId, holding]) => {
      const curPrice = stockMap[compId] || 0;
      return acc + (holding?.quantity || 0) * curPrice;
    }, 0);
  }, [currentStudent, appState.stocks]);

  // Total net worth: Cash + Savings + Invest + Stock Val
  const totalNetWorth = useMemo(() => {
    if (!currentStudent) return 0;
    return (
      (currentStudent.wallets.cash || 0) +
      (currentStudent.wallets.savings || 0) +
      (currentStudent.wallets.invest || 0) +
      stockEvaluationAmount
    );
  }, [currentStudent, stockEvaluationAmount]);

  // 1. Transfer handler
  const handleTransfer = (from: WalletType, to: WalletType, amount: number) => {
    if (!currentStudent || amount <= 0) return;

    updateState((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== currentStudent.id) return s;
        return {
          ...s,
          wallets: {
            ...s.wallets,
            [from]: (s.wallets[from] || 0) - amount,
            [to]: (s.wallets[to] || 0) + amount,
          },
        };
      });

      const walletNames: Record<WalletType, string> = {
        cash: '현금 지갑',
        savings: '저금통(예금)',
        invest: '투자 계좌',
      };

      const newTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        type: 'transfer',
        category: '예금이체',
        amount,
        sourceWallet: from,
        targetWallet: to,
        description: `${walletNames[from]}에서 ${walletNames[to]}으로 ${amount} 오이 이체`,
        processedBy: '학생본인',
        timestamp: Date.now(),
      };

      return {
        ...prev,
        students: updatedStudents,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // 2. Trade stock handler
  const handleTradeStock = (
    companyId: string,
    action: 'BUY' | 'SELL',
    quantity: number,
    pricePerShare: number
  ) => {
    if (!currentStudent || quantity <= 0) return;
    const targetComp = appState.stocks.find((s) => s.id === companyId);
    if (!targetComp) return;

    const totalCost = quantity * pricePerShare;

    updateState((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== currentStudent.id) return s;

        const currentHolding = s.portfolio[companyId] || {
          quantity: 0,
          avgBuyPrice: pricePerShare,
          totalInvested: 0,
        };

        let newInvestBalance = s.wallets.invest;
        let nextHolding = { ...currentHolding };

        if (action === 'BUY') {
          newInvestBalance -= totalCost;
          const nextQty = currentHolding.quantity + quantity;
          const nextInvested = (currentHolding.totalInvested || 0) + totalCost;
          const nextAvg = Math.round(nextInvested / nextQty);

          nextHolding = {
            quantity: nextQty,
            avgBuyPrice: nextAvg,
            totalInvested: nextInvested,
          };
        } else {
          // SELL
          newInvestBalance += totalCost;
          const nextQty = Math.max(0, currentHolding.quantity - quantity);
          const nextInvested = nextQty > 0 ? (currentHolding.avgBuyPrice * nextQty) : 0;

          nextHolding = {
            quantity: nextQty,
            avgBuyPrice: nextQty > 0 ? currentHolding.avgBuyPrice : 0,
            totalInvested: nextInvested,
          };
        }

        return {
          ...s,
          wallets: {
            ...s.wallets,
            invest: newInvestBalance,
          },
          portfolio: {
            ...s.portfolio,
            [companyId]: nextHolding,
          },
        };
      });

      const newTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        type: action === 'BUY' ? 'stock_buy' : 'stock_sell',
        category: action === 'BUY' ? '주식매수' : '주식매도',
        amount: totalCost,
        targetWallet: 'invest',
        description: `${targetComp.name} ${quantity}주 ${action === 'BUY' ? '매수' : '매도'} (주당 ${pricePerShare}오이)`,
        processedBy: '학생본인',
        timestamp: Date.now(),
      };

      return {
        ...prev,
        students: updatedStudents,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // 3. Claim dividends
  const handleClaimDividends = (totalDividends: number) => {
    if (!currentStudent || totalDividends <= 0) return;

    updateState((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== currentStudent.id) return s;
        return {
          ...s,
          wallets: {
            ...s.wallets,
            cash: (s.wallets.cash || 0) + totalDividends,
          },
        };
      });

      const newTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        type: 'dividend',
        category: '배당금',
        amount: totalDividends,
        targetWallet: 'cash',
        description: '보유 주식 분기 정기 배당금 입금',
        processedBy: '시스템',
        timestamp: Date.now(),
      };

      return {
        ...prev,
        students: updatedStudents,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // 4. Bank Teller transaction execution
  const handleExecuteTellerTransaction = (
    studentId: string,
    tellerName: string,
    type: 'income' | 'expense',
    category: '월급' | '보너스' | '벌금' | '기타',
    amount: number,
    description: string
  ) => {
    const targetStud = appState.students.find((s) => s.id === studentId);
    if (!targetStud) return;

    updateState((prev) => {
      const updatedStudents = prev.students.map((s) => {
        if (s.id !== studentId) return s;
        const currentCash = s.wallets.cash || 0;
        const nextCash = type === 'income' ? currentCash + amount : Math.max(0, currentCash - amount);
        return {
          ...s,
          wallets: {
            ...s.wallets,
            cash: nextCash,
          },
        };
      });

      const newTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        studentId,
        studentName: targetStud.name,
        type,
        category,
        amount,
        targetWallet: 'cash',
        description,
        processedBy: '은행원',
        tellerName,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        students: updatedStudents,
        transactions: [newTx, ...prev.transactions],
      };
    });
  };

  // 5. Teacher interest distribution
  const handleDistributeInterest = (rate: number) => {
    updateState((prev) => {
      const newTxs: TransactionRecord[] = [];
      const updatedStudents = prev.students.map((s) => {
        const savings = s.wallets.savings || 0;
        if (savings <= 0) return s;
        const interestAmount = Math.max(1, Math.round((savings * rate) / 100));

        newTxs.push({
          id: `tx-${Date.now()}-${s.id}`,
          studentId: s.id,
          studentName: s.name,
          type: 'interest',
          category: '이자수익',
          amount: interestAmount,
          targetWallet: 'savings',
          description: `저금통 예금 정기 이자 (${rate.toFixed(1)}%) 입금`,
          processedBy: '선생님',
          timestamp: Date.now(),
        });

        return {
          ...s,
          wallets: {
            ...s.wallets,
            savings: savings + interestAmount,
          },
        };
      });

      return {
        ...prev,
        students: updatedStudents,
        transactions: [...newTxs, ...prev.transactions],
      };
    });
  };

  // 6. Teacher bonus / fine distribution
  const handleDistributeBonus = (
    targetStudentId: 'ALL' | string,
    amount: number,
    description: string
  ) => {
    const isDeduction = amount < 0;
    const absAmount = Math.abs(amount);

    updateState((prev) => {
      const newTxs: TransactionRecord[] = [];
      const updatedStudents = prev.students.map((s) => {
        if (targetStudentId !== 'ALL' && s.id !== targetStudentId) return s;

        const currentCash = s.wallets.cash || 0;
        const nextCash = isDeduction ? Math.max(0, currentCash - absAmount) : currentCash + absAmount;

        newTxs.push({
          id: `tx-${Date.now()}-${s.id}`,
          studentId: s.id,
          studentName: s.name,
          type: isDeduction ? 'expense' : 'income',
          category: isDeduction ? '벌금' : '보너스',
          amount: absAmount,
          targetWallet: 'cash',
          description,
          processedBy: '선생님',
          timestamp: Date.now(),
        });

        return {
          ...s,
          wallets: {
            ...s.wallets,
            cash: nextCash,
          },
        };
      });

      return {
        ...prev,
        students: updatedStudents,
        transactions: [...newTxs, ...prev.transactions],
      };
    });
  };

  // 7. Publish news
  const handlePublishNews = (newsItem: StockNews) => {
    updateState((prev) => ({
      ...prev,
      news: [newsItem, ...prev.news],
    }));
  };

  // 8. Google Sheets sync push/pull
  const handleSyncGoogleSheets = async (action: 'push' | 'pull') => {
    const url = appState.config.googleAppsScriptUrl;
    const result = await storageService.syncWithGoogleAppsScript(url, action, appState);
    if (action === 'pull' && result.success && result.data) {
      setAppState(result.data);
    }
    return result;
  };

  // 상단 [🔄 시트 불러오기] 버튼 클릭 핸들러
  const handleTopPullFromSheet = async () => {
    if (!appState.config.googleAppsScriptUrl) {
      setSyncToast({
        message: '구글 스프레드시트 Web App URL이 아직 등록되지 않았습니다. 연동 가이드 창을 엽니다.',
        type: 'info',
      });
      setIsGoogleSheetsGuideOpen(true);
      return;
    }

    setIsSheetSyncing(true);
    setSyncToast({ message: '구글 스프레드시트에서 최신 학생 데이터와 통장 기록을 불러오는 중...', type: 'info' });
    const res = await handleSyncGoogleSheets('pull');
    setIsSheetSyncing(false);

    if (res.success) {
      soundEffects.playSuccess();
      setSyncToast({ message: '✅ 구글 시트에서 최신 학급 데이터를 성공적으로 불러왔습니다!', type: 'success' });
    } else {
      soundEffects.playError();
      setSyncToast({ message: `❌ 시트 불러오기 실패: ${res.message}`, type: 'error' });
    }

    setTimeout(() => {
      setSyncToast((cur) => (cur?.message.includes(res.message) || cur?.type === 'success' ? null : cur));
    }, 4000);
  };

  // 상단 [💾 시트에 결과 저장] 버튼 클릭 핸들러
  const handleTopPushToSheet = async () => {
    if (!appState.config.googleAppsScriptUrl) {
      setSyncToast({
        message: '구글 스프레드시트 Web App URL이 아직 등록되지 않았습니다. 연동 가이드 창을 엽니다.',
        type: 'info',
      });
      setIsGoogleSheetsGuideOpen(true);
      return;
    }

    setIsSheetSyncing(true);
    setSyncToast({ message: '현재 학생 자산, 주가, 거래 내역을 구글 시트에 기록하는 중...', type: 'info' });
    const res = await handleSyncGoogleSheets('push');
    setIsSheetSyncing(false);

    if (res.success) {
      soundEffects.playFanfare();
      setSyncToast({ message: '✅ 구글 스프레드시트에 모든 학급 데이터가 완벽히 저장되었습니다!', type: 'success' });
    } else {
      soundEffects.playError();
      setSyncToast({ message: `❌ 시트 저장 실패: ${res.message}`, type: 'error' });
    }

    setTimeout(() => {
      setSyncToast((cur) => (cur?.message.includes(res.message) || cur?.type === 'success' ? null : cur));
    }, 4000);
  };

  // 9. Export / Import / Reset
  const handleExportJson = () => {
    const jsonStr = storageService.exportDataJson(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cucumber_money_planet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    const importedState = storageService.importDataJson(jsonStr);
    setAppState(importedState);
  };

  const handleResetDefaults = () => {
    const resetState = storageService.resetToDefaults();
    setAppState(resetState);
  };

  const handleToggleSound = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. 상단 공통 헤더: [🔄 시트 불러오기] & [💾 시트에 결과 저장] 탑재 */}
      <Header
        currentStudent={currentStudent}
        totalNetWorth={totalNetWorth}
        onOpenTellerDesk={() => setIsTellerDeskOpen(true)}
        onOpenTeacherConsole={() => setIsTeacherConsoleOpen(true)}
        onSwitchStudent={() => setIsStudentLoginOpen(true)}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onPullFromSheet={handleTopPullFromSheet}
        onPushToSheet={handleTopPushToSheet}
        isSheetSyncing={isSheetSyncing}
      />

      {/* 스프레드시트 동기화 알림 배너 */}
      {syncToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm transition-all ${
              syncToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : syncToast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-teal-50 text-teal-900 border-teal-300'
            }`}
          >
            <span>{syncToast.message}</span>
            <button
              onClick={() => setSyncToast(null)}
              className="ml-3 text-xs underline font-normal opacity-80 hover:opacity-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 2. 메인 컨테이너 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 학생 지갑 요약 카드 (현금 지갑 / 저금통 / 투자 계좌) */}
        {currentStudent && (
          <WalletSummaryCards
            student={currentStudent}
            savingsInterestRate={appState.config.savingsInterestRate}
            stockEvaluationAmount={stockEvaluationAmount}
            onOpenTransferModal={() => {
              soundEffects.playClick();
              setIsTransferModalOpen(true);
            }}
          />
        )}

        {/* 3. 4대 메인 탭 네비게이션 */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 overflow-x-auto scrollbar-none shadow-xs">
          {[
            { id: 'passbook', label: 'My 통장 내역', icon: FileText, emoji: '📗' },
            { id: 'market', label: '주식 시장', icon: TrendingUp, emoji: '📈' },
            { id: 'news', label: '주식 뉴스', icon: Newspaper, emoji: '📰' },
            { id: 'portfolio', label: '내 포트폴리오', icon: PieChart, emoji: '📊' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80 scale-[1.01]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. 탭 콘텐츠 영역 */}
        <div className="pt-2">
          {activeTab === 'passbook' && currentStudent && (
            <PassbookTab student={currentStudent} transactions={appState.transactions} />
          )}

          {activeTab === 'market' && currentStudent && (
            <StockMarketTab
              stocks={appState.stocks}
              student={currentStudent}
              onTradeStock={handleTradeStock}
            />
          )}

          {activeTab === 'news' && (
            <StockNewsTab newsList={appState.news} stocks={appState.stocks} />
          )}

          {activeTab === 'portfolio' && currentStudent && (
            <PortfolioTab
              student={currentStudent}
              stocks={appState.stocks}
              onOpenSellModal={(stock) => {
                // switch to market tab with sell modal
                setActiveTab('market');
              }}
              onClaimDividends={handleClaimDividends}
            />
          )}
        </div>

      </main>

      {/* 5. 모달 컴포넌트들 */}

      {/* 지갑 이체 모달 */}
      {currentStudent && (
        <TransferModal
          student={currentStudent}
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onTransfer={handleTransfer}
        />
      )}

      {/* 은행원 창구 모달 */}
      <TellerDeskModal
        isOpen={isTellerDeskOpen}
        onClose={() => setIsTellerDeskOpen(false)}
        students={appState.students}
        tellerPin={appState.config.tellerPin}
        onExecuteTellerTransaction={handleExecuteTellerTransaction}
      />

      {/* 선생님 최고 관리자 콘솔 */}
      <TeacherConsoleModal
        isOpen={isTeacherConsoleOpen}
        onClose={() => setIsTeacherConsoleOpen(false)}
        students={appState.students}
        stocks={appState.stocks}
        news={appState.news}
        config={appState.config}
        onUpdateStudents={(nextStudents) => updateState((p) => ({ ...p, students: nextStudents }))}
        onUpdateStocks={(nextStocks) => updateState((p) => ({ ...p, stocks: nextStocks }))}
        onUpdateConfig={(nextCfg) => updateState((p) => ({ ...p, config: nextCfg }))}
        onPublishNews={handlePublishNews}
        onDistributeInterest={handleDistributeInterest}
        onDistributeBonus={handleDistributeBonus}
        onOpenGoogleSheetsGuide={() => setIsGoogleSheetsGuideOpen(true)}
        onSyncGoogleSheets={handleSyncGoogleSheets}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetDefaults={handleResetDefaults}
      />

      {/* 구글 스프레드시트 연동 가이드 및 code.gs 복사 모달 */}
      <GoogleSheetsGuideModal
        isOpen={isGoogleSheetsGuideOpen}
        onClose={() => setIsGoogleSheetsGuideOpen(false)}
        appsScriptCode={APPS_SCRIPT_CODE}
      />

      {/* 학생 전환 / 로그인 모달 */}
      {isStudentLoginOpen && (
        <StudentLoginModal
          students={appState.students}
          onSelectStudent={(selected) => {
            setCurrentStudentId(selected.id);
            setIsStudentLoginOpen(false);
          }}
          onOpenTellerDesk={() => {
            setIsStudentLoginOpen(false);
            setIsTellerDeskOpen(true);
          }}
          onOpenTeacherConsole={() => {
            setIsStudentLoginOpen(false);
            setIsTeacherConsoleOpen(true);
          }}
        />
      )}

      {/* 하단 푸터 */}
      <footer className="mt-auto py-5 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🥒</span>
            <span className="font-bold text-slate-800">오이 머니 플래닛</span>
            <span className="text-slate-400">| 초등학교 학급 경제 스톡 & 뱅킹</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>실시간 자동 동기화 활성</span>
            <span>•</span>
            <button
              onClick={() => setIsGoogleSheetsGuideOpen(true)}
              className="hover:text-emerald-700 underline font-medium"
            >
              Google Apps Script 연동
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTeacherConsoleOpen(true)}
              className="hover:text-emerald-700 underline font-medium"
            >
              선생님 설정
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
