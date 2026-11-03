import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabWord, CardSRS, SRSRating, UserSRSStore } from '../types';
import { playPronunciation } from '../utils/tts';
import { updateCardReview, toggleStarWord } from '../utils/srs';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  RotateCw, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Play, 
  Pause, 
  Filter, 
  Sparkles, 
  CheckCircle, 
  HelpCircle,
  Lightbulb,
  BookOpen,
  Sliders,
  Keyboard
} from 'lucide-react';

interface SmartFlashcardProps {
  words: VocabWord[];
  srsStore: UserSRSStore;
  onUpdateStore: (store: UserSRSStore) => void;
  selectedGradeTitle: string;
  onSelectAnotherGrade?: () => void;
  initialFilter?: 'all' | 'due' | 'starred' | 'unlearned';
}

export const SmartFlashcard: React.FC<SmartFlashcardProps> = ({
  words,
  srsStore,
  onUpdateStore,
  selectedGradeTitle,
  initialFilter = 'all',
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'starred' | 'unlearned'>(initialFilter);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [slowAudio, setSlowAudio] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  // Filter words
  const filteredWords = React.useMemo(() => {
    const now = Date.now();
    return words.filter((w) => {
      const card = srsStore.cards[w.id];
      if (filterMode === 'starred') {
        return !!card?.starred;
      }
      if (filterMode === 'due') {
        return card && card.dueDate <= now;
      }
      if (filterMode === 'unlearned') {
        return !card || card.repetitions === 0;
      }
      return true;
    });
  }, [words, srsStore, filterMode]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= filteredWords.length) {
      setCurrentIndex(Math.max(0, filteredWords.length - 1));
    }
    setIsFlipped(false);
  }, [filteredWords.length, currentIndex]);

  const activeWord = filteredWords[currentIndex];
  const activeCard: CardSRS | undefined = activeWord ? srsStore.cards[activeWord.id] : undefined;

  // Speak word
  const speakCurrentWord = useCallback((overrideText?: string) => {
    if (!activeWord) return;
    const textToSpeak = overrideText || activeWord.word;
    playPronunciation(textToSpeak, slowAudio ? 0.75 : 0.95);
  }, [activeWord, slowAudio]);

  // Handle Flip
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => {
      const next = !prev;
      if (!prev) {
        // If flipping to back, don't auto speak, but user knows
      }
      return next;
    });
  }, []);

  // Next & Prev Card
  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed full cycle!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      setCurrentIndex(0);
    }
  }, [currentIndex, filteredWords.length]);

  const handlePrev = useCallback(() => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredWords.length - 1));
  }, [filteredWords.length]);

  // Shuffle Deck
  const handleShuffle = () => {
    setIsFlipped(false);
    const newIdx = Math.floor(Math.random() * filteredWords.length);
    setCurrentIndex(newIdx);
  };

  // Star Toggle
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWord) return;
    const updated = toggleStarWord(srsStore, activeWord.id);
    onUpdateStore(updated);
  };

  // SRS Rating Selection
  const handleRate = (rating: SRSRating) => {
    if (!activeWord) return;
    const updated = updateCardReview(srsStore, activeWord.id, rating);
    onUpdateStore(updated);
    
    // Auto advance to next card
    setTimeout(() => {
      handleNext();
    }, 180);
  };

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isAutoPlaying || filteredWords.length === 0) return;

    const timer = setInterval(() => {
      setIsFlipped(prev => {
        if (!prev) {
          return true; // Flip to back
        } else {
          // Advance to next
          handleNext();
          return false;
        }
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [isAutoPlaying, filteredWords.length, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        speakCurrentWord();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleFlip, handleNext, handlePrev, isFlipped, speakCurrentWord]);

  if (filteredWords.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Không có thẻ nào trong bộ lọc này</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          {filterMode === 'due' 
            ? 'Tuyệt vời! Bạn đã hoàn thành tất cả các từ cần ôn tập hôm nay.' 
            : filterMode === 'starred'
            ? 'Bạn chưa đánh dấu sao từ vựng nào. Hãy nhấn biểu tượng ngôi sao trên thẻ để lưu từ khó.'
            : 'Hãy chuyển bộ lọc sang "Tất cả" để tiếp tục học tập.'}
        </p>
        <button
          onClick={() => setFilterMode('all')}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Xem tất cả từ vựng ({words.length})
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / filteredWords.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Top Deck Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{selectedGradeTitle}</span>
            <span aria-hidden="true">·</span>
            <span>Unit {activeWord.unit}: {activeWord.unitTitle}</span>
            {activeWord.level && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-indigo-600 uppercase">{activeWord.level}</span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-0.5">
            Flashcard Thông Minh (SM-2)
          </h2>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => { setFilterMode('all'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({words.length})
          </button>
          <button
            onClick={() => { setFilterMode('due'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'due' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cần ôn lại
          </button>
          <button
            onClick={() => { setFilterMode('starred'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'starred' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã đánh dấu ⭐
          </button>
          <button
            onClick={() => { setFilterMode('unlearned'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              filterMode === 'unlearned' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa thuộc
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-6">
        <div 
          className="bg-indigo-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Flashcard Container with 3D Flip */}
      <div className="relative perspective-1000 w-full min-h-[380px] sm:min-h-[420px] select-none">
        <div
          onClick={handleFlip}
          className={`relative w-full min-h-[380px] sm:min-h-[420px] rounded-2xl cursor-pointer transition-transform duration-500 preserve-3d shadow-md hover:shadow-lg border border-slate-200/80 bg-white ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full p-6 sm:p-8 flex flex-col justify-between backface-hidden bg-white rounded-2xl">
            
            {/* Top row: Topic, Part of Speech, Star, Audio buttons */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  ({activeWord.type})
                </span>
                {activeWord.topic && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600 font-medium">{activeWord.topic}</span>
                  </>
                )}
                {activeCard?.status && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className={`capitalize font-medium ${
                      activeCard.status === 'mastered' ? 'text-emerald-600' :
                      activeCard.status === 'review' ? 'text-sky-600' : 'text-amber-600'
                    }`}>
                      {activeCard.status === 'mastered' ? 'Đã thuộc' :
                       activeCard.status === 'review' ? 'Đang ôn' : 'Mới học'}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlowAudio(!slowAudio);
                  }}
                  className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-colors ${
                    slowAudio ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Chế độ đọc chậm cho người mới học"
                >
                  {slowAudio ? '0.75x' : '1.0x'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleStar}
                  className={`p-2 rounded-lg transition-colors ${
                    activeCard?.starred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Đánh dấu từ vựng cần lưu ý"
                >
                  <Star className={`w-5 h-5 ${activeCard?.starred ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Center: Main Word & IPA Pronunciation */}
            <div className="my-auto text-center py-4">
              
              {/* Visual Icon / Emoji for Visual Memory */}
              {activeWord.visualIcon && (
                <div className="text-5xl sm:text-6xl mb-2 animate-bounce transition-transform hover:scale-110 select-none">
                  {activeWord.visualIcon}
                </div>
              )}

              {/* Phonics Letter & Sound */}
              {activeWord.phonics && (
                <div className="inline-block px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 text-xs font-bold mb-2">
                  {activeWord.phonics}
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                {activeWord.word}
              </h1>
              
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-700 font-mono text-base sm:text-lg">
                <span className="text-[11px] font-sans font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">UK</span>
                <span>{activeWord.ipa}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakCurrentWord();
                  }}
                  className="p-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Nghe phát âm chuẩn Anh - Anh (UK) (Phím A)"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Phonics Chant Button */}
              {activeWord.chant && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakCurrentWord(activeWord.chant);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold transition-colors border border-indigo-200/50"
                  >
                    <span>🎵 Bài vè Phonics: "{activeWord.chant}"</span>
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-3">
                Chạm vào thẻ hoặc bấm phím <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Space</kbd> để xem nghĩa & ví dụ
              </p>
            </div>

            {/* Bottom: Repetitions & Progress */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-semibold text-slate-700">
                  {currentIndex + 1} / {filteredWords.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>Ôn lại: {activeCard ? `${activeCard.repetitions} lần` : 'Chưa học'}</span>
              </div>
              <div className="flex items-center gap-1 text-indigo-600 font-medium">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Lật mặt sau</span>
              </div>
            </div>

          </div>

          {/* BACK FACE (Rotated 180deg) */}
          <div className="absolute inset-0 w-full h-full p-6 sm:p-8 flex flex-col justify-between backface-hidden rotate-y-180 bg-linear-to-b from-indigo-50/40 via-white to-white rounded-2xl">
            
            {/* Header: English word reference + close/flip back */}
            <div className="flex items-center justify-between w-full border-b border-indigo-100/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-slate-900">{activeWord.word}</span>
                <span className="text-xs font-mono text-slate-500">{activeWord.ipa}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakCurrentWord();
                  }}
                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Định nghĩa & Mẫu câu
              </span>
            </div>

            {/* Content: Vietnamese meaning & Example sentence */}
            <div className="my-auto py-3 space-y-4">
              {/* Meaning */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Nghĩa tiếng Việt</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-950 font-display">
                    {activeWord.meaning}
                  </p>
                </div>
                {activeWord.visualIcon && (
                  <span className="text-4xl sm:text-5xl select-none p-2 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    {activeWord.visualIcon}
                  </span>
                )}
              </div>

              {/* Example Context */}
              {activeWord.example && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      Mẫu câu trọng tâm (Global Success)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakCurrentWord(activeWord.example);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Nghe câu
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-800 italic">
                    "{activeWord.example}"
                  </p>
                  {activeWord.exampleVi && (
                    <p className="text-xs text-slate-500 mt-1">
                      → {activeWord.exampleVi}
                    </p>
                  )}
                </div>
              )}

              {/* Mnemonic / Memory tip */}
              {activeWord.mnemonic && (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-left flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Mẹo nhớ trực quan:</span>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {activeWord.mnemonic}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SRS Rating Actions */}
            <div className="pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
              <p className="text-center text-xs font-medium text-slate-500 mb-2">
                Bạn nhớ từ này như thế nào? (Chọn để thuật toán SRS lên lịch ôn tập)
              </p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors font-medium text-xs group"
                >
                  <span className="font-bold">Quên</span>
                  <span className="text-[10px] text-rose-500 mt-0.5">Ôn lại ngay (1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors font-medium text-xs group"
                >
                  <span className="font-bold">Khó</span>
                  <span className="text-[10px] text-amber-600 mt-0.5">+1 ngày (2)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors font-medium text-xs group"
                >
                  <span className="font-bold">Tốt</span>
                  <span className="text-[10px] text-sky-600 mt-0.5">+3 ngày (3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-medium text-xs group"
                >
                  <span className="font-bold">Rất dễ</span>
                  <span className="text-[10px] text-emerald-600 mt-0.5">+7 ngày (4)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Deck Controls Toolbar */}
      <div className="flex items-center justify-between gap-3 mt-6">
        
        {/* Left: Previous button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Từ trước</span>
          </button>
          
          <button
            type="button"
            onClick={handleShuffle}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Xáo trộn ngẫu nhiên"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Flip & Auto-Play */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFlip}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>{isFlipped ? 'Xem mặt trước' : 'Lật thẻ (Space)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              isAutoPlaying 
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Tự động lật và chuyển thẻ tiếp theo"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'Dừng' : 'Tự chạy'}</span>
          </button>
        </div>

        {/* Right: Next button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
            title="Phím tắt bàn phím"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <span className="hidden sm:inline">Từ tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      {showShortcuts && (
        <div className="mt-4 p-3 rounded-xl bg-slate-100 text-slate-700 text-xs flex flex-wrap items-center justify-center gap-4 animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">Space</kbd> : Lật thẻ
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">←</kbd> / <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">→</kbd> : Chuyển từ
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">A</kbd> : Phát âm
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-300 font-mono">1 - 4</kbd> : Đánh giá SRS
          </span>
        </div>
      )}

    </div>
  );
};
