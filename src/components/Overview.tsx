import React from 'react';
import { GradeSummary, UserSRSStore, VocabWord } from '../types';
import { GRADES_LIST } from '../data';
import { getSRSStats } from '../utils/srs';
import { 
  BookOpen, 
  Layers, 
  Brain, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  Clock, 
  School,
  GraduationCap,
  Headphones
} from 'lucide-react';

interface OverviewProps {
  srsStore: UserSRSStore;
  allWords: VocabWord[];
  selectedGrade: number;
  onSelectGrade: (grade: number) => void;
  onStartFlashcard: () => void;
  onStartDictation: () => void;
  onStartPractice: () => void;
  onStartSRS: () => void;
  onOpenGrade1Visual: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  srsStore,
  allWords,
  selectedGrade,
  onSelectGrade,
  onStartFlashcard,
  onStartDictation,
  onStartPractice,
  onStartSRS,
  onOpenGrade1Visual,
}) => {
  const [levelFilter, setLevelFilter] = React.useState<'all' | 'primary' | 'secondary' | 'highschool'>('all');
  const stats = getSRSStats(srsStore, allWords.length);

  const selectedGradeObj = GRADES_LIST.find((g) => g.grade === selectedGrade) || GRADES_LIST[0];

  // Daily goal percent
  const dailyPercent = Math.min(100, Math.round(((srsStore.dailyCompleted || 0) / srsStore.dailyGoal) * 100));

  const filteredGrades = GRADES_LIST.filter((g) => {
    if (levelFilter === 'all') return true;
    return g.levelGroup === levelFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      
      {/* Hero Presentation Section */}
      <div className="relative rounded-3xl bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-10 shadow-lg overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200">Chuẩn Bộ Giáo Dục</span>
              <span aria-hidden="true">·</span>
              <span>Chương trình GDPT 2018 · Sách Global Success</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white text-balance leading-tight">
              Học Từ Vựng Tiếng Anh Lớp 1 Đến Lớp 12 Thông Minh
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Ghi nhớ từ vựng sâu sắc nhờ <strong>Flashcard 3D thông minh</strong>, phát âm bản xứ, mẹo gợi nhớ trực quan và <strong>hệ thống lặp lại ngắt quãng (SRS)</strong> tối ưu theo đường cong quên lãng Ebbinghaus.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenGrade1Visual}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-extrabold shadow-md transition-transform hover:scale-102 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>Góc Trực Quan Lớp 1 - 12 🎨</span>
              </button>

              <button
                onClick={onStartFlashcard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold shadow-md transition-transform hover:scale-102 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Học Flashcard {selectedGradeObj.title}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={onStartDictation}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold shadow-md transition-transform hover:scale-102 cursor-pointer"
              >
                <Headphones className="w-4 h-4" />
                <span>Luyện Nghe Viết Lớp {selectedGradeObj.grade}</span>
              </button>

              <button
                onClick={onStartSRS}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <span>Hệ Thống SRS ({stats.dueToday} từ cần ôn)</span>
              </button>
            </div>
          </div>

          {/* Daily Goal & Streak widget */}
          <div className="lg:col-span-4 bg-white/10 border border-white/15 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Mục tiêu hằng ngày</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5 fill-amber-300" />
                <span>Chuỗi {srsStore.streak} ngày</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-black font-display text-white tabular-nums">
                  {srsStore.dailyCompleted} / {srsStore.dailyGoal}
                </span>
                <span className="text-xs font-semibold text-indigo-200">
                  {dailyPercent}% hoàn thành
                </span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${dailyPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block">Đã thuộc vĩnh viễn</span>
                <span className="text-lg font-bold text-emerald-300 tabular-nums">
                  {stats.mastered} từ
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Đang củng cố</span>
                <span className="text-lg font-bold text-sky-300 tabular-nums">
                  {stats.reviewing + stats.learning} từ
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grade Level Selector Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Chọn Cấp Học & Lớp Của Bạn
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Toàn bộ 12 khối lớp được chia theo từng Unit bài học chuẩn xác từ sách giáo khoa.
            </p>
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                levelFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả (Lớp 1-12)
            </button>
            <button
              onClick={() => setLevelFilter('primary')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                levelFilter === 'primary' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiểu học (1-5)
            </button>
            <button
              onClick={() => setLevelFilter('secondary')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                levelFilter === 'secondary' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              THCS (6-9)
            </button>
            <button
              onClick={() => setLevelFilter('highschool')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                levelFilter === 'highschool' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              THPT (10-12)
            </button>
          </div>
        </div>

        {/* Grade Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrades.map((g) => {
            const isCurrent = g.grade === selectedGrade;
            const gradeWords = allWords.filter(w => w.grade === g.grade);
            const masteredInGrade = gradeWords.filter(w => srsStore.cards[w.id]?.status === 'mastered').length;

            return (
              <div
                key={g.grade}
                onClick={() => {
                  onSelectGrade(g.grade);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-600 ring-2 ring-indigo-100 bg-white shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">
                      {g.levelGroupName}
                    </span>
                    <span className="font-mono text-slate-400">
                      {g.unitsCount} Units
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-display flex items-center justify-between">
                    <span>{g.title}</span>
                    {isCurrent && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                        Đang chọn
                      </span>
                    )}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-700">
                    {gradeWords.length} từ vựng
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrade(g.grade);
                        onStartDictation();
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      Nghe viết
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrade(g.grade);
                        onStartFlashcard();
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      Học ngay →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Pillars of Effective Vocabulary Acquisition */}
      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight text-center mb-8">
          Phương Pháp Khoa Học Giúp Trí Nhớ Sâu & Phản Xạ Tự Nhiên
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-slate-900">
              Flashcard 3D & Mẹo Trực Quan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi từ đều đi kèm phiên âm chuẩn IPA, audio bản ngữ hai tốc độ (1.0x & 0.75x) và câu chuyện gợi nhớ hình ảnh sinh động giúp não bộ ghi nhận từ vựng chỉ trong 3 giây.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-slate-900">
              Lặp Lại Ngắt Quãng SM-2
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thuật toán xếp lịch tự động nhắc ôn lại đúng điểm uốn của đường cong quên lãng Ebbinghaus. Bạn chỉ ôn những từ chuẩn bị quên, tiết kiệm 70% thời gian học.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-slate-900">
              Đấu Trường 4 Đa Giác Quan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kết hợp trắc nghiệm phản xạ nhanh, luyện nghe chính tả từng chữ cái, trò chơi ghép thẻ trí nhớ và điền từ vào mẫu câu giao tiếp chuẩn từ sách Global Success.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
