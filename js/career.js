// ============================================================
// career.js — режим "Лига Оверклока": последовательность из 5
// соперников возрастающей сложности. Поражение -> рестарт лиги.
// Хранит прогресс в localStorage между сессиями (текущий этап).
// ============================================================

const Career = (() => {

  const OPPONENTS = [
    { name: 'BYTE FC',      difficulty: 'easy',   duration: 120 },
    { name: 'PIXEL UNITED', difficulty: 'easy',   duration: 150 },
    { name: 'GRID RANGERS', difficulty: 'normal',  duration: 150 },
    { name: 'VOLT CARTEL',  difficulty: 'normal',  duration: 180 },
    { name: 'CORE.EXE',     difficulty: 'hard',    duration: 180 },
  ];

  const STORAGE_KEY = 'ncfc_career_progress';
  const BEST_STREAK_KEY = 'ncfc_best_streak';

  function getProgress() {
    return Utils.storage.get(STORAGE_KEY, { stage: 0 });
  }

  function setProgress(stage) {
    Utils.storage.set(STORAGE_KEY, { stage });
  }

  function resetProgress() {
    setProgress(0);
  }

  function getCurrentOpponent() {
    const p = getProgress();
    const idx = Utils.clamp(p.stage, 0, OPPONENTS.length - 1);
    return { ...OPPONENTS[idx], stageIndex: idx, totalStages: OPPONENTS.length };
  }

  function advance() {
    const p = getProgress();
    const next = p.stage + 1;
    if (next >= OPPONENTS.length) {
      // лига пройдена полностью — обновляем лучшую серию и начинаем заново
      const best = Utils.storage.get(BEST_STREAK_KEY, 0);
      Utils.storage.set(BEST_STREAK_KEY, Math.max(best, OPPONENTS.length));
      setProgress(0);
      return { leagueCompleted: true };
    }
    setProgress(next);
    const best = Utils.storage.get(BEST_STREAK_KEY, 0);
    Utils.storage.set(BEST_STREAK_KEY, Math.max(best, next));
    return { leagueCompleted: false, nextStage: next };
  }

  function getBestStreak() {
    return Utils.storage.get(BEST_STREAK_KEY, 0);
  }

  return { getCurrentOpponent, advance, resetProgress, getBestStreak, OPPONENTS };
})();
