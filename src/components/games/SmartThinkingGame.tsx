import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Brain,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Bot,
  Users,
  Trophy,
  Zap
} from 'lucide-react';

interface SmartThinkingGameProps {
  userProfile: UserProfile;
  onReward: (gold: number, exp: number) => void;
  onBack: () => void;
}

const ROWS = 6;
const COLS = 7;

type Cell = 'cyan' | 'amber' | null;

export const SmartThinkingGame: React.FC<SmartThinkingGameProps> = ({
  userProfile,
  onReward,
  onBack
}) => {
  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<'cyan' | 'amber'>('cyan'); // cyan: Player, amber: Bot/Player 2
  const [mode, setMode] = useState<'bot' | 'pass_play'>('bot');
  const [difficulty, setDifficulty] = useState<'easy' | 'master'>('master');
  const [winner, setWinner] = useState<'cyan' | 'amber' | 'draw' | null>(null);
  const [winningCells, setWinningCells] = useState<Array<[number, number]>>([]);
  const [log, setLog] = useState('Your turn! Connect 4 glowing nanite orbs horizontally, vertically, or diagonally.');

  const resetGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setTurn('cyan');
    setWinner(null);
    setWinningCells([]);
    setLog('New thinking matrix ready! Connect 4 to win.');
  };

  const checkWin = (b: Cell[][]): { winner: 'cyan' | 'amber' | 'draw' | null; coords: Array<[number, number]> } => {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val && val === b[r][c + 1] && val === b[r][c + 2] && val === b[r][c + 3]) {
          return { winner: val, coords: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
        }
      }
    }

    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = b[r][c];
        if (val && val === b[r + 1][c] && val === b[r + 2][c] && val === b[r + 3][c]) {
          return { winner: val, coords: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
        }
      }
    }

    // Diagonal positive slope
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val && val === b[r - 1][c + 1] && val === b[r - 2][c + 2] && val === b[r - 3][c + 3]) {
          return { winner: val, coords: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]] };
        }
      }
    }

    // Diagonal negative slope
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = b[r][c];
        if (val && val === b[r + 1][c + 1] && val === b[r + 2][c + 2] && val === b[r + 3][c + 3]) {
          return { winner: val, coords: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]] };
        }
      }
    }

    // Draw check
    const isFull = b.every(row => row.every(cell => cell !== null));
    if (isFull) return { winner: 'draw', coords: [] };

    return { winner: null, coords: [] };
  };

  const dropOrb = (colIdx: number) => {
    if (winner || (turn === 'amber' && mode === 'bot')) return;

    sound.playClick();
    executeDrop(colIdx, turn);
  };

  const executeDrop = (colIdx: number, player: 'cyan' | 'amber') => {
    // Find lowest available row in column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][colIdx] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    sound.playPowerUp();
    const newGrid = grid.map(row => [...row]);
    newGrid[targetRow][colIdx] = player;
    setGrid(newGrid);

    const winResult = checkWin(newGrid);
    if (winResult.winner) {
      setWinner(winResult.winner);
      setWinningCells(winResult.coords);
      sound.playVictory();
      confetti({ particleCount: 80, spread: 70 });

      if (winResult.winner === 'cyan') {
        onReward(400, 120);
        setLog('🏆 INTELLECTUAL TRIUMPH! You aligned 4 orbs! +400 Gold & +120 EXP!');
      } else if (winResult.winner === 'amber') {
        setLog('Match Finished! Amber Bot connected 4 orbs.');
      } else {
        setLog('Matrix Standoff! Full grid draw.');
      }
      return;
    }

    const nextTurn = player === 'cyan' ? 'amber' : 'cyan';
    setTurn(nextTurn);
    setLog(`${nextTurn === 'cyan' ? 'Cyan' : 'Amber'}'s turn to calculate and drop an orb.`);
  };

  // Bot Turn Effect
  React.useEffect(() => {
    if (turn === 'amber' && mode === 'bot' && !winner) {
      const timer = setTimeout(() => {
        // Smart Thinking Heuristic:
        // 1. Can Bot win on next move?
        for (let c = 0; c < COLS; c++) {
          const testGrid = grid.map(row => [...row]);
          for (let r = ROWS - 1; r >= 0; r--) {
            if (testGrid[r][c] === null) {
              testGrid[r][c] = 'amber';
              if (checkWin(testGrid).winner === 'amber') {
                executeDrop(c, 'amber');
                return;
              }
              break;
            }
          }
        }

        // 2. Can Player win on next move? Block them!
        if (difficulty === 'master') {
          for (let c = 0; c < COLS; c++) {
            const testGrid = grid.map(row => [...row]);
            for (let r = ROWS - 1; r >= 0; r--) {
              if (testGrid[r][c] === null) {
                testGrid[r][c] = 'cyan';
                if (checkWin(testGrid).winner === 'cyan') {
                  executeDrop(c, 'amber');
                  return;
                }
                break;
              }
            }
          }
        }

        // 3. Prefer center column or valid random
        const validCols: number[] = [];
        for (let c = 0; c < COLS; c++) {
          if (grid[0][c] === null) validCols.push(c);
        }

        if (validCols.length > 0) {
          // Center preference
          const preferred = validCols.includes(3) && Math.random() < 0.6 ? 3 : validCols[Math.floor(Math.random() * validCols.length)];
          executeDrop(preferred, 'amber');
        }
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [turn, mode, grid, winner, difficulty]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/40 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Games Hub</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-cyan-400" size={26} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              MIND MATRIX (SMART THINKING)
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            High-IQ tactical spatial puzzle. Anticipate opponent placements and connect 4 nanite orbs to conquer the matrix!
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setMode('bot');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'bot'
                ? 'bg-cyan-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot size={14} />
            <span>Vs AI Bot</span>
          </button>
          <button
            onClick={() => {
              setMode('pass_play');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'pass_play'
                ? 'bg-cyan-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Pass & Play</span>
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* 7x6 Matrix */}
        <div className="md:col-span-8 flex flex-col items-center">
          {/* Column drop buttons */}
          <div className="grid grid-cols-7 gap-2 w-full max-w-[420px] mb-2 px-3">
            {Array(COLS).fill(0).map((_, c) => (
              <button
                key={c}
                disabled={Boolean(winner) || grid[0][c] !== null || (turn === 'amber' && mode === 'bot')}
                onClick={() => dropOrb(c)}
                className="py-1 rounded-xl bg-slate-900 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
              >
                ▼
              </button>
            ))}
          </div>

          <div className="w-full max-w-[420px] bg-gradient-to-b from-slate-900 to-indigo-950/80 p-4 rounded-3xl border-4 border-cyan-500/40 shadow-2xl">
            <div className="grid grid-cols-7 gap-2">
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const isWinningCell = winningCells.some(([wr, wc]) => wr === r && wc === c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => dropOrb(c)}
                      className="aspect-square rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-105"
                    >
                      {cell === 'cyan' && (
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 shadow-lg shadow-cyan-500/50 flex items-center justify-center ${
                            isWinningCell ? 'ring-4 ring-white animate-bounce' : ''
                          }`}
                        >
                          <Zap size={14} className="text-white fill-white" />
                        </div>
                      )}
                      {cell === 'amber' && (
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 shadow-lg shadow-amber-500/50 flex items-center justify-center ${
                            isWinningCell ? 'ring-4 ring-white animate-bounce' : ''
                          }`}
                        >
                          <Sparkles size={14} className="text-white fill-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Status & Options */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-3 h-3 rounded-full ${turn === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'} animate-pulse`} />
              <h3 className="text-lg font-black font-display text-white">
                {turn === 'cyan' ? 'Cyan Player Turn' : mode === 'bot' ? 'Amber AI Thinking...' : 'Amber Player Turn'}
              </h3>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-cyan-300 font-medium mb-4">
              {log}
            </div>

            {/* AI Difficulty Toggle */}
            {mode === 'bot' && (
              <div className="mb-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">AI Intelligence</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDifficulty('easy')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      difficulty === 'easy'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    Casual
                  </button>
                  <button
                    onClick={() => setDifficulty('master')}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      difficulty === 'master'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    Grandmaster
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={resetGame}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Restart Matrix</span>
            </button>
          </div>

          {winner && (
            <div className="bg-gradient-to-r from-cyan-950 to-indigo-950 border-2 border-cyan-400 p-5 rounded-3xl text-center shadow-xl animate-fade-in">
              <Trophy size={40} className="mx-auto text-cyan-400 mb-2" />
              <h3 className="text-xl font-black font-display text-white">
                {winner === 'cyan' ? 'CYAN VICTORY!' : winner === 'amber' ? 'AMBER VICTORY!' : 'STANDOFF DRAW!'}
              </h3>
              <p className="text-xs text-cyan-200/80 my-2">
                {winner === 'draw' ? 'The matrix is completely filled.' : '4 Orbs successfully aligned!'}
              </p>
              <button
                onClick={resetGame}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
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
