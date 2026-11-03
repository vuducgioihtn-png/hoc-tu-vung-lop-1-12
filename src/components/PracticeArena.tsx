import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabWord, UserSRSStore } from '../types';
import { playPronunciation } from '../utils/tts';
import { updateCardReview } from '../utils/srs';
import confetti from 'canvas-confetti';
import { 
  Brain, 
  HelpCircle, 
  Type, 
  Gamepad2, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  Eye,
  Trophy
} from 'lucide-react';

interface PracticeArenaProps {
  words: VocabWord[];
  srsStore: UserSRSStore;
  onUpdateStore: (store: UserSRSStore) => void;
  selectedGradeTitle: string;
}

type PracticeSubMode = 'quiz' | 'spelling' | 'match' | 'cloze';

interface MatchCard {
  id: string;
  wordId: string;
  text: string;
  type: 'word' | 'meaning';
  isMatched: boolean;
}

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  words,
  srsStore,
  onUpdateStore,
  selectedGradeTitle,
}) => {
  const [subMode, setSubMode] = useState<PracticeSubMode>('quiz');
  
  // Quiz state
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizQuestionsAnswered, setQuizQuestionsAnswered] = useState<number>(0);

  // Spelling state
  const [spellingIndex, setSpellingIndex] = useState<number>(0);
  const [typedInput, setTypedInput] = useState<string>('');
  const [spellingStatus, setSpellingStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [revealedLetters, setRevealedLetters] = useState<number>(0);

  // Match Game state
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [matchAttempts, setMatchAttempts] = useState<number>(0);
  const [matchCompleted, setMatchCompleted] = useState<boolean>(false);

  // Cloze / Sentence state
  const [clozeIndex, setClozeIndex] = useState<number>(0);
  const [selectedClozeWord, setSelectedClozeWord] = useState<string | null>(null);
  const [isClozeAnswered, setIsClozeAnswered] = useState<boolean>(false);

  // Stable shuffled pool of words for current grade based on IDs list
  const wordsKey = useMemo(() => words.map((w) => w.id).join(','), [words]);

  const studyPool = useMemo(() => {
    if (!words || words.length === 0) return [];
    return [...words].sort(() => Math.random() - 0.5);
  }, [wordsKey]);

  // Current quiz word and 4 options
  const currentQuizWord = studyPool.length > 0 ? studyPool[quizIndex % studyPool.length] : words[0];
  
  const quizOptions = useMemo(() => {
    if (!currentQuizWord) return [];
    const others = words
      .filter((w) => w.id !== currentQuizWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaning);

    const all = [currentQuizWord.meaning, ...others];
    return all.sort(() => Math.random() - 0.5);
  }, [currentQuizWord, wordsKey]);

  // Handle quiz option click
  const handleQuizAnswer = (option: string) => {
    if (isAnswered || !currentQuizWord) return;
    setSelectedOption(option);
    setIsAnswered(true);
    setQuizQuestionsAnswered((prev) => prev + 1);

    const isCorrect = option === currentQuizWord.meaning;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      playPronunciation(currentQuizWord.word);
      onUpdateStore(updateCardReview(srsStore, currentQuizWord.id, 'good'));
    } else {
      onUpdateStore(updateCardReview(srsStore, currentQuizWord.id, 'again'));
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizIndex((prev) => prev + 1);
  };

  // Spelling Handling
  const currentSpellingWord = studyPool.length > 0 ? studyPool[spellingIndex % studyPool.length] : words[0];

  useEffect(() => {
    if (subMode === 'spelling' && currentSpellingWord) {
      setTypedInput('');
      setSpellingStatus('idle');
      setRevealedLetters(0);
      playPronunciation(currentSpellingWord.word);
    }
  }, [subMode, spellingIndex, currentSpellingWord?.id]);

  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpellingWord || spellingStatus === 'correct') return;

    const trimmed = typedInput.trim();
    if (!trimmed) {
      return;
    }

    const normalizedInput = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const target = currentSpellingWord.word.toLowerCase().replace(/\s+/g, ' ');

    if (normalizedInput === target) {
      setSpellingStatus('correct');
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      onUpdateStore(updateCardReview(srsStore, currentSpellingWord.id, 'easy'));
    } else {
      setSpellingStatus('wrong');
      onUpdateStore(updateCardReview(srsStore, currentSpellingWord.id, 'again'));
    }
  };

  const handleSpellingHint = () => {
    if (!currentSpellingWord) return;
    if (revealedLetters < currentSpellingWord.word.length) {
      const nextCount = revealedLetters + 1;
      setRevealedLetters(nextCount);
      setTypedInput(currentSpellingWord.word.slice(0, nextCount));
      if (spellingStatus === 'wrong') {
        setSpellingStatus('idle');
      }
    }
  };

  const handleNextSpelling = () => {
    setSpellingIndex((prev) => prev + 1);
    setTypedInput('');
    setSpellingStatus('idle');
    setRevealedLetters(0);
  };

  // Match Game Setup (5 words = 10 cards)
  const initializeMatchGame = useCallback(() => {
    const selected = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
    const cards: MatchCard[] = [];

    selected.forEach((w) => {
      cards.push({
        id: `word_${w.id}`,
        wordId: w.id,
        text: w.word,
        type: 'word',
        isMatched: false,
      });
      cards.push({
        id: `meaning_${w.id}`,
        wordId: w.id,
        text: w.meaning,
        type: 'meaning',
        isMatched: false,
      });
    });

    setMatchCards(cards.sort(() => Math.random() - 0.5));
    setSelectedCardIds([]);
    setMatchAttempts(0);
    setMatchCompleted(false);
  }, [words]);

  useEffect(() => {
    if (subMode === 'match') {
      initializeMatchGame();
    }
  }, [subMode, initializeMatchGame]);

  const handleMatchCardClick = (cardId: string) => {
    if (selectedCardIds.length === 2 || selectedCardIds.includes(cardId)) return;

    const card = matchCards.find((c) => c.id === cardId);
    if (!card || card.isMatched) return;

    // Speak if English word clicked
    if (card.type === 'word') {
      playPronunciation(card.text);
    }

    const newSelected = [...selectedCardIds, cardId];
    setSelectedCardIds(newSelected);

    if (newSelected.length === 2) {
      setMatchAttempts((prev) => prev + 1);
      const first = matchCards.find((c) => c.id === newSelected[0])!;
      const second = matchCards.find((c) => c.id === newSelected[1])!;

      if (first.wordId === second.wordId) {
        // Matched!
        setTimeout(() => {
          setMatchCards((prev) =>
            prev.map((c) => (c.wordId === first.wordId ? { ...c, isMatched: true } : c))
          );
          setSelectedCardIds([]);

          // Check if all matched
          const remaining = matchCards.filter(
            (c) => !c.isMatched && c.wordId !== first.wordId
          ).length;
          if (remaining === 0) {
            setMatchCompleted(true);
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        }, 350);
      } else {
        // Not matched - flip back after delay
        setTimeout(() => {
          setSelectedCardIds([]);
        }, 900);
      }
    }
  };

  // Sentence / Cloze Handling
  const wordsWithExamples = useMemo(() => {
    return words.filter((w) => w.example && w.example.toLowerCase().includes(w.word.toLowerCase()));
  }, [wordsKey]);

  const currentClozeWord = wordsWithExamples[clozeIndex % (wordsWithExamples.length || 1)];

  const clozeOptions = useMemo(() => {
    if (!currentClozeWord) return [];
    const others = words
      .filter((w) => w.id !== currentClozeWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);

    return [currentClozeWord.word, ...others].sort(() => Math.random() - 0.5);
  }, [currentClozeWord, wordsKey]);

  const clozeSentenceParts = useMemo(() => {
    if (!currentClozeWord || !currentClozeWord.example) return null;
    const regex = new RegExp(`\\b${currentClozeWord.word}\\b`, 'i');
    const parts = currentClozeWord.example.split(regex);
    return {
      before: parts[0] || '',
      after: parts[1] || '',
    };
  }, [currentClozeWord]);

  const handleSelectCloze = (opt: string) => {
    if (isClozeAnswered || !currentClozeWord) return;
    setSelectedClozeWord(opt);
    setIsClozeAnswered(true);

    if (opt.toLowerCase() === currentClozeWord.word.toLowerCase()) {
      playPronunciation(currentClozeWord.example);
      onUpdateStore(updateCardReview(srsStore, currentClozeWord.id, 'good'));
    } else {
      onUpdateStore(updateCardReview(srsStore, currentClozeWord.id, 'again'));
    }
  };

  const handleNextCloze = () => {
    setSelectedClozeWord(null);
    setIsClozeAnswered(false);
    setClozeIndex((prev) => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Header and Submode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{selectedGradeTitle}</span>
            <span aria-hidden="true">·</span>
            <span>Đấu trường ghi nhớ 4 giác quan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-0.5">
            Luyện Tập & Củng Cố Trí Nhớ
          </h2>
        </div>

        {/* Practice Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSubMode('quiz')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              subMode === 'quiz' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            Trắc nghiệm
          </button>
          <button
            onClick={() => setSubMode('spelling')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              subMode === 'spelling' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-emerald-600" />
            Luyện gõ từ
          </button>
          <button
            onClick={() => setSubMode('match')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              subMode === 'match' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />
            Ghép cặp
          </button>
          <button
            onClick={() => setSubMode('cloze')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              subMode === 'cloze' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Điền mẫu câu
          </button>
        </div>
      </div>

      {/* 1. QUIZ CHALLENGE MODE */}
      {subMode === 'quiz' && currentQuizWord && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Câu {quizIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-700 tabular-nums">
                Điểm: {quizScore} / {quizQuestionsAnswered}
              </span>
            </div>
          </div>

          <div className="text-center py-4 mb-6">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Hãy chọn nghĩa tiếng Việt của từ:
            </span>
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                {currentQuizWord.word}
              </h3>
              <button
                onClick={() => playPronunciation(currentQuizWord.word)}
                className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 font-mono text-sm mt-1">{currentQuizWord.ipa}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {quizOptions.map((opt, idx) => {
              const isCorrectOption = opt === currentQuizWord.meaning;
              const isUserChoice = opt === selectedOption;

              let btnStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
              if (isAnswered) {
                if (isCorrectOption) {
                  btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold shadow-xs';
                } else if (isUserChoice && !isCorrectOption) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-800';
                } else {
                  btnStyle = 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                  {isAnswered && isUserChoice && !isCorrectOption && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Ví dụ minh họa:</p>
                <p className="text-sm font-medium text-slate-800 italic mt-0.5">
                  "{currentQuizWord.example}"
                </p>
                {currentQuizWord.exampleVi && (
                  <p className="text-xs text-slate-500 mt-0.5">→ {currentQuizWord.exampleVi}</p>
                )}
              </div>
              <button
                onClick={handleNextQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 self-end sm:self-center"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. SPELLING & DICTATION MODE */}
      {subMode === 'spelling' && currentSpellingWord && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Luyện nghe viết từ #{spellingIndex + 1}
            </span>
            <span className="text-slate-500">Độ dài: {currentSpellingWord.word.length} ký tự</span>
          </div>

          <div className="text-center py-4 mb-6">
            <button
              onClick={() => playPronunciation(currentSpellingWord.word)}
              className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-transform hover:scale-105 shadow-xs mb-3"
              title="Bấm để nghe lại phát âm"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <p className="text-xs text-slate-400">Bấm loa để nghe phát âm chuẩn Anh - Anh (UK / en-GB)</p>
            <p className="text-xl font-bold text-slate-900 mt-3 font-display">
              {currentSpellingWord.meaning}
            </p>
            <p className="text-xs font-mono text-slate-500 mt-1">
              <span className="font-sans font-bold text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded mr-1">UK</span>
              {currentSpellingWord.ipa}
            </p>

            {/* Revealed letters hint */}
            {revealedLetters > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1 font-mono text-lg font-bold text-slate-700">
                {currentSpellingWord.word.split('').map((char, i) => (
                  <span
                    key={i}
                    className={`w-7 h-9 flex items-center justify-center rounded border ${
                      i < revealedLetters ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-300'
                    }`}
                  >
                    {i < revealedLetters ? char : '_'}
                  </span>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleCheckSpelling} className="max-w-md mx-auto space-y-4">
            <div>
              <input
                type="text"
                autoFocus
                disabled={spellingStatus === 'correct'}
                value={typedInput}
                onChange={(e) => {
                  setTypedInput(e.target.value);
                  if (spellingStatus === 'wrong') {
                    setSpellingStatus('idle');
                  }
                }}
                placeholder="Gõ từ tiếng Anh tại đây..."
                className={`w-full px-4 py-3 rounded-xl border text-center text-lg font-semibold tracking-wide transition-all focus:outline-hidden ${
                  spellingStatus === 'correct'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200'
                    : spellingStatus === 'wrong'
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 ring-2 ring-rose-200'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleSpellingHint}
                className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Gợi ý ({revealedLetters}/{currentSpellingWord.word.length})</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {spellingStatus === 'wrong' && (
                  <button
                    type="button"
                    onClick={handleNextSpelling}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Bỏ qua từ này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {spellingStatus === 'correct' ? (
                  <button
                    type="button"
                    onClick={handleNextSpelling}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                  >
                    <span>Chính xác! Tiếp tục</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    {spellingStatus === 'wrong' ? 'Kiểm tra lại' : 'Kiểm tra'}
                  </button>
                )}
              </div>
            </div>

            {spellingStatus === 'wrong' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
                <div>
                  <span>Chưa chính xác! Đáp án đúng: </span>
                  <strong className="font-bold underline text-rose-950 font-mono text-sm ml-1">
                    {currentSpellingWord.word}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTypedInput(currentSpellingWord.word);
                    setSpellingStatus('idle');
                  }}
                  className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 rounded-md font-semibold text-[11px] shrink-0 cursor-pointer shadow-xs"
                >
                  Điền đáp án đúng
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 3. MEMORY MATCH CARDS GAME */}
      {subMode === 'match' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Ghép thẻ từ vựng & nghĩa tương ứng
            </span>
            <div className="flex items-center gap-3">
              <span>Lượt thử: <strong className="tabular-nums text-slate-800">{matchAttempts}</strong></span>
              <button
                onClick={initializeMatchGame}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Chơi lại
              </button>
            </div>
          </div>

          {matchCompleted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Xuất Sắc! Bạn Đã Hoàn Thành</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Bạn đã ghép đúng tất cả các cặp từ trong <strong className="text-slate-800">{matchAttempts}</strong> lượt thử!
              </p>
              <button
                onClick={initializeMatchGame}
                className="mt-6 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Chơi ván mới với 5 từ khác
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {matchCards.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                const isMatched = card.isMatched;

                let cardStyle = 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800';
                if (isMatched) {
                  cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-60 line-through';
                } else if (isSelected) {
                  cardStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200 scale-102';
                }

                return (
                  <button
                    key={card.id}
                    disabled={isMatched}
                    onClick={() => handleMatchCardClick(card.id)}
                    className={`min-h-[90px] p-3 rounded-xl border text-center flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer shadow-2xs ${cardStyle}`}
                  >
                    <span className="block">{card.text}</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-normal">
                      {card.type === 'word' ? 'English' : 'Tiếng Việt'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SENTENCE CLOZE (GLOBAL SUCCESS FOCUS) */}
      {subMode === 'cloze' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          {currentClozeWord && clozeSentenceParts ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
                <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                  Mẫu câu trọng tâm Unit {currentClozeWord.unit}
                </span>
                <span className="text-slate-500">
                  Câu #{clozeIndex + 1}
                </span>
              </div>

              <div className="text-center py-6 mb-6">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Điền từ thích hợp vào chỗ trống:
                </span>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed font-display">
                  <span>{clozeSentenceParts.before}</span>
                  <span className="inline-block mx-2 px-3 py-1 bg-amber-100 text-amber-900 border-b-2 border-amber-500 rounded-md">
                    {selectedClozeWord ? selectedClozeWord : '_______'}
                  </span>
                  <span>{clozeSentenceParts.after}</span>
                </p>
                {currentClozeWord.exampleVi && (
                  <p className="text-sm text-slate-500 mt-3 italic">
                    Nghĩa câu: "{currentClozeWord.exampleVi}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
                {clozeOptions.map((opt, i) => {
                  const isCorrect = opt.toLowerCase() === currentClozeWord.word.toLowerCase();
                  const isChosen = opt === selectedClozeWord;

                  let optClass = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                  if (isClozeAnswered) {
                    if (isCorrect) {
                      optClass = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold';
                    } else if (isChosen && !isCorrect) {
                      optClass = 'bg-rose-50 border-rose-300 text-rose-800';
                    } else {
                      optClass = 'bg-slate-50 border-slate-100 text-slate-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isClozeAnswered}
                      onClick={() => handleSelectCloze(opt)}
                      className={`p-3.5 rounded-xl border text-center text-sm font-semibold transition-all ${optClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isClozeAnswered && (
                <div className="flex justify-center">
                  <button
                    onClick={handleNextCloze}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Mẫu câu tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">Đang chuẩn bị các mẫu câu...</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
