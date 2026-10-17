import React from 'react';
import { Student } from '../types/economy';
import { soundEffects } from '../services/sound';
import {
  Coins,
  ShieldCheck,
  Building2,
  LogOut,
  Volume2,
  VolumeX,
  UserCheck,
  RefreshCw,
  Save,
  Sheet,
} from 'lucide-react';

interface HeaderProps {
  currentStudent: Student | null;
  totalNetWorth: number;
  onOpenTellerDesk: () => void;
  onOpenTeacherConsole: () => void;
  onSwitchStudent: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onPullFromSheet: () => void;
  onPushToSheet: () => void;
  isSheetSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  totalNetWorth,
  onOpenTellerDesk,
  onOpenTeacherConsole,
  onSwitchStudent,
  isMuted,
  onToggleSound,
  onPullFromSheet,
  onPushToSheet,
  isSheetSyncing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-md border-b border-emerald-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* 로고 & 타이틀 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/30 backdrop-blur-sm animate-bounce-subtle">
              🥒
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-700/80 rounded-full text-emerald-100 border border-emerald-500/50">
                  초등 학급 경제
                </span>
                <span className="text-xs text-emerald-200 hidden sm:inline">스톡 & 뱅킹</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                오이 머니 플래닛
              </h1>
            </div>
          </div>

          {/* 중앙: 학생 프로필 정보 (로그인 시) */}
          {currentStudent && (
            <div className="hidden md:flex items-center gap-3 bg-emerald-700/70 py-1.5 px-3.5 rounded-2xl border border-emerald-500/60 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-white text-slate-800 flex items-center justify-center text-lg font-bold shadow-sm">
                {currentStudent.avatar || '🥒'}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">
                    {currentStudent.name}
                  </span>
                  {currentStudent.isTeller && (
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <UserCheck className="w-3 h-3" /> 은행원
                    </span>
                  )}
                </div>
                <div className="text-xs text-emerald-100 flex items-center gap-1">
                  <span>총 자산:</span>
                  <span className="font-extrabold text-amber-300 text-sm">
                    {totalNetWorth.toLocaleString()} 오이
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* [🔄 시트 불러오기] 버튼 */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onPullFromSheet();
              }}
              disabled={isSheetSyncing}
              title="구글 스프레드시트에서 최신 학생 자산 및 통장 데이터 가져오기"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-teal-700/90 hover:bg-teal-700 active:scale-95 transition-all text-white font-bold text-xs sm:text-sm border border-teal-500/60 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-200 ${isSheetSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">시트 불러오기</span>
              <span className="sm:hidden">불러오기</span>
            </button>

            {/* [💾 시트에 결과 저장] 버튼 */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onPushToSheet();
              }}
              disabled={isSheetSyncing}
              title="현재 학생 자산, 주가, 거래 내역을 구글 스프레드시트에 영구 저장"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 transition-all text-white font-bold text-xs sm:text-sm border border-emerald-500/70 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
              <span className="hidden sm:inline">시트에 결과 저장</span>
              <span className="sm:hidden">시트 저장</span>
            </button>

            {/* 은행 창구 버튼 */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenTellerDesk();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-slate-900 font-bold text-xs sm:text-sm shadow-sm border border-amber-300"
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950" />
              <span className="hidden sm:inline">은행 창구</span>
              <span className="sm:hidden">창구</span>
            </button>

            {/* 선생님 관리 버튼 */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenTeacherConsole();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-900/90 hover:bg-emerald-950 active:scale-95 transition-all text-emerald-100 hover:text-white font-bold text-xs sm:text-sm border border-emerald-700 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
              <span className="hidden lg:inline">선생님 관리</span>
              <span className="lg:hidden">관리</span>
            </button>

            {/* 소리 토글 */}
            <button
              onClick={() => {
                onToggleSound();
                soundEffects.playClick();
              }}
              title={isMuted ? '효과음 켜기' : '효과음 끄기'}
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 active:scale-95 transition-all text-emerald-100 hover:text-white border border-emerald-500/40"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-200" />}
            </button>

            {/* 학생 변경 / 로그아웃 */}
            {currentStudent && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onSwitchStudent();
                }}
                title="학생 변경 (로그아웃)"
                className="p-1.5 sm:p-2 rounded-xl bg-emerald-700/80 hover:bg-rose-600 hover:text-white active:scale-95 transition-all text-emerald-100 border border-emerald-500/40"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
