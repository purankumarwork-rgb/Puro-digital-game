import { BattlePassTier, SeasonalQuest, BattlePassState } from '../types/game';

export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  {
    tier: 1,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 300, name: '300 Battle Gold', icon: '🪙', rarity: 'Common' },
    premiumReward: { type: 'skin', id: 'skin_rex_neon', name: 'Neon Vanguard Rex', icon: '🛡️', rarity: 'Epic' }
  },
  {
    tier: 2,
    xpRequired: 100,
    freeReward: { type: 'avatar', id: 'avatar_cyber_core', name: 'Cyber Core Avatar', icon: '🤖', rarity: 'Common' },
    premiumReward: { type: 'gems', amount: 40, name: '40 Cyber Gems', icon: '💎', rarity: 'Rare' }
  },
  {
    tier: 3,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 500, name: '500 Battle Gold', icon: '🪙', rarity: 'Common' },
    premiumReward: { type: 'title', name: 'Title: Grid Overlord', icon: '🎖️', rarity: 'Rare' }
  },
  {
    tier: 4,
    xpRequired: 100,
    freeReward: { type: 'gems', amount: 15, name: '15 Cyber Gems', icon: '💎', rarity: 'Rare' },
    premiumReward: { type: 'gold', amount: 1200, name: '1,200 Battle Gold', icon: '🪙', rarity: 'Rare' }
  },
  {
    tier: 5,
    xpRequired: 100,
    freeReward: { type: 'title', name: 'Title: Cyber Striker', icon: '🎖️', rarity: 'Rare' },
    premiumReward: { type: 'skin', id: 'skin_shadow_phantom', name: 'Phantom Specter Shadow', icon: '🥷', rarity: 'Legendary' }
  },
  {
    tier: 6,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 600, name: '600 Battle Gold', icon: '🪙', rarity: 'Common' },
    premiumReward: { type: 'gems', amount: 60, name: '60 Cyber Gems', icon: '💎', rarity: 'Rare' }
  },
  {
    tier: 7,
    xpRequired: 100,
    freeReward: { type: 'gems', amount: 20, name: '20 Cyber Gems', icon: '💎', rarity: 'Rare' },
    premiumReward: { type: 'gold', amount: 1500, name: '1,500 Battle Gold', icon: '🪙', rarity: 'Rare' }
  },
  {
    tier: 8,
    xpRequired: 100,
    freeReward: { type: 'avatar', id: 'avatar_hacker', name: 'Hacker Drone Avatar', icon: '👾', rarity: 'Rare' },
    premiumReward: { type: 'title', name: 'Title: Glitch Executioner', icon: '⚡', rarity: 'Epic' }
  },
  {
    tier: 9,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 800, name: '800 Battle Gold', icon: '🪙', rarity: 'Common' },
    premiumReward: { type: 'gems', amount: 80, name: '80 Cyber Gems', icon: '💎', rarity: 'Epic' }
  },
  {
    tier: 10,
    xpRequired: 100,
    freeReward: { type: 'gems', amount: 35, name: '35 Cyber Gems', icon: '💎', rarity: 'Rare' },
    premiumReward: { type: 'skin', id: 'skin_volt_thunder', name: 'Thunder Rail Volt', icon: '⚡', rarity: 'Legendary' }
  },
  {
    tier: 11,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 1000, name: '1,000 Battle Gold', icon: '🪙', rarity: 'Rare' },
    premiumReward: { type: 'gold', amount: 2000, name: '2,000 Battle Gold', icon: '🪙', rarity: 'Epic' }
  },
  {
    tier: 12,
    xpRequired: 100,
    freeReward: { type: 'title', name: 'Title: Arena Elite', icon: '🎖️', rarity: 'Rare' },
    premiumReward: { type: 'gems', amount: 100, name: '100 Cyber Gems', icon: '💎', rarity: 'Epic' }
  },
  {
    tier: 13,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 1200, name: '1,200 Battle Gold', icon: '🪙', rarity: 'Rare' },
    premiumReward: { type: 'avatar', id: 'avatar_cyber_warlord', name: 'Cyber Warlord Avatar', icon: '👑', rarity: 'Legendary' }
  },
  {
    tier: 14,
    xpRequired: 100,
    freeReward: { type: 'gems', amount: 50, name: '50 Cyber Gems', icon: '💎', rarity: 'Epic' },
    premiumReward: { type: 'skin', id: 'skin_pyro_inferno', name: 'Solar Inferno Pyro Blaze', icon: '🔥', rarity: 'Legendary' }
  },
  {
    tier: 15,
    xpRequired: 100,
    freeReward: { type: 'gold', amount: 2500, name: '2,500 Grand Gold', icon: '🪙', rarity: 'Epic' },
    premiumReward: { type: 'skin', id: 'skin_valk_seraph', name: 'Apex Chrono Seraphim Valkyrie', icon: '👑', rarity: 'Mythic' }
  }
];

export const INITIAL_SEASONAL_QUESTS: SeasonalQuest[] = [
  {
    id: 'sq_1',
    title: 'Season Warfare',
    description: 'Win 8 matches in Online or Offline Arena',
    target: 8,
    current: 0,
    rewardBpXp: 300,
    claimed: false,
    icon: '🏆'
  },
  {
    id: 'sq_2',
    title: 'Arena Executioner',
    description: 'Eliminate 25 opponent gladiators or bots',
    target: 25,
    current: 0,
    rewardBpXp: 250,
    claimed: false,
    icon: '🎯'
  },
  {
    id: 'sq_3',
    title: 'Power Core Harvester',
    description: 'Collect 12 health, shield, or speed powerups in combat',
    target: 12,
    current: 0,
    rewardBpXp: 200,
    claimed: false,
    icon: '🔋'
  },
  {
    id: 'sq_4',
    title: 'Ultimate Cataclysm',
    description: 'Deploy Hero Ultimate Abilities 10 times',
    target: 10,
    current: 0,
    rewardBpXp: 220,
    claimed: false,
    icon: '💥'
  },
  {
    id: 'sq_5',
    title: 'Offline Solo Champion',
    description: 'Complete 6 offline bot trials',
    target: 6,
    current: 0,
    rewardBpXp: 180,
    claimed: false,
    icon: '🤖'
  }
];

export const INITIAL_BATTLE_PASS_STATE: BattlePassState = {
  season: 1,
  seasonName: 'Neon Vanguard',
  seasonEndsTimestamp: Date.now() + 24 * 24 * 60 * 60 * 1000, // 24 days remaining
  tier: 1,
  xp: 35, // starting partial XP
  isPremium: false,
  claimedFreeTiers: [],
  claimedPremiumTiers: [],
  seasonalQuests: INITIAL_SEASONAL_QUESTS
};
