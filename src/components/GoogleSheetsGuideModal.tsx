import React, { useState } from 'react';
import { soundEffects } from '../services/sound';
import { X, Copy, Check, ExternalLink, Sheet, FileCode, CheckCircle2 } from 'lucide-react';

interface GoogleSheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptCode: string;
}

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({
  isOpen,
  onClose,
  appsScriptCode,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sheet className="w-6 h-6 text-emerald-300" />
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                구글 스프레드시트 연동 가이드 & Apps Script (code.gs)
              </h2>
              <span className="text-xs text-emerald-200">
                학교 계정 구글 드라이브와 3분 만에 실시간 동기화 설정하기
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

        {/* 본문 */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* 쉬운 4단계 안내 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="font-extrabold text-emerald-800 text-sm block mb-1">
                1단계: 구글 시트 만들기
              </span>
              <p className="text-slate-600 leading-relaxed">
                구글 드라이브에서 새 스프레드시트를 하나 만듭니다. (예: <code>오이 머니 플래닛_우리반</code>)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200">
              <span className="font-extrabold text-teal-800 text-sm block mb-1">
                2단계: Apps Script 열기
              </span>
              <p className="text-slate-600 leading-relaxed">
                스프레드시트 상단 메뉴 <strong>[확장 프로그램] ➔ [Apps Script]</strong>를 클릭합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="font-extrabold text-blue-800 text-sm block mb-1">
                3단계: 아래 코드 붙여넣기
              </span>
              <p className="text-slate-600 leading-relaxed">
                기존 코드를 모두 지우고, 아래의 <strong>[code.gs 전체 복사]</strong> 버튼을 눌러 붙여넣은 뒤 저장(Ctrl+S)합니다.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
              <span className="font-extrabold text-purple-800 text-sm block mb-1">
                4단계: 웹 앱 배포 & URL 복사
              </span>
              <p className="text-slate-600 leading-relaxed">
                우측 상단 <strong>[배포] ➔ [새 배포]</strong> ➔ 유형: <strong>웹 앱</strong> ➔ 액세스 권한: <strong>모든 사용자(Anyone)</strong>로 배포 후 URL을 복사해 설정창에 넣으세요!
              </p>
            </div>
          </div>

          {/* 코드 영역 및 복사 버튼 */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold">code.gs (Google Apps Script)</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : 'code.gs 전체 복사'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed">
              {appsScriptCode}
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
};
