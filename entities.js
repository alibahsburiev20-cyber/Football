// ============================================================
// entities.js — фабрики игровых сущностей: игрок, мяч.
// Простые объекты-данные, обновление логики в physics.js / match.js
// ============================================================

const Entities = (() => {

  function createPlayer({ x, y, team, isUser = false, isGK = false, role = 'field', skin = null }) {
    return {
      x, y,
      vx: 0, vy: 0,
      radius: 16,
      team,                 // 'home' | 'away'
      isUser,
      isGK,
      role,                 // 'field' | 'gk'
      facing: team === 'home' ? 0 : Math.PI,
      speed: 0,
      maxSpeed: isGK ? 220 : 260,
      accel: 1400,
      friction: 0.86,
      dashCooldown: 0,
      dashTimer: 0,
      isDashing: false,
      kickCooldown: 0,
      stunTimer: 0,         // после удачного отбора/столкновения
      hasBall: false,
      skin: skin || (team === 'home' ? '#00F0FF' : '#FF3D5A'),
      // AI state (только для не-пользователя)
      ai: {
        role: role,          // 'striker' | 'mid' | 'defender' | 'gk'
        homeX: x, homeY: y,
        targetX: x, targetY: y,
        decisionTimer: 0,
        state: 'position'    // position | chase | press | return
      },
      animPhase: Math.random() * Math.PI * 2,
    };
  }

  function createBall(x, y) {
    return {
      x, y,
      vx: 0, vy: 0,
      radius: 9,
      friction: 0.985,
      lastTouchTeam: null,
      lastTouchIsUser: false,
      possessedBy: null,    // ссылка на игрока, который сейчас контролирует
      overdriveActive: false,
      overdriveTimer: 0,
      spinAngle: 0,
      trailTick: 0,
    };
  }

  return { createPlayer, createBall };
})();
