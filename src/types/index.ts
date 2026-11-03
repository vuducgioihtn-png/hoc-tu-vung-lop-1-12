export type WordType = 
  | 'n' 
  | 'v' 
  | 'adj' 
  | 'adv' 
  | 'phr' 
  | 'phr.v' 
  | 'idiom' 
  | 'prep' 
  | 'pron' 
  | 'det' 
  | 'num' 
  | 'interj' 
  | 'excl';

export interface VocabWord {
  id: string;
  grade: number; // 1 to 12
  semester?: 1 | 2;
  unit: number; // 1, 2, ... (or 0 for Supplementary / Bổ trợ)
  unitTitle: string;
  word: string;
  type: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleVi?: string;
  mnemonic?: string; // Mẹo gợi nhớ hình ảnh/ngữ cảnh
  visualIcon?: string; // Biểu tượng trực quan sinh động
  phonics?: string; // Âm ngữ phonic (ví dụ: Chữ B/b - Âm /b/)
  chant?: string; // Câu vần điệu dễ nhớ
  topic?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardSRS {
  wordId: string;
  interval: number; // Days until next review
  repetitions: number; // Number of consecutive successful recall
  easeFactor: number; // Default 2.5, min 1.3
  dueDate: number; // Timestamp (ms)
  lastReviewed: number | null;
  history: Array<{
    date: number;
    rating: SRSRating;
  }>;
  starred: boolean;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface UserSRSStore {
  cards: Record<string, CardSRS>;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyGoal: number; // e.g. 15
  dailyCompleted: number;
  lastGoalDate: string; // YYYY-MM-DD
}

export type StudyMode = 
  | 'flashcard' 
  | 'quiz' 
  | 'spelling' 
  | 'match' 
  | 'sentence' 
  | 'due_review';

export interface GradeSummary {
  grade: number;
  title: string;
  levelGroup: 'primary' | 'secondary' | 'highschool';
  levelGroupName: string;
  totalWords: number;
  unitsCount: number;
  description: string;
}
