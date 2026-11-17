import React, { useState, useEffect, useMemo } from 'react';
import { ALL_VOCABULARY, GRADES_LIST, getWordsByGrade } from './data';
import { loadSRSStore, saveSRSStore, getDueWordIds } from './utils/srs';
import { VocabWord, UserSRSStore } from './types';
import { Navbar } from './components/Navbar';
import { Overview } from './components/Overview';
import { SmartFlashcard } from './components/SmartFlashcard';
import { PracticeArena } from './components/PracticeArena';
import { SRSDashboard } from './components/SRSDashboard';
import { VocabDictionary } from './components/VocabDictionary';
import { Grade1VisualHub } from './components/Grade1VisualHub';
import { ListeningDictation } from './components/ListeningDictation';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'flashcard' | 'dictation' | 'practice' | 'srs' | 'dictionary' | 'grade1_visual'>('overview');
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('eduvocab_selected_grade');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  const [srsStore, setSrsStore] = useState<UserSRSStore>(() => loadSRSStore());
  const [flashcardFilter, setFlashcardFilter] = useState<'all' | 'due' | 'starred' | 'unlearned'>('all');
  const [activeUnitWords, setActiveUnitWords] = useState<VocabWord[] | null>(null);
  const [dictationInitialUnit, setDictationInitialUnit] = useState<number | 'all'>('all');

  // Save selected grade
  useEffect(() => {
    localStorage.setItem('eduvocab_selected_grade', String(selectedGrade));
  }, [selectedGrade]);

  const handleUpdateStore = (newStore: UserSRSStore) => {
    setSrsStore(newStore);
    saveSRSStore(newStore);
  };

  // Grade words
  const currentGradeWords = useMemo(() => {
    return getWordsByGrade(selectedGrade);
  }, [selectedGrade]);
  const wordsForFlashcard = activeUnitWords || currentGradeWords;

  // Selected grade title
  const currentGradeObj = GRADES_LIST.find((g) => g.grade === selectedGrade) || GRADES_LIST[0];

  // Count due items
  const dueWordIds = getDueWordIds(srsStore);
  const dueCount = dueWordIds.length;

  const handleStartDueReview = () => {
    setActiveUnitWords(null);
    setFlashcardFilter('due');
    setCurrentTab('flashcard');
  };

  const handleLaunchUnitFlashcard = (grade: number, unit: number) => {
    setSelectedGrade(grade);
    const words = ALL_VOCABULARY.filter(w => w.grade === grade && w.unit === unit);
    setActiveUnitWords(words);
    setFlashcardFilter('all');
    setCurrentTab('flashcard');
  };

  const handleStartNormalFlashcard = () => {
    setActiveUnitWords(null);
    setFlashcardFilter('all');
    setCurrentTab('flashcard');
  };

  const handleLaunchUnitDictation = (grade: number, unit: number) => {
    setSelectedGrade(grade);
    setDictationInitialUnit(unit);
    setCurrentTab('dictation');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveUnitWords(null);
          if (tab === 'dictation') {
            setDictationInitialUnit('all');
          }
          setCurrentTab(tab);
        }}
        selectedGrade={selectedGrade}
        onSelectGrade={(g) => {
          setSelectedGrade(g);
          setActiveUnitWords(null);
        }}
        dueCount={dueCount}
        streak={srsStore.streak}
        onStartDueReview={handleStartDueReview}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'overview' && (
          <Overview
            srsStore={srsStore}
            allWords={ALL_VOCABULARY}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => {
              setSelectedGrade(g);
              setActiveUnitWords(null);
            }}
            onStartFlashcard={handleStartNormalFlashcard}
            onStartDictation={() => {
              setDictationInitialUnit('all');
              setCurrentTab('dictation');
            }}
            onStartPractice={() => setCurrentTab('practice')}
            onStartSRS={() => setCurrentTab('srs')}
            onOpenGrade1Visual={() => {
              if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(selectedGrade)) {
                setSelectedGrade(1);
              }
              setCurrentTab('grade1_visual');
            }}
          />
        )}

        {currentTab === 'flashcard' && (
          <SmartFlashcard
            words={wordsForFlashcard}
            srsStore={srsStore}
            onUpdateStore={handleUpdateStore}
            selectedGradeTitle={currentGradeObj.title}
            initialFilter={flashcardFilter}
          />
        )}

        {currentTab === 'dictation' && (
          <ListeningDictation
            allWords={ALL_VOCABULARY}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => {
              setSelectedGrade(g);
              setActiveUnitWords(null);
            }}
            srsStore={srsStore}
            onUpdateStore={handleUpdateStore}
            initialUnit={dictationInitialUnit}
          />
        )}

        {currentTab === 'practice' && (
          <PracticeArena
            words={currentGradeWords}
            srsStore={srsStore}
            onUpdateStore={handleUpdateStore}
            selectedGradeTitle={currentGradeObj.title}
          />
        )}

        {currentTab === 'srs' && (
          <SRSDashboard
            srsStore={srsStore}
            allWords={ALL_VOCABULARY}
            onUpdateStore={handleUpdateStore}
            onStartDueReview={handleStartDueReview}
          />
        )}

        {currentTab === 'grade1_visual' && (
          <Grade1VisualHub
            words={getWordsByGrade([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(selectedGrade) ? selectedGrade : 1)}
            activeGrade={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(selectedGrade) ? selectedGrade : 1}
            onChangeGrade={(g) => setSelectedGrade(g)}
            grade1Words={getWordsByGrade(1)}
            grade2Words={getWordsByGrade(2)}
            grade3Words={getWordsByGrade(3)}
            grade4Words={getWordsByGrade(4)}
            grade5Words={getWordsByGrade(5)}
            grade6Words={getWordsByGrade(6)}
            grade7Words={getWordsByGrade(7)}
            grade8Words={getWordsByGrade(8)}
            grade9Words={getWordsByGrade(9)}
            grade10Words={getWordsByGrade(10)}
            grade11Words={getWordsByGrade(11)}
            grade12Words={getWordsByGrade(12)}
            srsStore={srsStore}
            onUpdateStore={handleUpdateStore}
            onLaunchFlashcardWithWords={(selected) => {
              setSelectedGrade(selected[0]?.grade || 1);
              setActiveUnitWords(selected);
              setFlashcardFilter('all');
              setCurrentTab('flashcard');
            }}
          />
        )}

        {currentTab === 'dictionary' && (
          <VocabDictionary
            allWords={ALL_VOCABULARY}
            srsStore={srsStore}
            onUpdateStore={handleUpdateStore}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => {
              setSelectedGrade(g);
              setActiveUnitWords(null);
            }}
            onLaunchUnitFlashcard={handleLaunchUnitFlashcard}
            onLaunchUnitDictation={handleLaunchUnitDictation}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">EduVocab 1-12</span>
            <span aria-hidden="true">·</span>
            <span>Chương trình Tiếng Anh Giáo dục phổ thông 2018 (Global Success)</span>
            <span aria-hidden="true">·</span>
            <span>{ALL_VOCABULARY.length} từ vựng chuẩn & mẫu câu</span>
          </div>
          <div>
            <span>Thuật toán Lặp lại ngắt quãng SuperMemo SM-2 & Phát âm Web Speech</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
