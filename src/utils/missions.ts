import { DailyMission, MissionType, UserProfile, CharacterId } from '../types/game';

// 24 hours in milliseconds
export const MISSION_CYCLE_MS = 24 * 60 * 60 * 1000;

export const MISSION_POOL: Array<Omit<DailyMission, 'id' | 'current' | 'claimed'>> = [
  // 1. Win a match with a specific character
  {
    title: 'Vanguard Victory',
    description: 'Win a match while playing as Rex Vanguard',
    target: 1,
    rewardGold: 400,
    rewardGems: 15,
    rewardExp: 90,
    type: 'win_character',
    requiredCharacter: 'rex',
    icon: '🛡️'
  },
  {
    title: 'Shadow Mastery',
    description: 'Win a match while playing as Shadow Blade',
    target: 1,
    rewardGold: 450,
    rewardGems: 15,
    rewardExp: 100,
    type: 'win_character',
    requiredCharacter: 'shadow',
    icon: '🥷'
  },
  {
    title: 'Volt Supremacy',
    description: 'Win a match while playing as Volt Stryker',
    target: 1,
    rewardGold: 500,
    rewardGems: 20,
    rewardExp: 110,
    type: 'win_character',
    requiredCharacter: 'volt',
    icon: '⚡'
  },

  // 2. Achieve a certain score
  {
    title: 'Combat Ace',
    description: 'Achieve a score of at least 350 combat points in a single match',
    target: 350,
    rewardGold: 350,
    rewardGems: 12,
    rewardExp: 80,
    type: 'achieve_score',
    icon: '🎖️'
  },
  {
    title: 'Apex Overachiever',
    description: 'Achieve 500+ combat points in a single battle arena match',
    target: 500,
    rewardGold: 650,
    rewardGems: 25,
    rewardExp: 160,
    type: 'achieve_score',
    icon: '👑'
  },

  // 3. Play a certain number of offline matches
  {
    title: 'Bot Arena Trial',
    description: 'Play 2 offline practice matches against computer bots',
    target: 2,
    rewardGold: 300,
    rewardGems: 10,
    rewardExp: 70,
    type: 'offline_matches',
    icon: '🤖'
  },
  {
    title: 'Cyber Solo Specialist',
    description: 'Complete 3 offline bot matches without internet connection',
    target: 3,
    rewardGold: 450,
    rewardGems: 15,
    rewardExp: 100,
    type: 'offline_matches',
    icon: '🎮'
  },

  // 4. Kills & General Arena
  {
    title: 'Combat Initiator',
    description: 'Score 5 eliminations in Online or Offline Arena',
    target: 5,
    rewardGold: 300,
    rewardGems: 10,
    rewardExp: 75,
    type: 'kills',
    icon: '🎯'
  },
  {
    title: 'Victorious Warrior',
    description: 'Win 2 matches against players or bots',
    target: 2,
    rewardGold: 500,
    rewardGems: 20,
    rewardExp: 120,
    type: 'wins',
    icon: '🏆'
  },
  {
    title: 'Scavenger Core',
    description: 'Collect 4 powerups (Health/Shield/Damage) inside matches',
    target: 4,
    rewardGold: 250,
    rewardGems: 8,
    rewardExp: 60,
    type: 'powerups',
    icon: '🔋'
  },
  {
    title: 'Overdrive Surge',
    description: 'Deploy your Hero Ultimate Ability 3 times in combat',
    target: 3,
    rewardGold: 350,
    rewardGems: 12,
    rewardExp: 80,
    type: 'ultimates',
    icon: '💥'
  }
];

