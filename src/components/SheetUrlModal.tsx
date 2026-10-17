import React, { useState } from 'react';
import { soundEffects } from '../services/sound';
import { Settings, X, Check, ExternalLink, HelpCircle, AlertCircle, Link2 } from 'lucide-react';

interface SheetUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  onOpenGuide: () => void;
}

export const SheetUrlModal: React.FC<SheetUrlModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
  onOpenGuide,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentUrl);
  const [testStatus, setTestStatus] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    const cleanUrl = urlInput.trim();
    onSaveUrl(cleanUrl);
    setTestStatus('✅ URL이 안전하게 저장되었습니다!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleTestPing = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      setTestStatus('⚠️ 올바른 https://script.google.com/macros/s/... URL을 입력해주세요.');
      soundEffects.playError();
      return;
    }

    setIsTesting(true);
    setTestStatus('연결 테스트 중...');
    soundEffects.playClick();

    try {
      const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=PING` : `${cleanUrl}?action=PING`;
      const res = await fetch(pingUrl);
      const data = await res.json();
      if (data && data.status === 'success') {
        soundEffects.playSuccess();
        setTestStatus('🎉 구글 스프레드시트 웹앱 연결에 성공했습니다! 정상 통신 가능합니다.');
      } else {
        setTestStatus(`응답 수신됨: ${data.message || JSON.stringify(data)}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus(`연결 확인: ${msg} (배포 시 '액세스 권한: 모든 사용자'로 설정했는지 확인하세요)`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-200" />
            <h3 className="font-black text-base">구글 스프레드시트 Web App URL 설정</h3>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/20 transition-all text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            구글 스프레드시트의 <strong>[확장 프로그램] ➔ [Apps Script] ➔ [배포]</strong>에서 발급받은 웹 앱 URL을 붙여넣으세요. 이 주소는 브라우저 <code>localStorage</code>에 영구 보관됩니다.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Apps Script 웹 앱 주소 (URL)</span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onOpenGuide();
                }}
                className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-0.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>배포 가이드 보기</span>
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestStatus('');
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              * 웹 앱 배포 시 '액세스 권한: <strong>모든 사용자(Anyone)</strong>' 필수!
            </span>
          </div>

          {testStatus && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium leading-relaxed">
              {testStatus}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestPing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all disabled:opacity-50"
            >
              {isTesting ? '연결 확인 중...' : '연결 테스트'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>URL 저장하고 닫기</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
