/**
 * Speech synthesis utility for native British English (Anh - Anh / en-GB) pronunciation
 * Chuẩn giọng Anh - Anh (Received Pronunciation / Oxford / Cambridge)
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

export function getBritishEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // 1. High priority: Recognized natural British English voices
  const preferredUkVoiceNames = [
    'Google UK English Female',
    'Google UK English Male',
    'Microsoft Libby Online (Natural) - English (United Kingdom)',
    'Microsoft Oliver Online (Natural) - English (United Kingdom)',
    'Microsoft George',
    'Microsoft Susan',
    'Microsoft Hazel',
    'Daniel',
    'Oliver',
    'Kate',
    'Serena',
    'Arthur',
    'Martha',
    'Fiona',
    'Alice'
  ];

  for (const name of preferredUkVoiceNames) {
    const found = voices.find(
      v => v.name.toLowerCase().includes(name.toLowerCase()) && 
           (v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk') || v.lang.startsWith('en'))
    );
    if (found) return found;
  }

  // 2. Any voice explicitly marked as en-GB or en_GB
  const enGbVoice = voices.find(v => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'en-gb' || l.startsWith('en-gb');
  });
  if (enGbVoice) return enGbVoice;

  // 3. Any UK / United Kingdom variant voice
  const ukVoice = voices.find(v => 
    v.name.toLowerCase().includes('united kingdom') || 
    v.name.toLowerCase().includes('uk english') ||
    v.name.toLowerCase().includes('british')
  );
  if (ukVoice) return ukVoice;

  // 4. Fallback to British Isles region (en-IE / en-UK)
  const britishIsles = voices.find(v => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'en-ie' || l === 'en-uk';
  });
  if (britishIsles) return britishIsles;

  // 5. Final fallback to any English voice
  const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return anyEnglish || voices[0] || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Listen for voice catalog loading
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = getBritishEnglishVoice();
  };
  // Pre-cache if voices are already ready
  cachedVoice = getBritishEnglishVoice();
}

/**
 * Phát âm từ vựng hoặc câu theo chuẩn Anh - Anh (en-GB)
 * @param text Văn bản cần đọc
 * @param rate Tốc độ đọc (mặc định 0.9x rõ ràng, 0.75x chậm)
 */
export function playPronunciation(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this environment');
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Force British English (Anh - Anh) locale
      utterance.lang = 'en-GB';
      utterance.rate = rate; // 0.8 to 1.0
      utterance.pitch = 1.0;

      if (!cachedVoice) {
        cachedVoice = getBritishEnglishVoice();
      }
      if (cachedVoice) {
        utterance.voice = cachedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      resolve();
    }
  });
}

/**
 * Lấy thông tin giọng đọc Anh - Anh hiện tại
 */
export function getCurrentVoiceLabel(): string {
  if (!cachedVoice) {
    cachedVoice = getBritishEnglishVoice();
  }
  if (cachedVoice) {
    return `${cachedVoice.name} (Anh - Anh / en-GB)`;
  }
  return 'Chuẩn Anh - Anh (en-GB)';
}
