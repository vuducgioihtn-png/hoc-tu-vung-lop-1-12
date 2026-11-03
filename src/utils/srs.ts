import { CardSRS, SRSRating, UserSRSStore } from '../types';

const STORAGE_KEY = 'eduvocab_srs_state_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultSRSStore(): UserSRSStore {
  return {
    cards: {},
    streak: 0,
    lastActiveDate: '',
    dailyGoal: 15,
    dailyCompleted: 0,
    lastGoalDate: getTodayDateString(),
  };
}

export function loadSRSStore(): UserSRSStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSRSStore();
    const data: UserSRSStore = JSON.parse(raw);

    // Check daily goal reset if date changed
    const today = getTodayDateString();
    if (data.lastGoalDate !== today) {
      data.dailyCompleted = 0;
      data.lastGoalDate = today;
    }

    return data;
  } catch (error) {
    console.warn('Failed to parse SRS store from localStorage:', error);
    return getDefaultSRSStore();
  }
}

export function saveSRSStore(store: UserSRSStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save SRS store:', error);
  }
}

/**
 * SuperMemo SM-2 Interval Calculation
 */
export function calculateSM2(
  card: CardSRS | undefined,
  rating: SRSRating
): CardSRS {
  const now = Date.now();
  const currentEaseFactor = card ? card.easeFactor : 2.5;
  const currentRepetitions = card ? card.repetitions : 0;
  const currentInterval = card ? card.interval : 0;
  const history = card ? [...card.history] : [];

  let newRepetitions = currentRepetitions;
  let newInterval = currentInterval;
  let newEaseFactor = currentEaseFactor;
  let newStatus: CardSRS['status'] = 'learning';

  // Map rating to grade (0-5 scale in SM-2)
  let quality: number;
  switch (rating) {
    case 'again':
      quality = 1; // Complete blackout / failed
      break;
    case 'hard':
      quality = 3; // Correct response with effort
      break;
    case 'good':
      quality = 4; // Correct response with hesitation
      break;
    case 'easy':
      quality = 5; // Perfect recall
      break;
  }

  // SM-2 Ease Factor calculation:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  if (quality < 3) {
    // If recall failed, reset repetition count and set interval to 1 day (or review soon)
    newRepetitions = 0;
    newInterval = 1;
    newStatus = 'learning';
  } else {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1;
      newStatus = 'learning';
    } else if (newRepetitions === 1) {
      newInterval = 3;
      newStatus = 'review';
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
      if (newInterval > 30) {
        newStatus = 'mastered';
      } else {
        newStatus = 'review';
      }
    }
    newRepetitions += 1;
  }

  // Calculate new due date in milliseconds
  // In addition, for "easy", give a slight 1.2x boost on first good interval
  const intervalDays = Math.max(1, newInterval);
  const nextDueTimestamp = now + intervalDays * 24 * 60 * 60 * 1000;

  history.push({
    date: now,
    rating,
  });

  return {
    wordId: card?.wordId || '',
    interval: intervalDays,
    repetitions: newRepetitions,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    dueDate: nextDueTimestamp,
    lastReviewed: now,
    history,
    starred: card?.starred || false,
    status: newStatus,
  };
}

export function updateCardReview(
  store: UserSRSStore,
  wordId: string,
  rating: SRSRating
): UserSRSStore {
  const existingCard = store.cards[wordId];
  const updatedCard = calculateSM2(existingCard, rating);
  updatedCard.wordId = wordId;

  const today = getTodayDateString();
  let newStreak = store.streak;

  if (store.lastActiveDate !== today) {
    if (store.lastActiveDate) {
      // Check if last active was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (store.lastActiveDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
  }

  const updatedStore: UserSRSStore = {
    ...store,
    cards: {
      ...store.cards,
      [wordId]: updatedCard,
    },
    streak: newStreak,
    lastActiveDate: today,
    dailyCompleted: (store.dailyCompleted || 0) + 1,
    lastGoalDate: today,
  };

  saveSRSStore(updatedStore);
  return updatedStore;
}

export function toggleStarWord(
  store: UserSRSStore,
  wordId: string
): UserSRSStore {
  const currentCard = store.cards[wordId] || {
    wordId,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: Date.now(),
    lastReviewed: null,
    history: [],
    starred: false,
    status: 'new' as const,
  };

  const updatedCard: CardSRS = {
    ...currentCard,
    starred: !currentCard.starred,
  };

  const updatedStore: UserSRSStore = {
    ...store,
    cards: {
      ...store.cards,
      [wordId]: updatedCard,
    },
  };

  saveSRSStore(updatedStore);
  return updatedStore;
}

export function getDueWordIds(store: UserSRSStore): string[] {
  const now = Date.now();
  const dueIds: string[] = [];

  for (const [id, card] of Object.entries(store.cards)) {
    if (card.dueDate <= now) {
      dueIds.push(id);
    }
  }

  return dueIds;
}

export function getSRSStats(store: UserSRSStore, totalWordsCount: number) {
  let mastered = 0;
  let reviewing = 0;
  let learning = 0;
  let dueToday = 0;
  let starredCount = 0;
  const now = Date.now();

  for (const card of Object.values(store.cards)) {
    if (card.starred) starredCount += 1;
    if (card.status === 'mastered') mastered += 1;
    else if (card.status === 'review') reviewing += 1;
    else if (card.status === 'learning') learning += 1;

    if (card.dueDate <= now) {
      dueToday += 1;
    }
  }

  const learnedCount = Object.keys(store.cards).length;
  const newCount = Math.max(0, totalWordsCount - learnedCount);

  return {
    mastered,
    reviewing,
    learning,
    dueToday,
    starredCount,
    newCount,
    totalLearned: learnedCount,
    percentMastered: totalWordsCount > 0 ? Math.round((mastered / totalWordsCount) * 100) : 0,
    retentionRate: learnedCount > 0 ? Math.round(((mastered + reviewing) / learnedCount) * 100) : 100,
  };
}
