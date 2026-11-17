import React from 'react';
import { BookOpen, Layers, Brain, Award, Search, Sparkles, Flame, CheckCircle2, Headphones } from 'lucide-react';

type NavTab = 'overview' | 'flashcard' | 'dictation' | 'practice' | 'srs' | 'dictionary' | 'grade1_visual';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedGrade: number;
  onSelectGrade: (grade: number) => void;
  dueCount: number;
  streak: number;
  onStartDueReview: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedGrade,
  onSelectGrade,
  dueCount,
  streak,
  onStartDueReview,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Brand title, single line */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  EduVocab
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
                  Lớp 1 - 12 · Global Success
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 Navigation links, single line text */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('overview')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'overview'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => {
                if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(selectedGrade)) onSelectGrade(1);
                onSelectTab('grade1_visual');
              }}
              className={`px-3 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'grade1_visual'
                  ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50 font-semibold'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Góc Trực Quan Lớp 1 - 12</span>
            </button>
            <button
              onClick={() => onSelectTab('flashcard')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'flashcard'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Flashcard 3D
            </button>
            <button
              onClick={() => onSelectTab('dictation')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'dictation'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Headphones className="w-4 h-4" />
              Nghe viết
            </button>
            <button
              onClick={() => onSelectTab('practice')}
              className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'practice'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Brain className="w-4 h-4" />
              Luyện tập & Quiz
            </button>
            <button
              onClick={() => onSelectTab('srs')}
              className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'srs'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Lặp lại ngắt quãng (SRS)
            </button>
            <button
              onClick={() => onSelectTab('dictionary')}
              className={`px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                currentTab === 'dictionary'
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Tra cứu Unit
            </button>
          </nav>

          {/* Zone 3: Primary Action & Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Streak counter */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60"
              title={`Bạn đã duy trì học liên tục ${streak} ngày!`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="tabular-nums">{streak}</span>
              <span className="hidden sm:inline">ngày</span>
            </div>

            {/* Quick Due Card Button */}
            {dueCount > 0 ? (
              <button
                onClick={onStartDueReview}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <span>Ôn hôm nay</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white text-indigo-700 text-[11px] font-bold tabular-nums">
                  {dueCount}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('flashcard')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Học từ mới</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-100 gap-1 text-xs">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'overview' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => {
              if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(selectedGrade)) onSelectGrade(1);
              onSelectTab('grade1_visual');
            }}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-bold ${
              currentTab === 'grade1_visual' ? 'bg-amber-100 text-amber-900' : 'text-amber-700'
            }`}
          >
            Lớp 1 - 12 🎨
          </button>
          <button
            onClick={() => onSelectTab('flashcard')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'flashcard' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Flashcard
          </button>
          <button
            onClick={() => onSelectTab('dictation')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'dictation' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Nghe viết
          </button>
          <button
            onClick={() => onSelectTab('practice')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'practice' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Luyện tập
          </button>
          <button
            onClick={() => onSelectTab('srs')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'srs' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            SRS ({dueCount})
          </button>
          <button
            onClick={() => onSelectTab('dictionary')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              currentTab === 'dictionary' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Từ điển
          </button>
        </div>
      </div>
    </header>
  );
};
