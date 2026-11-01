import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Brain,
  Shield,
  RotateCcw,
  Award,
  ArrowLeft,
  Sparkles,
  Bot,
  User,
  Info
} from 'lucide-react';

interface PuliDantaGameProps {
  userProfile: UserProfile;
  onReward: (gold: number, exp: number) => void;
  onBack: () => void;
}

type PointId = number; // 0 to 24 (5x5 grid)

interface Move {
  from: PointId;
  to: PointId;
  captured?: PointId;
}

// Generate adjacency map for 5x5 board with diagonals
function buildAdjacencyList(): Map<PointId, PointId[]> {
  const adj = new Map<PointId, PointId[]>();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const id = r * 5 + c;
      const neighbors: PointId[] = [];

      // Orthogonal neighbors
      if (r > 0) neighbors.push((r - 1) * 5 + c);
      if (r < 4) neighbors.push((r + 1) * 5 + c);
      if (c > 0) neighbors.push(r * 5 + (c - 1));
      if (c < 4) neighbors.push(r * 5 + (c + 1));

      // Diagonal neighbors (on nodes where (r + c) is even)
      if ((r + c) % 2 === 0) {
        if (r > 0 && c > 0) neighbors.push((r - 1) * 5 + (c - 1));
        if (r > 0 && c < 4) neighbors.push((r - 1) * 5 + (c + 1));
        if (r < 4 && c > 0) neighbors.push((r + 1) * 5 + (c - 1));
        if (r < 4 && c < 4) neighbors.push((r + 1) * 5 + (c + 1));
      }

      adj.set(id, neighbors);
    }
  }

  return adj;
}

const ADJACENCY = buildAdjacencyList();

