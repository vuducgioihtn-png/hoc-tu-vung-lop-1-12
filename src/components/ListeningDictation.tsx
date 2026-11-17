import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { VocabWord, UserSRSStore } from '../types';
import { GRADES_LIST, getUnitsByGrade } from '../data';
import { playPronunciation } from '../utils/tts';
import { updateCardReview, toggleStarWord } from '../utils/srs';
import confetti from 'canvas-confetti';
import {
  Headphones,
  Volume2,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  Lightbulb,
  BookOpen,
  Trophy,
  Flame,
  SlidersHorizontal,
  Keyboard,
  SkipForward,
  AlertCircle,
} from 'lucide-react';

interface ListeningDictationProps {
  allWords: VocabWord[];
  selectedGrade: number;
  onSelectGrade: (grade: number) => void;
  srsStore: UserSRSStore;
  onUpdateStore: (store: UserSRSStore) => void;
  initialUnit?: number | 'all';
}

type DictationDifficulty = 'meaning' | 'blind';
type WordFilter = 'all' | 'unlearned' | 'due' | 'starred';

interface SessionResult {
  word: VocabWord;
  firstTryCorrect: boolean;
  usedHint: boolean;
  attempts: number;
  lastUserInput: string;
}

function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');
}

function isAnswerMatch(userInput: string, targetWord: string): boolean {
  const userNorm = normalizeAnswer(userInput);
  const targetNorm = normalizeAnswer(targetWord);
  if (!userNorm) return false;
  if (userNorm === targetNorm) return true;

  // Also accept answer without parenthetical note, e.g. "artificial intelligence (AI)" -> "artificial intelligence"
  const withoutParens = normalizeAnswer(targetWord.replace(/\([^)]*\)/g, ''));
  if (withoutParens && userNorm === withoutParens) return true;

  // Also accept text inside parentheses if it's an alternative full form like "cv (curriculum vitae)"
  const parenMatch = targetWord.match(/\(([^)]+)\)/);
  if (parenMatch && userNorm === normalizeAnswer(parenMatch[1])) return true;

  return false;
}

