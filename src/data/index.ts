import { VocabWord, GradeSummary } from '../types';
import { GRADE_1_WORDS, GRADE_2_WORDS, GRADE_3_WORDS } from './grade1_3';
import { GRADE_4_WORDS, GRADE_5_WORDS, GRADE_6_WORDS } from './grade4_6';
import { GRADE_7_WORDS, GRADE_8_WORDS, GRADE_9_WORDS } from './grade7_9';
import { GRADE_10_WORDS, GRADE_11_WORDS, GRADE_12_WORDS } from './grade10_12';

export const ALL_VOCABULARY: VocabWord[] = [
  ...GRADE_1_WORDS,
  ...GRADE_2_WORDS,
  ...GRADE_3_WORDS,
  ...GRADE_4_WORDS,
  ...GRADE_5_WORDS,
  ...GRADE_6_WORDS,
  ...GRADE_7_WORDS,
  ...GRADE_8_WORDS,
  ...GRADE_9_WORDS,
  ...GRADE_10_WORDS,
  ...GRADE_11_WORDS,
  ...GRADE_12_WORDS,
];

export const GRADES_LIST: GradeSummary[] = [
  // Cấp 1: Tiểu học
  {
    grade: 1,
    title: 'Tiếng Anh Lớp 1',
    levelGroup: 'primary',
    levelGroupName: 'Tiểu học',
    totalWords: GRADE_1_WORDS.length,
    unitsCount: 16,
    description: 'Chữ cái, đồ vật quen thuộc, số đếm 1-10, màu sắc và giao tiếp sân trường.'
  },
  {
    grade: 2,
    title: 'Tiếng Anh Lớp 2',
    levelGroup: 'primary',
    levelGroupName: 'Tiểu học',
    totalWords: GRADE_2_WORDS.length,
    unitsCount: 16,
    description: 'Bữa tiệc sinh nhật, động vật cưng, các thứ trong tuần, hình khối & cảm xúc.'
  },
  {
    grade: 3,
    title: 'Tiếng Anh Lớp 3',
    levelGroup: 'primary',
    levelGroupName: 'Tiểu học',
    totalWords: GRADE_3_WORDS.length,
    unitsCount: 20,
    description: 'Chào hỏi, cơ thể người, sở thích cá nhân, đồ dùng học tập và các phòng chức năng.'
  },
  {
    grade: 4,
    title: 'Tiếng Anh Lớp 4',
    levelGroup: 'primary',
    levelGroupName: 'Tiểu học',
    totalWords: GRADE_4_WORDS.length,
    unitsCount: 20,
    description: 'Thời gian biểu, các tháng trong năm, ngoại hình, hoạt động cuối tuần và dã ngoại.'
  },
  {
    grade: 5,
    title: 'Tiếng Anh Lớp 5',
    levelGroup: 'primary',
    levelGroupName: 'Tiểu học',
    totalWords: GRADE_5_WORDS.length,
    unitsCount: 20,
    description: 'Quê hương, nghề nghiệp tương lai, bảo vệ môi trường, kỳ quan thế giới và truyện cổ tích.'
  },

  // Cấp 2: THCS
  {
    grade: 6,
    title: 'Tiếng Anh Lớp 6',
    levelGroup: 'secondary',
    levelGroupName: 'Trung học cơ sở',
    totalWords: GRADE_6_WORDS.length,
    unitsCount: 12,
    description: 'Trường học mới, bạn bè & tính cách, khu phố, kỳ quan thiên nhiên, Tết và robot tương lai.'
  },
  {
    grade: 7,
    title: 'Tiếng Anh Lớp 7',
    levelGroup: 'secondary',
    levelGroupName: 'Trung học cơ sở',
    totalWords: GRADE_7_WORDS.length,
    unitsCount: 12,
    description: 'Sở thích độc đáo, lối sống lành mạnh, hoạt động cộng đồng, phim ảnh và năng lượng xanh.'
  },
  {
    grade: 8,
    title: 'Tiếng Anh Lớp 8',
    levelGroup: 'secondary',
    levelGroupName: 'Trung học cơ sở',
    totalWords: GRADE_8_WORDS.length,
    unitsCount: 12,
    description: 'Cuộc sống miền quê, tâm lý tuổi teen, phong tục truyền thống, thảm họa thiên nhiên và AI.'
  },
  {
    grade: 9,
    title: 'Tiếng Anh Lớp 9',
    levelGroup: 'secondary',
    levelGroupName: 'Trung học cơ sở',
    totalWords: GRADE_9_WORDS.length,
    unitsCount: 12,
    description: 'Làng nghề truyền thống, đời sống đô thị, tiếng Anh toàn cầu, du lịch bền vững và hướng nghiệp.'
  },

  // Cấp 3: THPT
  {
    grade: 10,
    title: 'Tiếng Anh Lớp 10',
    levelGroup: 'highschool',
    levelGroupName: 'Trung học phổ thông',
    totalWords: GRADE_10_WORDS.length,
    unitsCount: 10,
    description: 'Cuộc sống gia đình, dấu chân carbon, bình đẳng giới, hội nhập quốc tế và du lịch sinh thái.'
  },
  {
    grade: 11,
    title: 'Tiếng Anh Lớp 11',
    levelGroup: 'highschool',
    levelGroupName: 'Trung học phổ thông',
    totalWords: GRADE_11_WORDS.length,
    unitsCount: 10,
    description: 'Sức khỏe & tuổi thọ, khoảng cách thế hệ, đô thị tương lai, hội nhập ASEAN, biến đổi khí hậu, bảo tồn di sản, định hướng nghề nghiệp, tự lập & vấn đề xã hội.'
  },
  {
    grade: 12,
    title: 'Tiếng Anh Lớp 12',
    levelGroup: 'highschool',
    levelGroupName: 'Trung học phổ thông',
    totalWords: GRADE_12_WORDS.length,
    unitsCount: 10,
    description: 'Câu chuyện cuộc đời, thế giới đa văn hóa, sống xanh, đô thị hóa, việc làm & sự nghiệp, trí tuệ nhân tạo AI, truyền thông, bảo tồn hoang dã, học tập suốt đời & hợp tác quốc tế.'
  }
];

export function getWordsByGrade(grade: number): VocabWord[] {
  return ALL_VOCABULARY.filter(w => w.grade === grade);
}

export function getUnitsByGrade(grade: number): { unit: number; unitTitle: string; count: number }[] {
  const words = getWordsByGrade(grade);
  const map = new Map<number, { unit: number; unitTitle: string; count: number }>();
  
  for (const word of words) {
    const existing = map.get(word.unit);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(word.unit, {
        unit: word.unit,
        unitTitle: word.unitTitle,
        count: 1
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.unit - b.unit);
}

export function searchWords(query: string, gradeFilter?: number): VocabWord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return gradeFilter ? getWordsByGrade(gradeFilter) : ALL_VOCABULARY;
  }

  return ALL_VOCABULARY.filter(item => {
    if (gradeFilter && item.grade !== gradeFilter) return false;
    return (
      item.word.toLowerCase().includes(normalized) ||
      item.meaning.toLowerCase().includes(normalized) ||
      item.unitTitle.toLowerCase().includes(normalized) ||
      item.ipa.toLowerCase().includes(normalized) ||
      (item.topic && item.topic.toLowerCase().includes(normalized))
    );
  });
}
