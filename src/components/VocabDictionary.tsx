import React, { useState, useMemo } from 'react';
import { VocabWord, UserSRSStore } from '../types';
import { playPronunciation } from '../utils/tts';
import { toggleStarWord } from '../utils/srs';
import { 
  Search, 
  Volume2, 
  Star, 
  BookOpen, 
  Sparkles, 
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Headphones
} from 'lucide-react';

interface VocabDictionaryProps {
  allWords: VocabWord[];
  srsStore: UserSRSStore;
  onUpdateStore: (store: UserSRSStore) => void;
  selectedGrade: number;
  onSelectGrade: (grade: number) => void;
  onLaunchUnitFlashcard: (grade: number, unit: number) => void;
  onLaunchUnitDictation: (grade: number, unit: number) => void;
}

export const VocabDictionary: React.FC<VocabDictionaryProps> = ({
  allWords,
  srsStore,
  onUpdateStore,
  selectedGrade,
  onSelectGrade,
  onLaunchUnitFlashcard,
  onLaunchUnitDictation,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<number | 'all'>('all');

  // Available units for current grade
  const gradeWords = useMemo(() => {
    return allWords.filter(w => w.grade === selectedGrade);
  }, [allWords, selectedGrade]);

  const units = useMemo(() => {
    const map = new Map<number, string>();
    gradeWords.forEach(w => {
      if (!map.has(w.unit)) {
        map.set(w.unit, w.unitTitle);
      }
    });
    return Array.from(map.entries())
      .map(([unit, unitTitle]) => ({ unit, unitTitle }))
      .sort((a, b) => a.unit - b.unit);
  }, [gradeWords]);

  // Filtered words
  const displayedWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return gradeWords.filter(w => {
      if (selectedUnit !== 'all' && w.unit !== selectedUnit) {
        return false;
      }
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        w.unitTitle.toLowerCase().includes(q) ||
        w.ipa.toLowerCase().includes(q) ||
        (w.topic && w.topic.toLowerCase().includes(q))
      );
    });
  }, [gradeWords, selectedUnit, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tra cứu toàn diện</span>
            <span aria-hidden="true">·</span>
            <span>Bộ sách giáo khoa Global Success Lớp 1 - 12</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-0.5">
            Từ Điển & Bài Học Theo Unit
          </h2>
        </div>

        {/* Grade Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="grade-select" className="text-xs font-semibold text-slate-600">
            Chọn lớp:
          </label>
          <select
            id="grade-select"
            value={selectedGrade}
            onChange={(e) => {
              onSelectGrade(Number(e.target.value));
              setSelectedUnit('all');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-200"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Tiếng Anh Lớp {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search & Unit Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ tiếng Anh, phiên âm, nghĩa tiếng Việt, hoặc chủ đề..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Unit pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedUnit('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedUnit === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả Unit ({gradeWords.length})
          </button>
          {units.map((u) => (
            <button
              key={u.unit}
              onClick={() => setSelectedUnit(u.unit)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedUnit === u.unit
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {u.unit === 0 ? 'Bổ trợ' : `Unit ${u.unit}`}
            </button>
          ))}
        </div>
      </div>

      {/* Unit Flashcard Launcher Banner (if specific unit selected) */}
      {selectedUnit !== 'all' && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-indigo-950">
              {selectedUnit === 0 ? 'Từ vựng Bổ trợ' : `Unit ${selectedUnit}`}: {units.find(u => u.unit === selectedUnit)?.unitTitle}
            </h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              Đang xem {displayedWords.length} từ vựng thuộc Unit này
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onLaunchUnitDictation(selectedGrade, selectedUnit as number)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Nghe viết Unit này</span>
            </button>
            <button
              onClick={() => onLaunchUnitFlashcard(selectedGrade, selectedUnit as number)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Học Flashcard Unit này</span>
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Từ vựng (Word)</th>
                <th className="py-3 px-3">Từ loại</th>
                <th className="py-3 px-3">Phiên âm (IPA)</th>
                <th className="py-3 px-4">Nghĩa tiếng Việt</th>
                <th className="py-3 px-4 hidden md:table-cell">Mẫu câu trọng tâm</th>
                <th className="py-3 px-3">Ghi nhớ SRS</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedWords.map((word) => {
                const card = srsStore.cards[word.id];
                const isStarred = !!card?.starred;

                let srsBadge = (
                  <span className="text-[11px] text-slate-400 font-medium">Chưa học</span>
                );
                if (card) {
                  if (card.status === 'mastered') {
                    srsBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Đã thuộc
                      </span>
                    );
                  } else if (card.dueDate <= Date.now()) {
                    srsBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <Clock className="w-3.5 h-3.5" />
                        Đến hạn
                      </span>
                    );
                  } else {
                    srsBadge = (
                      <span className="text-[11px] font-medium text-sky-600">
                        {card.repetitions} lần ôn
                      </span>
                    );
                  }
                }

                return (
                  <tr key={word.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Word + Audio */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{word.word}</span>
                        <button
                          onClick={() => playPronunciation(word.word)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        ({word.type})
                      </span>
                    </td>

                    {/* IPA */}
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">
                      {word.ipa}
                    </td>

                    {/* Meaning */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {word.meaning}
                    </td>

                    {/* Example sentence */}
                    <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-500 italic max-w-xs">
                      {word.example ? `"${word.example}"` : '—'}
                    </td>

                    {/* SRS Status */}
                    <td className="py-3 px-3">
                      {srsBadge}
                    </td>

                    {/* Actions: Star */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onUpdateStore(toggleStarWord(srsStore, word.id))}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isStarred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title="Đánh dấu từ yêu thích"
                      >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayedWords.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            Không tìm thấy từ vựng nào phù hợp với từ khóa "{searchQuery}"
          </div>
        )}
      </div>

    </div>
  );
};
