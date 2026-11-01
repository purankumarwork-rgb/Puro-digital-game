import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types/game';

// Scopes matching the requested and granted scopes
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const signOutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveSaveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Searches for existing Puro Game save files on Google Drive
 */
export async function listPuroCloudSaves(accessToken: string): Promise<DriveSaveFile[]> {
  try {
    const q = encodeURIComponent("name contains 'Puro_BattleArena_SaveData' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to list files from Google Drive');
    }
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing Drive saves:', err);
    throw err;
  }
}

/**
 * Uploads/Backs up the player profile to Google Drive
 */
export async function backupProfileToDrive(
  accessToken: string,
  profile: UserProfile
): Promise<DriveSaveFile> {
  const fileName = `Puro_BattleArena_SaveData_${profile.id.replace('#', '')}.json`;
  const fileContent = JSON.stringify(
    {
      app: 'Puro - Digital game (Battle Arena Pro)',
      version: '2.4.0',
      backupTimestamp: new Date().toISOString(),
      player: profile
    },
    null,
    2
  );

  const existingFiles = await listPuroCloudSaves(accessToken);
  const targetExisting = existingFiles.find(f => f.name === fileName);

  if (targetExisting) {
    // Update existing file
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${targetExisting.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: fileContent
    });
    if (!res.ok) throw new Error('Failed to update Google Drive save');
    return await res.json();
  } else {
    // Create new file with multipart metadata + media
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'Puro Battle Arena Pro Cloud Save'
    };

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to upload save to Google Drive');
    }
    return await res.json();
  }
}

/**
 * Restores player profile from a Google Drive save file
 */
export async function restoreProfileFromDrive(
  accessToken: string,
  fileId: string
): Promise<UserProfile> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to read save file from Google Drive');
  const data = await res.json();
  if (!data.player) throw new Error('Invalid Puro game save file format');
  return data.player;
}

/**
 * Deletes a save file from Google Drive (Requires explicit confirmation)
 */
export async function deleteDriveSave(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to delete file from Google Drive');
  }
}
