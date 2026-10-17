import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  Student,
  StockCompany,
  StockNews,
  EconomyConfig,
  WalletType,
  TransactionRecord,
  StudentRole,
  StudentSheetItem,
  AssignmentItem,
  AssignmentResult,
  INITIAL_ROLES,
} from './types/economy';
import { storageService } from './services/storage';
import { soundEffects } from './services/sound';
import { APPS_SCRIPT_CODE } from './constants/appsScriptCode';
import confetti from 'canvas-confetti';

import { Header } from './components/Header';
import { WalletSummaryCards } from './components/WalletSummaryCards';
import { TransferModal } from './components/TransferModal';
import { PassbookTab } from './components/PassbookTab';
import { StockMarketTab } from './components/StockMarketTab';
import { StockNewsTab } from './components/StockNewsTab';
import { PortfolioTab } from './components/PortfolioTab';
import { RoleAssignmentTab } from './components/RoleAssignmentTab';
import { TellerDeskModal } from './components/TellerDeskModal';
import { TeacherConsoleModal } from './components/TeacherConsoleModal';
import { GoogleSheetsGuideModal } from './components/GoogleSheetsGuideModal';
import { StudentLoginModal } from './components/StudentLoginModal';
import { SheetUrlModal } from './components/SheetUrlModal';

