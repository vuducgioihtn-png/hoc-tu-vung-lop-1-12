import React, { useRef } from 'react';
import { UserSRSStore, VocabWord } from '../types';
import { getSRSStats, getDueWordIds } from '../utils/srs';
import { 
  Brain, 
  Sparkles, 
  Clock, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw,
  Play,
  Award,
  BarChart3
} from 'lucide-react';

interface SRSDashboardProps {
  srsStore: UserSRSStore;
  allWords: VocabWord[];
  onUpdateStore: (store: UserSRSStore) => void;
  onStartDueReview: () => void;
}

export const SRSDashboard: React.FC<SRSDashboardProps> = ({
  srsStore,
  allWords,
  onUpdateStore,
  onStartDueReview,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = getSRSStats(srsStore, allWords.length);
  const dueWordIds = getDueWordIds(srsStore);
  const dueWords = allWords.filter(w => dueWordIds.includes(w.id));

  // Export JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(srsStore, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eduvocab_srs_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed.cards === 'object') {
          onUpdateStore(parsed);
          alert('Khôi phục dữ liệu học tập thành công!');
        } else {
          alert('Tệp dữ liệu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp sao lưu.');
      }
    };
    reader.readAsText(file);
  };

  // Reset progress
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ học từ vựng không?')) {
      const resetStore: UserSRSStore = {
        cards: {},
        streak: 0,
        lastActiveDate: '',
        dailyGoal: 15,
        dailyCompleted: 0,
        lastGoalDate: new Date().toISOString().slice(0, 10),
      };
      onUpdateStore(resetStore);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Thuật toán SuperMemo SM-2</span>
            <span aria-hidden="true">·</span>
            <span>Tối ưu hóa đường cong trí nhớ Ebbinghaus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight mt-0.5">
            Hệ Thống Lặp Lại Ngắt Quãng (SRS)
          </h2>
        </div>

        {dueWords.length > 0 && (
          <button
            onClick={onStartDueReview}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Ôn tập ngay ({dueWords.length} thẻ đến hạn)</span>
          </button>
        )}
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Due Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-rose-600">Cần ôn hôm nay</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums">
              {stats.dueToday}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">từ vựng cần củng cố</span>
          </div>
        </div>

        {/* Card 2: Mastered */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">Đã nhớ vĩnh viễn</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums">
              {stats.mastered}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">chu kỳ ôn &gt; 30 ngày</span>
          </div>
        </div>

        {/* Card 3: Active Learning */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-sky-600">Đang củng cố</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums">
              {stats.reviewing + stats.learning}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">chu kỳ 1 - 15 ngày</span>
          </div>
        </div>

        {/* Card 4: Retention Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-indigo-600">Độ bền trí nhớ</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums">
              {stats.retentionRate}%
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">tỉ lệ nhớ chính xác</span>
          </div>
        </div>

      </div>

      {/* Ebbinghaus Forgetting Curve Diagram & Scientific Explanation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              Nguyên Lý Đường Cong Quên Lãng (Ebbinghaus) & Thuật Toán SM-2
            </h3>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
            Tối ưu 90%+ trí nhớ
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mb-6">
          Não bộ con người quên tới 75% thông tin mới chỉ sau 48 giờ nếu không được ôn tập. Hệ thống <strong>Spaced Repetition (Lặp lại ngắt quãng)</strong> của ứng dụng tính toán thời điểm vàng trước khi não bộ chuẩn bị quên để nhắc bạn ôn lại với các khoảng cách tăng dần: <em>1 ngày → 3 ngày → 7 ngày → 16 ngày → 35 ngày</em>, biến từ vựng thành phản xạ vĩnh viễn.
        </p>

        {/* Interactive Visual Graph representation */}
        <div className="relative w-full h-48 bg-slate-900 rounded-xl p-4 overflow-hidden flex flex-col justify-between text-white font-mono text-xs">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

          {/* Graph labels */}
          <div className="relative z-10 flex justify-between text-slate-400 text-[11px]">
            <span>Trí nhớ 100%</span>
            <span>Ngày 1 (Lần 1)</span>
            <span>Ngày 3 (Lần 2)</span>
            <span>Ngày 7 (Lần 3)</span>
            <span>Ngày 16 (Lần 4)</span>
            <span>Vĩnh viễn (&gt;90%)</span>
          </div>

          {/* Curves SVG */}
          <div className="relative z-10 w-full h-24 my-auto">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Without SRS: steep decay red curve */}
              <path
                d="M 10,10 Q 50,85 150,90 L 490,95"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* With SRS: wave-like reinforcement green curve */}
              <path
                d="M 10,10 Q 40,50 80,60 Q 85,15 140,40 Q 145,15 230,30 Q 235,15 360,20 Q 365,15 490,15"
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
              />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-0.5 bg-rose-400 inline-block" /> Học một lần rồi bỏ (Quên 80%)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-3 h-1 bg-emerald-400 inline-block" /> Lặp lại ngắt quãng SM-2 (Nhớ lâu &gt;90%)
              </span>
            </div>
            <span className="text-slate-400">Thời gian (ngày) →</span>
          </div>
        </div>
      </div>

      {/* Due Today Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Danh Sách Thẻ Cần Ôn Tập ({dueWords.length})
          </h3>
          {dueWords.length > 0 && (
            <button
              onClick={onStartDueReview}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Mở chế độ Flashcard →
            </button>
          )}
        </div>

        {dueWords.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 text-center border border-dashed border-slate-200">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800">Hôm nay không còn thẻ nào cần ôn!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Trí nhớ của bạn đang ở trạng thái tối ưu. Hãy tiếp tục học thêm từ vựng mới hoặc nghỉ ngơi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dueWords.slice(0, 9).map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-base">{w.word}</span>
                    <span className="text-[11px] font-semibold text-indigo-600">Lớp {w.grade}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{w.ipa}</p>
                  <p className="text-xs text-slate-700 font-medium mt-1">{w.meaning}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                  Unit {w.unit}: {w.unitTitle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Backup & Data Sync */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-display font-bold text-base text-slate-900">Sao Lưu & Quản Lý Dữ Liệu</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Xuất tiến độ học tập ra tệp JSON để lưu trữ hoặc chuyển sang thiết bị khác mà không lo mất bài.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportData}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportData}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs"
            title="Đặt lại tiến độ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
