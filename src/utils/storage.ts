import { UserProfile, GameSettings, Achievement } from '../types/game';
import { generateDailyMissions } from './missions';
import { INITIAL_BATTLE_PASS_STATE } from '../constants/battlePass';

const PROFILE_KEY = 'puro_battle_arena_profile_v2';
const SETTINGS_KEY = 'puro_battle_arena_settings_v2';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_novice',
    title: 'Arena Initiate',
    description: 'Complete your first battle in Puro Arena',
    icon: '🎖️',
    rewardGold: 200,
    rewardExp: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'ach_sniper',
    title: 'Sharpshooter',
    description: 'Achieve 20 total kills across matches',
    icon: '🎯',
    rewardGold: 600,
    rewardExp: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 20
  },
  {
    id: 'ach_streak',
    title: 'Unstoppable Rampage',
    description: 'Attain a 3-match win streak',
    icon: '🔥',
    rewardGold: 1000,
    rewardExp: 250,
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'ach_collector',
    title: 'Hero Armory',
    description: 'Unlock 3 distinct arena characters',
    icon: '👑',
    rewardGold: 1500,
    rewardExp: 400,
    unlocked: false,
    progress: 1,
    maxProgress: 3
  }
];

export const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.8,
  bgmVolume: 0.35,
  soundEnabled: true,
  vibration: true,
  showFps: true,
  joystickSize: 'medium',
  graphicsQuality: 'high'
};
export const INITIAL_FRIENDS: import('../types/game').Friend[] = [
  {
    id: 'PUR#8812',
    username: 'Vortex_Apex',
    avatar: '👑',
    title: 'Grandmaster Gladiator',
    level: 18,
    status: 'online'
  },
  {
    id: 'PUR#3401',
    username: 'ShadowStriker',
    avatar: '🥷',
    title: 'Cyber Assassin',
    level: 12,
    status: 'in_game'
  },
  {
    id: 'PUR#9215',
    username: 'NeonValkyrie',
    avatar: '💎',
    title: 'Nanite Seraph',
    level: 9,
    status: 'online'
  },
  {
    id: 'PUR#6510',
    username: 'VoltSniper',
    avatar: '⚡',
    title: 'Railgun Marksman',
    level: 7,
    status: 'offline',
    lastSeen: '1 hour ago'
  }
];

export function createDefaultProfile(): UserProfile {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `PUR#${randomNum}`,
    username: `Gladiator_${randomNum}`,
    emailOrPhone: `player_${randomNum}@puro.game`,
    authMethod: 'guest',
    avatar: '🛡️',
    title: 'Cyber Recruit',
    level: 1,
    exp: 40,
    gold: 1000, // Starter virtual coins
    gems: 50,
    unlockedCharacters: ['rex'],
    selectedCharacter: 'rex',
    unlockedSkins: [],
    selectedSkin: 'default',
    selectedMap: 'cyber_grid',
    stats: {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      kills: 0,
      deaths: 0,
      winStreak: 0,
      highestStreak: 0,
      mvpCount: 0
    },
    matchHistory: [],
    missions: generateDailyMissions(4),
    lastMissionResetTime: Date.now(),
    dailyMissionsCompletedBonusClaimed: false,
    freeRerollsRemaining: 1,
    achievements: INITIAL_ACHIEVEMENTS,
    battlePass: INITIAL_BATTLE_PASS_STATE,
    friends: INITIAL_FRIENDS,
    friendRequests: [
      { id: 'PUR#4109', username: 'ThunderBlade', avatar: '🔥', title: 'Inferno Juggernaut' }
    ],
    dailyLoginDay: 1,
    lastDailyClaim: 0,
    isBanned: false
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.missions || parsed.missions.length === 0) {
        parsed.missions = generateDailyMissions(4);
      }
      if (!parsed.lastMissionResetTime) {
        parsed.lastMissionResetTime = Date.now();
      }
      if (!parsed.achievements || parsed.achievements.length === 0) {
        parsed.achievements = INITIAL_ACHIEVEMENTS;
      }
      if (!parsed.battlePass) {
        parsed.battlePass = INITIAL_BATTLE_PASS_STATE;
      }
      if (!parsed.friends || parsed.friends.length === 0) {
        parsed.friends = INITIAL_FRIENDS;
      }
      if (!parsed.friendRequests) {
        parsed.friendRequests = [];
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored profile', e);
  }
  const defaultProfile = createDefaultProfile();
  saveProfile(defaultProfile);
  return defaultProfile;
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving profile', e);
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}
