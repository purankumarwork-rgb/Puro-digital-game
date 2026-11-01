import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UserProfile, Character, Obstacle, PowerUp, Projectile, Particle, DamageNumber, KillFeedItem } from '../types/game';
import { CHARACTERS, ARENA_MAPS } from '../constants/characters';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Shield, Zap, Flame, Award, ChevronLeft } from 'lucide-react';

interface BattleCanvasProps {
  userProfile: UserProfile;
  mode: 'offline_bot' | 'online' | 'practice';
  difficulty?: 'easy' | 'medium' | 'hard' | 'insane';
  format?: '1v1' | '2v2' | '1v3';
  mapId?: string;
  onlineRoomCode?: string;
  onlineSocket?: WebSocket | null;
  onExitMatch: (results?: { result: 'VICTORY' | 'DEFEAT' | 'DRAW'; kills: number; deaths: number; score: number; goldEarned: number }) => void;
}

interface Entity {
  id: string;
  isBot: boolean;
  isLocalPlayer: boolean;
  name: string;
  character: Character;
  team: 'red' | 'blue';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  kills: number;
  deaths: number;
  score: number;
  dashCooldown: number; // in sec
  abilityCooldown: number;
  ultimateCharge: number; // 0 - 100
  powerupBuff?: {
    type: 'damage' | 'speed';
    timeLeft: number;
  };
  radius: number;
  target?: Entity | null;
  botState?: 'patrol' | 'engage' | 'flee' | 'powerup';
  botTimer?: number;
}

