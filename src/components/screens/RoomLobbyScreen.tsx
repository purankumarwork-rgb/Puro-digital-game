import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { ARENA_MAPS } from '../../constants/characters';
import { sound } from '../../utils/audio';
import { Users, Copy, Check, Shield, Send, ArrowLeft, Play, Sparkles } from 'lucide-react';

interface RoomPlayer {
  id: string;
  username: string;
  characterId: string;
  team: 'red' | 'blue';
  isReady: boolean;
  kills?: number;
}

interface RoomLobbyScreenProps {
  userProfile: UserProfile;
  roomData: {
    code: string;
    name: string;
    hostId: string;
    mode: '1v1' | '2v2';
    map: string;
    status: string;
    players: RoomPlayer[];
  } | null;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onSendChat: (text: string) => void;
  chatMessages: Array<{ sender: string; text: string; team: 'red' | 'blue' }>;
}

export const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = ({
  userProfile,
  roomData,
  onLeaveRoom,
  onToggleReady,
  onStartMatch,
  onSendChat,
  chatMessages,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  if (!roomData) return null;

  const isHost = roomData.hostId === userProfile.id;
  const currentMap = ARENA_MAPS.find(m => m.id === roomData.map) || ARENA_MAPS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomData.code);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const redPlayers = roomData.players.filter(p => p.team === 'red');
  const bluePlayers = roomData.players.filter(p => p.team === 'blue');
  const allReady = roomData.players.every(p => p.isReady || p.id === roomData.hostId);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Bar with Room Code & Leave */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-purple-500/30 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold font-display text-white">
                {roomData.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 uppercase">
                {roomData.mode} Match
              </span>
            </div>
            <p className="text-xs text-slate-400">Map: {currentMap.name}</p>
          </div>
        </div>

        {/* Room Code Pill */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">ROOM CODE</div>
            <div className="text-xl font-black font-display text-cyan-400 tracking-widest">
              {roomData.code}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 font-bold"
            title="Copy Code to Invite Friends"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Teams Lineup Grid (Red vs Blue) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Red Team */}
        <div className="bg-slate-900/70 border-2 border-red-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-red-500/20 pb-3">
            <h2 className="text-lg font-bold font-display text-red-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              RED SQUAD ({redPlayers.length}/{roomData.mode === '2v2' ? 2 : 1})
            </h2>
            <span className="text-xs text-slate-400">Attacking Side</span>
          </div>

          <div className="flex flex-col gap-3">
            {redPlayers.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-xl">
                    🛡️
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {p.username}
                      {p.id === roomData.hostId && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/40">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">Gladiator: {p.characterId}</div>
                  </div>
                </div>

                <div>
                  {p.isReady ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check size={13} /> READY
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full">
                      NOT READY
                    </span>
                  )}
                </div>
              </div>
            ))}

            {redPlayers.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Waiting for gladiator to join...
              </div>
            )}
          </div>
        </div>

        {/* Blue Team */}
        <div className="bg-slate-900/70 border-2 border-cyan-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
            <h2 className="text-lg font-bold font-display text-cyan-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              BLUE SQUAD ({bluePlayers.length}/{roomData.mode === '2v2' ? 2 : 1})
            </h2>
            <span className="text-xs text-slate-400">Defending Side</span>
          </div>

          <div className="flex flex-col gap-3">
            {bluePlayers.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {p.username}
                      {p.id === roomData.hostId && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/40">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">Gladiator: {p.characterId}</div>
                  </div>
                </div>

                <div>
                  {p.isReady ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check size={13} /> READY
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full">
                      NOT READY
                    </span>
                  )}
                </div>
              </div>
            ))}

            {bluePlayers.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Waiting for opponent to join using room code {roomData.code}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat & Host Start Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lobby Chat */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-60">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Lobby Comms
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 text-xs">
            {chatMessages.length === 0 && (
              <div className="text-slate-500 italic py-8 text-center">
                Send tactical messages or greet your teammates here.
              </div>
            )}
            {chatMessages.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className={c.team === 'red' ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold'}>
                  [{c.sender}]:
                </span>
                <span className="text-slate-200">{c.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
            >
              <Send size={13} />
            </button>
          </form>
        </div>

        {/* Ready / Start Actions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Match Status
            </div>
            <div className="text-lg font-bold font-display text-white mb-2">
              {allReady ? 'All Players Ready!' : 'Waiting for Readiness'}
            </div>
            <p className="text-xs text-slate-400">
              {isHost
                ? 'As the room host, you can launch the arena once players are in position.'
                : 'Click Ready so the host knows you are prepared to fight.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {!isHost && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleReady();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 font-bold text-sm text-white shadow-lg active:scale-95 transition-all"
              >
                Toggle Ready Status
              </button>
            )}

            {isHost && (
              <button
                onClick={() => {
                  sound.playPowerUp();
                  onStartMatch();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-black font-display text-base tracking-wider text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Play size={18} />
                <span>LAUNCH ARENA MATCH</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
