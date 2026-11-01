import React, { useState } from 'react';
import { UserProfile, CharacterId } from '../../types/game';
import { CHARACTERS, SHOP_SKINS, SHOP_COIN_PACKS } from '../../constants/characters';
import { UpiPaymentModal } from './UpiPaymentModal';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  ShieldAlert,
  Check,
  CreditCard,
  RotateCcw,
  X,
  ExternalLink,
  ShieldCheck,
  Lock,
  QrCode,
  Rotate3d
} from 'lucide-react';
import { SkinRotator } from '../SkinRotator';

interface ShopScreenProps {
  userProfile: UserProfile;
  onUnlockCharacter: (charId: CharacterId, costGold: number, costGems: number) => void;
  onUnlockSkin: (skinId: string, costGold: number, costGems: number) => void;
  onPurchaseCoinPack: (pack: typeof SHOP_COIN_PACKS[0]) => void;
  onClose: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  userProfile,
  onUnlockCharacter,
  onUnlockSkin,
  onPurchaseCoinPack,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'heroes' | 'skins' | 'coins'>('heroes');
  const [selectedPack, setSelectedPack] = useState<typeof SHOP_COIN_PACKS[0] | null>(null);
  const [selectedUpiPack, setSelectedUpiPack] = useState<typeof SHOP_COIN_PACKS[0] | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [inspectingSkin, setInspectingSkin] = useState<typeof SHOP_SKINS[0] | null>(null);

  const handleBuyHero = (charId: CharacterId) => {
    const char = CHARACTERS[charId];
    if (userProfile.gold >= char.priceGold && userProfile.gems >= char.priceGems) {
      sound.playVictory();
      confetti({ particleCount: 70, spread: 70 });
      onUnlockCharacter(charId, char.priceGold, char.priceGems);
    } else {
      sound.playDefeat();
      alert('Insufficient virtual coins! Play more matches or complete daily challenges to earn free gold.');
    }
  };

  const handleBuySkin = (skin: typeof SHOP_SKINS[0]) => {
    if (userProfile.gold >= skin.priceGold) {
      sound.playPowerUp();
      confetti({ particleCount: 60, spread: 60 });
      onUnlockSkin(skin.id, skin.priceGold, skin.priceGems);
    } else {
      sound.playDefeat();
      alert('Insufficient virtual coins for this skin!');
    }
  };

  const handleConfirmPurchase = () => {
    if (!selectedPack) return;
    sound.playVictory();
    confetti({ particleCount: 90, spread: 80 });
    onPurchaseCoinPack(selectedPack);
    setPurchaseSuccess(`Successfully added ${selectedPack.gold.toLocaleString()} Battle Gold & ${selectedPack.gems} Gems!`);
    setSelectedPack(null);
    setTimeout(() => setPurchaseSuccess(null), 4000);
  };