export const BattleCanvas: React.FC<BattleCanvasProps> = ({
  userProfile,
  mode,
  difficulty = 'medium',
  format = '1v1',
  mapId = 'cyber_grid',
  onlineRoomCode,
  onlineSocket,
  onExitMatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Match HUD states
  const [matchTime, setMatchTime] = useState(180);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState<'VICTORY' | 'DEFEAT' | 'DRAW' | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>('MATCH START - ELIMINATE ENEMIES!');
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [audioMuted, setAudioMuted] = useState(!sound.soundEnabled);

  // Player ability cooldowns for on-screen HUD buttons
  const [dashCdRatio, setDashCdRatio] = useState(0);
  const [abilityCdRatio, setAbilityCdRatio] = useState(0);
  const [ultCharge, setUltCharge] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(50);

  // Internal game engine references
  const entitiesRef = useRef<Entity[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 450, y: 300, isDown: false });

  // Virtual touch joysticks
  const moveJoystickRef = useRef<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });

  const aimJoystickRef = useRef<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });

  const lastShotTimeRef = useRef<number>(0);
  const currentMap = ARENA_MAPS.find(m => m.id === mapId) || ARENA_MAPS[0];

  // Selected player character
  const playerCharacter = CHARACTERS[userProfile.selectedCharacter] || CHARACTERS.rex;

  // Initialize Match
  useEffect(() => {
    sound.startBgm();

    // Map obstacles
    obstaclesRef.current = currentMap.obstacles;

    // Power-up locations
    powerUpsRef.current = [
      { id: 'pup-1', x: 450, y: 120, type: 'shield', duration: 15, active: true },
      { id: 'pup-2', x: 450, y: 480, type: 'health', duration: 15, active: true },
      { id: 'pup-3', x: 180, y: 300, type: 'damage', duration: 8, active: true },
      { id: 'pup-4', x: 720, y: 300, type: 'speed', duration: 8, active: true },
    ];

    // Build Entities
    const entities: Entity[] = [];

    // Local human player (Team Red by default)
    const localPlayer: Entity = {
      id: userProfile.id,
      isBot: false,
      isLocalPlayer: true,
      name: userProfile.username || 'You',
      character: playerCharacter,
      team: 'red',
      x: 180,
      y: 300,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: playerCharacter.stats.hp,
      maxHp: playerCharacter.stats.hp,
      shield: 50,
      maxShield: 50,
      kills: 0,
      deaths: 0,
      score: 0,
      dashCooldown: 0,
      abilityCooldown: 0,
      ultimateCharge: 0,
      radius: 22
    };
    entities.push(localPlayer);

    if (mode === 'offline_bot' || mode === 'practice') {
      // Configure Bot enemies & allies based on format
      if (format === '1v1') {
        const botChar = CHARACTERS.shadow;
        entities.push(createBotEntity('bot-1', 'Bot Phantom', botChar, 'blue', 720, 300, difficulty));
      } else if (format === '1v3') {
        entities.push(createBotEntity('bot-1', 'Bot Volt', CHARACTERS.volt, 'blue', 720, 200, difficulty));
        entities.push(createBotEntity('bot-2', 'Bot Pyro', CHARACTERS.pyro, 'blue', 720, 300, difficulty));
        entities.push(createBotEntity('bot-3', 'Bot Shadow', CHARACTERS.shadow, 'blue', 720, 400, difficulty));
      } else if (format === '2v2') {
        // Ally
        entities.push(createBotEntity('bot-ally', 'Ally Valkyrie', CHARACTERS.valkyrie, 'red', 180, 420, difficulty));
        // Enemies
        entities.push(createBotEntity('bot-1', 'Bot Volt', CHARACTERS.volt, 'blue', 720, 220, difficulty));
        entities.push(createBotEntity('bot-2', 'Bot Pyro', CHARACTERS.pyro, 'blue', 720, 380, difficulty));
      }
    }

    entitiesRef.current = entities;

    const timer = setInterval(() => {
      setMatchTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          evaluateMatchOutcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      sound.stopBgm();
    };
  }, [mode, format, difficulty, mapId, userProfile]);

  // Setup Bot generator
  function createBotEntity(
    id: string,
    name: string,
    char: Character,
    team: 'red' | 'blue',
    x: number,
    y: number,
    diff: string
  ): Entity {
    let hpMultiplier = 1;
    if (diff === 'insane') hpMultiplier = 1.6;
    if (diff === 'easy') hpMultiplier = 0.8;

    return {
      id,
      isBot: true,
      isLocalPlayer: false,
      name,
      character: char,
      team,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: team === 'blue' ? Math.PI : 0,
      hp: Math.round(char.stats.hp * hpMultiplier),
      maxHp: Math.round(char.stats.hp * hpMultiplier),
      shield: diff === 'easy' ? 20 : 50,
      maxShield: 50,
      kills: 0,
      deaths: 0,
      score: 0,
      dashCooldown: 0,
      abilityCooldown: 0,
      ultimateCharge: 20,
      radius: 22,
      botState: 'patrol',
      botTimer: 0
    };
  }

  // Evaluate Match Outcome
  const evaluateMatchOutcome = useCallback(() => {
    let redKills = 0;
    let blueKills = 0;
    const player = entitiesRef.current.find(e => e.isLocalPlayer);

    entitiesRef.current.forEach(e => {
      if (e.team === 'red') redKills += e.kills;
      else blueKills += e.kills;
    });

    let outcome: 'VICTORY' | 'DEFEAT' | 'DRAW' = 'DRAW';
    if (redKills > blueKills) outcome = 'VICTORY';
    else if (blueKills > redKills) outcome = 'DEFEAT';

    setGameOver(outcome);

    if (outcome === 'VICTORY') {
      sound.playVictory();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 }
      });
    } else {
      sound.playDefeat();
    }

    const goldEarned = outcome === 'VICTORY' ? 350 + (player?.kills || 0) * 40 : 150 + (player?.kills || 0) * 20;

    setTimeout(() => {
      onExitMatch({
        result: outcome,
        kills: player?.kills || 0,
        deaths: player?.deaths || 0,
        score: (player?.kills || 0) * 100 + (outcome === 'VICTORY' ? 300 : 50),
        goldEarned
      });
    }, 4500);
  }, [onExitMatch]);

  // Online WebSocket synchronization listener
  useEffect(() => {
    if (mode !== 'online' || !onlineSocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'SYNC_PLAYER') {
          const remote = entitiesRef.current.find(e => e.id === msg.id && !e.isLocalPlayer);
          if (remote) {
            remote.x = msg.x;
            remote.y = msg.y;
            remote.angle = msg.angle;
          }
        } else if (msg.type === 'PROJECTILE_SPAWNED') {
          if (msg.projectile.ownerId !== userProfile.id) {
            projectilesRef.current.push(msg.projectile);
            sound.playLaser();
          }
        } else if (msg.type === 'DAMAGE_CONFIRMED') {
          const target = entitiesRef.current.find(e => e.id === msg.targetId);
          if (target) {
            target.hp = msg.hp;
            target.shield = msg.shield;
            if (msg.wasEliminated) {
              sound.playExplosion();
              triggerExplosion(target.x, target.y, '#ef4444');
            }
          }
        } else if (msg.type === 'MATCH_FINISHED') {
          evaluateMatchOutcome();
        }
      } catch (e) {}
    };

    onlineSocket.addEventListener('message', handleMessage);
    return () => {
      onlineSocket.removeEventListener('message', handleMessage);
    };
  }, [mode, onlineSocket, userProfile.id, evaluateMatchOutcome]);

  // Particle explosion trigger
  function triggerExplosion(x: number, y: number, color: string, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        maxLife: Math.random() * 0.4 + 0.3,
        radius: Math.random() * 3.5 + 1.5
      });
    }
  }

  // Floating damage number
  function addDamageText(x: number, y: number, amount: number, isShield = false, isCrit = false) {
    damageNumbersRef.current.push({
      id: Math.random().toString(),
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      amount,
      isCrit,
      isShield,
      life: 1.0
    });
  }

  // Local Player Actions
  const handleDash = useCallback(() => {
    const player = entitiesRef.current.find(e => e.isLocalPlayer);
    if (!player || player.dashCooldown > 0 || player.hp <= 0) return;

    sound.playDash();
    const dashDistance = 110;
    const nx = player.x + Math.cos(player.angle) * dashDistance;
    const ny = player.y + Math.sin(player.angle) * dashDistance;

    // Check boundary
    player.x = Math.max(30, Math.min(870, nx));
    player.y = Math.max(30, Math.min(570, ny));
    player.dashCooldown = 3.5;

    triggerExplosion(player.x, player.y, player.character.color, 12);
  }, []);

  const handleAbility = useCallback(() => {
    const player = entitiesRef.current.find(e => e.isLocalPlayer);
    if (!player || player.abilityCooldown > 0 || player.hp <= 0) return;

    player.abilityCooldown = player.character.specialAbility.cooldownSec;
    sound.playShieldHit();

    if (player.character.id === 'rex') {
      player.shield = Math.min(player.maxShield + 40, player.maxShield + 40);
      setAnnouncement('REX KINETIC BARRIER ACTIVATED!');
    } else if (player.character.id === 'shadow') {
      handleDash();
      setAnnouncement('SHADOW BLINK STRIKE!');
    } else if (player.character.id === 'volt') {
      // Launch electric emp
      const angle = player.angle;
      projectilesRef.current.push({
        id: 'emp-' + Math.random(),
        ownerId: player.id,
        team: player.team,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 16,
        vy: Math.sin(angle) * 16,
        damage: 45,
        color: '#facc15',
        range: 600,
        traveled: 0,
        radius: 8
      });
      sound.playRailgun();
      setAnnouncement('VOLT EMP LAUNCHED!');
    } else if (player.character.id === 'pyro') {
      // Flame Wall
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = player.angle + i * 0.18;
        projectilesRef.current.push({
          id: 'pyro-' + Math.random(),
          ownerId: player.id,
          team: player.team,
          x: player.x,
          y: player.y,
          vx: Math.cos(spreadAngle) * 12,
          vy: Math.sin(spreadAngle) * 12,
          damage: 32,
          color: '#f97316',
          range: 400,
          traveled: 0,
          radius: 6
        });
      }
      sound.playExplosion();
      setAnnouncement('PYRO FLAME BARRAGE!');
    } else if (player.character.id === 'valkyrie') {
      // Heal
      player.hp = Math.min(player.maxHp, player.hp + 40);
      sound.playPowerUp();
      setAnnouncement('VALKYRIE NANITE REPAIR!');
    }
  }, [handleDash]);

  const handleUltimate = useCallback(() => {
    const player = entitiesRef.current.find(e => e.isLocalPlayer);
    if (!player || player.ultimateCharge < 100 || player.hp <= 0) return;

    player.ultimateCharge = 0;
    sound.playUltimate();
    setAnnouncement(`ULTIMATE ACTIVATED: ${player.character.ultimateAbility.name}!`);

    // Fire 360 degree radial wave of projectiles
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      projectilesRef.current.push({
        id: 'ult-' + Math.random(),
        ownerId: player.id,
        team: player.team,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 15,
        vy: Math.sin(angle) * 15,
        damage: 55,
        color: '#f59e0b',
        range: 550,
        traveled: 0,
        radius: 7
      });
    }
    triggerExplosion(player.x, player.y, '#f59e0b', 30);
  }, []);

  // Fire Weapon
  const fireProjectile = useCallback((attacker: Entity, targetAngle: number) => {
    const now = Date.now();
    const fireInterval = 1000 / attacker.character.stats.fireRate;

    if (attacker.isLocalPlayer) {
      if (now - lastShotTimeRef.current < fireInterval) return;
      lastShotTimeRef.current = now;
    }

    if (attacker.character.id === 'volt') {
      sound.playRailgun();
    } else {
      sound.playLaser(attacker.team === 'red' ? 950 : 700);
    }

    const spread = (Math.random() - 0.5) * attacker.character.weapon.spread;
    const finalAngle = targetAngle + spread;
    const spd = attacker.character.weapon.projectileSpeed;

    const damageBoost = attacker.powerupBuff?.type === 'damage' ? 1.5 : 1.0;
    const damage = Math.round(attacker.character.stats.damage * damageBoost);

    const proj: Projectile = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      ownerId: attacker.id,
      team: attacker.team,
      x: attacker.x + Math.cos(finalAngle) * 25,
      y: attacker.y + Math.sin(finalAngle) * 25,
      vx: Math.cos(finalAngle) * spd,
      vy: Math.sin(finalAngle) * spd,
      damage,
      color: attacker.character.weapon.projectileColor,
      range: attacker.character.stats.range,
      traveled: 0,
      radius: attacker.character.id === 'volt' ? 4 : 5
    };

    projectilesRef.current.push(proj);

    // If online match, broadcast projectile to server
    if (attacker.isLocalPlayer && mode === 'online' && onlineSocket?.readyState === WebSocket.OPEN) {
      onlineSocket.send(JSON.stringify({
        type: 'PLAYER_FIRE',
        angle: finalAngle,
        speed: spd,
        damage,
        color: proj.color,
        range: proj.range
      }));
    }
  }, [mode, onlineSocket]);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isPaused && !gameOver) {
        // 1. Update Entities
        updatePhysics(dt);
        // 2. Update Bot AI
        updateBots(dt);
        // 3. Update Projectiles & Collisions
        updateProjectiles(dt);
        // 4. Update Powerups & Particles
        updateEnvironment(dt);
      }

      // Render Everything
      renderScene(ctx);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, gameOver, currentMap, fireProjectile]);

  // Update physics for movement and cooldowns
  function updatePhysics(dt: number) {
    const player = entitiesRef.current.find(e => e.isLocalPlayer);
    if (!player || player.hp <= 0) return;

    // Movement calculation from Keyboard or Touch Joystick
    let moveX = 0;
    let moveY = 0;

    if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) moveY -= 1;
    if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) moveY += 1;
    if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
    if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

    // Check touch joystick
    if (moveJoystickRef.current.active) {
      const dx = moveJoystickRef.current.currX - moveJoystickRef.current.startX;
      const dy = moveJoystickRef.current.currY - moveJoystickRef.current.startY;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        moveX = dx / Math.max(dist, 50);
        moveY = dy / Math.max(dist, 50);
      }
    }

    // Aim calculation: Mouse or Aim Joystick
    if (aimJoystickRef.current.active) {
      const adx = aimJoystickRef.current.currX - aimJoystickRef.current.startX;
      const ady = aimJoystickRef.current.currY - aimJoystickRef.current.startY;
      if (Math.hypot(adx, ady) > 12) {
        player.angle = Math.atan2(ady, adx);
        fireProjectile(player, player.angle);
      }
    } else {
      // Mouse aim
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = 900 / rect.width;
        const scaleY = 600 / rect.height;
        const targetX = (mouseRef.current.x - rect.left) * scaleX;
        const targetY = (mouseRef.current.y - rect.top) * scaleY;
        player.angle = Math.atan2(targetY - player.y, targetX - player.x);

        if (mouseRef.current.isDown) {
          fireProjectile(player, player.angle);
        }
      }
    }

    // Normalize movement
    const len = Math.hypot(moveX, moveY);
    const speedBoost = player.powerupBuff?.type === 'speed' ? 1.45 : 1.0;
    const speed = player.character.stats.speed * 60 * speedBoost;

    if (len > 0) {
      player.vx = (moveX / len) * speed;
      player.vy = (moveY / len) * speed;
    } else {
      player.vx *= 0.8;
      player.vy *= 0.8;
    }

    // Apply movement with obstacle collision
    const nextX = player.x + player.vx * dt;
    const nextY = player.y + player.vy * dt;

    if (!checkObstacleCollision(nextX, player.y, player.radius)) {
      player.x = Math.max(player.radius + 10, Math.min(900 - player.radius - 10, nextX));
    }
    if (!checkObstacleCollision(player.x, nextY, player.radius)) {
      player.y = Math.max(player.radius + 10, Math.min(600 - player.radius - 10, nextY));
    }

    // Cooldown reductions
    if (player.dashCooldown > 0) player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    if (player.abilityCooldown > 0) player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);

    // Buff decay
    if (player.powerupBuff) {
      player.powerupBuff.timeLeft -= dt;
      if (player.powerupBuff.timeLeft <= 0) player.powerupBuff = undefined;
    }

    // Passive shield regeneration (recharges if unhit for 4s)
    if (player.shield < player.maxShield) {
      player.shield = Math.min(player.maxShield, player.shield + 2.5 * dt);
    }

    // Update HUD state mirrors
    setDashCdRatio(player.dashCooldown / 3.5);
    setAbilityCdRatio(player.abilityCooldown / player.character.specialAbility.cooldownSec);
    setUltCharge(Math.min(100, player.ultimateCharge));
    setPlayerHp(Math.round(player.hp));
    setPlayerMaxHp(player.maxHp);
    setPlayerShield(Math.round(player.shield));

    // Online position sync
    if (mode === 'online' && onlineSocket?.readyState === WebSocket.OPEN) {
      onlineSocket.send(JSON.stringify({
        type: 'PLAYER_MOVE',
        x: player.x,
        y: player.y,
        angle: player.angle
      }));
    }
  }

  // Smart Bot AI behavior
  function updateBots(dt: number) {
    const enemies = entitiesRef.current.filter(e => e.isBot && e.hp > 0);
    const allLiving = entitiesRef.current.filter(e => e.hp > 0);

    enemies.forEach(bot => {
      // Find nearest opponent
      const opponents = allLiving.filter(o => o.team !== bot.team);
      if (opponents.length === 0) return;

      // Select target
      let closestDist = Infinity;
      let target: Entity | null = null;
      for (const opp of opponents) {
        const dist = Math.hypot(opp.x - bot.x, opp.y - bot.y);
        if (dist < closestDist) {
          closestDist = dist;
          target = opp;
        }
      }

      if (!target) return;

      // Angle to target
      const angleToTarget = Math.atan2(target.y - bot.y, target.x - bot.x);
      bot.angle = angleToTarget;

      // Bot movement tactics: Keep optimal combat distance (~220px)
      const idealDist = bot.character.role === 'Sniper' ? 360 : 200;
      let moveDir = 0;

      if (closestDist > idealDist + 40) {
        moveDir = 1; // Approach
      } else if (closestDist < idealDist - 40) {
        moveDir = -1; // Back away
      }

      // Add slight strafe
      const strafeAngle = angleToTarget + (moveDir === 1 ? 0 : Math.PI / 2);
      const botSpeed = bot.character.stats.speed * 45;

      const nextX = bot.x + Math.cos(strafeAngle) * botSpeed * dt;
      const nextY = bot.y + Math.sin(strafeAngle) * botSpeed * dt;

      if (!checkObstacleCollision(nextX, bot.y, bot.radius)) {
        bot.x = Math.max(30, Math.min(870, nextX));
      }
      if (!checkObstacleCollision(bot.x, nextY, bot.radius)) {
        bot.y = Math.max(30, Math.min(570, nextY));
      }

      // Bot shooting decision
      bot.botTimer = (bot.botTimer || 0) + dt;
      const shootInterval = difficulty === 'insane' ? 0.35 : difficulty === 'hard' ? 0.5 : 0.9;

      if (bot.botTimer >= shootInterval && closestDist < bot.character.stats.range) {
        bot.botTimer = 0;
        // Inaccuracy based on difficulty
        const errorMargin = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.18 : 0.05;
        const aimAngle = angleToTarget + (Math.random() - 0.5) * errorMargin;
        fireProjectile(bot, aimAngle);
      }

      // Bot shield regen
      if (bot.shield < bot.maxShield) {
        bot.shield = Math.min(bot.maxShield, bot.shield + 2.5 * dt);
      }
    });
  }

  // Obstacle collision check
  function checkObstacleCollision(x: number, y: number, radius: number): boolean {
    for (const obs of obstaclesRef.current) {
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
      const distanceX = x - closestX;
      const distanceY = y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      if (distanceSquared < radius * radius) {
        return true;
      }
    }
    return false;
  }

  // Update projectiles and damage resolution
  function updateProjectiles(dt: number) {
    const remaining: Projectile[] = [];

    projectilesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.traveled += Math.hypot(p.vx, p.vy);

      // Arena bounds check
      if (p.x < 10 || p.x > 890 || p.y < 10 || p.y > 590 || p.traveled > p.range) {
        triggerExplosion(p.x, p.y, p.color, 4);
        return;
      }

      // Obstacle collision
      if (checkObstacleCollision(p.x, p.y, p.radius)) {
        triggerExplosion(p.x, p.y, p.color, 6);
        return;
      }

      // Hit check against entities
      let hit = false;
      for (const entity of entitiesRef.current) {
        if (entity.team !== p.team && entity.hp > 0) {
          const dist = Math.hypot(p.x - entity.x, p.y - entity.y);
          if (dist < entity.radius + p.radius) {
            hit = true;
            applyDamage(entity, p);
            break;
          }
        }
      }

      if (!hit) {
        remaining.push(p);
      }
    });

    projectilesRef.current = remaining;
  }

  // Damage calculation & Elimination
  function applyDamage(target: Entity, projectile: Projectile) {
    const isCrit = Math.random() < 0.2;
    const finalDamage = isCrit ? Math.round(projectile.damage * 1.5) : projectile.damage;

    // Shield absorption
    if (target.shield > 0) {
      sound.playShieldHit();
      const absorbed = Math.min(target.shield, finalDamage);
      target.shield -= absorbed;
      const remainder = finalDamage - absorbed;
      target.hp = Math.max(0, target.hp - remainder);
      addDamageText(target.x, target.y, absorbed, true, false);
      if (remainder > 0) {
        addDamageText(target.x, target.y - 15, remainder, false, isCrit);
      }
    } else {
      sound.playHit();
      target.hp = Math.max(0, target.hp - finalDamage);
      addDamageText(target.x, target.y, finalDamage, false, isCrit);
    }

    triggerExplosion(projectile.x, projectile.y, target.shield > 0 ? '#38bdf8' : '#ef4444', 8);

    // Charge ultimate for shooter
    const attacker = entitiesRef.current.find(e => e.id === projectile.ownerId);
    if (attacker) {
      attacker.ultimateCharge = Math.min(100, attacker.ultimateCharge + (isCrit ? 14 : 9));
      if (attacker.isLocalPlayer && attacker.ultimateCharge >= 100) {
        sound.playPowerUp();
      }
    }

    // Check for elimination
    if (target.hp <= 0) {
      target.deaths++;
      sound.playExplosion();
      triggerExplosion(target.x, target.y, target.team === 'red' ? '#ef4444' : '#06b6d4', 28);

      if (attacker) {
        attacker.kills++;
        attacker.score += 100;
        // Kill feed entry
        setKillFeed(prev => [
          {
            id: 'kf-' + Date.now(),
            killer: attacker.name,
            victim: target.name,
            killerTeam: attacker.team,
            victimTeam: target.team,
            timestamp: Date.now()
          },
          ...prev.slice(0, 3)
        ]);

        if (attacker.isLocalPlayer) {
          setAnnouncement(`YOU ELIMINATED ${target.name.toUpperCase()}! (+100 PTS)`);
        }
      }

      // Update team scores
      let rKills = 0;
      let bKills = 0;
      entitiesRef.current.forEach(e => {
        if (e.team === 'red') rKills += e.kills;
        else bKills += e.kills;
      });
      setRedScore(rKills);
      setBlueScore(bKills);

      // Check win threshold (5 in 1v1, 10 in 2v2)
      const targetScore = format === '2v2' ? 10 : 5;
      if (rKills >= targetScore || bKills >= targetScore) {
        evaluateMatchOutcome();
        return;
      }

      // Respawn target after 3 seconds
      setTimeout(() => {
        if (target && !gameOver) {
          target.hp = target.maxHp;
          target.shield = target.maxShield;
          target.x = target.team === 'red' ? 160 : 740;
          target.y = 150 + Math.random() * 300;
          triggerExplosion(target.x, target.y, '#10b981', 15);
        }
      }, 3000);
    }
  }

  // Update particles and power-up collisions
  function updateEnvironment(dt: number) {
    // Particles
    particlesRef.current = particlesRef.current
      .map(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        return p;
      })
      .filter(p => p.life > 0);

    // Floating text
    damageNumbersRef.current = damageNumbersRef.current
      .map(dn => {
        dn.y -= 30 * dt;
        dn.life -= dt * 1.5;
        return dn;
      })
      .filter(dn => dn.life > 0);

    // Power-up pickups
    powerUpsRef.current.forEach(pup => {
      if (!pup.active) return;
      entitiesRef.current.forEach(ent => {
        if (ent.hp > 0 && Math.hypot(ent.x - pup.x, ent.y - pup.y) < ent.radius + 18) {
          pup.active = false;
          sound.playPowerUp();
          triggerExplosion(pup.x, pup.y, '#38bdf8', 12);

          if (pup.type === 'health') {
            ent.hp = Math.min(ent.maxHp, ent.hp + 45);
            addDamageText(ent.x, ent.y, 45, false, false);
          } else if (pup.type === 'shield') {
            ent.shield = Math.min(ent.maxShield + 30, ent.maxShield + 30);
          } else if (pup.type === 'damage' || pup.type === 'speed') {
            ent.powerupBuff = {
              type: pup.type,
              timeLeft: pup.duration
            };
          }

          if (ent.isLocalPlayer) {
            setAnnouncement(`ACQUIRED ${pup.type.toUpperCase()} POWERUP!`);
          }

          // Respawn powerup after 25s
          setTimeout(() => {
            pup.active = true;
          }, 25000);
        }
      });
    });
  }

  // Rendering 2D Cyber Arena
  function renderScene(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 900, 600);

    // 1. Background Grid & Theme
    ctx.fillStyle = currentMap.bgColor;
    ctx.fillRect(0, 0, 900, 600);

    // Grid pattern
    ctx.strokeStyle = currentMap.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x < 900; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y < 600; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }

    // Outer cyber border
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 892, 592);

    // Center arena circle
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(450, 300, 100, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.save();
      ctx.fillStyle = currentMap.obstacleColor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 8);
      ctx.fill();
      ctx.stroke();

      // Cyber hazard lines or barrier glow
      if (obs.type === 'energy_barrier') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, obs.h - 8);
      }
      ctx.restore();
    });

    // 3. Power-ups
    powerUpsRef.current.forEach(pup => {
      if (!pup.active) return;
      ctx.save();
      const pulse = Math.sin(Date.now() / 200) * 3;

      ctx.beginPath();
      ctx.arc(pup.x, pup.y, 16 + pulse, 0, Math.PI * 2);
      ctx.fillStyle =
        pup.type === 'health' ? 'rgba(34, 197, 94, 0.25)' :
        pup.type === 'shield' ? 'rgba(56, 189, 248, 0.25)' :
        pup.type === 'damage' ? 'rgba(239, 68, 68, 0.25)' :
        'rgba(234, 179, 8, 0.25)';
      ctx.fill();

      // Icon core
      ctx.beginPath();
      ctx.arc(pup.x, pup.y, 10, 0, Math.PI * 2);
      ctx.fillStyle =
        pup.type === 'health' ? '#22c55e' :
        pup.type === 'shield' ? '#38bdf8' :
        pup.type === 'damage' ? '#ef4444' :
        '#eab308';
      ctx.fill();
      ctx.restore();
    });

    // 4. Projectiles
    projectilesRef.current.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Particles
    particlesRef.current.forEach(part => {
      ctx.save();
      ctx.fillStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Entities (Players & Bots)
    entitiesRef.current.forEach(entity => {
      if (entity.hp <= 0) return; // Dead, awaiting respawn
      ctx.save();

      // Team ring shadow
      ctx.shadowColor = entity.team === 'red' ? '#ef4444' : '#06b6d4';
      ctx.shadowBlur = entity.isLocalPlayer ? 18 : 8;

      // Chassis body
      ctx.beginPath();
      ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
      ctx.fillStyle = entity.team === 'red' ? '#7f1d1d' : '#0e3a5a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = entity.character.color;
      ctx.stroke();

      // Directional weapon turret
      ctx.beginPath();
      ctx.moveTo(entity.x, entity.y);
      ctx.lineTo(
        entity.x + Math.cos(entity.angle) * (entity.radius + 12),
        entity.y + Math.sin(entity.angle) * (entity.radius + 12)
      );
      ctx.lineWidth = 5;
      ctx.strokeStyle = entity.character.weapon.projectileColor;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center core avatar icon
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entity.character.avatarUrl, entity.x, entity.y);

      // Name & Title
      ctx.font = 'bold 11px Rajdhani, sans-serif';
      ctx.fillStyle = entity.team === 'red' ? '#fca5a5' : '#7dd3fc';
      ctx.textAlign = 'center';
      ctx.fillText(entity.name, entity.x, entity.y - entity.radius - 16);

      // Health & Shield Bars
      const barWidth = 44;
      const barHeight = 4;
      const barX = entity.x - barWidth / 2;
      const barY = entity.y - entity.radius - 10;

      // BG bar
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Shield overlay
      if (entity.shield > 0) {
        const shieldRatio = Math.min(1, entity.shield / entity.maxShield);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(barX, barY - 3, barWidth * shieldRatio, 2);
      }

      // HP bar fill
      const hpRatio = Math.max(0, entity.hp / entity.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      ctx.restore();
    });

    // 7. Floating Damage Numbers
    damageNumbersRef.current.forEach(dn => {
      ctx.save();
      ctx.font = dn.isCrit ? 'bold 16px Chakra Petch' : 'bold 13px Rajdhani';
      ctx.fillStyle = dn.isShield ? '#38bdf8' : dn.isCrit ? '#facc15' : '#ef4444';
      ctx.globalAlpha = Math.max(0, dn.life);
      ctx.textAlign = 'center';
      ctx.fillText((dn.isCrit ? '💥 ' : '') + dn.amount, dn.x, dn.y);
      ctx.restore();
    });
  }

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        handleDash();
      } else if (e.code === 'KeyE') {
        handleAbility();
      } else if (e.code === 'KeyQ' || e.code === 'KeyF') {
        handleUltimate();
      } else if (e.code === 'Escape') {
        setIsPaused(p => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleDash, handleAbility, handleUltimate]);

  // Touch Handlers for Virtual Joysticks
  const handleTouchStartMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    moveJoystickRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currX: touch.clientX,
      currY: touch.clientY
    };
  };

  const handleTouchMoveMove = (e: React.TouchEvent) => {
    if (!moveJoystickRef.current.active) return;
    const touch = e.targetTouches[0];
    moveJoystickRef.current.currX = touch.clientX;
    moveJoystickRef.current.currY = touch.clientY;
  };

  const handleTouchEndMove = () => {
    moveJoystickRef.current.active = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black select-none overflow-hidden touch-control-area">
      {/* Top Combat HUD */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between px-4 py-2 bg-slate-900/85 backdrop-blur-md rounded-xl border border-cyan-500/30 z-20 shadow-xl max-w-4xl mx-auto">
        {/* Left Team & Exit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExitMatch()}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-red-500 transition-colors"
            title="Leave Match"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{playerCharacter.avatarUrl}</span>
            <div>
              <div className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                RED TEAM: {redScore}
              </div>
              <div className="text-xs text-slate-400">
                {userProfile.username} ({playerCharacter.name})
              </div>
            </div>
          </div>
        </div>

        {/* Center Round Timer & Goal */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-black font-display text-cyan-400 tracking-wider">
            {Math.floor(matchTime / 60)}:{('0' + (matchTime % 60)).slice(-2)}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            First to {format === '2v2' ? '10' : '5'} Kills
          </div>
        </div>

        {/* Right Opponents & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-cyan-400">
              BLUE TEAM: {blueScore}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              Mode: {format} ({difficulty})
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.soundEnabled = !sound.soundEnabled;
                setAudioMuted(!sound.soundEnabled);
                if (sound.soundEnabled) sound.startBgm();
                else sound.stopBgm();
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {audioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Kill Feed (Top Right below HUD) */}
      <div className="absolute top-16 right-4 flex flex-col gap-1 z-10 pointer-events-none">
        {killFeed.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-700/60 px-3 py-1 rounded-md shadow-md animate-fade-in"
          >
            <span className={item.killerTeam === 'red' ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
              {item.killer}
            </span>
            <span className="text-slate-400">⚡</span>
            <span className={item.victimTeam === 'red' ? 'text-red-400' : 'text-cyan-400'}>
              {item.victim}
            </span>
          </div>
        ))}
      </div>

      {/* Dynamic Announcement Banner */}
      {announcement && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-gradient-to-r from-cyan-600/90 via-blue-700/90 to-purple-600/90 text-white font-display font-bold text-sm md:text-base px-6 py-1.5 rounded-full border border-cyan-400/50 shadow-2xl tracking-wide uppercase animate-bounce">
            {announcement}
          </div>
        </div>
      )}

      {/* Game Canvas Container */}
      <div className="relative w-full max-w-[900px] aspect-[3/2] max-h-[85vh] flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseMove={e => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
          }}
          onMouseDown={() => {
            mouseRef.current.isDown = true;
          }}
          onMouseUp={() => {
            mouseRef.current.isDown = false;
          }}
          className="w-full h-full object-contain rounded-xl border border-cyan-500/20 shadow-2xl cursor-crosshair"
        />

        {/* Player Status Bar Overlay at Bottom of Canvas */}
        <div className="absolute bottom-4 left-6 z-10 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-0.5">
              <span>HP</span>
              <span className="text-emerald-400">{playerHp} / {playerMaxHp}</span>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-0.5">
              <span>SHIELD</span>
              <span className="text-cyan-400">{playerShield} / 50</span>
            </div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${Math.max(0, (playerShield / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* On-Screen Mobile Virtual Controls (Dual Joystick & Action Buttons) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-30">
        {/* Left: Virtual Movement Joystick Touch Zone */}
        <div
          onTouchStart={handleTouchStartMove}
          onTouchMove={handleTouchMoveMove}
          onTouchEnd={handleTouchEndMove}
          className="w-36 h-36 rounded-full bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 pointer-events-auto flex items-center justify-center relative touch-control-area"
        >
          <div className="w-14 h-14 rounded-full bg-cyan-500/40 border-2 border-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-lg pointer-events-none">
            MOVE
          </div>
        </div>

        {/* Right: Combat Buttons (Dash, Ability, Ultimate, Fire) */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Dash Button */}
          <button
            onClick={handleDash}
            disabled={dashCdRatio > 0}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold shadow-lg transition-transform active:scale-90 border-2 ${
              dashCdRatio > 0
                ? 'bg-slate-800/80 border-slate-600 text-slate-500'
                : 'bg-indigo-600/90 border-indigo-400 text-white hover:bg-indigo-500'
            }`}
          >
            <Zap size={18} />
            <span className="text-[10px]">DASH</span>
          </button>

          {/* Special Ability Button */}
          <button
            onClick={handleAbility}
            disabled={abilityCdRatio > 0}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold shadow-lg transition-transform active:scale-90 border-2 ${
              abilityCdRatio > 0
                ? 'bg-slate-800/80 border-slate-600 text-slate-500'
                : 'bg-emerald-600/90 border-emerald-400 text-white hover:bg-emerald-500'
            }`}
          >
            <Shield size={18} />
            <span className="text-[9px]">SKILL</span>
          </button>

          {/* Ultimate Button */}
          <button
            onClick={handleUltimate}
            disabled={ultCharge < 100}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs font-bold shadow-xl transition-all active:scale-95 border-2 ${
              ultCharge >= 100
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 border-yellow-300 text-white animate-pulse-glow'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            <Flame size={20} className={ultCharge >= 100 ? 'text-yellow-200' : 'text-slate-600'} />
            <span className="text-[10px]">ULT {Math.round(ultCharge)}%</span>
          </button>

          {/* Direct Shoot / Aim Zone */}
          <button
            onMouseDown={() => {
              const player = entitiesRef.current.find(e => e.isLocalPlayer);
              if (player) fireProjectile(player, player.angle);
            }}
            onTouchStart={() => {
              const player = entitiesRef.current.find(e => e.isLocalPlayer);
              if (player) fireProjectile(player, player.angle);
            }}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 border-2 border-red-300 text-white font-black flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform"
          >
            <span className="text-base">🎯</span>
            <span className="text-xs">FIRE</span>
          </button>
        </div>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40 p-4">
          <div className="bg-slate-900 border border-cyan-500/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold font-display text-cyan-400 mb-2">BATTLE PAUSED</h2>
            <p className="text-sm text-slate-400 mb-6">Take a breather, Gladiator.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-white shadow-lg transition-all"
              >
                Resume Battle
              </button>
              <button
                onClick={() => onExitMatch()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Quit to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Victory / Defeat Overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="text-5xl mb-3">
              {gameOver === 'VICTORY' ? '🏆' : gameOver === 'DEFEAT' ? '💀' : '⚔️'}
            </div>
            <h2
              className={`text-4xl font-black font-display tracking-wider mb-2 ${
                gameOver === 'VICTORY'
                  ? 'text-yellow-400'
                  : gameOver === 'DEFEAT'
                  ? 'text-red-500'
                  : 'text-cyan-400'
              }`}
            >
              {gameOver === 'VICTORY' ? 'VICTORY!' : gameOver === 'DEFEAT' ? 'DEFEATED' : 'DRAW MATCH'}
            </h2>
            <p className="text-slate-300 mb-6 text-sm">
              {gameOver === 'VICTORY'
                ? 'Outstanding performance in the arena! Match rewards granted.'
                : 'Fight back harder in the next match, Gladiator!'}
            </p>

            {/* Scorecard */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-6 flex justify-around items-center">
              <div>
                <div className="text-xs text-slate-400 uppercase">Red Team</div>
                <div className="text-2xl font-black text-red-400">{redScore}</div>
              </div>
              <div className="text-slate-600 font-display text-xl font-bold">VS</div>
              <div>
                <div className="text-xs text-slate-400 uppercase">Blue Team</div>
                <div className="text-2xl font-black text-cyan-400">{blueScore}</div>
              </div>
            </div>

            <button
              onClick={() => evaluateMatchOutcome()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-base shadow-xl hover:brightness-110 active:scale-95 transition-all"
            >
              Collect Rewards & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
