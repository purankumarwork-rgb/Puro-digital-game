import { Character, CharacterId, Obstacle } from '../types/game';

export const CHARACTERS: Record<CharacterId, Character> = {
  rex: {
    id: 'rex',
    name: 'Rex Vanguard',
    title: 'Titan Defender',
    role: 'Assault',
    description: 'Heavy armored combatant equipped with dual plasma repeaters and kinetic shield matrix.',
    avatarUrl: '🛡️',
    color: '#06b6d4', // Cyan
    secondaryColor: '#3b82f6',
    priceGold: 0, // Default starter
    priceGems: 0,
    stats: {
      hp: 120,
      speed: 4.8,
      damage: 22,
      fireRate: 4.5,
      range: 480
    },
    weapon: {
      name: 'Dual Plasma Repeater',
      projectileSpeed: 13,
      projectileColor: '#22d3ee',
      burstCount: 1,
      spread: 0.04
    },
    specialAbility: {
      name: 'Kinetic Shield',
      description: 'Generates an immediate 40HP energy barrier absorbing damage for 4 seconds.',
      cooldownSec: 7
    },
    ultimateAbility: {
      name: 'Plasma Overdrive',
      description: 'Supercharges fire rate by 150% and fires explosive homing plasma bursts for 5 seconds.',
      chargeRequired: 100
    }
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Blade',
    title: 'Ghost Infiltrator',
    role: 'Assassin',
    description: 'Swift ninja operative armed with homing cyber shurikens and hyper-space teleportation dash.',
    avatarUrl: '🥷',
    color: '#a855f7', // Purple
    secondaryColor: '#c084fc',
    priceGold: 1200,
    priceGems: 60,
    stats: {
      hp: 90,
      speed: 6.2,
      damage: 28,
      fireRate: 3.2,
      range: 440
    },
    weapon: {
      name: 'Cyber Shurikens',
      projectileSpeed: 16,
      projectileColor: '#c084fc',
      burstCount: 2,
      spread: 0.09
    },
    specialAbility: {
      name: 'Blink Dash',
      description: 'Instant phase teleport forward, leaving a decoy that confuses enemy bots.',
      cooldownSec: 5
    },
    ultimateAbility: {
      name: 'Blade Storm',
      description: 'Hurls a 360-degree radial ring of lethal micro-blades dealing massive critical damage.',
      chargeRequired: 100
    }
  },
  volt: {
    id: 'volt',
    name: 'Volt Stryker',
    title: 'Railgun Marksman',
    role: 'Sniper',
    description: 'Long-range electric sniper that pierces through barriers with high-voltage particle rays.',
    avatarUrl: '⚡',
    color: '#eab308', // Amber / Yellow
    secondaryColor: '#facc15',
    priceGold: 1800,
    priceGems: 90,
    stats: {
      hp: 95,
      speed: 5.2,
      damage: 42,
      fireRate: 1.8,
      range: 650
    },
    weapon: {
      name: 'Ion Railgun',
      projectileSpeed: 21,
      projectileColor: '#fde047',
      burstCount: 1,
      spread: 0.01
    },
    specialAbility: {
      name: 'EMP Grenade',
      description: 'Launches an electric grenade that slows enemies by 50% and drains shields.',
      cooldownSec: 8
    },
    ultimateAbility: {
      name: 'Thunderstrike Beam',
      description: 'Fires an arena-wide lightning death ray that pierces obstacles and disintegrates targets.',
      chargeRequired: 100
    }
  },
  pyro: {
    id: 'pyro',
    name: 'Pyro Blaze',
    title: 'Incinerator Heavy',
    role: 'Tank',
    description: 'Devastating frontline pyromancer firing cluster napalm rockets that ignite the arena.',
    avatarUrl: '🔥',
    color: '#f97316', // Orange
    secondaryColor: '#ef4444',
    priceGold: 2200,
    priceGems: 120,
    stats: {
      hp: 140,
      speed: 4.4,
      damage: 34,
      fireRate: 2.4,
      range: 420
    },
    weapon: {
      name: 'Napalm Launcher',
      projectileSpeed: 11,
      projectileColor: '#ff6b35',
      burstCount: 1,
      spread: 0.06
    },
    specialAbility: {
      name: 'Flame Wall',
      description: 'Erects a temporary barrier of fire that damages incoming enemies and melts projectiles.',
      cooldownSec: 9
    },
    ultimateAbility: {
      name: 'Supernova Eruption',
      description: 'Triggers a massive incendiary explosion creating lingering burning zones across the arena.',
      chargeRequired: 100
    }
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Cyber Valkyrie',
    title: 'Nanite Specialist',
    role: 'Support',
    description: 'Tactical engineer using guided photon lasers and nanobots that heal teammates in 2v2 matches.',
    avatarUrl: '💎',
    color: '#10b981', // Emerald
    secondaryColor: '#34d399',
    priceGold: 2800,
    priceGems: 150,
    stats: {
      hp: 105,
      speed: 5.5,
      damage: 24,
      fireRate: 4.0,
      range: 500
    },
    weapon: {
      name: 'Photon Pulse Carbine',
      projectileSpeed: 14,
      projectileColor: '#34d399',
      burstCount: 1,
      spread: 0.03
    },
    specialAbility: {
      name: 'Nanite Repair Drone',
      description: 'Deploys a healing drone restoring 35 HP to yourself and nearest teammate over 3s.',
      cooldownSec: 8
    },
    ultimateAbility: {
      name: 'Chrono Rift Sanctuary',
      description: 'Drops a sanctuary dome granting team invulnerability and 50% movement speed for 4 seconds.',
      chargeRequired: 100
    }
  }
};

