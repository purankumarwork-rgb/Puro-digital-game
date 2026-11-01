import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, GameSettings, CharacterId, MatchHistoryItem } from './types/game';
import { loadProfile, saveProfile, loadSettings, saveSettings } from './utils/storage';
import {
  checkAndResetMissions,
  evaluateMatchChallenges,
  calculateExpAndLevel
} from './utils/missions';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';

// Navigation & Screens
import { Header } from './components/Header';
import { BattleCanvas } from './components/BattleCanvas';
import { HomeScreen } from './components/screens/HomeScreen';
import { RoomLobbyScreen } from './components/screens/RoomLobbyScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { WalletScreen } from './components/screens/WalletScreen';
import { TournamentScreen } from './components/screens/TournamentScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { BattlePassScreen } from './components/screens/BattlePassScreen';
import { FriendsScreen } from './components/screens/FriendsScreen';
import { GameHubScreen } from './components/screens/GameHubScreen';

// Board & Smart Thinking Games
import { LudoGame } from './components/games/LudoGame';
import { CarromGame } from './components/games/CarromGame';
import { PuliDantaGame } from './components/games/PuliDantaGame';
import { SmartThinkingGame } from './components/games/SmartThinkingGame';

// Modals
import { MissionsModal } from './components/screens/MissionsModal';
import { OfflineSetupModal } from './components/screens/OfflineSetupModal';
import { LoginModal } from './components/screens/LoginModal';
import { AdminPanelModal } from './components/screens/AdminPanelModal';
import { PublishGuideModal } from './components/screens/PublishGuideModal';
import { SettingsModal } from './components/screens/SettingsModal';
import { DriveSaveModal } from './components/screens/DriveSaveModal';

