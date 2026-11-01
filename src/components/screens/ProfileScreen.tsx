import React, { useState } from 'react';
import { UserProfile, CharacterId } from '../../types/game';
import { CHARACTERS, SHOP_SKINS } from '../../constants/characters';
import { SkinRotator } from '../SkinRotator';
import { sound } from '../../utils/audio';
import {
  User,
  Copy,
  Check,
  Edit2,
  Trash2,
  TrendingUp,
  Sparkles,
  Rotate3d,
  Users,
  UserPlus,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ProfileScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onResetAccount: () => void;
  onOpenAuth: () => void;
  onOpenFriends?: () => void;
}

const AVATAR_OPTIONS = ['🛡️', '🥷', '⚡', '🔥', '💎', '👑', '🤖', '👾', '🚀', '🦊'];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  onUpdateProfile,
  onResetAccount,
  onOpenAuth,
  onOpenFriends,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userProfile.username);
  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 360° Skin Rotator state
  const [previewCharId, setPreviewCharId] = useState<CharacterId>(userProfile.selectedCharacter || 'rex');
  const [quickFriendId, setQuickFriendId] = useState('');
  const [quickFriendNotice, setQuickFriendNotice] = useState<string | null>(null);

  const selectedChar = CHARACTERS[previewCharId] || CHARACTERS['rex'];

  // All skins available for this character that user has unlocked (or default)
  const availableSkins = [
    { id: 'default', name: 'Default Cyber Armor' },
    ...SHOP_SKINS.filter(s => s.characterId === previewCharId && userProfile.unlockedSkins.includes(s.id))
  ];

  const [previewSkinId, setPreviewSkinId] = useState<string>(
    userProfile.selectedSkin && availableSkins.some(s => s.id === userProfile.selectedSkin)
      ? userProfile.selectedSkin
      : 'default'
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(userProfile.id);
    setCopiedId(true);
    sound.playClick();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = () => {
    if (!usernameInput.trim()) return;
    sound.playClick();
    onUpdateProfile({
      ...userProfile,
      username: usernameInput.trim()
    });
    setIsEditing(false);
  };

  const handleSelectAvatar = (avatar: string) => {
    sound.playClick();
    onUpdateProfile({
      ...userProfile,
      avatar
    });
  };

  const handleEquipCurrentSkin = () => {
    sound.playPowerUp();
    onUpdateProfile({
      ...userProfile,
      selectedCharacter: previewCharId,
      selectedSkin: previewSkinId
    });
  };

  const handleQuickAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickFriendId.trim();
    if (!raw) return;

    const formattedId = raw.startsWith('#')
      ? `PUR${raw}`
      : raw.includes('#')
      ? raw.toUpperCase()
      : `PUR#${raw.toUpperCase()}`;

    if (formattedId === userProfile.id.toUpperCase()) {
      setQuickFriendNotice("Cannot add your own Player ID!");
      setTimeout(() => setQuickFriendNotice(null), 3000);
      return;
    }

    if ((userProfile.friends || []).some(f => f.id.toUpperCase() === formattedId)) {
      setQuickFriendNotice("Already in friends list!");
      setTimeout(() => setQuickFriendNotice(null), 3000);
      return;
    }

    sound.playPowerUp();
    const newFriend = {
      id: formattedId,
      username: `Gladiator_${formattedId.replace(/[^0-9]/g, '').slice(-4) || 'Buddy'}`,
      avatar: '⚡',
      title: 'Arena Contender',
      level: 8,
      status: 'online' as const
    };

    onUpdateProfile({
      ...userProfile,
      friends: [newFriend, ...(userProfile.friends || [])]
    });

    setQuickFriendId('');
    setQuickFriendNotice(`Added ${formattedId} to friends!`);
    setTimeout(() => setQuickFriendNotice(null), 3500);
  };

  const winRate =
    userProfile.stats.matchesPlayed > 0
      ? Math.round((userProfile.stats.matchesWon / userProfile.stats.matchesPlayed) * 100)
      : 0;

  const kdRatio =
    userProfile.stats.deaths > 0
      ? (userProfile.stats.kills / userProfile.stats.deaths).toFixed(2)
      : (userProfile.stats.kills || 0).toFixed(2);

  const friendsList = userProfile.friends || [];
  const onlineCount = friendsList.filter(f => f.status === 'online').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with editor */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-700 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-xl">
              {userProfile.avatar}
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-1 font-semibold">Tap icon below</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    maxLength={16}
                    className="bg-slate-950 border border-cyan-400 rounded-xl px-3 py-1 text-base font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black font-display text-white">{userProfile.username}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <span className="text-xs bg-cyan-950 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-800">
                LVL {userProfile.level}
              </span>
            </div>

            <div className="text-xs text-slate-400 mb-2">
              Title: <span className="text-cyan-400 font-semibold">{userProfile.title}</span>
            </div>

            {/* Unique Player ID Pill with Copy */}
            <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500">Player ID:</span>
              <span className="font-mono font-bold text-cyan-300">{userProfile.id}</span>
              <button
                onClick={handleCopyId}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Player ID"
              >
                {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 w-full md:w-64">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-400">EXP Progression</span>
            <span className="text-cyan-400">{userProfile.exp} / {userProfile.level * 100}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
              style={{ width: `${Math.min(100, (userProfile.exp / (userProfile.level * 100)) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500">Next level grants +{userProfile.level * 200} Gold</div>
        </div>
      </div>

      {/* 360° HERO & SKIN ROTATOR SHOWCASE (Skin rotate anable) */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rotate3d className="text-cyan-400 animate-spin" size={22} />
            <h2 className="text-lg font-black font-display text-white">
              360° HERO & SKIN ROTATOR
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Interactive 360° Turntable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Turntable Canvas */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
            <SkinRotator
              character={selectedChar}
              skinId={previewSkinId}
              skinName={availableSkins.find(s => s.id === previewSkinId)?.name || 'Default Cyber Armor'}
              size={280}
            />
            <p className="text-[10px] text-slate-400 text-center mt-2">
              💡 Swipe or drag horizontally on the hero to rotate 360° in real-time.
            </p>
          </div>

          {/* Skin and Character Customization Controls */}
          <div className="md:col-span-6 flex flex-col gap-4">
            {/* Select Hero */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Combat Hero
              </span>
              <div className="grid grid-cols-5 gap-2">
                {(['rex', 'shadow', 'volt', 'pyro', 'valkyrie'] as CharacterId[]).map(cId => {
                  const ch = CHARACTERS[cId];
                  const isUnlocked = userProfile.unlockedCharacters.includes(cId);
                  const isSelected = previewCharId === cId;

                  return (
                    <button
                      key={cId}
                      onClick={() => {
                        sound.playClick();
                        setPreviewCharId(cId);
                        setPreviewSkinId('default');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : isUnlocked
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/50 border-slate-900 opacity-60'
                      }`}
                    >
                      <span className="text-xl">{ch.avatarUrl}</span>
                      <span className="text-[10px] font-bold text-white truncate max-w-full">{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Skin for this hero */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Available Skins ({availableSkins.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {availableSkins.map(sk => {
                  const isEquipped = userProfile.selectedCharacter === previewCharId && userProfile.selectedSkin === sk.id;
                  const isPreview = previewSkinId === sk.id;

                  return (
                    <button
                      key={sk.id}
                      onClick={() => {
                        sound.playClick();
                        setPreviewSkinId(sk.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isPreview
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sk.name} {isEquipped && '✓ Equipped'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equip Button */}
            <div className="pt-2">
              <button
                onClick={handleEquipCurrentSkin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Equip Selected Hero & Skin for Battles</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FRIENDS & SQUAD INTEGRATION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-cyan-400" size={22} />
            <h2 className="text-lg font-bold font-display text-white">
              SQUAD & SOCIAL ({friendsList.length} Friends)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Currently <span className="text-emerald-400 font-bold">{onlineCount} friends online</span>. Add friends by Player ID to send Direct Invites to private matches without codes!
          </p>

          {/* Quick Add Form */}
          <form onSubmit={handleQuickAddFriend} className="flex gap-2 mt-3 max-w-sm">
            <input
              type="text"
              placeholder="Add Player ID (e.g. PUR#8812)"
              value={quickFriendId}
              onChange={e => setQuickFriendId(e.target.value)}
              className="bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono focus:outline-none flex-1"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Add</span>
            </button>
          </form>

          {quickFriendNotice && (
            <div className="text-[11px] text-cyan-300 font-bold mt-1.5">{quickFriendNotice}</div>
          )}
        </div>

        {onOpenFriends && (
          <button
            onClick={onOpenFriends}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer transition-all"
          >
            <Zap size={16} />
            <span>Open Friends List & Direct Invites</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Avatar Picker Carousel */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Choose Avatar Icon
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {AVATAR_OPTIONS.map(av => (
            <button
              key={av}
              onClick={() => handleSelectAvatar(av)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all cursor-pointer ${
                userProfile.avatar === av
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-105'
                  : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Combat Career Statistics */}
      <div>
        <h2 className="text-lg font-bold font-display text-white mb-3 flex items-center gap-2">
          <TrendingUp size={20} className="text-cyan-400" />
          CAREER COMBAT STATISTICS
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Battles</div>
            <div className="text-2xl font-black font-display text-white">{userProfile.stats.matchesPlayed}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Victories</div>
            <div className="text-2xl font-black font-display text-emerald-400">{userProfile.stats.matchesWon}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Win Rate</div>
            <div className="text-2xl font-black font-display text-cyan-400">{winRate}%</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">K/D Ratio</div>
            <div className="text-2xl font-black font-display text-rose-400">{kdRatio}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Kills</div>
            <div className="text-2xl font-black font-display text-amber-400">{userProfile.stats.kills}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Deaths</div>
            <div className="text-2xl font-black font-display text-slate-400">{userProfile.stats.deaths}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Win Streak</div>
            <div className="text-2xl font-black font-display text-orange-400">{userProfile.stats.winStreak}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Highest Streak</div>
            <div className="text-2xl font-black font-display text-yellow-400">{userProfile.stats.highestStreak}</div>
          </div>
        </div>
      </div>

      {/* Account Management & Security / Delete Options */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Account Credentials & Data</h3>
          <p className="text-xs text-slate-400">
            Auth method: <span className="font-semibold uppercase text-cyan-400">{userProfile.authMethod}</span> ({userProfile.emailOrPhone})
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Switch Account
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete / Reset Account</span>
          </button>
        </div>
      </div>

      {/* Delete / Reset Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-rose-500 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-lg font-bold font-display text-white mb-2">Reset Player Data?</h3>
            <p className="text-xs text-slate-400 mb-5">
              This will clear all local match statistics and reset your profile to default recruit status in accordance with privacy data deletion requirements.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onResetAccount();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
