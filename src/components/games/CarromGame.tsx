import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Circle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  Bot,
  User
} from 'lucide-react';

interface CarromGameProps {
  userProfile: UserProfile;
  onReward: (gold: number, exp: number) => void;
  onBack: () => void;
}

interface Piece {
  id: number;
  type: 'white' | 'black' | 'queen' | 'striker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPocketed: boolean;
  color: string;
  borderColor: string;
  points: number;
}

const BOARD_SIZE = 420;
const POCKET_RADIUS = 22;
const FRICTION = 0.982;
const MIN_VELOCITY = 0.05;

const POCKETS = [
  { x: 26, y: 26 },
  { x: BOARD_SIZE - 26, y: 26 },
  { x: 26, y: BOARD_SIZE - 26 },
  { x: BOARD_SIZE - 26, y: BOARD_SIZE - 26 }
];

export const CarromGame: React.FC<CarromGameProps> = ({ userProfile, onReward, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [turn, setTurn] = useState<'player' | 'bot'>('player');
  const [strikerBaselineX, setStrikerBaselineX] = useState(BOARD_SIZE / 2);
  const [isAiming, setIsAiming] = useState(false);
  const [aimEnd, setAimEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [queenCoverPending, setQueenCoverPending] = useState(false);
  const [log, setLog] = useState('Your turn! Slide striker on baseline, then drag and release to shoot.');
  const [gameOver, setGameOver] = useState(false);

  const piecesRef = useRef<Piece[]>([]);

  // Initialize carrom pieces
  const initBoard = () => {
    const center = BOARD_SIZE / 2;
    const pieces: Piece[] = [];
    let id = 1;

    // Red Queen in center
    pieces.push({
      id: id++,
      type: 'queen',
      x: center,
      y: center,
      vx: 0,
      vy: 0,
      radius: 12,
      isPocketed: false,
      color: '#dc2626',
      borderColor: '#fef08a',
      points: 30
    });

    // Inner ring (alternate white and black)
    const ringRadius = 24;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const isWhite = i % 2 === 0;
      pieces.push({
        id: id++,
        type: isWhite ? 'white' : 'black',
        x: center + Math.cos(angle) * ringRadius,
        y: center + Math.sin(angle) * ringRadius,
        vx: 0,
        vy: 0,
        radius: 11,
        isPocketed: false,
        color: isWhite ? '#f8fafc' : '#1e293b',
        borderColor: isWhite ? '#cbd5e1' : '#475569',
        points: isWhite ? 10 : 5
      });
    }

    // Outer ring
    const outerRadius = 46;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const isWhite = i % 2 !== 0;
      pieces.push({
        id: id++,
        type: isWhite ? 'white' : 'black',
        x: center + Math.cos(angle) * outerRadius,
        y: center + Math.sin(angle) * outerRadius,
        vx: 0,
        vy: 0,
        radius: 11,
        isPocketed: false,
        color: isWhite ? '#f8fafc' : '#1e293b',
        borderColor: isWhite ? '#cbd5e1' : '#475569',
        points: isWhite ? 10 : 5
      });
    }

    // Striker (bottom baseline for player)
    pieces.push({
      id: 999,
      type: 'striker',
      x: center,
      y: BOARD_SIZE - 68,
      vx: 0,
      vy: 0,
      radius: 16,
      isPocketed: false,
      color: '#06b6d4',
      borderColor: '#ffffff',
      points: 0
    });

    piecesRef.current = pieces;
    setStrikerBaselineX(center);
    setPlayerScore(0);
    setBotScore(0);
    setTurn('player');
    setGameOver(false);
    setLog('Carrom board reset! Place your striker and take aim.');
  };

  useEffect(() => {
    initBoard();
  }, []);

  // Reset Striker to baseline
  const resetStriker = (forPlayer: 'player' | 'bot') => {
    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (!striker) return;

    striker.vx = 0;
    striker.vy = 0;
    striker.isPocketed = false;

    if (forPlayer === 'player') {
      striker.x = strikerBaselineX;
      striker.y = BOARD_SIZE - 68;
    } else {
      striker.x = BOARD_SIZE / 2;
      striker.y = 68; // Bot top baseline
    }
  };

  // Bot Turn Simulation
  useEffect(() => {
    if (turn === 'bot' && !isMoving && !gameOver) {
      setLog('Bot is positioning striker and calculating bank shot...');
      const timer = setTimeout(() => {
        // Find closest non-pocketed piece to target pocket
        const activePieces = piecesRef.current.filter(p => p.type !== 'striker' && !p.isPocketed);
        if (activePieces.length === 0) {
          setGameOver(true);
          return;
        }

        const target = activePieces[Math.floor(Math.random() * activePieces.length)];
        const striker = piecesRef.current.find(p => p.type === 'striker');
        if (!striker) return;

        striker.x = BOARD_SIZE / 4 + Math.random() * (BOARD_SIZE / 2);
        striker.y = 68;

        // Angle towards target piece with slight variance
        const dx = target.x - striker.x;
        const dy = target.y - striker.y;
        const dist = Math.hypot(dx, dy);
        const power = Math.min(18, Math.max(9, dist * 0.08));

        sound.playLaser();
        striker.vx = (dx / dist) * power;
        striker.vy = (dy / dist) * power;
        setIsMoving(true);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [turn, isMoving, gameOver]);

  // Main Physics and Rendering Loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Draw Wooden/Cyber Carrom Board
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Board Frame
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Inner Play Area (Warm wood tones with neon guidelines)
      ctx.fillStyle = '#292524';
      ctx.fillRect(16, 16, BOARD_SIZE - 32, BOARD_SIZE - 32);

      // Board Border Outline
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, BOARD_SIZE - 32, BOARD_SIZE - 32);

      // 4 Corner Pockets
      POCKETS.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pocket interior shadow
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_RADIUS - 4, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
      });

      // Center Circle & Concentric Patterns
      const center = BOARD_SIZE / 2;
      ctx.beginPath();
      ctx.arc(center, center, 42, 0, Math.PI * 2);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Baselines (Top for Bot, Bottom for Player)
      const drawBaseline = (y: number) => {
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(BOARD_SIZE - 70, y);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Baseline endpoint circles
        ctx.beginPath();
        ctx.arc(70, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(BOARD_SIZE - 70, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.stroke();
      };

      drawBaseline(68); // Bot baseline
      drawBaseline(BOARD_SIZE - 68); // Player baseline

      // Aim Line (while aiming)
      const striker = piecesRef.current.find(p => p.type === 'striker');
      if (isAiming && aimEnd && striker) {
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(aimEnd.x, aimEnd.y);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reverse strike trajectory preview
        const dx = striker.x - aimEnd.x;
        const dy = striker.y - aimEnd.y;
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(striker.x + dx * 2.5, striker.y + dy * 2.5);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Update Physics
      let anyMoving = false;
      const pieces = piecesRef.current;

      pieces.forEach(p => {
        if (p.isPocketed) return;

        // Position update
        p.x += p.vx;
        p.y += p.vy;

        // Friction
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        if (Math.abs(p.vx) < MIN_VELOCITY) p.vx = 0;
        if (Math.abs(p.vy) < MIN_VELOCITY) p.vy = 0;

        if (p.vx !== 0 || p.vy !== 0) anyMoving = true;

        // Wall collisions
        const minX = 16 + p.radius;
        const maxX = BOARD_SIZE - 16 - p.radius;
        const minY = 16 + p.radius;
        const maxY = BOARD_SIZE - 16 - p.radius;

        if (p.x < minX) { p.x = minX; p.vx = -p.vx * 0.85; sound.playShieldHit(); }
        if (p.x > maxX) { p.x = maxX; p.vx = -p.vx * 0.85; sound.playShieldHit(); }
        if (p.y < minY) { p.y = minY; p.vy = -p.vy * 0.85; sound.playShieldHit(); }
        if (p.y > maxY) { p.y = maxY; p.vy = -p.vy * 0.85; sound.playShieldHit(); }

        // Pocket detection
        POCKETS.forEach(pocket => {
          const dist = Math.hypot(p.x - pocket.x, p.y - pocket.y);
          if (dist < POCKET_RADIUS - 2) {
            p.isPocketed = true;
            p.vx = 0;
            p.vy = 0;

            if (p.type === 'striker') {
              sound.playDefeat();
              setLog('⚠️ Foul! Striker pocketed! 5 points penalty.');
              if (turn === 'player') setPlayerScore(s => Math.max(0, s - 5));
              else setBotScore(s => Math.max(0, s - 5));
            } else {
              sound.playVictory();
              if (turn === 'player') {
                setPlayerScore(s => s + p.points);
                setLog(`🎯 Pocketed ${p.type.toUpperCase()} piece! +${p.points} Points!`);
              } else {
                setBotScore(s => s + p.points);
                setLog(`🤖 Bot pocketed ${p.type.toUpperCase()} piece! +${p.points} Points.`);
              }
            }
          }
        });
      });

      // Circle-Circle collisions
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const p1 = pieces[i];
          const p2 = pieces[j];
          if (p1.isPocketed || p2.isPocketed) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = p1.radius + p2.radius;

          if (dist < minDist && dist > 0) {
            // Overlap resolution
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;

            // Elastic bounce
            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            p1.vx -= p * nx * 0.95;
            p1.vy -= p * ny * 0.95;
            p2.vx += p * nx * 0.95;
            p2.vy += p * ny * 0.95;

            sound.playShieldHit();
          }
        }
      }

      // 3. Draw Pieces
      pieces.forEach(p => {
        if (p.isPocketed) return;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fill();

        ctx.strokeStyle = p.borderColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Center jewel on Queen or Striker
        if (p.type === 'queen') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        } else if (p.type === 'striker') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        ctx.restore();
      });

      // Turn Resolution when all pieces stop moving
      if (isMoving && !anyMoving) {
        setIsMoving(false);
        const remainingPieces = pieces.filter(p => p.type !== 'striker' && !p.isPocketed);
        if (remainingPieces.length === 0) {
          setGameOver(true);
          sound.playVictory();
          confetti({ particleCount: 100, spread: 80 });
          onReward(450, 120);
        } else {
          // Switch Turn
          const nextTurn = turn === 'player' ? 'bot' : 'player';
          setTurn(nextTurn);
          resetStriker(nextTurn);
          if (nextTurn === 'player') {
            setLog('Your turn! Slide striker along baseline, drag to aim and shoot.');
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isMoving, turn, isAiming, aimEnd, strikerBaselineX]);

  // Touch and Mouse Aim Handlers for Player
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (turn !== 'player' || isMoving || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (!striker) return;

    // Check if clicked near striker
    const dist = Math.hypot(x - striker.x, y - striker.y);
    if (dist < 40) {
      setIsAiming(true);
      setAimEnd({ x, y });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setAimEnd({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  const handlePointerUp = () => {
    if (!isAiming || !aimEnd) {
      setIsAiming(false);
      return;
    }

    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (!striker) return;

    // Calculate shot impulse vector (pull back to shoot forward)
    const dx = striker.x - aimEnd.x;
    const dy = striker.y - aimEnd.y;
    const pullDist = Math.hypot(dx, dy);

    if (pullDist > 10) {
      const power = Math.min(22, pullDist * 0.16);
      striker.vx = (dx / pullDist) * power;
      striker.vy = (dy / pullDist) * power;

      sound.playLaser();
      setIsMoving(true);
      setLog(`Shot released! Power: ${Math.round(power * 4)}%`);
    }

    setIsAiming(false);
    setAimEnd(null);
  };

  // Slider handler for striker baseline positioning
  const handleBaselineSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMoving || turn !== 'player') return;
    const newX = Number(e.target.value);
    setStrikerBaselineX(newX);
    const striker = piecesRef.current.find(p => p.type === 'striker');
    if (striker && !striker.isPocketed) {
      striker.x = newX;
      striker.y = BOARD_SIZE - 68;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Games Hub</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              CYBER CARROM ("CHARAM")
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            South Asian classic carrom board with realistic striker physics, 4 corner pockets, white/black men, and red Queen.
          </p>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="text-center px-3 border-r border-slate-800">
            <span className="text-[10px] text-cyan-400 font-bold uppercase block">You</span>
            <span className="text-xl font-black font-display text-white">{playerScore}</span>
          </div>
          <div className="text-center px-3">
            <span className="text-[10px] text-rose-400 font-bold uppercase block">Bot</span>
            <span className="text-xl font-black font-display text-white">{botScore}</span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Carrom Canvas */}
        <div className="md:col-span-8 flex flex-col items-center">
          <div
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="relative cursor-crosshair touch-none rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-800/80"
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
          >
            <canvas
              ref={canvasRef}
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              className="w-full h-full"
            />
          </div>

          {/* Baseline Position Slider */}
          <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Target size={14} className="text-cyan-400" />
                <span>Position Striker On Baseline</span>
              </span>
              <span className="text-cyan-300 font-mono">{Math.round(strikerBaselineX)}px</span>
            </div>
            <input
              type="range"
              min={90}
              max={BOARD_SIZE - 90}
              value={strikerBaselineX}
              disabled={turn !== 'player' || isMoving}
              onChange={handleBaselineSlide}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 text-center mt-1">
              Drag striker backwards to aim and charge shot power
            </div>
          </div>
        </div>

        {/* Turn, Rules & Controls */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Current Turn</span>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${turn === 'player' ? 'bg-cyan-400' : 'bg-rose-400'} animate-pulse`} />
              <h3 className="text-lg font-black font-display text-white">
                {turn === 'player' ? 'Your Shot' : 'Smart Bot Opponent'}
              </h3>
            </div>

            {/* Live Instructions */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-amber-300 font-medium leading-relaxed mb-4">
              {log}
            </div>

            {/* Point Rules */}
            <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                  <span>White Carrom Men</span>
                </span>
                <span className="font-bold text-cyan-400">+10 Pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
                  <span>Black Carrom Men</span>
                </span>
                <span className="font-bold text-amber-400">+5 Pts</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 border border-yellow-300" />
                  <span>Red Queen</span>
                </span>
                <span className="font-bold text-rose-400">+30 Pts</span>
              </div>
            </div>

            <button
              onClick={initBoard}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Carrom Board</span>
            </button>
          </div>

          {gameOver && (
            <div className="bg-gradient-to-r from-amber-950 to-yellow-950 border-2 border-amber-400 p-5 rounded-3xl text-center shadow-xl animate-fade-in">
              <Trophy size={40} className="mx-auto text-amber-400 mb-2" />
              <h3 className="text-xl font-black font-display text-white">
                {playerScore >= botScore ? 'CARROM VICTORY!' : 'MATCH COMPLETED'}
              </h3>
              <p className="text-xs text-amber-200/80 my-2">
                Final Score: You ({playerScore}) - Bot ({botScore})
              </p>
              <button
                onClick={initBoard}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Rematch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
