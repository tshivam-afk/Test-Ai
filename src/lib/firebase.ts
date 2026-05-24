import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Test, TestProgress, ExamHistoryItem } from "../types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const loginWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string, displayName: string) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCred.user, { displayName });
  return userCred;
};

export const logout = async () => {
  return signOut(auth);
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Test Connection on active boot
testConnection();

// Cloud write & delete operations for workbooks
export const saveWorkbookToCloud = async (userId: string, test: Test) => {
  const path = `users/${userId}/workbooks/${test.id}`;
  try {
    const dataWithOwner = { ...test, userId };
    await setDoc(doc(db, "users", userId, "workbooks", test.id), dataWithOwner);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteWorkbookFromCloud = async (userId: string, testId: string) => {
  const path = `users/${userId}/workbooks/${testId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "workbooks", testId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Cloud write & delete operations for progress logs
export const saveProgressToCloud = async (userId: string, progressRecord: TestProgress) => {
  const path = `users/${userId}/progress/${progressRecord.testId}`;
  try {
    const dataWithOwner = { ...progressRecord, userId };
    await setDoc(doc(db, "users", userId, "progress", progressRecord.testId), dataWithOwner);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteProgressFromCloud = async (userId: string, testId: string) => {
  const path = `users/${userId}/progress/${testId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "progress", testId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Cloud write & delete operations for history items
export const saveHistoryToCloud = async (userId: string, historyItem: ExamHistoryItem) => {
  const path = `users/${userId}/history/${historyItem.id}`;
  try {
    const dataWithOwner = { ...historyItem, userId };
    await setDoc(doc(db, "users", userId, "history", historyItem.id), dataWithOwner);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteHistoryFromCloud = async (userId: string, historyId: string) => {
  const path = `users/${userId}/history/${historyId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "history", historyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Fetch user workspace data
export async function fetchUserData(userId: string) {
  try {
    const workbooksRef = collection(db, "users", userId, "workbooks");
    const progressRef = collection(db, "users", userId, "progress");
    const historyRef = collection(db, "users", userId, "history");

    const [workbooksSnap, progressSnap, historySnap] = await Promise.all([
      getDocs(workbooksRef),
      getDocs(progressRef),
      getDocs(historyRef),
    ]);

    const workbooks: Test[] = [];
    workbooksSnap.forEach((d) => {
      const data = d.data() as Test & { userId?: string };
      delete data.userId; // clean internal field
      workbooks.push(data);
    });

    const progress: Record<string, TestProgress> = {};
    progressSnap.forEach((d) => {
      const data = d.data() as TestProgress & { userId?: string };
      delete data.userId;
      progress[d.id] = data;
    });

    const history: ExamHistoryItem[] = [];
    historySnap.forEach((d) => {
      const data = d.data() as ExamHistoryItem & { userId?: string };
      delete data.userId;
      history.push(data);
    });

    return { workbooks, progress, history };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

// Delete and erase all cloud database sync structures
export async function deleteAllCloudData(userId: string) {
  try {
    const workbooksRef = collection(db, "users", userId, "workbooks");
    const progressRef = collection(db, "users", userId, "progress");
    const historyRef = collection(db, "users", userId, "history");

    const [workbooksSnap, progressSnap, historySnap] = await Promise.all([
      getDocs(workbooksRef),
      getDocs(progressRef),
      getDocs(historyRef),
    ]);

    const deletePromises: Promise<void>[] = [];

    workbooksSnap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    progressSnap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    historySnap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });

    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}
