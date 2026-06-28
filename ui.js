// ============================================================
// ui.js — управление экранами, настройками, баннерами и результатом.
// Связывает DOM-интерфейс с модулями Match / Career.
// ============================================================

const UI = (() => {

  let settings = {
    volume: 70,
    difficulty: 'normal',
    shake: 'on',
    duration: '180'
  };

  let currentMode = null; // 'quick' | 'career' | 'training'
  let comboHideTimeout = null;

  function loadSettings() {
    settings = Utils.storage.get('ncfc_settings', settings);
    document.getElementById('set-volume').value = settings.volume;
    setSegActive('set-difficulty', settings.difficulty);
    setSegActive('set-shake', settings.shake);
    setSegActive('set-duration', settings.duration);
    AudioEngine.setVolume(settings.volume / 100);
  }

  function saveSettings() {
    Utils.storage.set('ncfc_settings', settings);
  }

  function setSegActive(groupId, val) {
    const group = document.getElementById(groupId);
    group.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === String(val));
    });
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function showOverlay(id) {
    document.getElementById(id).classList.add('active');
  }

  function hideOverlay(id) {
    document.getElementById(id).classList.remove('active');
  }

  function updateBestStreakDisplay() {
    document.getElementById('best-streak-val').textContent = Career.getBestStreak();
  }

  function flashCombo(count) {
    const el = document.getElementById('hud-combo');
    document.getElementById('combo-count').textContent = count;
    el.classList.add('show');
    clearTimeout(comboHideTimeout);
    comboHideTimeout = setTimeout(() => el.classList.remove('show'), 1400);
  }

  function showGoalBanner(scorerName) {
    const banner = document.getElementById('goal-banner');
    document.getElementById('goal-banner-sub').textContent = scorerName.toUpperCase();
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 1500);
  }

  function startMatch(mode) {
    currentMode = mode;
    AudioEngine.ensureCtx();

    let config = {
      duration: parseInt(settings.duration, 10),
      difficulty: settings.difficulty,
      shakeEnabled: settings.shake === 'on',
      homeName: 'ТЫ',
      awayName: 'CPU',
      modeLabel: ''
    };

    if (mode === 'quick') {
      config.modeLabel = 'БЫСТРЫЙ МАТЧ';
      config.awayName = 'CPU';
    } else if (mode === 'training') {
      config.modeLabel = 'ТРЕНИРОВКА';
      config.duration = 999999;
      config.difficulty = 'easy';
      config.awayName = 'МАНЕКЕН';
    } else if (mode === 'career') {
      const opp = Career.getCurrentOpponent();
      config.modeLabel = `ЛИГА · ЭТАП ${opp.stageIndex + 1}/${opp.totalStages}`;
      config.awayName = opp.name;
      config.difficulty = opp.difficulty;
      config.duration = opp.duration;
    }

    showScreen('screen-game');
    Match.init(config);
  }

  function showResult(state) {
    const headline = document.getElementById('result-headline');
    const scoreEl = document.getElementById('result-score');
    const note = document.getElementById('result-league-note');

    let resultType = 'draw';
    if (state.scoreHome > state.scoreAway) resultType = 'win';
    else if (state.scoreHome < state.scoreAway) resultType = 'lose';

    headline.textContent = resultType === 'win' ? 'ПОБЕДА' : resultType === 'lose' ? 'ПОРАЖЕНИЕ' : 'НИЧЬЯ';
    headline.className = 'result-headline' + (resultType === 'lose' ? ' lose' : resultType === 'draw' ? ' draw' : '');
    scoreEl.textContent = `${state.scoreHome} : ${state.scoreAway}`;

    document.getElementById('stat-bestcombo').textContent = state.bestCombo;
    document.getElementById('stat-overclocks').textContent = state.overdriveShotsUsed;
    document.getElementById('stat-shots').textContent = state.totalShots;

    note.textContent = '';
    const nextBtn = document.getElementById('btn-result-next');

    if (currentMode === 'career') {
      if (resultType === 'win') {
        const advanceResult = Career.advance();
        if (advanceResult.leagueCompleted) {
          note.textContent = 'ЛИГА ОВЕРКЛОКА ПРОЙДЕНА ПОЛНОСТЬЮ! Начни заново с первого соперника.';
        } else {
          const nextOpp = Career.getCurrentOpponent();
          note.textContent = `Следующий соперник: ${nextOpp.name}`;
        }
        nextBtn.textContent = 'ДАЛЬШЕ';
        nextBtn.dataset.action = 'continue-career';
      } else {
        Career.resetProgress();
        note.textContent = 'Лига начинается заново с первого соперника.';
        nextBtn.textContent = 'НАЧАТЬ ЛИГУ СНОВА';
        nextBtn.dataset.action = 'restart-career';
      }
      updateBestStreakDisplay();
    } else {
      nextBtn.textContent = 'ИГРАТЬ СНОВА';
      nextBtn.dataset.action = 'replay';
    }

    showOverlay('screen-result');
  }

  function bindEvents() {
    // BOOT -> MENU handled in main.js

    // Menu cards
    document.getElementById('card-quick').addEventListener('click', () => { AudioEngine.sfxMenuConfirm(); startMatch('quick'); });
    document.getElementById('card-career').addEventListener('click', () => { AudioEngine.sfxMenuConfirm(); startMatch('career'); });
    document.getElementById('card-training').addEventListener('click', () => { AudioEngine.sfxMenuConfirm(); startMatch('training'); });

    document.querySelectorAll('.menu-card').forEach(c => {
      c.addEventListener('mouseenter', () => AudioEngine.sfxMenuHover());
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => showOverlay('screen-settings'));
    document.getElementById('btn-settings-close').addEventListener('click', () => { saveSettings(); hideOverlay('screen-settings'); });

    document.getElementById('set-volume').addEventListener('input', (e) => {
      settings.volume = parseInt(e.target.value, 10);
      AudioEngine.setVolume(settings.volume / 100);
    });

    document.getElementById('set-difficulty').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      settings.difficulty = btn.dataset.val;
      setSegActive('set-difficulty', settings.difficulty);
    });
    document.getElementById('set-shake').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      settings.shake = btn.dataset.val;
      setSegActive('set-shake', settings.shake);
      Renderer.setShakeEnabled(settings.shake === 'on');
    });
    document.getElementById('set-duration').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      settings.duration = btn.dataset.val;
      setSegActive('set-duration', settings.duration);
    });

    // How to play
    document.getElementById('btn-howto').addEventListener('click', () => showOverlay('screen-howto'));
    document.getElementById('btn-howto-close').addEventListener('click', () => hideOverlay('screen-howto'));

    // Pause
    document.getElementById('btn-pause').addEventListener('click', () => {
      Match.setPaused(true);
      showOverlay('screen-pause');
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      hideOverlay('screen-pause');
      Match.setPaused(false);
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      hideOverlay('screen-pause');
      Match.destroy();
      startMatch(currentMode);
    });
    document.getElementById('btn-quit-menu').addEventListener('click', () => {
      hideOverlay('screen-pause');
      Match.destroy();
      goToMenu();
    });

    // Result
    document.getElementById('btn-result-next').addEventListener('click', (e) => {
      hideOverlay('screen-result');
      const action = e.target.dataset.action;
      Match.destroy();
      if (action === 'continue-career' || action === 'restart-career') {
        startMatch('career');
      } else {
        startMatch(currentMode);
      }
    });
    document.getElementById('btn-result-menu').addEventListener('click', () => {
      hideOverlay('screen-result');
      Match.destroy();
      goToMenu();
    });
  }

  function goToMenu() {
    showScreen('screen-menu');
    updateBestStreakDisplay();
    MenuBackground.start();
  }

  function init() {
    loadSettings();
    bindEvents();
    updateBestStreakDisplay();
  }

  return { init, showScreen, showResult, flashCombo, showGoalBanner, goToMenu, startMatch };
})();