export const PuliDantaGame: React.FC<PuliDantaGameProps> = ({ userProfile, onReward, onBack }) => {
  // Board state: null | 'tiger' | 'goat'
  const [board, setBoard] = useState<Array<'tiger' | 'goat' | null>>(() => {
    const b: Array<'tiger' | 'goat' | null> = Array(25).fill(null);
    // 3 Tigers starting positions (corners & center)
    b[0] = 'tiger';
    b[4] = 'tiger';
    b[12] = 'tiger';
    return b;
  });

  const [playerRole, setPlayerRole] = useState<'goat' | 'tiger'>('goat');
  const [turn, setTurn] = useState<'goat' | 'tiger'>('goat');
  const [goatsToPlace, setGoatsToPlace] = useState(15);
  const [goatsCaptured, setGoatsCaptured] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<PointId | null>(null);
  const [winner, setWinner] = useState<'goat' | 'tiger' | null>(null);
  const [log, setLog] = useState('Game started! Place your 15 Goats carefully to surround and trap all 3 Tigers.');
  const [showRules, setShowRules] = useState(false);

  // Reset Game
  const resetGame = () => {
    const b: Array<'tiger' | 'goat' | null> = Array(25).fill(null);
    b[0] = 'tiger';
    b[4] = 'tiger';
    b[12] = 'tiger';
    setBoard(b);
    setTurn('goat');
    setGoatsToPlace(15);
    setGoatsCaptured(0);
    setSelectedPiece(null);
    setWinner(null);
    setLog('New match! Place Goats to trap Tigers, or hunt Goats as Tiger.');
  };

  // Find valid tiger moves (single step or jump over goat)
  const getTigerMoves = (from: PointId, currentBoard: Array<'tiger' | 'goat' | null>): Move[] => {
    const moves: Move[] = [];
    const r1 = Math.floor(from / 5);
    const c1 = from % 5;
    const neighbors = ADJACENCY.get(from) || [];

    for (const n of neighbors) {
      if (currentBoard[n] === null) {
        // Simple step
        moves.push({ from, to: n });
      } else if (currentBoard[n] === 'goat') {
        // Check jump over goat
        const r2 = Math.floor(n / 5);
        const c2 = n % 5;
        const dr = r2 - r1;
        const dc = c2 - c1;
        const r3 = r2 + dr;
        const c3 = c2 + dc;

        if (r3 >= 0 && r3 < 5 && c3 >= 0 && c3 < 5) {
          const jumpTarget = r3 * 5 + c3;
          if (currentBoard[jumpTarget] === null) {
            moves.push({ from, to: jumpTarget, captured: n });
          }
        }
      }
    }

    return moves;
  };

  // Check if all Tigers are trapped
  const areAllTigersTrapped = (currentBoard: Array<'tiger' | 'goat' | null>): boolean => {
    for (let i = 0; i < 25; i++) {
      if (currentBoard[i] === 'tiger') {
        const moves = getTigerMoves(i, currentBoard);
        if (moves.length > 0) return false;
      }
    }
    return true;
  };

  // Handle Player Click on point
  const handlePointClick = (idx: PointId) => {
    if (winner || turn !== playerRole) return;

    sound.playClick();

    // GOAT TURN
    if (turn === 'goat') {
      if (goatsToPlace > 0) {
        // Placement phase: can only click empty point
        if (board[idx] === null) {
          const newBoard = [...board];
          newBoard[idx] = 'goat';
          setBoard(newBoard);
          setGoatsToPlace(g => g - 1);
          sound.playPowerUp();
          setLog(`Goat placed on intersection ${idx}. ${goatsToPlace - 1} remaining to place.`);

          // Check if tigers already trapped
          if (areAllTigersTrapped(newBoard)) {
            handleVictory('goat');
            return;
          }

          setTurn('tiger');
        }
      } else {
        // Movement phase: select goat then target
        if (selectedPiece === null) {
          if (board[idx] === 'goat') {
            setSelectedPiece(idx);
          }
        } else {
          if (idx === selectedPiece) {
            setSelectedPiece(null); // deselect
          } else if (board[idx] === 'goat') {
            setSelectedPiece(idx); // re-select another goat
          } else if (board[idx] === null) {
            // Check adjacency
            const neighbors = ADJACENCY.get(selectedPiece) || [];
            if (neighbors.includes(idx)) {
              const newBoard = [...board];
              newBoard[selectedPiece] = null;
              newBoard[idx] = 'goat';
              setBoard(newBoard);
              setSelectedPiece(null);

              if (areAllTigersTrapped(newBoard)) {
                handleVictory('goat');
                return;
              }

              setTurn('tiger');
            }
          }
        }
      }
    }

    // TIGER TURN
    else if (turn === 'tiger') {
      if (selectedPiece === null) {
        if (board[idx] === 'tiger') {
          setSelectedPiece(idx);
        }
      } else {
        if (idx === selectedPiece) {
          setSelectedPiece(null);
        } else if (board[idx] === 'tiger') {
          setSelectedPiece(idx);
        } else {
          // Check valid tiger move from selectedPiece to idx
          const validMoves = getTigerMoves(selectedPiece, board);
          const chosenMove = validMoves.find(m => m.to === idx);

          if (chosenMove) {
            executeTigerMove(chosenMove);
          }
        }
      }
    }
  };

  const executeTigerMove = (move: Move) => {
    const newBoard = [...board];
    newBoard[move.from] = null;
    newBoard[move.to] = 'tiger';

    let newCaptured = goatsCaptured;
    if (move.captured !== undefined) {
      newBoard[move.captured] = null;
      newCaptured += 1;
      setGoatsCaptured(newCaptured);
      sound.playDefeat();
      setLog(`🐅 Tiger pounced and captured a Goat! (${newCaptured}/5 Goats captured)`);
    } else {
      sound.playLaser();
      setLog(`Tiger moved across intersection points.`);
    }

    setBoard(newBoard);
    setSelectedPiece(null);

    // Check if Tigers won (captured 5 goats)
    if (newCaptured >= 5) {
      handleVictory('tiger');
      return;
    }

    // Check if Tigers are trapped
    if (areAllTigersTrapped(newBoard)) {
      handleVictory('goat');
      return;
    }

    setTurn('goat');
  };

  const handleVictory = (who: 'goat' | 'tiger') => {
    setWinner(who);
    sound.playVictory();
    confetti({ particleCount: 90, spread: 70 });

    if (who === playerRole) {
      onReward(600, 200);
      setLog(`🏆 INTELLECTUAL MASTER! You won Puli Danta! +600 Gold & +200 EXP!`);
    } else {
      setLog(`Match Ended. ${who === 'goat' ? 'Goats surrounded Tigers!' : 'Tigers captured 5 Goats!'}`);
    }
  };

  // Bot AI Turn
  useEffect(() => {
    if (winner || turn === playerRole) return;

    const timer = setTimeout(() => {
      // BOT AS TIGER
      if (turn === 'tiger') {
        const allTigerMoves: Move[] = [];
        for (let i = 0; i < 25; i++) {
          if (board[i] === 'tiger') {
            allTigerMoves.push(...getTigerMoves(i, board));
          }
        }

        if (allTigerMoves.length === 0) {
          handleVictory('goat');
          return;
        }

        // Prefer capturing moves
        const captureMove = allTigerMoves.find(m => m.captured !== undefined);
        const chosen = captureMove || allTigerMoves[Math.floor(Math.random() * allTigerMoves.length)];
        executeTigerMove(chosen);
      }

      // BOT AS GOAT
      else if (turn === 'goat') {
        if (goatsToPlace > 0) {
          // Place goat strategically: pick center intersections or near tigers
          const emptyIndices: number[] = [];
          for (let i = 0; i < 25; i++) {
            if (board[i] === null) emptyIndices.push(i);
          }
          const chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const newBoard = [...board];
          newBoard[chosen] = 'goat';
          setBoard(newBoard);
          setGoatsToPlace(g => g - 1);

          if (areAllTigersTrapped(newBoard)) {
            handleVictory('goat');
            return;
          }
          setTurn('tiger');
        } else {
          // Move a goat
          const possibleGoatMoves: Array<{ from: number; to: number }> = [];
          for (let i = 0; i < 25; i++) {
            if (board[i] === 'goat') {
              const neighbors = ADJACENCY.get(i) || [];
              for (const n of neighbors) {
                if (board[n] === null) {
                  possibleGoatMoves.push({ from: i, to: n });
                }
              }
            }
          }

          if (possibleGoatMoves.length > 0) {
            const m = possibleGoatMoves[Math.floor(Math.random() * possibleGoatMoves.length)];
            const newBoard = [...board];
            newBoard[m.from] = null;
            newBoard[m.to] = 'goat';
            setBoard(newBoard);

            if (areAllTigersTrapped(newBoard)) {
              handleVictory('goat');
              return;
            }
          }
          setTurn('tiger');
        }
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [turn, playerRole, board, goatsToPlace, winner]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Games Hub</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐅</span>
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              PULI DANTA (TIGERS & GOATS)
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Ancient South Asian strategic thinking game. Tigers must capture 5 Goats; Goats must outsmart and trap all Tigers!
          </p>
        </div>

        {/* Role Picker */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setPlayerRole('goat');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              playerRole === 'goat'
                ? 'bg-emerald-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🐐 Play Goats</span>
          </button>
          <button
            onClick={() => {
              setPlayerRole('tiger');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              playerRole === 'tiger'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🐅 Play Tiger</span>
          </button>
        </div>
      </div>

      {/* Main Board & Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* SVG/Canvas Style Tactical Board (5x5 Grid with Crosses) */}
        <div className="md:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-[420px] aspect-square bg-slate-950 rounded-3xl p-6 border-4 border-amber-900/60 shadow-2xl flex items-center justify-center">
            {/* Board Background Lines SVG */}
            <svg viewBox="0 0 400 400" className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none">
              {/* Outer boundary */}
              <rect x="20" y="20" width="360" height="360" stroke="#78350f" strokeWidth="3" fill="none" />

              {/* Grid lines */}
              {[1, 2, 3].map(i => (
                <React.Fragment key={i}>
                  <line x1="20" y1={20 + i * 90} x2="380" y2={20 + i * 90} stroke="#78350f" strokeWidth="2" />
                  <line x1={20 + i * 90} y1="20" x2={20 + i * 90} y2="380" stroke="#78350f" strokeWidth="2" />
                </React.Fragment>
              ))}

              {/* Major Diagonals */}
              <line x1="20" y1="20" x2="380" y2="380" stroke="#b45309" strokeWidth="2" />
              <line x1="380" y1="20" x2="20" y2="380" stroke="#b45309" strokeWidth="2" />

              {/* Diamond Sub-Diagonals */}
              <line x1="200" y1="20" x2="380" y2="200" stroke="#b45309" strokeWidth="1.5" />
              <line x1="380" y1="200" x2="200" y2="380" stroke="#b45309" strokeWidth="1.5" />
              <line x1="200" y1="380" x2="20" y2="200" stroke="#b45309" strokeWidth="1.5" />
              <line x1="20" y1="200" x2="200" y2="20" stroke="#b45309" strokeWidth="1.5" />
            </svg>

            {/* 25 Intersecting Clickable Nodes */}
            <div className="grid grid-cols-5 grid-rows-5 w-full h-full relative z-10">
              {board.map((cell, idx) => {
                const isSelected = selectedPiece === idx;
                const canSelect =
                  turn === playerRole &&
                  ((turn === 'goat' && goatsToPlace === 0 && cell === 'goat') ||
                    (turn === 'tiger' && cell === 'tiger'));

                return (
                  <div key={idx} className="flex items-center justify-center p-1">
                    <button
                      onClick={() => handlePointClick(idx)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shadow-md cursor-pointer ${
                        isSelected
                          ? 'ring-4 ring-cyan-400 bg-cyan-950 scale-125 z-20'
                          : cell === 'tiger'
                          ? 'bg-amber-600/90 border-2 border-white text-white hover:scale-110'
                          : cell === 'goat'
                          ? 'bg-emerald-600/90 border-2 border-white text-white hover:scale-110'
                          : 'bg-slate-900/90 border border-amber-600/40 hover:bg-slate-800'
                      }`}
                      title={`Point ${idx}`}
                    >
                      {cell === 'tiger' && '🐅'}
                      {cell === 'goat' && '🐐'}
                      {cell === null && <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center mt-3">
            {turn === playerRole ? '🎯 Your Turn! Tap on points to place or move.' : '🤖 Thinking...'}
          </div>
        </div>

        {/* Match Counters & Status */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${turn === 'goat' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <h3 className="text-lg font-black font-display text-white">
                {turn === 'goat' ? "Goats' Turn" : "Tigers' Turn"}
              </h3>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/30 text-center">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Goats in Hand</span>
                <span className="text-xl font-black font-display text-white">{goatsToPlace} / 15</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-rose-500/30 text-center">
                <span className="text-[10px] text-rose-400 font-bold uppercase block">Goats Captured</span>
                <span className="text-xl font-black font-display text-white">{goatsCaptured} / 5</span>
              </div>
            </div>

            {/* Live Message */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-amber-300 font-medium mb-4">
              {log}
            </div>

            <button
              onClick={resetGame}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Game</span>
            </button>
          </div>

          {/* Quick Rules */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl text-xs space-y-1.5 text-slate-400">
            <div className="font-bold text-white flex items-center gap-1.5 mb-1">
              <Info size={14} className="text-cyan-400" />
              <span>How To Win:</span>
            </div>
            <p>• <strong className="text-amber-400">Tigers:</strong> Jump over Goats into empty spaces to capture them. Capture 5 Goats to win.</p>
            <p>• <strong className="text-emerald-400">Goats:</strong> Place all 15 Goats, then move adjacent. Encircle all 3 Tigers so none can move to win.</p>
          </div>

          {/* Winner Card */}
          {winner && (
            <div className="bg-gradient-to-r from-amber-950 to-emerald-950 border-2 border-amber-400 p-5 rounded-3xl text-center shadow-xl animate-fade-in">
              <span className="text-4xl block mb-2">{winner === 'goat' ? '🐐' : '🐅'}</span>
              <h3 className="text-xl font-black font-display text-white">
                {winner === 'goat' ? 'GOATS CONQUERED!' : 'TIGERS HUNTED ALL!'}
              </h3>
              <p className="text-xs text-amber-200/80 my-2">
                {winner === 'goat' ? 'All 3 Tigers have been completely trapped!' : '5 Goats were successfully captured!'}
              </p>
              <button
                onClick={resetGame}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
