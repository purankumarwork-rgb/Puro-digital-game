import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  RotateCcw,
  Bot,
  Users,
  Award,
  ArrowLeft,
  Sparkles,
  Volume2
} from 'lucide-react';

interface LudoGameProps {
  userProfile: UserProfile;
  onReward: (gold: number, exp: number) => void;
  onBack: () => void;
}

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface Token {
  id: number;
  color: PlayerColor;
  step: number; // -1: in base, 0-50: main track, 51-56: home column, 57: finished home
}

// 52-step standard common track coordinates on 15x15 board
// Red starts at index 0, Green at index 13, Yellow at index 26, Blue at index 39
const TRACK_COORDS: Array<[number, number]> = [
  // Red side going right (0-5)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Going up into green column (5-11)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Green top turn (11-13)
  [0, 7], [0, 8],
  // Coming down right of green (13-18)
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Going right into yellow row (18-24)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Yellow right turn (24-26)
  [7, 14], [8, 14],
  // Coming left from yellow (26-31)
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Going down into blue column (31-37)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Blue bottom turn (37-39)
  [14, 7], [14, 6],
  // Coming up left of blue (39-44)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Going left towards red (44-50)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Red left turn (50-51)
  [7, 0]
];

// Home stretch coordinates for each color
const HOME_STRETCH: Record<PlayerColor, Array<[number, number]>> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

