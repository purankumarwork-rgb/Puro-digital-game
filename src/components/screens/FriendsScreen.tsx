import React, { useState } from 'react';
import { UserProfile, Friend } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  Zap,
  Copy,
  Check,
  Trash2,
  CheckCircle,
  XCircle,
  Swords,
  Clock,
  Search,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface FriendsScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onDirectInvite: (friend: Friend) => void;
  onClose: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  userProfile,
  onUpdateProfile,
  onDirectInvite,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friendIdInput, setFriendIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const friendsList = userProfile.friends || [];
  const friendRequests = userProfile.friendRequests || [];

  const onlineFriends = friendsList.filter(f => f.status === 'online');
  const inGameFriends = friendsList.filter(f => f.status === 'in_game');
  const offlineFriends = friendsList.filter(f => f.status === 'offline');

  const filteredFriends = friendsList.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyMyId = () => {
    navigator.clipboard.writeText(userProfile.id);
    setCopiedId(true);
    sound.playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddFriend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = friendIdInput.trim();
    if (!rawInput) return;

    // Validate format or normalize to PUR#XXXX
    const formattedId = rawInput.startsWith('#')
      ? `PUR${rawInput}`
      : rawInput.includes('#')
      ? rawInput.toUpperCase()
      : `PUR#${rawInput.toUpperCase()}`;

    // Can't add self
    if (formattedId === userProfile.id.toUpperCase()) {
      sound.playDefeat();
      setFeedbackMsg({ text: "You cannot add your own Player ID!", type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    // Check if already friends
    if (friendsList.some(f => f.id.toUpperCase() === formattedId)) {
      sound.playDefeat();
      setFeedbackMsg({ text: "Already in your friends list!", type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    sound.playPowerUp();
    confetti({ particleCount: 40, spread: 50 });

    const newFriend: Friend = {
      id: formattedId,
      username: `Gladiator_${formattedId.replace(/[^0-9]/g, '').slice(-4) || 'Rival'}`,
      avatar: ['⚡', '💎', '🔥', '👑', '🛡️', '🥷'][Math.floor(Math.random() * 6)],
      title: 'Arena Contender',
      level: Math.floor(Math.random() * 15) + 3,
      status: 'online', // New friend appears online for instant battle invite
      lastSeen: 'Just now'
    };

    const updatedProfile: UserProfile = {
      ...userProfile,
      friends: [newFriend, ...friendsList]
    };

    onUpdateProfile(updatedProfile);
    setFriendIdInput('');
    setFeedbackMsg({ text: `Friend added successfully! (${formattedId})`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRemoveFriend = (friendId: string) => {
    sound.playClick();
    const updatedProfile: UserProfile = {
      ...userProfile,
      friends: friendsList.filter(f => f.id !== friendId)
    };
    onUpdateProfile(updatedProfile);
  };

  const handleAcceptRequest = (request: { id: string; username: string; avatar: string; title: string }) => {
    sound.playVictory();
    confetti({ particleCount: 50, spread: 60 });

    const newFriend: Friend = {
      id: request.id,
      username: request.username,
      avatar: request.avatar,
      title: request.title,
      level: Math.floor(Math.random() * 10) + 5,
      status: 'online'
    };

    const updatedProfile: UserProfile = {
      ...userProfile,
      friends: [newFriend, ...friendsList],
      friendRequests: friendRequests.filter(r => r.id !== request.id)
    };

    onUpdateProfile(updatedProfile);
    setFeedbackMsg({ text: `Accepted request from ${request.username}!`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeclineRequest = (requestId: string) => {
    sound.playClick();
    const updatedProfile: UserProfile = {
      ...userProfile,
      friendRequests: friendRequests.filter(r => r.id !== requestId)
    };
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Arena</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-cyan-400" size={26} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              FRIENDS & SQUAD
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Add friends by Player ID, view live online statuses, and send instant Direct Invites to private 1v1 and 2v2 arena rooms without needing room codes!
          </p>
        </div>

        {/* My Player ID Share Card */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 min-w-[220px]">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Player ID</span>
          <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-cyan-500/30">
            <span className="font-mono font-black text-cyan-300 text-sm tracking-wide">{userProfile.id}</span>
            <button
              onClick={handleCopyMyId}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copy My Player ID"
            >
              {copiedId ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
          <span className="text-[10px] text-slate-400">Share with rivals to receive Direct Invites</span>
        </div>
      </div>

      {/* Add Friend by ID Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <h2 className="text-sm font-bold font-display text-white mb-2 flex items-center gap-2">
          <UserPlus size={18} className="text-cyan-400" />
          ADD FRIEND BY PLAYER ID
        </h2>
        <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="e.g. PUR#8812 or 8812"
              value={friendIdInput}
              onChange={e => setFriendIdInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 font-bold text-xs text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Send Friend Request / Add</span>
          </button>
        </form>

        {feedbackMsg && (
          <div
            className={`mt-3 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-500 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'friends'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={15} />
            <span>Friends ({friendsList.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles size={15} />
            <span>Requests</span>
            {friendRequests.length > 0 && (
              <span className="bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className="relative hidden sm:block w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Friends List */}
      {activeTab === 'friends' && (
        <div className="flex flex-col gap-3">
          {/* Status summary pill */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span>{onlineFriends.length} Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span>{inGameFriends.length} In Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>{offlineFriends.length} Offline</span>
            </div>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
              <Users size={36} className="mx-auto text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Friends Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Share your Player ID <span className="text-cyan-400 font-mono font-bold">{userProfile.id}</span> or add a friend above using their ID to send direct invites!
              </p>
            </div>
          ) : (
            filteredFriends.map(friend => {
              const isOnline = friend.status === 'online';
              const isInGame = friend.status === 'in_game';

              return (
                <div
                  key={friend.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md"
                >
                  {/* Friend info & avatar */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-950 border border-cyan-500/30 flex items-center justify-center text-2xl shadow">
                        {friend.avatar}
                      </div>
                      {/* Status indicator dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          isOnline
                            ? 'bg-emerald-400 ring-2 ring-emerald-500/30 animate-pulse'
                            : isInGame
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`}
                        title={isOnline ? 'Online' : isInGame ? 'In Game' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-display text-white">
                          {friend.username}
                        </span>
                        <span className="text-[10px] bg-slate-950 text-cyan-400 font-bold px-1.5 py-0.2 rounded border border-cyan-900">
                          LVL {friend.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-500">{friend.id}</span>
                        <span>•</span>
                        <span className="text-slate-400">{friend.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status details */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {/* Status badge */}
                    <div className="text-right mr-2">
                      {isOnline && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          🟢 Online
                        </span>
                      )}
                      {isInGame && (
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          ⚔️ In Battle (1v1)
                        </span>
                      )}
                      {!isOnline && !isInGame && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> {friend.lastSeen || 'Offline'}
                        </span>
                      )}
                    </div>

                    {/* Direct Invite Button */}
                    {isOnline ? (
                      <button
                        onClick={() => {
                          sound.playClick();
                          onDirectInvite(friend);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
                        title="Directly invite friend to your private room without requiring a code"
                      >
                        <Zap size={14} className="fill-white" />
                        <span>Direct Invite</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-600 text-xs font-semibold cursor-not-allowed"
                      >
                        {isInGame ? 'Match in Progress' : 'Offline'}
                      </button>
                    )}

                    {/* Remove friend */}
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-950 transition-colors"
                      title="Remove Friend"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Pending Friend Requests */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-3">
          {friendRequests.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
              <Sparkles size={36} className="mx-auto text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">No Pending Requests</h3>
              <p className="text-xs text-slate-500 mt-1">
                You're all caught up! New friend requests from players will appear here.
              </p>
            </div>
          ) : (
            friendRequests.map(req => (
              <div
                key={req.id}
                className="bg-slate-900/80 border border-purple-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900 to-indigo-950 border border-purple-400/40 flex items-center justify-center text-2xl shadow">
                    {req.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-white">{req.username}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-cyan-400">{req.id}</span>
                      <span>•</span>
                      <span>{req.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