import {
  FileText,
  TrendingUp,
  Newspaper,
  PieChart,
  Coins,
  ArrowLeftRight,
  Briefcase,
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => storageService.loadInitialState());
  const [currentStudentId, setCurrentStudentId] = useState<string>(() => {
    return appState.students[0]?.id || '';
  });

  // Active Main Tab: 'passbook' | 'market' | 'news' | 'portfolio' | 'roles'
  const [activeTab, setActiveTab] = useState<'passbook' | 'market' | 'news' | 'portfolio' | 'roles'>('roles');

  // Roles & Assignments state
  const [roles, setRoles] = useState<StudentRole[]>(() => {
    return appState.roles && appState.roles.length > 0 ? appState.roles : INITIAL_ROLES;
  });
  const [assignmentResults, setAssignmentResults] = useState<AssignmentResult[]>(() => {
    return appState.assignmentResults || [];
  });
  const [currentAssignments, setCurrentAssignments] = useState<AssignmentItem[]>(() => {
    // Generate initial assignments from students and roles
    return appState.students.map((s, idx) => {
      const assignedRole = (appState.roles && appState.roles[idx]) || INITIAL_ROLES[idx % INITIAL_ROLES.length];
      return {
        num: s.studentNumber || idx + 1,
        name: s.name,
        role: s.isTeller ? '은행원' : assignedRole.role,
        desc: s.isTeller ? '학급 은행 창구 입출금 및 통장 관리' : assignedRole.desc,
      };
    });
  });

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isTellerDeskOpen, setIsTellerDeskOpen] = useState<boolean>(false);
  const [isTeacherConsoleOpen, setIsTeacherConsoleOpen] = useState<boolean>(false);
  const [isGoogleSheetsGuideOpen, setIsGoogleSheetsGuideOpen] = useState<boolean>(false);
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState<boolean>(false);
  const [isSheetUrlModalOpen, setIsSheetUrlModalOpen] = useState<boolean>(false);

  // Google Sheets sync state
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // URL state with localStorage backup
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const localSaved = localStorage.getItem('cucumber_sheet_url');
      if (localSaved) return localSaved;
    }
    return appState.config.googleAppsScriptUrl || '';
  });

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

  // 구글 시트 URL 저장 핸들러
  const handleSaveSheetUrl = (newUrl: string) => {
    setSheetUrl(newUrl);
    try {
      localStorage.setItem('cucumber_sheet_url', newUrl);
    } catch {}
    updateState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        googleAppsScriptUrl: newUrl,
      },
    }));
    soundEffects.playSuccess();
    setSyncToast({ message: '✅ 구글 시트 Web App URL이 성공적으로 저장되었습니다.', type: 'success' });
  };

  // 1. 구글 시트에서 명단/결과 불러오기 (GET 요청)
  const handlePullFromSheet = useCallback(async (isSilent: boolean = false) => {
    const targetUrl = sheetUrl.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      if (!isSilent) {
        soundEffects.playError();
        setSyncToast({
          message: '구글 스프레드시트 Web App URL이 아직 등록되지 않았습니다. [⚙️ 시트 URL 설정]에서 주소를 먼저 입력해주세요.',
          type: 'info',
        });
        setIsSheetUrlModalOpen(true);
      }
      return;
    }

    setIsPulling(true);
    if (!isSilent) {
      setSyncToast({ message: '구글 스프레드시트에서 학생 명단, 역할, 배정 결과를 불러오는 중...', type: 'info' });
    }

    const res = await storageService.fetchSheetRoleData(targetUrl);
    setIsPulling(false);

    if (!res.success) {
      if (!isSilent) {
        soundEffects.playError();
        setSyncToast({
          message: `❌ 시트 불러오기 실패: ${res.message} (기존 화면 데이터가 안전하게 유지됩니다)`,
          type: 'error',
        });
      }
      return;
    }

    // 성공 시 데이터 파싱 및 반영 (객체 구조 보존)
    if (res.roles && res.roles.length > 0) {
      setRoles(res.roles);
      updateState((p) => ({ ...p, roles: res.roles }));
    }

    if (res.results) {
      setAssignmentResults(res.results);
      updateState((p) => ({ ...p, assignmentResults: res.results }));

      // 최근 결과가 있으면 currentAssignments에도 반영
      if (res.results.length > 0) {
        const latestDate = res.results[res.results.length - 1]?.date;
        const latestItems = res.results.filter((r) => r.date === latestDate);
        if (latestItems.length > 0) {
          setCurrentAssignments(
            latestItems.map((item) => ({
              num: item.num,
              name: item.name,
              role: item.role,
              desc: item.desc,
            }))
          );
        }
      }
    }

    if (res.students && res.students.length > 0) {
      updateState((prev) => {
        const existingStudentMap = new Map(prev.students.map((s) => [s.name, s]));
        const nextStudents: Student[] = res.students!.map((sItem) => {
          const existing = existingStudentMap.get(sItem.name);
          if (existing) {
            return {
              ...existing,
              studentNumber: sItem.num,
              name: sItem.name,
            };
          }
          // 시트에 새로 등록된 학생인 경우 기본 계좌 생성
          return {
            id: `student-sheet-${sItem.num}-${Date.now()}`,
            name: sItem.name,
            studentNumber: sItem.num,
            avatar: '🥒',
            pin: '1234',
            wallets: { cash: 50, savings: 0, invest: 0 },
            portfolio: {},
            isTeller: false,
          };
        });

        return {
          ...prev,
          students: nextStudents,
        };
      });

      // currentAssignments가 비어있다면 새로 매칭
      setCurrentAssignments((prev) => {
        if (prev.length > 0) return prev;
        const curRoles = (res.roles && res.roles.length > 0) ? res.roles : roles;
        return res.students!.map((s, idx) => ({
          num: s.num,
          name: s.name,
          role: curRoles[idx % curRoles.length]?.role || '칠판당번',
          desc: curRoles[idx % curRoles.length]?.desc || '학급 활동',
        }));
      });
    }

    if (!isSilent) {
      soundEffects.playSuccess();
      setSyncToast({
        message: `✅ 구글 시트에서 학생 명단(${res.students?.length || 0}명), 역할(${res.roles?.length || 0}종), 배정 결과를 성공적으로 불러왔습니다!`,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 5000);
    }
  }, [sheetUrl, updateState, roles]);

  // 페이지 열릴 때 자동으로 시트 불러오기 (URL이 있을 경우)
  useEffect(() => {
    if (sheetUrl && sheetUrl.startsWith('http')) {
      handlePullFromSheet(true);
    }
  }, []);

  // 2. 배정 결과 구글 시트에 저장하기 (POST 요청)
  const handlePushAssignmentsToSheet = async () => {
    const targetUrl = sheetUrl.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      soundEffects.playError();
      setSyncToast({
        message: '구글 스프레드시트 Web App URL이 아직 등록되지 않았습니다. [⚙️ 시트 URL 설정]에서 주소를 먼저 입력해주세요.',
        type: 'info',
      });
      setIsSheetUrlModalOpen(true);
      return;
    }

    if (currentAssignments.length === 0) {
      alert('저장할 1인 1역할 배정 결과가 없습니다. 먼저 [랜덤 배정하기]나 역할을 지정해주세요.');
      return;
    }

    setIsPushing(true);
    setSyncToast({ message: '1인 1역할 배정 결과를 구글 스프레드시트에 저장하는 중...', type: 'info' });

    // assignments의 각 항목은 { num: student.num, name: student.name, role: selectedRole.role, desc: selectedRole.desc }
    const assignmentsPayload = currentAssignments.map((a) => ({
      num: typeof a.num === 'number' ? a.num : parseInt(String(a.num), 10) || 0,
      name: String(a.name || ''),
      role: String(a.role || ''),
      desc: String(a.desc || ''),
    }));

    const res = await storageService.saveAssignmentsToSheet(targetUrl, assignmentsPayload);
    setIsPushing(false);

    if (res.success) {
      soundEffects.playFanfare();
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {}

      // 저장된 히스토리 로컬에도 추가
      const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const newHistoryItems: AssignmentResult[] = assignmentsPayload.map((item) => ({
        date: nowStr,
        num: item.num,
        name: item.name,
        role: item.role,
        desc: item.desc,
      }));

      setAssignmentResults((prev) => [...prev, ...newHistoryItems]);
      updateState((prev) => ({
        ...prev,
        assignmentResults: [...(prev.assignmentResults || []), ...newHistoryItems],
      }));

      // 은행원으로 배정된 학생은 학급 공인 은행원(isTeller)으로 자동 동기화!
      const tellerNames = new Set(assignmentsPayload.filter((a) => a.role === '은행원').map((a) => a.name));
      if (tellerNames.size > 0) {
        updateState((prev) => ({
          ...prev,
          students: prev.students.map((s) => ({
            ...s,
            isTeller: tellerNames.has(s.name),
          })),
        }));
      }

      setSyncToast({
        message: `✅ ${res.message}`,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 5000);
    } else {
      soundEffects.playError();
      setSyncToast({
        message: `❌ 시트 저장 실패: ${res.message}`,
        type: 'error',
      });
    }
  };

  // 학생 명단 업데이트 시 연동
  const handleUpdateStudentsFromRoles = (nextStudents: StudentSheetItem[]) => {
    updateState((prev) => {
      const existingMap = new Map(prev.students.map((s) => [s.name, s]));
      const updated: Student[] = nextStudents.map((item) => {
        const exist = existingMap.get(item.name);
        if (exist) {
          return { ...exist, studentNumber: item.num, name: item.name };
        }
        return {
          id: `student-${Date.now()}-${item.num}`,
          name: item.name,
          studentNumber: item.num,
          avatar: '🥒',
          pin: '1234',
          wallets: { cash: 50, savings: 0, invest: 0 },
          portfolio: {},
          isTeller: false,
        };
      });
      return { ...prev, students: updated };
    });
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
      
      {/* 1. 상단 공통 헤더: [⚙️ 시트 URL 설정], [🔄 시트에서 명단/결과 불러오기], [💾 배정 결과 구글 시트에 저장] */}
      <Header
        currentStudent={currentStudent}
        totalNetWorth={totalNetWorth}
        onOpenTellerDesk={() => setIsTellerDeskOpen(true)}
        onOpenTeacherConsole={() => setIsTeacherConsoleOpen(true)}
        onOpenSheetSettings={() => setIsSheetUrlModalOpen(true)}
        onSwitchStudent={() => setIsStudentLoginOpen(true)}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onPullFromSheet={() => handlePullFromSheet(false)}
        onPushToSheet={handlePushAssignmentsToSheet}
        isPulling={isPulling}
        isPushing={isPushing}
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

        {/* 3. 메인 탭 네비게이션: 1인 1역할 배정 포함 */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 overflow-x-auto scrollbar-none shadow-xs">
          {[
            { id: 'roles', label: '1인 1역할 배정', icon: Briefcase, emoji: '💼' },
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
          {activeTab === 'roles' && (
            <RoleAssignmentTab
              students={appState.students.map((s, idx) => ({
                num: s.studentNumber || idx + 1,
                name: s.name,
              }))}
              roles={roles}
              currentAssignments={currentAssignments}
              savedResults={assignmentResults}
              onUpdateStudents={handleUpdateStudentsFromRoles}
              onUpdateRoles={(nextRoles) => {
                setRoles(nextRoles);
                updateState((p) => ({ ...p, roles: nextRoles }));
              }}
              onUpdateAssignments={(nextA) => setCurrentAssignments(nextA)}
              onPullFromSheet={() => handlePullFromSheet(false)}
              onPushAssignmentsToSheet={handlePushAssignmentsToSheet}
              isPulling={isPulling}
              isPushing={isPushing}
              sheetUrl={sheetUrl}
              onOpenSheetSettings={() => setIsSheetUrlModalOpen(true)}
            />
          )}

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
                setActiveTab('market');
              }}
              onClaimDividends={handleClaimDividends}
            />
          )}
        </div>

      </main>

      {/* 5. 모달 컴포넌트들 */}

      {/* [⚙️ 시트 URL 설정] 모달 */}
      <SheetUrlModal
        isOpen={isSheetUrlModalOpen}
        onClose={() => setIsSheetUrlModalOpen(false)}
        currentUrl={sheetUrl}
        onSaveUrl={handleSaveSheetUrl}
        onOpenGuide={() => {
          setIsSheetUrlModalOpen(false);
          setIsGoogleSheetsGuideOpen(true);
        }}
      />

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
