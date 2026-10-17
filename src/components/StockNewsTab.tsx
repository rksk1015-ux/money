import React, { useState } from 'react';
import { StockNews, StockCompany } from '../types/economy';
import { soundEffects } from '../services/sound';
import {
  Newspaper,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Lightbulb,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface StockNewsTabProps {
  newsList: StockNews[];
  stocks: StockCompany[];
}

export const StockNewsTab: React.FC<StockNewsTabProps> = ({
  newsList,
  stocks,
}) => {
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(
    newsList[0]?.id || null
  );

  const stockMap = React.useMemo(() => {
    const map: Record<string, StockCompany> = {};
    stocks.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [stocks]);

  const selectedNews = newsList.find((n) => n.id === selectedNewsId) || newsList[0];

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case '산업혁신':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '금리·배당':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '바이오임상':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-green-900 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">📰</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-white/20 rounded-full border border-white/30 text-white">
            경제 & 기업 뉴스룸
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mt-1">
          오이 머니 플래닛 주간 경제 뉴스
        </h2>
        <p className="text-xs text-emerald-100/90 mt-0.5">
          실제 세상의 뉴스처럼, 기업의 새로운 소식과 사건이 주가에 미치는 영향을 알아보고 경제 감각을 키워보세요!
        </p>
      </div>

      {/* 뉴스 목록 및 상세 뷰 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 좌측 뉴스 목록 (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase">
              헤드라인 뉴스 피드
            </span>
            <span className="text-xs text-emerald-700 font-bold">
              총 {newsList.length}건의 뉴스
            </span>
          </div>

          <div className="space-y-2.5">
            {newsList.map((news) => {
              const isSelected = news.id === selectedNews?.id;
              return (
                <button
                  key={news.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedNewsId(news.id);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        news.badge
                      )}`}
                    >
                      {news.badge}
                    </span>
                    {news.setNumber && (
                      <span className="text-[11px] font-bold text-slate-400">
                        시나리오 {news.setNumber}세트
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {news.content}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측 선택된 뉴스 상세 & 교육 포인트 카드 (7 cols) */}
        {selectedNews && (
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
            
            {/* 뉴스 헤드라인 헤더 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(
                    selectedNews.badge
                  )}`}
                >
                  {selectedNews.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  학급 경제 정규 속보
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {selectedNews.title}
              </h2>
            </div>

            {/* 뉴스 본문 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
              {selectedNews.content}
            </div>

            {/* 주가 변동 영향 분석 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>이 뉴스로 인한 4대 기업 주가 변동 결과</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selectedNews.effects).map(([compId, delta]) => {
                  const comp = stockMap[compId];
                  if (!comp) return null;
                  const isUp = delta > 0;
                  const isDown = delta < 0;

                  return (
                    <div
                      key={compId}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isUp
                          ? 'bg-rose-50/70 border-rose-200'
                          : isDown
                          ? 'bg-blue-50/70 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{comp.icon}</span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {comp.name}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs text-slate-500">영향:</span>
                        <span
                          className={`text-sm font-black flex items-center gap-0.5 ${
                            isUp ? 'text-rose-600' : isDown ? 'text-blue-600' : 'text-slate-600'
                          }`}
                        >
                          {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                          {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                          {isUp ? `+${delta} 오이` : isDown ? `${delta} 오이` : '영향 없음'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 선생님의 경제 한마디 (교육 포인트 핵심 박스) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-200/80 shadow-sm relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lightbulb className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <span>선생님의 경제 한마디 (배움 쏙쏙!)</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed font-medium">
                    {selectedNews.educationPoint}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
