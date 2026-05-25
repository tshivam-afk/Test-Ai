import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive fuller scope for backup and restore of custom files
provider.addScope("https://www.googleapis.com/auth/drive");

// In-memory cache for token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Drive OAuth accessToken from Firebase credential.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Firebase popup sign-in failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// --- Google Drive REST wrappers ---

/**
 * Searches for 'neet_prep_workspace_backup.json' in Google Drive
 */
export async function findBackupFile(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent("name = 'neet_prep_workspace_backup.json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API search failed: ${errText}`);
  }
  
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Downloads backup file by Google Drive file ID
 */
export async function downloadBackupContent(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download backup content from Google Drive: ${errText}`);
  }
  
  return await response.json();
}

/**
 * Uploads (create or rewrite) backup content to Google Drive
 */
export async function uploadBackupContent(
  accessToken: string, 
  contentObj: any, 
  existingFileId?: string | null
): Promise<string> {
  const filename = "neet_prep_workspace_backup.json";
  const jsonString = JSON.stringify(contentObj, null, 2);
  
  if (existingFileId) {
    // Perform update on file content (media)
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const response = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: jsonString,
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update backup file content: ${errText}`);
    }
    
    return existingFileId;
  } else {
    // 1. Create file metadata
    const metaUrl = "https://www.googleapis.com/drive/v3/files";
    const metaResponse = await fetch(metaUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: filename,
        mimeType: "application/json",
      }),
    });
    
    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      throw new Error(`Failed to create backup metadata: ${errText}`);
    }
    
    const newFile = await metaResponse.json();
    const newId = newFile.id;
    
    // 2. Upload file content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newId}?uploadType=media`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: jsonString,
    });
    
    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Failed to upload newly created backup file content: ${errText}`);
    }
    
    return newId;
  }
}
