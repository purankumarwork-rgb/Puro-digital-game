export type CharacterId = 'rex' | 'shadow' | 'volt' | 'pyro' | 'valkyrie';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  role: 'Assault' | 'Assassin' | 'Sniper' | 'Tank' | 'Support';
  description: string;
  avatarUrl: string;
  color: string;
  secondaryColor: string;
  priceGold: number;
  priceGems: number;
  stats: {
    hp: number;
    speed: number;
    damage: number;
    fireRate: number; // shots per sec
    range: number;
  };
  weapon: {
    name: string;
    projectileSpeed: number;
    projectileColor: string;
    burstCount: number;
    spread: number;
  };
  specialAbility: {
    name: string;
    description: string;
    cooldownSec: number;
  };
  ultimateAbility: {
    name: string;
    description: string;
    chargeRequired: number; // 100
  };
}

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  kills: number;
  deaths: number;
  winStreak: number;
  highestStreak: number;
  mvpCount: number;
}

export interface MatchHistoryItem {
  id: string;
  timestamp: number;
  mode: string;
  map: string;
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  kills: number;
  deaths: number;
  score: number;
  coinsEarned: number;
  expEarned: number;
}

export type MissionType =
  | 'kills'
  | 'matches'
  | 'wins'
  | 'powerups'
  | 'ultimates'
  | 'character_kills'
  | 'win_character'
  | 'achieve_score'
  | 'offline_matches';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardGold: number;
  rewardGems: number;
  rewardExp: number;
  claimed: boolean;
  type: MissionType;
  requiredCharacter?: CharacterId;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardGold: number;
  rewardExp: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface BattlePassReward {
  type: 'gold' | 'gems' | 'skin' | 'character' | 'title' | 'avatar';
  amount?: number;
  id?: string;
  name: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: BattlePassReward;
  premiumReward: BattlePassReward;
}

export interface SeasonalQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardBpXp: number;
  claimed: boolean;
  icon: string;
}

export interface BattlePassState {
  season: number;
  seasonName: string;
  seasonEndsTimestamp: number;
  tier: number;
  xp: number;
  isPremium: boolean;
  claimedFreeTiers: number[];
  claimedPremiumTiers: number[];
  seasonalQuests: SeasonalQuest[];
}

export interface Friend {
  id: string; // e.g. "PUR#8812"
  username: string;
  avatar: string;
  title: string;
  level: number;
  status: 'online' | 'in_game' | 'offline';
  currentRoomCode?: string;
  lastSeen?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  emailOrPhone: string;
  authMethod: 'guest' | 'phone' | 'email' | 'google';
  avatar: string;
  title: string;
  level: number;
  exp: number;
  gold: number;
  gems: number;
  unlockedCharacters: CharacterId[];
  selectedCharacter: CharacterId;
  unlockedSkins: string[];
  selectedSkin: string;
  selectedMap: string;
  stats: PlayerStats;
  matchHistory: MatchHistoryItem[];
  missions: DailyMission[];
  lastMissionResetTime: number; // Milliseconds timestamp of 24h reset cycle
  dailyMissionsCompletedBonusClaimed: boolean;
  freeRerollsRemaining: number;
  achievements: Achievement[];
  battlePass: BattlePassState;
  friends: Friend[];
  friendRequests?: Array<{ id: string; username: string; avatar: string; title: string }>;
  dailyLoginDay: number;
  lastDailyClaim: number;
  isBanned?: boolean;
}

export interface GameSettings {
  sfxVolume: number; // 0 to 1
  bgmVolume: number;
  soundEnabled: boolean;
  vibration: boolean;
  showFps: boolean;
  joystickSize: 'small' | 'medium' | 'large';
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'pillar' | 'wall' | 'energy_barrier';
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'health' | 'shield' | 'damage' | 'speed';
  duration: number; // in seconds
  active: boolean;
}

export interface Projectile {
  id: string;
  ownerId: string;
  team: 'red' | 'blue';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  range: number;
  traveled: number;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  amount: number;
  isCrit: boolean;
  isShield: boolean;
  life: number;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  killerTeam: 'red' | 'blue';
  victimTeam: 'red' | 'blue';
  timestamp: number;
}