export function generateDailyMissions(count = 4): DailyMission[] {
  // Ensure varied challenge types (at least 1 win/character, 1 score/offline, and kills/general)
  const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((item, index) => ({
    ...item,
    id: `mission-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    current: 0,
    claimed: false
  }));
}

export function getRemainingResetTime(lastResetTime: number): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  progressPercent: number;
  hasExpired: boolean;
} {
  const now = Date.now();
  const elapsed = now - (lastResetTime || now);
  const remaining = Math.max(0, MISSION_CYCLE_MS - elapsed);
  const hasExpired = elapsed >= MISSION_CYCLE_MS;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / MISSION_CYCLE_MS) * 100));

  return { hours, minutes, seconds, formatted, progressPercent, hasExpired };
}

export function checkAndResetMissions(profile: UserProfile): { updatedProfile: UserProfile; wasReset: boolean } {
  const { hasExpired } = getRemainingResetTime(profile.lastMissionResetTime);

  if (hasExpired || !profile.missions || profile.missions.length === 0) {
    const freshMissions = generateDailyMissions(4);
    const updatedProfile: UserProfile = {
      ...profile,
      missions: freshMissions,
      lastMissionResetTime: Date.now(),
      dailyMissionsCompletedBonusClaimed: false,
      freeRerollsRemaining: 1
    };
    return { updatedProfile, wasReset: true };
  }

  return { updatedProfile: profile, wasReset: false };
}

export function calculateExpAndLevel(
  currentLevel: number,
  currentExp: number,
  expToAdd: number
): { newLevel: number; newExp: number; leveledUp: boolean; bonusCoins: number; bonusGems: number } {
  let level = currentLevel;
  let exp = currentExp + expToAdd;
  let leveledUp = false;
  let bonusCoins = 0;
  let bonusGems = 0;

  let threshold = level * 100;
  while (exp >= threshold) {
    exp -= threshold;
    level++;
    leveledUp = true;
    bonusCoins += level * 200;
    bonusGems += 10;
    threshold = level * 100;
  }

  return { newLevel: level, newExp: exp, leveledUp, bonusCoins, bonusGems };
}

export interface MatchEvaluationContext {
  result: 'VICTORY' | 'DEFEAT' | 'DRAW';
  characterId: CharacterId;
  score: number;
  kills: number;
  isOffline: boolean;
  powerupsCollected?: number;
  ultimatesUsed?: number;
}

export function evaluateMatchChallenges(
  profile: UserProfile,
  context: MatchEvaluationContext
): { updatedProfile: UserProfile; completedMissionNames: string[] } {
  const completedMissionNames: string[] = [];

  const updatedMissions = profile.missions.map(mission => {
    if (mission.claimed) return mission;
    let increment = 0;

    switch (mission.type) {
      case 'win_character':
        if (context.result === 'VICTORY' && mission.requiredCharacter === context.characterId) {
          increment = 1;
        }
        break;

      case 'achieve_score':
        if (context.score >= mission.target) {
          increment = mission.target - mission.current;
        } else if (context.score > mission.current) {
          increment = context.score - mission.current;
        }
        break;

      case 'offline_matches':
        if (context.isOffline) {
          increment = 1;
        }
        break;

      case 'kills':
        increment = context.kills;
        break;

      case 'wins':
        if (context.result === 'VICTORY') {
          increment = 1;
        }
        break;

      case 'matches':
        increment = 1;
        break;

      case 'powerups':
        increment = context.powerupsCollected || 0;
        break;

      case 'ultimates':
        increment = context.ultimatesUsed || 0;
        break;

      case 'character_kills':
        if (mission.requiredCharacter === context.characterId) {
          increment = context.kills;
        }
        break;
    }

    if (increment > 0) {
      const nextProgress = Math.min(mission.target, mission.current + increment);
      if (nextProgress >= mission.target && mission.current < mission.target) {
        completedMissionNames.push(mission.title);
      }
      return { ...mission, current: nextProgress };
    }

    return mission;
  });

  return {
    updatedProfile: { ...profile, missions: updatedMissions },
    completedMissionNames
  };
}

export function rerollSingleMission(profile: UserProfile, missionId: string): UserProfile {
  const missionIndex = profile.missions.findIndex(m => m.id === missionId);
  if (missionIndex === -1) return profile;

  const activeTitles = new Set(profile.missions.map(m => m.title));
  const candidate = MISSION_POOL.find(p => !activeTitles.has(p.title)) || MISSION_POOL[0];

  const newMission: DailyMission = {
    ...candidate,
    id: `mission-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    current: 0,
    claimed: false
  };

  const newMissions = [...profile.missions];
  newMissions[missionIndex] = newMission;

  return {
    ...profile,
    missions: newMissions,
    freeRerollsRemaining: Math.max(0, profile.freeRerollsRemaining - 1)
  };
}