const COLOR_CONFIG: Record<PlayerColor, { name: string; hex: string; bg: string; text: string; startIdx: number }> = {
  red: { name: 'Red (You)', hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-400', startIdx: 0 },
  green: { name: 'Green (Bot)', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', startIdx: 13 },
  yellow: { name: 'Yellow (Bot)', hex: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-400', startIdx: 26 },
  blue: { name: 'Blue (Bot)', hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', startIdx: 39 },
};

const SAFE_STEPS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe star positions along track

export const LudoGame: React.FC<LudoGameProps> = ({ userProfile, onReward, onBack }) => {
  const [tokens, setTokens] = useState<Token[]>([
    { id: 0, color: 'red', step: -1 },
    { id: 1, color: 'red', step: -1 },
    { id: 2, color: 'red', step: -1 },
    { id: 3, color: 'red', step: -1 },
    { id: 4, color: 'green', step: -1 },
    { id: 5, color: 'green', step: -1 },
    { id: 6, color: 'green', step: -1 },
    { id: 7, color: 'green', step: -1 },
  ]);

  const [activePlayer, setActivePlayer] = useState<PlayerColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [gameMode, setGameMode] = useState<'bot' | 'pass_play'>('bot');
  const [log, setLog] = useState<string>('Game started! Red turn to roll.');

  // Roll dice
  const handleRollDice = () => {
    if (isRolling || diceValue !== null || winner) return;

    sound.playClick();
    setIsRolling(true);

    let counter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalDice);
        setIsRolling(false);
        sound.playPowerUp();

        // Check movable tokens
        const movable = getMovableTokens(activePlayer, finalDice);
        if (movable.length === 0) {
          setLog(`${COLOR_CONFIG[activePlayer].name} rolled ${finalDice} - No valid moves!`);
          setTimeout(() => switchTurn(finalDice === 6), 1200);
        } else if (movable.length === 1 && activePlayer !== 'red' && gameMode === 'bot') {
          // Auto move for single choice
          setTimeout(() => moveToken(movable[0], finalDice), 800);
        }
      }
    }, 60);
  };

  const getMovableTokens = (color: PlayerColor, dice: number): Token[] => {
    return tokens.filter(t => {
      if (t.color !== color) return false;
      if (t.step === -1) return dice === 6; // Needs a 6 to leave home
      if (t.step === 57) return false; // Already finished
      return t.step + dice <= 57;
    });
  };

  const moveToken = (token: Token, dice: number) => {
    sound.playClick();
    let newStep = token.step;

    if (token.step === -1) {
      newStep = 0; // enter track
      setLog(`${COLOR_CONFIG[token.color].name} deployed a token to the track!`);
    } else {
      newStep = token.step + dice;
      setLog(`${COLOR_CONFIG[token.color].name} advanced token by ${dice} steps.`);
    }

    // Check collision / capture
    let capturedOpponent = false;
    let updatedTokens = tokens.map(t => {
      if (t.id === token.id) return { ...t, step: newStep };
      return t;
    });

    if (newStep >= 0 && newStep <= 50) {
      // Calculate global track index
      const myStart = COLOR_CONFIG[token.color].startIdx;
      const myGlobalPos = (myStart + newStep) % 52;
      const isSafe = SAFE_STEPS.includes(myGlobalPos);

      if (!isSafe) {
        updatedTokens = updatedTokens.map(t => {
          if (t.color !== token.color && t.step >= 0 && t.step <= 50) {
            const oppStart = COLOR_CONFIG[t.color].startIdx;
            const oppGlobalPos = (oppStart + t.step) % 52;
            if (oppGlobalPos === myGlobalPos) {
              // Captured! Send back to base
              capturedOpponent = true;
              sound.playDefeat();
              setLog(`💥 ${COLOR_CONFIG[token.color].name} CAPTURED opponent token! Sent to base!`);
              return { ...t, step: -1 };
            }
          }
          return t;
        });
      }
    }

    setTokens(updatedTokens);
    setDiceValue(null);

    // Check Win
    const playerTokens = updatedTokens.filter(t => t.color === token.color);
    const hasWon = playerTokens.every(t => t.step === 57);

    if (hasWon) {
      setWinner(token.color);
      sound.playVictory();
      confetti({ particleCount: 100, spread: 80 });
      if (token.color === 'red') {
        onReward(500, 150);
        setLog(`🏆 VICTORY! You won Ludo Royale! +500 Gold & +150 EXP!`);
      } else {
        setLog(`Match Over! ${COLOR_CONFIG[token.color].name} won the match!`);
      }
      return;
    }

    // Extra turn if rolled 6 or captured opponent
    const hasExtraTurn = dice === 6 || capturedOpponent;
    switchTurn(hasExtraTurn);
  };

  const switchTurn = (extraTurn: boolean) => {
    setDiceValue(null);
    if (extraTurn) {
      setLog(`⭐ Extra turn awarded to ${COLOR_CONFIG[activePlayer].name}!`);
      return;
    }

    // Switch between Red and Green (for 2-player)
    const nextPlayer: PlayerColor = activePlayer === 'red' ? 'green' : 'red';
    setActivePlayer(nextPlayer);
    setLog(`${COLOR_CONFIG[nextPlayer].name}'s turn to roll.`);
  };

  // Bot AI Turn
  useEffect(() => {
    if (winner) return;
    if (activePlayer !== 'red' && gameMode === 'bot') {
      const timer = setTimeout(() => {
        if (diceValue === null && !isRolling) {
          handleRollDice();
        } else if (diceValue !== null && !isRolling) {
          const movable = getMovableTokens(activePlayer, diceValue);
          if (movable.length > 0) {
            // Pick strategic token: prefer leaving base or capturing
            const deployToken = movable.find(t => t.step === -1);
            const chosen = deployToken || movable[0];
            moveToken(chosen, diceValue);
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [activePlayer, diceValue, isRolling, winner, gameMode]);

  // Dice icon rendering
  const renderDiceIcon = () => {
    switch (diceValue) {
      case 1: return <Dice1 size={48} className="text-white" />;
      case 2: return <Dice2 size={48} className="text-white" />;
      case 3: return <Dice3 size={48} className="text-white" />;
      case 4: return <Dice4 size={48} className="text-white" />;
      case 5: return <Dice5 size={48} className="text-white" />;
      case 6: return <Dice6 size={48} className="text-amber-400 animate-bounce" />;
      default: return <div className="text-sm font-bold text-slate-400">ROLL</div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-emerald-950 border border-amber-500/30 p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Games Hub</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎲</span>
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              LUDO ROYALE
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Classic 4-color dice board game. Roll 6 to deploy, capture rivals, safe star zones, and race tokens home!
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setGameMode('bot')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              gameMode === 'bot'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot size={14} />
            <span>Vs Smart Bot</span>
          </button>
          <button
            onClick={() => setGameMode('pass_play')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              gameMode === 'pass_play'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Pass & Play</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Ludo Board (Interactive Grid) */}
        <div className="md:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-[420px] aspect-square bg-slate-950 rounded-3xl p-3 border-4 border-slate-800 shadow-2xl overflow-hidden">
            {/* 4 Corner Home Bases */}
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2 relative">
              {/* Red Home (Top Left) */}
              <div className="bg-red-950/60 border-2 border-red-500/50 rounded-2xl p-3 flex flex-col items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider">Red Base (You)</span>
                <div className="grid grid-cols-2 gap-2">
                  {tokens.filter(t => t.color === 'red' && t.step === -1).map(t => {
                    const canMove = activePlayer === 'red' && diceValue === 6;
                    return (
                      <button
                        key={t.id}
                        disabled={!canMove}
                        onClick={() => moveToken(t, diceValue!)}
                        className={`w-9 h-9 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-md transition-all ${
                          canMove ? 'ring-4 ring-amber-400 animate-pulse cursor-pointer scale-110' : 'opacity-80'
                        }`}
                      >
                        🔴
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-red-400/80">Need 6 to launch</span>
              </div>

              {/* Green Home (Top Right) */}
              <div className="bg-emerald-950/60 border-2 border-emerald-500/50 rounded-2xl p-3 flex flex-col items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Green Base</span>
                <div className="grid grid-cols-2 gap-2">
                  {tokens.filter(t => t.color === 'green' && t.step === -1).map(t => {
                    const canMove = activePlayer === 'green' && diceValue === 6 && gameMode === 'pass_play';
                    return (
                      <button
                        key={t.id}
                        disabled={!canMove}
                        onClick={() => moveToken(t, diceValue!)}
                        className={`w-9 h-9 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-md ${
                          canMove ? 'ring-4 ring-amber-400 animate-pulse cursor-pointer' : 'opacity-80'
                        }`}
                      >
                        🟢
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-emerald-400/80">Need 6 to launch</span>
              </div>

              {/* Blue Home (Bottom Left) */}
              <div className="bg-blue-950/40 border-2 border-blue-500/30 rounded-2xl p-3 flex flex-col items-center justify-center opacity-60">
                <span className="text-xs font-bold text-blue-400">Blue Outpost</span>
                <span className="text-[10px] text-slate-500">2-Player Duel</span>
              </div>

              {/* Yellow Home (Bottom Right) */}
              <div className="bg-yellow-950/40 border-2 border-yellow-500/30 rounded-2xl p-3 flex flex-col items-center justify-center opacity-60">
                <span className="text-xs font-bold text-yellow-400">Yellow Outpost</span>
                <span className="text-[10px] text-slate-500">2-Player Duel</span>
              </div>

              {/* Center Victory Crown Zone */}
              <div className="absolute inset-0 m-auto w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white flex flex-col items-center justify-center shadow-2xl z-10">
                <span className="text-2xl animate-bounce">👑</span>
                <span className="text-[10px] font-black text-slate-950">HOME FINISH</span>
              </div>
            </div>
          </div>

          {/* Active Tokens on Field */}
          <div className="w-full max-w-[420px] bg-slate-900 border border-slate-800 rounded-2xl p-3 mt-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Active Combat Tokens on Field
            </span>
            <div className="flex flex-wrap gap-2">
              {tokens.filter(t => t.step >= 0 && t.step < 57).length === 0 ? (
                <div className="text-xs text-slate-500 py-1">No tokens on track yet. Roll a 6 to deploy!</div>
              ) : (
                tokens.filter(t => t.step >= 0 && t.step < 57).map(t => {
                  const isMyTurn = t.color === activePlayer;
                  const canMove = isMyTurn && diceValue !== null && t.step + diceValue <= 57;

                  return (
                    <button
                      key={t.id}
                      disabled={!canMove}
                      onClick={() => moveToken(t, diceValue!)}
                      className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        canMove
                          ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400 scale-105 font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400 opacity-80'
                      }`}
                    >
                      <span>{t.color === 'red' ? '🔴' : '🟢'}</span>
                      <span className="text-xs font-bold">
                        {COLOR_CONFIG[t.color].name.split(' ')[0]} (Step {t.step}/57)
                      </span>
                      {canMove && <span className="text-[10px] bg-black text-amber-300 px-1 rounded font-bold">MOVE</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Dice & Status Controls */}
        <div className="md:col-span-4 flex flex-col gap-4">
          {/* Turn Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-lg text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Current Turn
            </span>
            <div className={`text-xl font-black font-display ${COLOR_CONFIG[activePlayer].text} flex items-center justify-center gap-2`}>
              <span className={`w-3 h-3 rounded-full ${COLOR_CONFIG[activePlayer].bg} animate-pulse`} />
              <span>{COLOR_CONFIG[activePlayer].name}</span>
            </div>

            {/* Interactive Dice Roller */}
            <div className="my-5 flex flex-col items-center">
              <button
                disabled={isRolling || (activePlayer !== 'red' && gameMode === 'bot') || diceValue !== null}
                onClick={handleRollDice}
                className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
                  activePlayer === 'red' && diceValue === null
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-4 border-amber-300 text-slate-950 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 border-2 border-slate-700 text-slate-300 opacity-90'
                }`}
              >
                {renderDiceIcon()}
              </button>

              <span className="text-xs text-slate-400 mt-2 font-bold">
                {isRolling
                  ? 'Rolling dice...'
                  : diceValue !== null
                  ? `Rolled a ${diceValue}! Select a token to move.`
                  : activePlayer === 'red'
                  ? 'Tap dice to roll'
                  : 'Bot is thinking...'}
              </span>
            </div>

            {/* Live Match Log */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Match Log</span>
              <p className="text-xs text-cyan-300 font-semibold">{log}</p>
            </div>
          </div>

          {/* Victory Card */}
          {winner && (
            <div className="bg-gradient-to-r from-amber-950 to-yellow-950 border-2 border-amber-400 p-5 rounded-3xl text-center shadow-xl animate-fade-in">
              <span className="text-4xl block mb-2">🏆</span>
              <h3 className="text-xl font-black font-display text-amber-300">
                {COLOR_CONFIG[winner].name} WINS!
              </h3>
              <p className="text-xs text-amber-200/80 my-2">
                All tokens reached home finish safely!
              </p>
              <button
                onClick={() => {
                  setTokens([
                    { id: 0, color: 'red', step: -1 },
                    { id: 1, color: 'red', step: -1 },
                    { id: 2, color: 'red', step: -1 },
                    { id: 3, color: 'red', step: -1 },
                    { id: 4, color: 'green', step: -1 },
                    { id: 5, color: 'green', step: -1 },
                    { id: 6, color: 'green', step: -1 },
                    { id: 7, color: 'green', step: -1 },
                  ]);
                  setWinner(null);
                  setActivePlayer('red');
                  setDiceValue(null);
                  setLog('New match started! Red turn.');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
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
