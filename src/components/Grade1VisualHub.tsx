import React, { useState, useMemo, useEffect } from 'react';
import { VocabWord, UserSRSStore } from '../types';
import { playPronunciation } from '../utils/tts';
import { updateCardReview } from '../utils/srs';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  Sparkles, 
  Search, 
  Filter, 
  Smile, 
  CheckCircle2, 
  Trophy, 
  RotateCcw,
  Layers,
  Music,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface Grade1VisualHubProps {
  words: VocabWord[]; // words for currently active grade
  srsStore: UserSRSStore;
  onUpdateStore: (store: UserSRSStore) => void;
  onLaunchFlashcardWithWords: (words: VocabWord[]) => void;
  activeGrade?: number;
  onChangeGrade?: (grade: number) => void;
  grade1Words?: VocabWord[];
  grade2Words?: VocabWord[];
  grade3Words?: VocabWord[];
  grade4Words?: VocabWord[];
  grade5Words?: VocabWord[];
  grade6Words?: VocabWord[];
  grade7Words?: VocabWord[];
  grade8Words?: VocabWord[];
  grade9Words?: VocabWord[];
  grade10Words?: VocabWord[];
  grade11Words?: VocabWord[];
  grade12Words?: VocabWord[];
}

export const Grade1VisualHub: React.FC<Grade1VisualHubProps> = ({
  words,
  srsStore,
  onUpdateStore,
  onLaunchFlashcardWithWords,
  activeGrade = 1,
  onChangeGrade,
  grade1Words,
  grade2Words,
  grade3Words,
  grade4Words,
  grade5Words,
  grade6Words,
  grade7Words,
  grade8Words,
  grade9Words,
  grade10Words,
  grade11Words,
  grade12Words,
}) => {
  const [currentSelectedGrade, setCurrentSelectedGrade] = useState<number>(activeGrade);
  const [selectedPhonic, setSelectedPhonic] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sync internal grade when activeGrade prop changes
  useEffect(() => {
    if (activeGrade && activeGrade !== currentSelectedGrade) {
      setCurrentSelectedGrade(activeGrade);
      setSelectedPhonic('all');
      setSelectedTopic('all');
    }
  }, [activeGrade]);

  // Determine current active words pool based on selected grade
  const currentWords = useMemo(() => {
    if (currentSelectedGrade === 12 && grade12Words && grade12Words.length > 0) {
      return grade12Words;
    }
    if (currentSelectedGrade === 11 && grade11Words && grade11Words.length > 0) {
      return grade11Words;
    }
    if (currentSelectedGrade === 10 && grade10Words && grade10Words.length > 0) {
      return grade10Words;
    }
    if (currentSelectedGrade === 9 && grade9Words && grade9Words.length > 0) {
      return grade9Words;
    }
    if (currentSelectedGrade === 8 && grade8Words && grade8Words.length > 0) {
      return grade8Words;
    }
    if (currentSelectedGrade === 7 && grade7Words && grade7Words.length > 0) {
      return grade7Words;
    }
    if (currentSelectedGrade === 6 && grade6Words && grade6Words.length > 0) {
      return grade6Words;
    }
    if (currentSelectedGrade === 5 && grade5Words && grade5Words.length > 0) {
      return grade5Words;
    }
    if (currentSelectedGrade === 4 && grade4Words && grade4Words.length > 0) {
      return grade4Words;
    }
    if (currentSelectedGrade === 3 && grade3Words && grade3Words.length > 0) {
      return grade3Words;
    }
    if (currentSelectedGrade === 2 && grade2Words && grade2Words.length > 0) {
      return grade2Words;
    }
    if (currentSelectedGrade === 1 && grade1Words && grade1Words.length > 0) {
      return grade1Words;
    }
    return words;
  }, [currentSelectedGrade, words, grade1Words, grade2Words, grade3Words, grade4Words, grade5Words, grade6Words, grade7Words, grade8Words, grade9Words, grade10Words, grade11Words, grade12Words]);

  // Interactive Picture Sound Game state
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameQuestionIdx, setGameQuestionIdx] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number>(0);
  const [gameFeedback, setGameFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Extract unique phonics
  const phonicsList = useMemo(() => {
    const set = new Set<string>();
    currentWords.forEach((w) => {
      if (w.phonics) set.add(w.phonics);
    });
    return Array.from(set);
  }, [currentWords]);

  // Extract topics
  const topicsList = useMemo(() => {
    const set = new Set<string>();
    currentWords.forEach((w) => {
      if (w.topic) set.add(w.topic);
    });
    return Array.from(set);
  }, [currentWords]);

  // Filtered words
  const filteredWords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return currentWords.filter((w) => {
      if (selectedPhonic !== 'all' && w.phonics !== selectedPhonic) {
        return false;
      }
      if (selectedTopic !== 'all' && w.topic !== selectedTopic) {
        return false;
      }
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        (w.phonics && w.phonics.toLowerCase().includes(q))
      );
    });
  }, [currentWords, selectedPhonic, selectedTopic, searchTerm]);

  // Picture sound game options
  const gamePool = useMemo(() => {
    return [...currentWords].sort(() => Math.random() - 0.5);
  }, [currentWords]);

  const currentGameWord = gamePool[gameQuestionIdx % (gamePool.length || 1)];

  const gameOptions = useMemo(() => {
    if (!currentGameWord) return [];
    const others = currentWords
      .filter((w) => w.id !== currentGameWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [currentGameWord, ...others].sort(() => Math.random() - 0.5);
  }, [currentGameWord, currentWords]);

  const handleStartGame = () => {
    setGameActive(true);
    setGameScore(0);
    setGameQuestionIdx(0);
    setGameFeedback(null);
    if (currentGameWord) {
      setTimeout(() => playPronunciation(currentGameWord.word, 0.8), 200);
    }
  };

  const handleGameSelect = (chosenWord: VocabWord) => {
    if (gameFeedback !== null || !currentGameWord) return;

    if (chosenWord.id === currentGameWord.id) {
      setGameFeedback('correct');
      setGameScore((prev) => prev + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onUpdateStore(updateCardReview(srsStore, currentGameWord.id, 'easy'));
      setTimeout(() => {
        setGameFeedback(null);
        setGameQuestionIdx((prev) => prev + 1);
        const nextWord = gamePool[(gameQuestionIdx + 1) % gamePool.length];
        if (nextWord) {
          playPronunciation(nextWord.word, 0.8);
        }
      }, 1200);
    } else {
      setGameFeedback('wrong');
      onUpdateStore(updateCardReview(srsStore, currentGameWord.id, 'again'));
      setTimeout(() => {
        setGameFeedback(null);
      }, 1400);
    }
  };

  const switchGrade = (newGrade: number) => {
    setCurrentSelectedGrade(newGrade);
    setSelectedPhonic('all');
    setSelectedTopic('all');
    setGameActive(false);
    if (onChangeGrade) {
      onChangeGrade(newGrade);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      
      {/* Grade Selector Switcher (Lớp 1 vs Lớp 2 vs Lớp 3 vs Lớp 4) */}
      <div className="flex flex-wrap items-center justify-between bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => switchGrade(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 1
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🌟 Lớp 1</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade1Words ? grade1Words.length : 93} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 2
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🚀 Lớp 2</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade2Words ? grade2Words.length : 84} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(3)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 3
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🎒 Lớp 3</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade3Words ? grade3Words.length : 173} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(4)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 4
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🎯 Lớp 4</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade4Words ? grade4Words.length : 129} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(5)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 5
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🎓 Lớp 5</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade5Words ? grade5Words.length : 134} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(6)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 6
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>💎 Lớp 6</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade6Words ? grade6Words.length : 96} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 7
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🌟 Lớp 7</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade7Words ? grade7Words.length : 59} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(8)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 8
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>⚡ Lớp 8</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade8Words ? grade8Words.length : 71} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(9)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 9
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>⚡ Lớp 9</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade9Words ? grade9Words.length : 81} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(10)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 10
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>⚡ Lớp 10</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade10Words ? grade10Words.length : 91} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(11)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 11
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>⚡ Lớp 11</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade11Words ? grade11Words.length : 110} từ
            </span>
          </button>

          <button
            onClick={() => switchGrade(12)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSelectedGrade === 12
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>👑 Lớp 12</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
              {grade12Words ? grade12Words.length : 100} từ
            </span>
          </button>
        </div>

        <span className="hidden xl:inline text-xs text-slate-500 font-medium px-3">
          Chuẩn bộ sách Global Success · Bộ Giáo Dục & Đào Tạo
        </span>
      </div>

      {/* Header Banner */}
      <div className={`relative rounded-3xl text-white p-6 sm:p-8 shadow-md overflow-hidden ${
        currentSelectedGrade === 1
          ? 'bg-linear-to-r from-amber-400 via-orange-400 to-rose-400'
          : currentSelectedGrade === 2
          ? 'bg-linear-to-r from-sky-500 via-indigo-500 to-blue-600'
          : currentSelectedGrade === 3
          ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600'
          : currentSelectedGrade === 4
          ? 'bg-linear-to-r from-purple-600 via-violet-600 to-indigo-700'
          : currentSelectedGrade === 5
          ? 'bg-linear-to-r from-rose-500 via-pink-600 to-red-600'
          : currentSelectedGrade === 6
          ? 'bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-700'
          : currentSelectedGrade === 7
          ? 'bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-700'
          : currentSelectedGrade === 8
          ? 'bg-linear-to-r from-rose-600 via-purple-600 to-indigo-700'
          : currentSelectedGrade === 9
          ? 'bg-linear-to-r from-amber-600 via-rose-600 to-indigo-800'
          : currentSelectedGrade === 10
          ? 'bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-900'
          : currentSelectedGrade === 11
          ? 'bg-linear-to-r from-blue-700 via-indigo-700 to-purple-900'
          : 'bg-linear-to-r from-purple-800 via-indigo-900 to-slate-950'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chuyên đề trực quan Lớp {currentSelectedGrade} · Global Success</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              {currentSelectedGrade === 1 
                ? 'Góc Học Từ Vựng Trực Quan Lớp 1' 
                : currentSelectedGrade === 2
                ? 'Góc Học Từ Vựng Trực Quan Lớp 2'
                : currentSelectedGrade === 3
                ? 'Góc Học Từ Vựng Trực Quan Lớp 3'
                : currentSelectedGrade === 4
                ? 'Góc Học Từ Vựng Trực Quan Lớp 4'
                : currentSelectedGrade === 5
                ? 'Góc Học Từ Vựng Trực Quan Lớp 5'
                : currentSelectedGrade === 6
                ? 'Góc Học Từ Vựng Trực Quan Lớp 6 (THCS)'
                : currentSelectedGrade === 7
                ? 'Góc Học Từ Vựng Trực Quan Lớp 7 (THCS)'
                : currentSelectedGrade === 8
                ? 'Góc Học Từ Vựng Trực Quan Lớp 8 (THCS)'
                : currentSelectedGrade === 9
                ? 'Góc Học Từ Vựng Trực Quan Lớp 9 (THCS)'
                : currentSelectedGrade === 10
                ? 'Góc Học Từ Vựng Trực Quan Lớp 10 (THPT)'
                : currentSelectedGrade === 11
                ? 'Góc Học Từ Vựng Trực Quan Lớp 11 (THPT)'
                : 'Góc Học Từ Vựng Trực Quan Lớp 12 (Tốt Nghiệp & Đại Học)'}
            </h2>
            <p className="text-sm text-white/95 max-w-2xl leading-relaxed">
              {currentSelectedGrade === 1 
                ? 'Trực quan sinh động với hình vẽ ngộ nghĩnh, âm ngữ Phonics theo từng chữ cái chuẩn SGK (Chữ B, C, A, D, I, E, G, H, O, M, U, L, N, T, F, W) và câu vè nhịp điệu giúp bé nhớ bài chỉ sau 1 lần nghe!'
                : currentSelectedGrade === 2
                ? 'Mở rộng vốn từ với 16 Unit sinh nhật, sân sau, bãi biển, nông trại, siêu thị, số đếm 11-20, hình khối, cảm xúc, 7 ngày trong tuần và giới từ vị trí có biểu tượng & audio phát âm vui nhộn!'
                : currentSelectedGrade === 3
                ? 'Đột phá vốn từ 20 Unit học kỳ 1 & 2: Chào hỏi, tên tuổi, bộ phận cơ thể, sở thích đuôi -ing, trường học, đồ dùng học tập, nghề nghiệp, phòng ngủ, bữa ăn gia đình, thú cưng, đồ chơi và sở thú với hình ảnh minh họa, phiên âm IPA và câu vè bắt tai!'
                : currentSelectedGrade === 4
                ? 'Nâng tầm ngữ cảnh 20 Unit học kỳ 1 & 2: Trường mới, thời gian sinh hoạt, thời khóa biểu các môn học, 12 tháng sinh nhật, kỹ năng can/can\'t, dụng cụ học tập, dã ngoại cuối tuần, việc nhà phụ mẹ, địa chỉ nhà ở, ngoại hình, trung tâm thương mại và thế giới động vật hoang dã!'
                : currentSelectedGrade === 5
                ? 'Chinh phục trọn vẹn 20 Unit lớp 5 chuẩn Global Success: Quê hương địa chỉ, thói quen sinh hoạt, hoạt động trường lớp, nghề nghiệp tương lai, phương pháp học tiếng Anh, truyện cổ tích & tính cách nhân vật, thế giới động vật sở thú, bảo vệ môi trường, danh lam thắng cảnh, kỳ quan thế giới và chuyến đi trải nghiệm!'
                : currentSelectedGrade === 6
                ? 'Khởi đầu cấp THCS với 12 Unit Global Success: Trường mới & trường nội trú, các kiểu nhà & thiết bị tiện nghi, tính cách & ngoại hình bạn bè, khu phố cổ kính & hiện đại, kỳ quan thiên nhiên Việt Nam, phong tục Tết Nguyên Đán, truyền hình, thể thao, các thành phố trên thế giới, nhà tương lai và kỷ nguyên robot!'
                : currentSelectedGrade === 7
                ? 'Bứt phá THCS với 12 Unit chuẩn sách Lớp 7 Global Success: Sở thích nghệ thuật & chạm khắc vỏ trứng, lối sống lành mạnh & dinh dưỡng, công tác tình nguyện vì cộng đồng, âm nhạc & triển lãm tranh, món ngon & gia vị truyền thống, thăm Văn Miếu Quốc Tử Giám, tiết kiệm năng lượng, các dòng phim điện ảnh, lễ hội thế giới, năng lượng tái tạo, phương tiện giao thông tương lai và các quốc gia nói tiếng Anh!'
                : currentSelectedGrade === 8
                ? 'Chinh phục cấp THCS với 12 Unit Lớp 8 Global Success: Thời gian giải trí & đồ handmade DIY, vẻ đẹp thôn quê & mùa gặt lúa, tâm lý tuổi teen & áp lực bạn bè, bản sắc các dân tộc Việt Nam & nhà rông, phong tục tập quán & sum họp gia đình, phong cách sống xanh, bảo vệ môi trường & giảm rác thải nhựa, kỹ năng mua sắm thông thái, ứng phó thiên tai & bộ cứu hộ khẩn cấp, công nghệ giao tiếp tương lai & thần giao cách cảm, trí tuệ nhân tạo (AI) cùng thám hiểm sự sống các hành tinh khác!'
                : currentSelectedGrade === 9
                ? 'Bứt phá điểm số thi vào 10 với trọn bộ 12 Unit Lớp 9 Global Success: Cộng đồng địa phương & nghề gốm sứ truyền thống, nhịp sống đô thị & tiện ích giao thông công cộng, chăm sóc sức khỏe tâm lý & vượt qua áp lực đồng trang lứa, ký ức tuổi thơ & khoảng cách thế hệ, chuyến phiêu lưu leo núi mở mang tầm nhìn, bản sắc 54 dân tộc anh em & nhà rông nhà sàn, nghệ thuật nấu nướng dinh dưỡng & thực phẩm hữu cơ, du lịch sinh thái bền vững, tiếng Anh toàn cầu & phương ngữ bản xứ, bảo vệ hành tinh xanh Trái Đất, thiết bị điện tử & trí tuệ nhân tạo (AI), cùng định hướng nghề nghiệp và xây dựng CV xin việc tương lai!'
                : currentSelectedGrade === 10
                ? 'Khởi đầu cấp THPT với trọn vẹn 10 Unit Lớp 10 Global Success: Cuộc sống gia đình & san sẻ việc nhà (Family life), Dấu chân carbon & sống xanh bền vững (Humans and the environment), Nghệ thuật âm nhạc & thần tượng (Music), Cống hiến cộng đồng & tình nguyện vùng cao (For a better community), Phát minh công nghệ & trí tuệ nhân tạo AI (Inventions), Bình đẳng giới & cơ hội việc làm công bằng (Gender equality), Việt Nam và các tổ chức quốc tế ASEAN, UN (Viet Nam and international organisations), Phương pháp học tập mới & E-learning (New ways to learn), Bảo vệ môi trường sinh thái & chống săn trộm động vật quý hiếm (Protecting the environment), cùng Du lịch sinh thái và tôn trọng di sản văn hóa bản địa (Ecotourism)!'
                : currentSelectedGrade === 11
                ? 'Đột phá học lực THPT với trọn vẹn 10 Unit Lớp 11 Global Success: Bí quyết trường thọ & hệ miễn dịch khỏe mạnh (A long and healthy life), Thấu hiểu & thu hẹp khoảng cách thế hệ (The generation gap), Đô thị tương lai thông minh & giao thông tự động (Cities of the future), Việt Nam hội nhập cùng cộng đồng ASEAN (ASEAN and Viet Nam), Ngăn chặn nóng lên toàn cầu & cắt giảm phát thải (Global warming), Bảo tồn di sản văn hóa vật thể và phi vật thể (Preserving our heritage), Định hướng giáo dục đại học và học nghề cho học sinh tốt nghiệp (Education options for school-leavers), Rèn luyện bản lĩnh sống tự lập và quản lý tài chính (Becoming independent), Chung tay giải quyết các vấn đề xã hội nhức nhối (Social issues), cùng Tuyên bố hòa bình và hợp tác kinh tế ASEAN (The ASEAN manifesto and cooperation)!'
                : 'Chinh phục kỳ thi Tốt Nghiệp THPT & Đại Học với trọn vẹn 10 Unit Lớp 12 Global Success: Những câu chuyện cuộc đời truyền cảm hứng & để lại di sản (Life stories), Thế giới đa văn hóa & thích nghi hội nhập (A multicultural world), Lối sống xanh & giảm dấu chân carbon (Green living), Đô thị hóa & giải tỏa áp lực hạ tầng (Urbanisation), Thế giới việc làm & nấc thang sự nghiệp (The world of work), Trí tuệ nhân tạo AI & tự động hóa kỷ nguyên số (Artificial intelligence), Truyền thông đại chúng & kiểm chứng tin giả (The mass media), Bảo tồn động vật hoang dã & chống tuyệt chủng (Wildlife conservation), Nâng cao kỹ năng nghề nghiệp & học tập suốt đời (Career upskilling and lifelong learning), cùng Thách thức toàn cầu & ngoại giao hợp tác quốc tế (Global challenges and international cooperation)!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onLaunchFlashcardWithWords(filteredWords)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-sm transition-transform hover:scale-102 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Học Flashcard ({filteredWords.length} từ)</span>
            </button>

            <button
              onClick={() => (gameActive ? setGameActive(false) : handleStartGame())}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Smile className="w-4 h-4 text-amber-300" />
              <span>{gameActive ? 'Đóng Trò Chơi' : 'Trò Chơi Nghe & Chọn Tranh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Picture Sound Game Arena */}
      {gameActive && currentGameWord && (
        <div className={`bg-white rounded-3xl border-2 p-6 sm:p-8 shadow-md animate-in fade-in ${
          currentSelectedGrade === 1 ? 'border-amber-300' : 'border-sky-300'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
            <span className={`font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
              currentSelectedGrade === 1 ? 'text-amber-800 bg-amber-100' : 'text-sky-800 bg-sky-100'
            }`}>
              <Trophy className="w-4 h-4 text-amber-500" />
              Trò chơi: Nghe âm thanh - Chạm tranh đúng! (Điểm: {gameScore})
            </span>
            <button
              onClick={() => playPronunciation(currentGameWord.word, 0.75)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              Nghe lại từ
            </button>
          </div>

          <div className="text-center py-4 mb-6">
            <p className="text-sm font-semibold text-slate-500 mb-2">Bé hãy bấm vào loa để nghe lại âm thanh:</p>
            <button
              onClick={() => playPronunciation(currentGameWord.word, 0.75)}
              className={`w-20 h-20 mx-auto rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer ${
                currentSelectedGrade === 1
                  ? 'bg-linear-to-tr from-amber-400 to-orange-400'
                  : 'bg-linear-to-tr from-sky-400 to-indigo-500'
              }`}
              title="Bấm để nghe phát âm"
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <p className="text-xs text-slate-400 mt-3 font-mono">Phiên âm: {currentGameWord.ipa}</p>

            {gameFeedback === 'correct' && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hoan hô! Bé chọn đúng rồi: "{currentGameWord.word}" - {currentGameWord.meaning}! ⭐</span>
              </div>
            )}
            {gameFeedback === 'wrong' && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-sm font-bold">
                <span>Chưa đúng rồi, bé hãy nghe kỹ lại một lần nữa nhé! 🎧</span>
              </div>
            )}
          </div>

          {/* 4 Picture Choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {gameOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleGameSelect(opt)}
                className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer shadow-2xs hover:scale-102"
              >
                <span className="text-6xl sm:text-7xl select-none group-hover:scale-110 transition-transform">
                  {opt.visualIcon || '📚'}
                </span>
                <span className="font-bold text-slate-800 text-base font-display">
                  {opt.meaning}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phonics Soundboard & Quick Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Tìm nhanh từ vựng Lớp ${currentSelectedGrade} (tiếng Anh, nghĩa tiếng Việt, âm phonics...)`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Phonics letter filters */}
        {phonicsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-500" />
                Lọc theo Âm Phonics SGK Lớp {currentSelectedGrade}:
              </span>
              <button
                onClick={() => setSelectedPhonic('all')}
                className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Hiện tất cả
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                onClick={() => setSelectedPhonic('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedPhonic === 'all'
                    ? currentSelectedGrade === 1 ? 'bg-amber-500 text-white shadow-xs' : 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({currentWords.length})
              </button>
              {phonicsList.map((p) => {
                const count = currentWords.filter((w) => w.phonics === p).length;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPhonic(p)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      selectedPhonic === p
                        ? currentSelectedGrade === 1 ? 'bg-amber-500 text-white shadow-xs' : 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Topic filter bar */}
        {topicsList.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Chủ đề gần gũi với bé:</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                onClick={() => setSelectedTopic('all')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedTopic === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả chủ đề
              </button>
              {topicsList.map((top) => (
                <button
                  key={top}
                  onClick={() => setSelectedTopic(top)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedTopic === top
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {top}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Visual Vocabulary Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Danh Sách Thẻ Trực Quan Lớp {currentSelectedGrade} ({filteredWords.length} từ vựng)
          </h3>
          <span className="text-xs text-slate-500">
            Chạm vào thẻ hoặc bấm loa để nghe phát âm và vần điệu
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWords.map((word) => {
            const card = srsStore.cards[word.id];

            return (
              <div
                key={word.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Icon + Unit info */}
                  <div className="flex items-start justify-between">
                    <span className="text-5xl select-none group-hover:scale-115 transition-transform duration-200">
                      {word.visualIcon || '📖'}
                    </span>
                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        currentSelectedGrade === 1 ? 'text-amber-700 bg-amber-50' : 'text-sky-700 bg-sky-50'
                      }`}>
                        {word.unit === 0 ? 'Bổ trợ' : `Unit ${word.unit}`}
                      </span>
                      {word.phonics && (
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          {word.phonics}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Word & IPA */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
                        {word.word}
                      </h4>
                      <button
                        onClick={() => playPronunciation(word.word, 0.8)}
                        className={`p-2 rounded-full transition-colors shadow-2xs cursor-pointer ${
                          currentSelectedGrade === 1 
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                            : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                        }`}
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-sans font-bold px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">UK</span>
                      <p className="text-xs font-mono text-slate-500">{word.ipa}</p>
                    </div>
                    <p className="text-sm font-bold text-indigo-950 mt-1.5">{word.meaning}</p>
                  </div>

                  {/* Visual Mnemonic */}
                  {word.mnemonic && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-900 leading-snug">
                      <span className="font-bold">Mẹo nhớ: </span>
                      <span>{word.mnemonic}</span>
                    </div>
                  )}

                  {/* Phonics Chant */}
                  {word.chant && (
                    <button
                      onClick={() => playPronunciation(word.chant!, 0.85)}
                      className="mt-2 w-full text-left p-2 rounded-lg bg-indigo-50/60 hover:bg-indigo-50 text-[11px] font-semibold text-indigo-700 flex items-center justify-between transition-colors cursor-pointer"
                      title="Nghe câu vè"
                    >
                      <span className="truncate">🎵 {word.chant}</span>
                      <Volume2 className="w-3 h-3 shrink-0 ml-1" />
                    </button>
                  )}
                </div>

                {/* Bottom: Sentence context */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 italic truncate max-w-[170px]" title={word.example}>
                    "{word.example}"
                  </span>
                  <button
                    onClick={() => {
                      onLaunchFlashcardWithWords([word]);
                    }}
                    className={`text-[11px] font-bold cursor-pointer ${
                      currentSelectedGrade === 1 ? 'text-amber-600 hover:text-amber-800' : 'text-sky-600 hover:text-sky-800'
                    }`}
                  >
                    Luyện thẻ →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredWords.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            Không tìm thấy từ nào phù hợp với bộ lọc này.
          </div>
        )}
      </div>

    </div>
  );
};