import {
  Home,
  ShoppingBag,
  Wallet,
  Trophy,
  User as UserIcon,
  Calendar,
  Cloud,
  CheckCircle2,
  Crown,
  X,
  Users,
  Gamepad2,
  Zap
} from 'lucide-react';
import { Friend } from './types/game';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const p = loadProfile();
    const { updatedProfile } = checkAndResetMissions(p);
    return updatedProfile;
  });

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [currentView, setCurrentView] = useState<
    | 'home'
    | 'battle'
    | 'shop'
    | 'wallet'
    | 'tournament'
    | 'leaderboard'
    | 'profile'
    | 'room_lobby'
    | 'battle_pass'
    | 'friends'
    | 'game_hub'
    | 'ludo'
    | 'carrom'
    | 'puli_danta'
    | 'mind_matrix'
  >('home');

  // Direct battle invite from friend
  const [incomingInvite, setIncomingInvite] = useState<{
    fromPlayerId: string;
    fromUsername: string;
    roomCode: string;
    mode?: string;
  } | null>(null);

  // Modals
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isOfflineSetupOpen, setIsOfflineSetupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPublishGuideOpen, setIsPublishGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Active Match Setup
  const [matchMode, setMatchMode] = useState<'offline_bot' | 'online' | 'practice'>('offline_bot');
  const [matchDifficulty, setMatchDifficulty] = useState<'easy' | 'medium' | 'hard' | 'insane'>('medium');
  const [matchFormat, setMatchFormat] = useState<'1v1' | '2v2' | '1v3'>('1v1');
  const [matchMapId, setMatchMapId] = useState<string>('cyber_grid');

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WebSocket Server Connection for Online Multiplayer
  const socketRef = useRef<WebSocket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [roomData, setRoomData] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; team: 'red' | 'blue' }>>([]);
  const [isMatchmakingSearching, setIsMatchmakingSearching] = useState(false);

  // Connect to backend WebSocket server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsOnline(true);
        // Register client for direct invites and presence
        try {
          ws.send(JSON.stringify({
            type: 'REGISTER_CLIENT',
            playerId: userProfile.id,
            username: userProfile.username
          }));
        } catch (e) {}
      };

      ws.onclose = () => {
        setIsOnline(false);
      };

      ws.onerror = () => {
        setIsOnline(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ROOM_CREATED' || msg.type === 'ROOM_JOINED') {
            setRoomData(msg.room);
            setCurrentView('room_lobby');
            sound.playPowerUp();
          } else if (msg.type === 'PLAYER_JOINED' || msg.type === 'ROOM_UPDATED') {
            setRoomData(msg.room);
          } else if (msg.type === 'MATCH_STARTED') {
            setRoomData(msg.room);
            setMatchMode('online');
            setMatchFormat(msg.room.mode);
            setMatchMapId(msg.room.map);
            setCurrentView('battle');
            sound.playVictory();
          } else if (msg.type === 'ROOM_CHAT') {
            setChatMessages(prev => [...prev, { sender: msg.sender, text: msg.text, team: msg.team }]);
          } else if (msg.type === 'QUICK_MATCH_FOUND') {
            setIsMatchmakingSearching(false);
            setRoomData(msg.room);
            setMatchMode('online');
            setMatchFormat(msg.room.mode);
            setCurrentView('battle');
            sound.playVictory();
          } else if (msg.type === 'DIRECT_INVITE_RECEIVED') {
            sound.playPowerUp();
            setIncomingInvite({
              fromPlayerId: msg.fromPlayerId,
              fromUsername: msg.fromUsername,
              roomCode: msg.roomCode,
              mode: msg.mode
            });
          } else if (msg.type === 'ERROR') {
            alert(msg.message);
            setIsMatchmakingSearching(false);
          }
        } catch (e) {}
      };
    } catch (e) {
      setIsOnline(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Sync profile changes to localStorage
  const updateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveProfile(newProfile);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Start Offline Match
  const handleStartOfflineMatch = (options: {
    difficulty: 'easy' | 'medium' | 'hard' | 'insane';
    format: '1v1' | '2v2' | '1v3';
    mapId: string;
  }) => {
    setMatchMode('offline_bot');
    setMatchDifficulty(options.difficulty);
    setMatchFormat(options.format);
    setMatchMapId(options.mapId);
    setCurrentView('battle');
  };

  // 2. Start Quick Match Online
  const handleStartQuickMatch = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setIsMatchmakingSearching(true);
      socketRef.current.send(JSON.stringify({
        type: 'QUICK_MATCH_QUEUE',
        playerId: userProfile.id,
        username: userProfile.username,
        mode: '1v1'
      }));
      showNotification('Searching for active gladiators...');
    } else {
      // Fallback to offline match if server unreachable
      showNotification('Multiplayer offline: Entering Practice Bot Match.');
      handleStartOfflineMatch({ difficulty: 'medium', format: '1v1', mapId: 'cyber_grid' });
    }
  };

  // 3. Create or Join Private Room
  const handleCreateRoom = (roomName?: string, mode: '1v1' | '2v2' = '1v1', map = 'cyber_grid') => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CREATE_ROOM',
        playerId: userProfile.id,
        username: userProfile.username,
        characterId: userProfile.selectedCharacter,
        roomName,
        mode,
        map
      }));
    } else {
      alert('Connecting to game server... Please try again in a moment.');
    }
  };

  const handleJoinRoom = (code: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: code,
        playerId: userProfile.id,
        username: userProfile.username,
        characterId: userProfile.selectedCharacter
      }));
    } else {
      alert('Game server connection unavailable.');
    }
  };

  // Direct Battle Invite without needing room code
  const handleSendDirectInvite = (friend: Friend) => {
    sound.playClick();
    if (!roomData?.code) {
      // 1. Auto-create private room
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'CREATE_ROOM',
          playerId: userProfile.id,
          username: userProfile.username,
          characterId: userProfile.selectedCharacter,
          roomName: `${userProfile.username}'s Arena`,
          mode: '1v1',
          map: 'cyber_grid'
        }));
      }
      showNotification(`⚡ Direct invite sent to ${friend.username}! Creating room...`);

      // 2. Relay invite and simulate friend joining lobby
      setTimeout(() => {
        showNotification(`🤝 ${friend.username} accepted your direct invite!`);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'DIRECT_INVITE',
            fromPlayerId: userProfile.id,
            fromUsername: userProfile.username,
            targetPlayerId: friend.id,
            roomCode: roomData?.code || 'PUR101',
            mode: '1v1'
          }));
        }
      }, 1400);
    } else {
      // Already in an existing room
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'DIRECT_INVITE',
          fromPlayerId: userProfile.id,
          fromUsername: userProfile.username,
          targetPlayerId: friend.id,
          roomCode: roomData.code,
          mode: roomData.mode || '1v1'
        }));
      }
      showNotification(`⚡ Direct invite sent to ${friend.username}! No room code needed.`);
      setTimeout(() => {
        showNotification(`🤝 ${friend.username} joined the room!`);
      }, 1400);
    }
  };

  // Rewards for Board & Mind Games (Ludo, Carrom, Puli Danta, Mind Matrix)
  const handleBoardGameReward = (gold: number, exp: number) => {
    const { newLevel, newExp, leveledUp } = calculateExpAndLevel(userProfile.level, userProfile.exp, exp);
    const updated: UserProfile = {
      ...userProfile,
      gold: userProfile.gold + gold,
      level: newLevel,
      exp: newExp
    };
    updateProfile(updated);
    if (leveledUp) {
      showNotification(`LEVEL UP! You reached Level ${newLevel}! +${gold} Gold earned.`);
    } else {
      showNotification(`Game Victory! +${gold} Gold & +${exp} EXP awarded.`);
    }
  };

  // 4. Match Finish Resolution
  const handleExitMatch = (results?: {
    result: 'VICTORY' | 'DEFEAT' | 'DRAW';
    kills: number;
    deaths: number;
    score: number;
    goldEarned: number;
  }) => {
    setCurrentView('home');

    if (!results) return;

    const isWin = results.result === 'VICTORY';
    const isLoss = results.result === 'DEFEAT';
    const expGained = isWin ? 100 + results.kills * 15 : 40 + results.kills * 10;

    // Check level up
    const { newLevel, newExp, leveledUp, bonusCoins, bonusGems } = calculateExpAndLevel(
      userProfile.level,
      userProfile.exp,
      expGained
    );

    const updatedStats = {
      ...userProfile.stats,
      matchesPlayed: userProfile.stats.matchesPlayed + 1,
      matchesWon: userProfile.stats.matchesWon + (isWin ? 1 : 0),
      matchesLost: userProfile.stats.matchesLost + (isLoss ? 1 : 0),
      kills: userProfile.stats.kills + results.kills,
      deaths: userProfile.stats.deaths + results.deaths,
      winStreak: isWin ? userProfile.stats.winStreak + 1 : 0,
      highestStreak: Math.max(userProfile.stats.highestStreak, isWin ? userProfile.stats.winStreak + 1 : 0)
    };

    const newHistoryItem: MatchHistoryItem = {
      id: 'match-' + Date.now(),
      timestamp: Date.now(),
      mode: matchMode === 'offline_bot' ? `Offline (${matchFormat})` : `Online (${matchFormat})`,
      map: matchMapId,
      result: results.result,
      kills: results.kills,
      deaths: results.deaths,
      score: results.score,
      coinsEarned: results.goldEarned + bonusCoins,
      expEarned: expGained
    };

    // Battle Pass XP calculation & Seasonal Quests
    const bp = userProfile.battlePass;
    const baseBpXp = isWin ? 50 : 30;
    const bpXpEarned = Math.round(baseBpXp * (bp.isPremium ? 1.2 : 1.0));
    let nextBpXp = bp.xp + bpXpEarned;
    let nextBpTier = bp.tier;
    let tierAdvanced = false;

    while (nextBpXp >= 100 && nextBpTier < 15) {
      nextBpXp -= 100;
      nextBpTier += 1;
      tierAdvanced = true;
    }

    const updatedSeasonalQuests = (bp.seasonalQuests || []).map(q => {
      if (q.claimed) return q;
      let inc = 0;
      if (q.id === 'sq_1' && isWin) inc = 1;
      if (q.id === 'sq_2') inc = results.kills;
      if (q.id === 'sq_5' && matchMode === 'offline_bot') inc = 1;
      return inc > 0 ? { ...q, current: Math.min(q.target, q.current + inc) } : q;
    });

    // Evaluate Daily Challenges based on full match context
    const { updatedProfile: evaluatedProfile, completedMissionNames } = evaluateMatchChallenges(
      {
        ...userProfile,
        gold: userProfile.gold + results.goldEarned + bonusCoins,
        gems: userProfile.gems + bonusGems,
        level: newLevel,
        exp: newExp,
        stats: updatedStats,
        matchHistory: [newHistoryItem, ...userProfile.matchHistory.slice(0, 15)],
        battlePass: {
          ...bp,
          tier: nextBpTier,
          xp: nextBpTier >= 15 ? 100 : nextBpXp,
          seasonalQuests: updatedSeasonalQuests
        }
      },
      {
        result: results.result,
        characterId: userProfile.selectedCharacter,
        score: results.score,
        kills: results.kills,
        isOffline: matchMode === 'offline_bot'
      }
    );

    updateProfile(evaluatedProfile);

    if (leveledUp) {
      sound.playVictory();
      confetti({ particleCount: 90, spread: 80 });
      showNotification(`LEVEL UP! You reached Level ${newLevel}! (+${bonusCoins} Gold, +${bonusGems} Gems)`);
    } else if (tierAdvanced) {
      sound.playVictory();
      confetti({ particleCount: 80, spread: 70 });
      showNotification(`BATTLE PASS TIER UNLOCKED! You reached Tier ${nextBpTier}! Claim new rewards.`);
    } else if (completedMissionNames.length > 0) {
      sound.playPowerUp();
      showNotification(`Daily Challenge Completed: "${completedMissionNames[0]}"! Claim your reward.`);
    } else {
      showNotification(`Match Finished: +${results.goldEarned} Gold, +${expGained} EXP & +${bpXpEarned} Pass XP!`);
    }
  };

  // Claim Daily Missions & Rewards
  const handleClaimSingleMission = (missionId: string) => {
    const mission = userProfile.missions.find(m => m.id === missionId);
    if (!mission || mission.claimed || mission.current < mission.target) return;

    const { newLevel, newExp, leveledUp, bonusCoins, bonusGems } = calculateExpAndLevel(
      userProfile.level,
      userProfile.exp,
      mission.rewardExp
    );

    const updatedMissions = userProfile.missions.map(m =>
      m.id === missionId ? { ...m, claimed: true } : m
    );

    const updatedProfile: UserProfile = {
      ...userProfile,
      missions: updatedMissions,
      gold: userProfile.gold + mission.rewardGold + bonusCoins,
      gems: userProfile.gems + mission.rewardGems + bonusGems,
      level: newLevel,
      exp: newExp
    };

    updateProfile(updatedProfile);
    showNotification(`Claimed +${mission.rewardGold} Gold & +${mission.rewardExp} EXP!`);
  };

  const handleClaimMegaBonus = () => {
    if (userProfile.dailyMissionsCompletedBonusClaimed) return;
    const { newLevel, newExp, leveledUp } = calculateExpAndLevel(userProfile.level, userProfile.exp, 150);

    const updatedProfile: UserProfile = {
      ...userProfile,
      gold: userProfile.gold + 1000,
      gems: userProfile.gems + 30,
      level: newLevel,
      exp: newExp,
      dailyMissionsCompletedBonusClaimed: true
    };

    updateProfile(updatedProfile);
    showNotification('All Daily Challenges Complete: +1,000 Gold & +30 Gems Granted!');
  };

  const handleClaimDailyLogin = () => {
    const rewards = [200, 300, 450, 600, 800, 1000, 2500];
    const goldReward = rewards[(userProfile.dailyLoginDay - 1) % rewards.length];
    const gemReward = userProfile.dailyLoginDay === 7 ? 100 : 10;

    const updatedProfile: UserProfile = {
      ...userProfile,
      gold: userProfile.gold + goldReward,
      gems: userProfile.gems + gemReward,
      dailyLoginDay: (userProfile.dailyLoginDay % 7) + 1,
      lastDailyClaim: Date.now()
    };

    updateProfile(updatedProfile);
    showNotification(`Claimed Day ${userProfile.dailyLoginDay} Bonus: +${goldReward} Gold & +${gemReward} Gems!`);
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-slate-900 border-2 border-cyan-400 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold font-display">
            <CheckCircle2 size={16} className="text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Matchmaking Overlay */}
      {isMatchmakingSearching && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-cyan-500 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display text-white mb-1">SEARCHING MATCH...</h3>
            <p className="text-xs text-slate-400 mb-5">Connecting with active arena gladiators</p>
            <button
              onClick={() => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({ type: 'CANCEL_MATCHMAKING', playerId: userProfile.id }));
                }
                setIsMatchmakingSearching(false);
              }}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel Matchmaking
            </button>
          </div>
        </div>
      )}

      {/* Direct Battle Invite Banner */}
      {incomingInvite && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-cyan-400 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-white">Direct Battle Invite!</h4>
                <p className="text-xs text-slate-300">
                  <span className="text-cyan-400 font-bold">{incomingInvite.fromUsername}</span> directly invited you to 1v1 Arena!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playVictory();
                  const code = incomingInvite.roomCode;
                  setIncomingInvite(null);
                  handleJoinRoom(code);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Join
              </button>
              <button
                onClick={() => setIncomingInvite(null)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <Header
        userProfile={userProfile}
        isOnline={isOnline}
        onOpenProfile={() => setCurrentView('profile')}
        onOpenShop={() => setCurrentView('shop')}
        onOpenWallet={() => setCurrentView('wallet')}
        onOpenBattlePass={() => setCurrentView('battle_pass')}
        onOpenFriends={() => setCurrentView('friends')}
        onOpenGameHub={() => setCurrentView('game_hub')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPublishGuide={() => setIsPublishGuideOpen(true)}
        onOpenAuth={() => setIsLoginOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-20">
        {currentView === 'battle' ? (
          <BattleCanvas
            userProfile={userProfile}
            mode={matchMode}
            difficulty={matchDifficulty}
            format={matchFormat}
            mapId={matchMapId}
            onlineRoomCode={roomData?.code}
            onlineSocket={socketRef.current}
            onExitMatch={handleExitMatch}
          />
        ) : currentView === 'room_lobby' ? (
          <RoomLobbyScreen
            userProfile={userProfile}
            roomData={roomData}
            onLeaveRoom={() => {
              setRoomData(null);
              setCurrentView('home');
            }}
            onToggleReady={() => {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'TOGGLE_READY' }));
              }
            }}
            onStartMatch={() => {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'START_MATCH' }));
              }
            }}
            onSendChat={(text) => {
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'SEND_CHAT', text }));
              }
            }}
            chatMessages={chatMessages}
          />
        ) : currentView === 'friends' ? (
          <FriendsScreen
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
            onDirectInvite={handleSendDirectInvite}
            onClose={() => setCurrentView('home')}
          />
        ) : currentView === 'game_hub' ? (
          <GameHubScreen
            userProfile={userProfile}
            onSelectGame={(gId) => {
              if (gId === 'arena') setCurrentView('home');
              else setCurrentView(gId);
            }}
          />
        ) : currentView === 'ludo' ? (
          <LudoGame
            userProfile={userProfile}
            onReward={handleBoardGameReward}
            onBack={() => setCurrentView('game_hub')}
          />
        ) : currentView === 'carrom' ? (
          <CarromGame
            userProfile={userProfile}
            onReward={handleBoardGameReward}
            onBack={() => setCurrentView('game_hub')}
          />
        ) : currentView === 'puli_danta' ? (
          <PuliDantaGame
            userProfile={userProfile}
            onReward={handleBoardGameReward}
            onBack={() => setCurrentView('game_hub')}
          />
        ) : currentView === 'mind_matrix' ? (
          <SmartThinkingGame
            userProfile={userProfile}
            onReward={handleBoardGameReward}
            onBack={() => setCurrentView('game_hub')}
          />
        ) : currentView === 'shop' ? (
          <ShopScreen
            userProfile={userProfile}
            onUnlockCharacter={(charId, costGold, costGems) => {
              const updatedProfile = {
                ...userProfile,
                gold: userProfile.gold - costGold,
                gems: userProfile.gems - costGems,
                unlockedCharacters: [...userProfile.unlockedCharacters, charId]
              };
              updateProfile(updatedProfile);
            }}
            onUnlockSkin={(skinId, costGold, costGems) => {
              const updatedProfile = {
                ...userProfile,
                gold: userProfile.gold - costGold,
                gems: userProfile.gems - costGems,
                unlockedSkins: [...userProfile.unlockedSkins, skinId]
              };
              updateProfile(updatedProfile);
            }}
            onPurchaseCoinPack={(pack) => {
              const updatedProfile = {
                ...userProfile,
                gold: userProfile.gold + pack.gold,
                gems: userProfile.gems + pack.gems
              };
              updateProfile(updatedProfile);
            }}
            onClose={() => setCurrentView('home')}
          />
        ) : currentView === 'wallet' ? (
          <WalletScreen
            userProfile={userProfile}
            onOpenShop={() => setCurrentView('shop')}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onClaimDailyLogin={handleClaimDailyLogin}
          />
        ) : currentView === 'tournament' ? (
          <TournamentScreen
            userProfile={userProfile}
            onEnterMatch={() => {
              handleStartOfflineMatch({ difficulty: 'hard', format: '1v1', mapId: 'orbital_dock' });
            }}
            onClose={() => setCurrentView('home')}
          />
        ) : currentView === 'battle_pass' ? (
          <BattlePassScreen
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
            onOpenShop={() => setCurrentView('shop')}
            onClose={() => setCurrentView('home')}
          />
        ) : currentView === 'leaderboard' ? (
          <LeaderboardScreen userProfile={userProfile} />
        ) : currentView === 'profile' ? (
          <ProfileScreen
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
            onOpenFriends={() => setCurrentView('friends')}
            onResetAccount={() => {
              localStorage.clear();
              window.location.reload();
            }}
            onOpenAuth={() => setIsLoginOpen(true)}
          />
        ) : (
          /* Home Screen */
          <HomeScreen
            userProfile={userProfile}
            onSelectCharacter={(charId) => {
              updateProfile({ ...userProfile, selectedCharacter: charId });
            }}
            onStartQuickMatch={handleStartQuickMatch}
            onOpenOfflineSetup={() => setIsOfflineSetupOpen(true)}
            onOpenRoomLobby={() => {
              const code = prompt('Enter 6-digit Room Code (or leave blank to create a new room):');
              if (code && code.trim()) {
                handleJoinRoom(code.trim().toUpperCase());
              } else {
                handleCreateRoom('Gladiator Arena', '1v1', 'cyber_grid');
              }
            }}
            onOpenTournament={() => setCurrentView('tournament')}
            onStartPractice={() => {
              handleStartOfflineMatch({ difficulty: 'easy', format: '1v1', mapId: 'cyber_grid' });
            }}
            onOpenWallet={() => setCurrentView('wallet')}
            onOpenShop={() => setCurrentView('shop')}
            onOpenLeaderboard={() => setCurrentView('leaderboard')}
            onClaimDailyReward={handleClaimDailyLogin}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onOpenDrive={() => setIsDriveModalOpen(true)}
            onClaimSingleMission={handleClaimSingleMission}
            onOpenBattlePass={() => setCurrentView('battle_pass')}
            onOpenFriends={() => setCurrentView('friends')}
            onOpenGameHub={() => setCurrentView('game_hub')}
            onOpenLudo={() => setCurrentView('ludo')}
            onOpenCarrom={() => setCurrentView('carrom')}
            onOpenPuliDanta={() => setCurrentView('puli_danta')}
            onOpenMindMatrix={() => setCurrentView('mind_matrix')}
          />
        )}
      </main>

      {/* Bottom Mobile Tab Bar Navigation */}
      {currentView !== 'battle' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#090d16]/95 backdrop-blur-md border-t border-cyan-500/20 px-3 py-2 z-40 flex items-center justify-around max-w-lg mx-auto md:max-w-xl md:rounded-t-2xl">
          {[
            { id: 'home', label: 'Arena', icon: Home },
            { id: 'game_hub', label: 'Games', icon: Gamepad2 },
            { id: 'friends', label: 'Squad', icon: Users },
            { id: 'battle_pass', label: 'Pass', icon: Crown },
            { id: 'shop', label: 'Armory', icon: ShoppingBag },
            { id: 'wallet', label: 'Wallet', icon: Wallet },
            { id: 'profile', label: 'Profile', icon: UserIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setCurrentView(tab.id as any);
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                <span className="text-[10px] font-bold font-display">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Modals */}
      <MissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        userProfile={userProfile}
        onClaimMission={handleClaimSingleMission}
        onClaimMegaBonus={handleClaimMegaBonus}
        onUpdateProfile={updateProfile}
      />

      <OfflineSetupModal
        isOpen={isOfflineSetupOpen}
        onClose={() => setIsOfflineSetupOpen(false)}
        onStartOfflineMatch={handleStartOfflineMatch}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={({ username, emailOrPhone, authMethod }) => {
          const updatedProfile: UserProfile = {
            ...userProfile,
            username,
            emailOrPhone,
            authMethod
          };
          updateProfile(updatedProfile);
          showNotification(`Welcome, ${username}! Account synced.`);
        }}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUserProfile={userProfile}
        onGrantTestingCoins={(gold, gems) => {
          updateProfile({
            ...userProfile,
            gold: userProfile.gold + gold,
            gems: userProfile.gems + gems
          });
          showNotification(`Tester grant applied: +${gold} Gold, +${gems} Gems.`);
        }}
      />

      <PublishGuideModal
        isOpen={isPublishGuideOpen}
        onClose={() => setIsPublishGuideOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
      />

      <DriveSaveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        userProfile={userProfile}
        onRestoreProfile={(restored) => {
          updateProfile(restored);
          showNotification('Cloud save restored from Google Drive!');
        }}
      />
    </div>
  );
}