export const ARENA_MAPS = [
  {
    id: 'cyber_grid',
    name: 'Neo Cyber Grid',
    theme: 'Neon Blue & Dark Indigo',
    bgColor: '#080d1a',
    gridColor: 'rgba(6, 182, 212, 0.12)',
    obstacleColor: '#0e7490',
    obstacles: [
      { x: 300, y: 150, w: 60, h: 120, type: 'pillar' },
      { x: 540, y: 150, w: 60, h: 120, type: 'pillar' },
      { x: 300, y: 390, w: 60, h: 120, type: 'pillar' },
      { x: 540, y: 390, w: 60, h: 120, type: 'pillar' },
      { x: 420, y: 280, w: 60, h: 100, type: 'energy_barrier' }
    ] as Obstacle[]
  },
  {
    id: 'neo_tokyo',
    name: 'Neo Tokyo Rooftop',
    theme: 'Cyber Magenta & Violet',
    bgColor: '#11091f',
    gridColor: 'rgba(168, 85, 247, 0.12)',
    obstacleColor: '#7e22ce',
    obstacles: [
      { x: 220, y: 200, w: 120, h: 60, type: 'wall' },
      { x: 560, y: 200, w: 120, h: 60, type: 'wall' },
      { x: 220, y: 400, w: 120, h: 60, type: 'wall' },
      { x: 560, y: 400, w: 120, h: 60, type: 'wall' },
      { x: 420, y: 300, w: 60, h: 60, type: 'pillar' }
    ] as Obstacle[]
  },
  {
    id: 'orbital_dock',
    name: 'Orbital Hangar 9',
    theme: 'Solar Amber & Industrial Steel',
    bgColor: '#131109',
    gridColor: 'rgba(234, 179, 8, 0.1)',
    obstacleColor: '#a16207',
    obstacles: [
      { x: 200, y: 120, w: 500, h: 40, type: 'wall' },
      { x: 200, y: 500, w: 500, h: 40, type: 'wall' },
      { x: 420, y: 240, w: 60, h: 180, type: 'pillar' }
    ] as Obstacle[]
  },
  {
    id: 'magma_core',
    name: 'Infernal Core',
    theme: 'Volcanic Crimson & Obsidian',
    bgColor: '#190a07',
    gridColor: 'rgba(239, 68, 68, 0.14)',
    obstacleColor: '#991b1b',
    obstacles: [
      { x: 250, y: 250, w: 80, h: 80, type: 'pillar' },
      { x: 570, y: 250, w: 80, h: 80, type: 'pillar' },
      { x: 410, y: 140, w: 80, h: 80, type: 'pillar' },
      { x: 410, y: 440, w: 80, h: 80, type: 'pillar' }
    ] as Obstacle[]
  }
];

export const SHOP_SKINS = [
  { id: 'skin_rex_gold', characterId: 'rex', name: 'Golden Overlord', priceGold: 1500, priceGems: 50, tag: 'Epic' },
  { id: 'skin_shadow_neon', characterId: 'shadow', name: 'Cyber Neon Phantom', priceGold: 2000, priceGems: 75, tag: 'Legendary' },
  { id: 'skin_volt_void', characterId: 'volt', name: 'Void Rail Accelerator', priceGold: 2200, priceGems: 80, tag: 'Epic' },
  { id: 'skin_pyro_solar', characterId: 'pyro', name: 'Solar Flare Juggernaut', priceGold: 2500, priceGems: 95, tag: 'Legendary' },
  { id: 'skin_valk_angel', characterId: 'valkyrie', name: 'Archangel Seraphim', priceGold: 3000, priceGems: 120, tag: 'Mythic' }
];

export const SHOP_COIN_PACKS = [
  { id: 'pack_bronze', title: 'Recruit Vault', gold: 2000, gems: 50, priceUSD: '$0.99', priceINR: '₹79', bonus: '+10% Bonus' },
  { id: 'pack_silver', title: 'Warrior Cache', gold: 6000, gems: 180, priceUSD: '$2.99', priceINR: '₹249', popular: true, bonus: '+25% Extra' },
  { id: 'pack_gold', title: 'Gladiator Hoard', gold: 15000, gems: 500, priceUSD: '$6.99', priceINR: '₹599', bonus: '+40% Super Bonus' },
  { id: 'pack_apex', title: 'Apex Champion Chest', gold: 45000, gems: 1600, priceUSD: '$18.99', priceINR: '₹1,599', bonus: '+65% Best Value' }
];