  const handleUpiSuccess = (gold: number, gems: number) => {
    if (selectedUpiPack) {
      onPurchaseCoinPack(selectedUpiPack);
      setPurchaseSuccess(`UPI Payment Verified! Added ${gold.toLocaleString()} Battle Gold & ${gems} Gems to your wallet.`);
      setSelectedUpiPack(null);
      setTimeout(() => setPurchaseSuccess(null), 4000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="text-purple-400" size={24} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              CYBER ARMORY & SHOP
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Unlock combat gladiators, legendary neon skins, and optional virtual currency packs via UPI QR or Google Play.
          </p>
        </div>

        {/* Currency balances in Shop */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-amber-500/30 flex items-center gap-2">
            <Coins className="text-amber-400" size={18} />
            <div>
              <div className="text-[10px] text-slate-400">Battle Gold</div>
              <div className="text-sm font-bold text-amber-400">{userProfile.gold.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-purple-500/30 flex items-center gap-2">
            <Sparkles className="text-purple-400" size={18} />
            <div>
              <div className="text-[10px] text-slate-400">Cyber Gems</div>
              <div className="text-sm font-bold text-purple-400">{userProfile.gems.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Google Play / Legal Disclaimer Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-300">
        <ShieldAlert size={20} className="flex-shrink-0 text-amber-400" />
        <div>
          <span className="font-bold uppercase tracking-wider">Policy Compliance Notice:</span> Puro does NOT support or facilitate real-money betting, cash wagering, or real cash withdrawals. All virtual currency and items are purely digital in-game unlocks.
        </div>
      </div>

      {purchaseSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-400 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check size={16} />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {/* Shop Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'heroes', label: 'Gladiator Heroes' },
          { id: 'skins', label: 'Cosmetic Skins' },
          { id: 'coins', label: 'Virtual Currency Packs (UPI / Play)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              sound.playClick();
              setActiveTab(t.id as any);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold font-display text-xs md:text-sm transition-all ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Gladiator Heroes Tab */}
      {activeTab === 'heroes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(CHARACTERS) as CharacterId[]).map(charId => {
            const char = CHARACTERS[charId];
            const isUnlocked = userProfile.unlockedCharacters.includes(charId);

            return (
              <div
                key={charId}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-slate-950/60 border-slate-800/80'
                    : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl shadow-md">
                      {char.avatarUrl}
                    </div>
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                        {char.role}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold font-display text-white">{char.name}</h3>
                  <div className="text-xs text-purple-400 font-semibold mb-2">{char.title}</div>
                  <p className="text-xs text-slate-400 mb-4">{char.description}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500">HP</div>
                      <div className="text-xs font-bold text-emerald-400">{char.stats.hp}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">DMG</div>
                      <div className="text-xs font-bold text-rose-400">{char.stats.damage}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">SPD</div>
                      <div className="text-xs font-bold text-cyan-400">{char.stats.speed}</div>
                    </div>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold"
                    >
                      In Armory
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyHero(charId)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 font-bold text-xs text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Coins size={14} className="text-amber-400" />
                      <span>Unlock ({char.priceGold} Gold)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Cosmetic Skins Tab */}
      {activeTab === 'skins' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SHOP_SKINS.map(skin => {
            const isOwned = userProfile.unlockedSkins.includes(skin.id);

            return (
              <div
                key={skin.id}
                className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {skin.tag}
                    </span>
                    <span className="text-xs text-slate-400">Hero: {skin.characterId}</span>
                  </div>
                  <h3 className="text-base font-bold font-display text-white mb-1">{skin.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Exclusive cybernetic visual overlay with glowing weapon trail effects.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setInspectingSkin(skin);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1 border border-cyan-500/30 transition-all cursor-pointer"
                    title="Rotate skin 360°"
                  >
                    <Rotate3d size={14} />
                    <span>360°</span>
                  </button>
                  {isOwned ? (
                    <button
                      disabled
                      className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Owned
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuySkin(skin)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Coins size={14} />
                      <span>{skin.priceGold} Gold</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Virtual Currency Packs (UPI QR Scanner & Google Play Options) */}
      {activeTab === 'coins' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {SHOP_COIN_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                  pack.popular
                    ? 'bg-gradient-to-b from-indigo-950/80 to-slate-950 border-indigo-400 shadow-xl'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 right-4 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-3">
                    <Coins size={22} />
                  </div>
                  <h3 className="text-base font-bold font-display text-white">{pack.title}</h3>
                  <div className="text-xs text-emerald-400 font-semibold mb-2">{pack.bonus}</div>

                  <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Battle Gold:</span>
                      <span className="font-bold text-amber-400">+{pack.gold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cyber Gems:</span>
                      <span className="font-bold text-purple-400">+{pack.gems}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Primary UPI QR Option */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedUpiPack(pack);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode size={14} />
                    <span>Pay with UPI QR ({pack.priceINR})</span>
                  </button>

                  {/* Google Play Option */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedPack(pack);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CreditCard size={13} />
                    <span>Google Play ({pack.priceUSD})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
              <span>Payments secured via UPI (slice - Puran Kumar Pandit, puro@slc) and Google Play In-App Billing.</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                alert('Purchases verified: All unlocked heroes and skins are active on your player account.');
              }}
              className="text-cyan-400 hover:underline font-semibold flex-shrink-0"
            >
              Restore Purchases
            </button>
          </div>
        </div>
      )}

      {/* UPI QR Payment Modal */}
      {selectedUpiPack && (
        <UpiPaymentModal
          isOpen={!!selectedUpiPack}
          onClose={() => setSelectedUpiPack(null)}
          pack={selectedUpiPack}
          onPaymentSuccess={handleUpiSuccess}
        />
      )}

      {/* Google Play Simulated Checkout Confirmation Dialog */}
      {selectedPack && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-cyan-400 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CreditCard size={18} className="text-cyan-400" />
                <span>Google Play Checkout</span>
              </div>
              <button
                onClick={() => setSelectedPack(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
              <div className="text-sm font-bold text-white mb-1">{selectedPack.title}</div>
              <div className="text-xs text-slate-400 mb-3">Itemized Digital Game Content Unlock</div>

              <div className="space-y-1 text-xs border-t border-slate-800 pt-2">
                <div className="flex justify-between text-slate-300">
                  <span>Price:</span>
                  <span className="font-bold">{selectedPack.priceUSD} / {selectedPack.priceINR}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Applicable Taxes:</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span>{selectedPack.priceUSD}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-5 text-center">
              Tap confirm to simulate secure Google Play in-app purchase. Coins will be credited to your account immediately.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPack(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-black shadow-lg"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360° Interactive Skin Rotator Inspection Modal */}
      {inspectingSkin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setInspectingSkin(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Rotate3d className="text-cyan-400" size={20} />
              <h3 className="text-lg font-bold font-display text-white">
                360° SKIN INSPECTION
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Swipe or drag horizontally to inspect the skin from any angle!
            </p>

            <div className="flex justify-center mb-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <SkinRotator
                character={CHARACTERS[inspectingSkin.characterId as CharacterId] || CHARACTERS.rex}
                skinId={inspectingSkin.id}
                skinName={inspectingSkin.name}
                size={240}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setInspectingSkin(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Close Preview
              </button>
              {!userProfile.unlockedSkins.includes(inspectingSkin.id) && (
                <button
                  onClick={() => {
                    const skin = inspectingSkin;
                    setInspectingSkin(null);
                    handleBuySkin(skin);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-lg"
                >
                  Buy ({inspectingSkin.priceGold} Gold)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