export const ListeningDictation: React.FC<ListeningDictationProps> = ({
  allWords,
  selectedGrade,
  onSelectGrade,
  srsStore,
  onUpdateStore,
  initialUnit = 'all',
}) => {
  // Scope & Filters
  const [selectedUnit, setSelectedUnit] = useState<number | 'all'>(initialUnit);
  const [wordFilter, setWordFilter] = useState<WordFilter>('all');
  const [sessionLimit, setSessionLimit] = useState<number>(10); // 0 = all
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);

  // Mode & Audio Settings
  const [difficulty, setDifficulty] = useState<DictationDifficulty>('meaning');
  const [showIPA, setShowIPA] = useState<boolean>(false);
  const [showLetterSlots, setShowLetterSlots] = useState<boolean>(true);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(0.9); // 0.9 | 0.75 | 0.6

  // Session Queue & Progress
  const [customRetryWords, setCustomRetryWords] = useState<VocabWord[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [revealedLetters, setRevealedLetters] = useState<number>(0);
  const [revealMeaningTemp, setRevealMeaningTemp] = useState<boolean>(false);
  const [attemptsForCurrent, setAttemptsForCurrent] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [bestCombo, setBestCombo] = useState<number>(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialUnit prop when navigated from Dictionary
  useEffect(() => {
    setSelectedUnit(initialUnit);
    setCustomRetryWords(null);
  }, [initialUnit, selectedGrade]);

  // Available units in selected grade
  const unitsInGrade = useMemo(() => getUnitsByGrade(selectedGrade), [selectedGrade]);
  const selectedGradeObj = useMemo(
    () => GRADES_LIST.find((g) => g.grade === selectedGrade) || GRADES_LIST[0],
    [selectedGrade]
  );

  // Candidate words matching Grade + Unit + SRS Filter
  const filteredPool = useMemo(() => {
    const now = Date.now();
    return allWords.filter((w) => {
      if (w.grade !== selectedGrade) return false;
      if (selectedUnit !== 'all' && w.unit !== selectedUnit) return false;

      const card = srsStore.cards[w.id];
      if (wordFilter === 'unlearned') {
        return !card || card.repetitions === 0;
      }
      if (wordFilter === 'due') {
        return !!card && card.dueDate <= now;
      }
      if (wordFilter === 'starred') {
        return !!card?.starred;
      }
      return true;
    });
  }, [allWords, selectedGrade, selectedUnit, wordFilter, srsStore.cards]);

  // Build active session deck
  const sessionDeck = useMemo(() => {
    if (customRetryWords && customRetryWords.length > 0) {
      return customRetryWords;
    }
    const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
    if (sessionLimit > 0 && shuffled.length > sessionLimit) {
      return shuffled.slice(0, sessionLimit);
    }
    return shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPool, sessionLimit, shuffleSeed, customRetryWords]);

  // Reset session state when scope changes
  const resetSessionState = useCallback(() => {
    setCurrentIndex(0);
    setTypedInput('');
    setStatus('idle');
    setRevealedLetters(0);
    setRevealMeaningTemp(false);
    setAttemptsForCurrent(0);
    setCombo(0);
    setBestCombo(0);
    setResults([]);
    setSessionCompleted(false);
  }, []);

  useEffect(() => {
    resetSessionState();
  }, [selectedGrade, selectedUnit, wordFilter, sessionLimit, shuffleSeed, customRetryWords, resetSessionState]);

  const currentWord: VocabWord | undefined = sessionDeck[currentIndex];
  const currentCard = currentWord ? srsStore.cards[currentWord.id] : undefined;

  const speakWord = useCallback(
    async (text?: string, rateOverride?: number) => {
      const targetText = text || currentWord?.word;
      if (!targetText) return;
      setIsPlayingAudio(true);
      try {
        await playPronunciation(targetText, rateOverride ?? playbackRate);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [currentWord?.word, playbackRate]
  );

  // Auto-play pronunciation when moving to a new word
  useEffect(() => {
    if (!sessionCompleted && currentWord && autoPlay && status === 'idle' && attemptsForCurrent === 0) {
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentWord?.id, sessionCompleted, autoPlay, status, attemptsForCurrent, speakWord]);

  // Focus input on new word
  useEffect(() => {
    if (!sessionCompleted && status !== 'correct') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [currentIndex, sessionCompleted, status]);

  const handleGradeChange = (grade: number) => {
    setCustomRetryWords(null);
    setSelectedUnit('all');
    onSelectGrade(grade);
  };

  const handleRestartNewRound = () => {
    setCustomRetryWords(null);
    setShuffleSeed((prev) => prev + 1);
  };

  const handleNextWord = useCallback(() => {
    if (!currentWord) return;

    if (currentIndex + 1 >= sessionDeck.length) {
      setSessionCompleted(true);
      const firstTryCount = results.filter((r) => r.firstTryCorrect).length;
      if (sessionDeck.length > 0 && firstTryCount / sessionDeck.length >= 0.7) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setTypedInput('');
    setStatus('idle');
    setRevealedLetters(0);
    setRevealMeaningTemp(false);
    setAttemptsForCurrent(0);
  }, [currentWord, currentIndex, sessionDeck.length, results]);

  const handleSubmitCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    // If already correct, pressing Enter advances to next word
    if (status === 'correct') {
      handleNextWord();
      return;
    }

    const normalizedUser = normalizeAnswer(typedInput);
    if (!normalizedUser) {
      speakWord(currentWord.word);
      return;
    }

    const nextAttemptCount = attemptsForCurrent + 1;
    setAttemptsForCurrent(nextAttemptCount);

    if (isAnswerMatch(typedInput, currentWord.word)) {
      const isFirstTry = nextAttemptCount === 1;
      const usedHint = revealedLetters > 0;
      setStatus('correct');

      if (isFirstTry && !usedHint) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        if (nextCombo > bestCombo) setBestCombo(nextCombo);
      } else {
        setCombo(0);
      }

      // Record result once per word
      setResults((prev) => {
        if (prev.some((r) => r.word.id === currentWord.id)) return prev;
        return [
          ...prev,
          {
            word: currentWord,
            firstTryCorrect: isFirstTry && !usedHint,
            usedHint,
            attempts: nextAttemptCount,
            lastUserInput: typedInput.trim(),
          },
        ];
      });

      // Update SRS only on first evaluation if not already recorded wrong
      if (isFirstTry) {
        const rating = usedHint ? 'hard' : difficulty === 'blind' ? 'easy' : 'good';
        onUpdateStore(updateCardReview(srsStore, currentWord.id, rating));
      }

      confetti({ particleCount: 30, spread: 45, origin: { y: 0.65 } });
      speakWord(currentWord.word);
    } else {
      setStatus('wrong');
      setCombo(0);

      // Update SRS as 'again' on first failed attempt
      if (nextAttemptCount === 1) {
        onUpdateStore(updateCardReview(srsStore, currentWord.id, 'again'));
      }
    }
  };

  const handleSkipWord = () => {
    if (!currentWord) return;
    setCombo(0);

    setResults((prev) => {
      if (prev.some((r) => r.word.id === currentWord.id)) return prev;
      return [
        ...prev,
        {
          word: currentWord,
          firstTryCorrect: false,
          usedHint: revealedLetters > 0,
          attempts: attemptsForCurrent,
          lastUserInput: typedInput.trim(),
        },
      ];
    });

    if (attemptsForCurrent === 0) {
      onUpdateStore(updateCardReview(srsStore, currentWord.id, 'again'));
    }

    handleNextWord();
  };

  const handleRevealHintLetter = () => {
    if (!currentWord || status === 'correct') return;
    if (revealedLetters < currentWord.word.length) {
      let nextCount = revealedLetters + 1;
      // Automatically skip over spaces or hyphens when revealing
      while (
        nextCount < currentWord.word.length &&
        (currentWord.word[nextCount - 1] === ' ' || currentWord.word[nextCount - 1] === '-')
      ) {
        nextCount += 1;
      }
      setRevealedLetters(nextCount);
      setTypedInput(currentWord.word.slice(0, nextCount));
      if (status === 'wrong') setStatus('idle');
      inputRef.current?.focus();
    }
  };

  // Global keyboard shortcut: Ctrl + Space or Alt + R to replay audio
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || !currentWord) return;
      if ((e.ctrlKey && e.code === 'Space') || (e.altKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        speakWord(currentWord.word);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sessionCompleted, currentWord, speakWord]);

  // Character diff renderer for wrong answers
  const renderCharacterDiff = (userStr: string, targetStr: string) => {
    const userNorm = userStr.trim();
    const targetNorm = targetStr.trim();
    const maxLen = Math.max(userNorm.length, targetNorm.length);

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-sm">
        {Array.from({ length: maxLen }, (_, idx) => {
          const uChar = userNorm[idx];
          const tChar = targetNorm[idx];
          if (uChar === undefined) {
            return (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200"
                title="Thiếu ký tự"
              >
                _
              </span>
            );
          }
          const isMatch = tChar !== undefined && uChar.toLowerCase() === tChar.toLowerCase();
          return (
            <span
              key={idx}
              className={`px-1.5 py-0.5 rounded border font-bold ${
                isMatch
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border-rose-300 line-through'
              }`}
            >
              {uChar === ' ' ? '␣' : uChar}
            </span>
          );
        })}
      </div>
    );
  };

  const correctCount = results.filter((r) => r.firstTryCorrect).length;
  const accuracyPercent =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-indigo-600">{selectedGradeObj.levelGroupName}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedGradeObj.title}</span>
            {selectedUnit !== 'all' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">
                  {selectedUnit === 0 ? 'Bổ trợ' : `Unit ${selectedUnit}`}
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            <Headphones className="w-6 h-6 text-indigo-600" />
            <span>Luyện Nghe Viết Từ Vựng Theo Lớp</span>
          </h2>
        </div>

        {/* Live Session Stats */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs font-bold text-amber-800">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Combo: {combo}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs font-bold text-emerald-800">
            <Trophy className="w-4 h-4 text-emerald-600" />
            <span className="tabular-nums">
              Chuẩn: {correctCount}/{results.length} ({accuracyPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Grade & Unit Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Grade 1-12 Selector Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn Khối Lớp (Lớp 1 - Lớp 12)
            </span>
            <span className="text-xs text-slate-500">
              {filteredPool.length} từ phù hợp
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {GRADES_LIST.map((g) => {
              const active = g.grade === selectedGrade;
              const groupColor =
                g.levelGroup === 'primary'
                  ? active
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-amber-50/70 text-amber-900 border-amber-200/70 hover:bg-amber-100'
                  : g.levelGroup === 'secondary'
                  ? active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50/60 text-indigo-900 border-indigo-200/70 hover:bg-indigo-100'
                  : active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/60 text-emerald-900 border-emerald-200/70 hover:bg-emerald-100';

              return (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => handleGradeChange(g.grade)}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${groupColor}`}
                >
                  Lớp {g.grade}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unit, Filter, Limit & Difficulty Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Unit Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Unit bài học
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => {
                const val = e.target.value;
                setCustomRetryWords(null);
                setSelectedUnit(val === 'all' ? 'all' : Number(val));
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            >
              <option value="all">Tất cả Unit ({allWords.filter((w) => w.grade === selectedGrade).length} từ)</option>
              {unitsInGrade.map((u) => (
                <option key={u.unit} value={u.unit}>
                  {u.unit === 0 ? 'Bổ trợ' : `Unit ${u.unit}`}: {u.unitTitle} ({u.count} từ)
                </option>
              ))}
            </select>
          </div>

          {/* Word Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Lọc từ vựng
            </label>
            <select
              value={wordFilter}
              onChange={(e) => {
                setCustomRetryWords(null);
                setWordFilter(e.target.value as WordFilter);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            >
              <option value="all">Tất cả từ vựng</option>
              <option value="unlearned">Từ mới / Chưa thuộc</option>
              <option value="due">Đến hạn ôn (SRS)</option>
              <option value="starred">Từ đã đánh dấu ⭐</option>
            </select>
          </div>

          {/* Difficulty Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Chế độ nghe viết
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDifficulty('meaning')}
                className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  difficulty === 'meaning'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kèm nghĩa
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('blind')}
                className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  difficulty === 'blind'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nghe thuần
              </button>
            </div>
          </div>

          {/* Session Count + Shuffle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Số từ mỗi lượt & Đảo từ
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={sessionLimit}
                onChange={(e) => {
                  setCustomRetryWords(null);
                  setSessionLimit(Number(e.target.value));
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
              >
                <option value={10}>10 từ / lượt</option>
                <option value={15}>15 từ / lượt</option>
                <option value={20}>20 từ / lượt</option>
                <option value={0}>Tất cả ({filteredPool.length})</option>
              </select>
              <button
                type="button"
                onClick={handleRestartNewRound}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
                title="Đảo danh sách từ mới"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-slate-400 font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Tùy chỉnh:
            </span>
            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                autoPlay
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {autoPlay ? '🔊 Tự đọc từ mới: Bật' : '🔇 Tự đọc từ mới: Tắt'}
            </button>
            <button
              type="button"
              onClick={() => setShowLetterSlots(!showLetterSlots)}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                showLetterSlots
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {showLetterSlots ? '🔡 Khung số chữ cái: Hiện' : '🔡 Khung số chữ cái: Ẩn'}
            </button>
            <button
              type="button"
              onClick={() => setShowIPA(!showIPA)}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                showIPA
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {showIPA ? '🗣️ Phiên âm IPA: Hiện' : '🗣️ Phiên âm IPA: Ẩn'}
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Keyboard className="w-3.5 h-3.5" />
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono">
                Ctrl+Space
              </kbd>{' '}
              nghe lại ·{' '}
              <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono">
                Enter
              </kbd>{' '}
              kiểm tra / tiếp
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sessionDeck.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            Chưa có từ vựng nào trong bộ lọc này
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {wordFilter === 'due'
              ? 'Bạn chưa có từ nào đến hạn ôn tập SRS ở lớp/unit này.'
              : wordFilter === 'starred'
              ? 'Bạn chưa đánh dấu ⭐ từ nào trong lớp/unit này.'
              : 'Thử chọn "Tất cả từ vựng" hoặc chuyển sang Unit khác để bắt đầu luyện nghe viết.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setWordFilter('all');
              setSelectedUnit('all');
              setCustomRetryWords(null);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Xem tất cả từ Lớp {selectedGrade}
          </button>
        </div>
      )}

      {/* Session Completed Summary */}
      {sessionDeck.length > 0 && sessionCompleted && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold font-display text-slate-900">
              Hoàn Thành Phiên Nghe Viết {selectedGradeObj.title}!
            </h3>
            <p className="text-sm text-slate-500">
              Kết quả đã được đồng bộ tự động vào lịch ôn tập lặp lại ngắt quãng (SRS).
            </p>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
              <span className="text-xs text-slate-500 block">Tổng số từ</span>
              <span className="text-2xl font-extrabold text-slate-900 font-display tabular-nums">
                {results.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/70 text-center">
              <span className="text-xs text-emerald-700 block">Đúng ngay lần đầu</span>
              <span className="text-2xl font-extrabold text-emerald-700 font-display tabular-nums">
                {accuracyPercent}%
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/70 text-center">
              <span className="text-xs text-amber-700 block">Chuỗi Combo cao nhất</span>
              <span className="text-2xl font-extrabold text-amber-700 font-display tabular-nums">
                {bestCombo} 🔥
              </span>
            </div>
          </div>

          {/* Review list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Chi tiết các từ vừa luyện nghe viết</span>
              <span>Trạng thái lần đầu</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {results.map((item) => (
                <div
                  key={item.word.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => speakWord(item.word.word)}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0 cursor-pointer"
                      title="Nghe lại"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{item.word.word}</span>
                        <span className="text-xs font-mono text-slate-400">{item.word.ipa}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.word.meaning}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {item.firstTryCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Chính xác
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        {item.usedHint ? 'Có dùng gợi ý' : 'Cần luyện thêm'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-session actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {results.some((r) => !r.firstTryCorrect) && (
              <button
                type="button"
                onClick={() => {
                  const missed = results.filter((r) => !r.firstTryCorrect).map((r) => r.word);
                  setCustomRetryWords(missed);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  Luyện lại các từ sai/gợi ý ({results.filter((r) => !r.firstTryCorrect).length} từ)
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRestartNewRound}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Luyện lượt từ mới</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Dictation Card */}
      {sessionDeck.length > 0 && !sessionCompleted && currentWord && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${Math.round(((currentIndex + 1) / sessionDeck.length) * 100)}%` }}
            />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Card Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg tabular-nums">
                  Từ {currentIndex + 1} / {sessionDeck.length}
                </span>
                <span className="text-slate-500 font-medium">
                  {currentWord.unit === 0 ? 'Bổ trợ' : `Unit ${currentWord.unit}`}: {currentWord.unitTitle}
                </span>
                {customRetryWords && (
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                    Ôn từ sai
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">
                  {currentWord.word.length} ký tự
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateStore(toggleStarWord(srsStore, currentWord.id))}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentCard?.starred
                      ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                      : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Đánh dấu từ cần chú ý"
                >
                  <Star className={`w-4 h-4 ${currentCard?.starred ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Audio Stage */}
            <div className="text-center space-y-4 py-2">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => speakWord(currentWord.word)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-indigo-600 text-white scale-105 ring-4 ring-indigo-100'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105'
                  }`}
                  title="Nghe phát âm chuẩn Anh - Anh (Ctrl + Space)"
                >
                  <Volume2 className="w-9 h-9" />
                </button>

                {/* Speed Pills */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                  {[
                    { label: '1.0x Chuẩn UK', rate: 0.9 },
                    { label: '0.75x Chậm', rate: 0.75 },
                    { label: '0.6x Rất chậm', rate: 0.6 },
                  ].map((opt) => (
                    <button
                      key={opt.rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(opt.rate);
                        speakWord(currentWord.word, opt.rate);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        playbackRate === opt.rate
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meaning / Blind Hint Section */}
              <div className="pt-1">
                {difficulty === 'meaning' || revealMeaningTemp || status === 'correct' ? (
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                      {currentWord.visualIcon && (
                        <span className="text-2xl select-none">{currentWord.visualIcon}</span>
                      )}
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        ({currentWord.type})
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                        {currentWord.meaning}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-500">
                      Chế độ nghe thuần: Lắng nghe phát âm và viết lại từ chính xác
                    </p>
                    <button
                      type="button"
                      onClick={() => setRevealMeaningTemp(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hé lộ nghĩa tiếng Việt</span>
                    </button>
                  </div>
                )}

                {(showIPA || status === 'correct') && (
                  <p className="text-xs font-mono text-slate-500 mt-1.5">
                    <span className="font-sans font-bold text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1.5">
                      UK
                    </span>
                    {currentWord.ipa}
                  </p>
                )}
              </div>

              {/* Character Slots Indicator */}
              {showLetterSlots && status !== 'correct' && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {currentWord.word.split('').map((char, i) => {
                    if (char === ' ') {
                      return <span key={i} className="w-3" aria-hidden="true" />;
                    }
                    if (char === '-' || char === "'") {
                      return (
                        <span
                          key={i}
                          className="w-5 h-8 flex items-center justify-center font-mono font-bold text-slate-500"
                        >
                          {char}
                        </span>
                      );
                    }
                    const isRevealed = i < revealedLetters;
                    const userChar = typedInput[i];
                    return (
                      <span
                        key={i}
                        className={`w-7 h-9 flex items-center justify-center rounded-lg border font-mono text-base font-bold transition-colors ${
                          isRevealed
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : userChar
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}
                      >
                        {isRevealed ? char : userChar ? userChar : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dictation Input Form */}
            <form onSubmit={handleSubmitCheck} className="max-w-lg mx-auto space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={status === 'correct'}
                  value={typedInput}
                  onChange={(e) => {
                    setTypedInput(e.target.value);
                    if (status === 'wrong') setStatus('idle');
                  }}
                  placeholder="Nghe và gõ từ tiếng Anh tại đây..."
                  className={`w-full px-4 py-3.5 rounded-xl border text-center text-lg sm:text-xl font-bold tracking-wide transition-all focus:outline-hidden ${
                    status === 'correct'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-200'
                      : status === 'wrong'
                      ? 'border-rose-400 bg-rose-50/60 text-rose-900 ring-2 ring-rose-200'
                      : 'border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={status === 'correct' || revealedLetters >= currentWord.word.length}
                    onClick={handleRevealHintLetter}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Gợi ý chữ ({revealedLetters}/{currentWord.word.length})
                    </span>
                  </button>

                  {status !== 'correct' && (
                    <button
                      type="button"
                      onClick={handleSkipWord}
                      className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="Bỏ qua từ này"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Bỏ qua</span>
                    </button>
                  )}
                </div>

                {status === 'correct' ? (
                  <button
                    type="button"
                    onClick={handleNextWord}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ml-auto"
                  >
                    <span>
                      {currentIndex + 1 >= sessionDeck.length ? 'Xem tổng kết' : 'Từ tiếp theo (Enter)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer ml-auto"
                  >
                    {status === 'wrong' ? 'Kiểm tra lại' : 'Kiểm tra (Enter)'}
                  </button>
                )}
              </div>

              {/* Wrong Answer Feedback with Character Diff */}
              {status === 'wrong' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2 text-xs text-rose-800">
                    <span className="font-bold flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Chưa đúng! Hãy đối chiếu từng chữ cái bên dưới và gõ lại:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-white border border-rose-200/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Bạn vừa gõ
                      </span>
                      {renderCharacterDiff(typedInput, currentWord.word)}
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200 space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase block">
                        Đáp án chuẩn ({currentWord.ipa})
                      </span>
                      <div className="font-mono text-base font-extrabold text-emerald-800">
                        {currentWord.word}
                      </div>
                      <div className="text-xs text-slate-600">{currentWord.meaning}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => speakWord(currentWord.word, 0.75)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe chậm 0.75x</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTypedInput('');
                        setStatus('idle');
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Xóa để gõ lại cho nhớ
                    </button>
                  </div>
                </div>
              )}

              {/* Correct Answer Rich Details */}
              {status === 'correct' && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Chính xác! {attemptsForCurrent === 1 && revealedLetters === 0 ? 'Đúng ngay lần đầu ✨' : 'Tuyệt vời!'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-900">
                      {currentWord.word} · {currentWord.ipa}
                    </span>
                  </div>

                  {currentWord.example && (
                    <div className="p-3 rounded-lg bg-white border border-emerald-100 text-left space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          Mẫu câu ứng dụng
                        </span>
                        <button
                          type="button"
                          onClick={() => speakWord(currentWord.example, 0.9)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe câu</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-800 italic">
                        "{currentWord.example}"
                      </p>
                      {currentWord.exampleVi && (
                        <p className="text-xs text-slate-500">→ {currentWord.exampleVi}</p>
                      )}
                    </div>
                  )}

                  {currentWord.mnemonic && (
                    <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/90 border border-amber-200/70 p-2.5 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Mẹo nhớ:</strong> {currentWord.mnemonic}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
