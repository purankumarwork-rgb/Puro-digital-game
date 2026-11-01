import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/game';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  listPuroCloudSaves,
  backupProfileToDrive,
  restoreProfileFromDrive,
  deleteDriveSave,
  DriveSaveFile
} from '../../services/googleDrive';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Cloud,
  UploadCloud,
  DownloadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  LogOut,
  Calendar,
  Coins,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { User } from 'firebase/auth';

interface DriveSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onRestoreProfile: (restored: UserProfile) => void;
}

export const DriveSaveModal: React.FC<DriveSaveModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRestoreProfile,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cloudSaves, setCloudSaves] = useState<DriveSaveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Confirmation dialog state for destructive operations (Mandatory for Google Drive)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        loadSaves(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setCloudSaves([]);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  const loadSaves = async (token: string) => {
    setIsLoading(true);
    try {
      const files = await listPuroCloudSaves(token);
      setCloudSaves(files);
    } catch (e: any) {
      setStatusMessage('Error loading cloud saves: ' + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        sound.playVictory();
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await loadSaves(res.accessToken);
        setStatusMessage('Connected to Google Drive successfully!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e: any) {
      sound.playDefeat();
      setStatusMessage('Google Drive connection failed: ' + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setCurrentUser(null);
    setAccessToken(null);
    setCloudSaves([]);
  };

  // Upload/Backup
  const handleBackup = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      sound.playPowerUp();
      const saved = await backupProfileToDrive(accessToken, userProfile);
      confetti({ particleCount: 60, spread: 60 });
      setStatusMessage('Game save successfully backed up to your Google Drive!');
      await loadSaves(accessToken);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      sound.playDefeat();
      setStatusMessage('Backup failed: ' + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Restore save with mandatory confirmation dialog
  const promptRestore = (file: DriveSaveFile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Save from Google Drive?',
      description: `This will overwrite your local device state with the cloud backup "${file.name}" saved on ${new Date(file.modifiedTime).toLocaleString()}.`,
      confirmText: 'Confirm & Restore',
      onConfirm: async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
          sound.playVictory();
          const restored = await restoreProfileFromDrive(accessToken, file.id);
          onRestoreProfile(restored);
          confetti({ particleCount: 80, spread: 80 });
          setStatusMessage('Save successfully restored from Google Drive!');
          setConfirmDialog(null);
          setTimeout(() => {
            setStatusMessage(null);
            onClose();
          }, 2000);
        } catch (e: any) {
          sound.playDefeat();
          setStatusMessage('Restore failed: ' + (e.message || ''));
          setConfirmDialog(null);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Delete save with mandatory confirmation dialog
  const promptDelete = (file: DriveSaveFile) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Cloud Save from Google Drive?',
      description: `Are you sure you want to delete "${file.name}" from your Google Drive? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
          await deleteDriveSave(accessToken, file.id);
          sound.playClick();
          setStatusMessage('Cloud save deleted from Google Drive.');
          await loadSaves(accessToken);
          setConfirmDialog(null);
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (e: any) {
          setStatusMessage('Delete failed: ' + (e.message || ''));
          setConfirmDialog(null);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">GOOGLE DRIVE CLOUD SAVE</h2>
                <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-800">
                  OFFICIAL INTEGRATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Backup your profile, characters, coins, and challenges across devices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mt-3 p-3 rounded-xl bg-blue-950/80 border border-blue-400 text-xs font-semibold text-blue-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
          {/* User Sign-In Banner */}
          {!currentUser ? (
            <div className="p-6 bg-slate-950/90 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-3xl">
                ☁️
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Connect Google Drive with Permission
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Authorize Puro to store encrypted game progress and daily challenges in your personal Google Drive storage.
                </p>
              </div>

              {/* Official Google Sign-In Styled Button */}
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full max-w-xs mx-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Sign in with Google Drive'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Account Card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {currentUser.displayName || 'Google Drive User'}
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                        LINKED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <UploadCloud size={14} />
                    <span>Backup Now</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Disconnect Google Drive"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>

              {/* Cloud Saves List */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck size={14} className="text-blue-400" />
                    Saves in your Google Drive ({cloudSaves.length})
                  </h3>
                  <button
                    onClick={() => accessToken && loadSaves(accessToken)}
                    className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                    title="Refresh List"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {cloudSaves.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No cloud saves found on Google Drive. Tap "Backup Now" to create your first cloud snapshot.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cloudSaves.map(file => (
                      <div
                        key={file.id}
                        className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">{file.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Saved: {new Date(file.modifiedTime).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => promptRestore(file)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                          >
                            <DownloadCloud size={13} />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => promptDelete(file)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                            title="Delete Save from Drive"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Confirmation Modal for Destructive Operations */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-amber-500 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl">
              <div className="text-3xl mb-2">⚠️</div>
              <h4 className="text-base font-bold text-white mb-2">{confirmDialog.title}</h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">{confirmDialog.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg"
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Policy */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted cloud save with Google Workspace permission</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
