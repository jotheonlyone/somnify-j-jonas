import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection, 
  getDocs, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { UserProfile, SleepLog, Factor } from "../types";

// User-provided Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEcCmsUxxA9HBK2r2rmVN0Zq91gzdvNWI",
  authDomain: "sleep-tracker-jjonas.firebaseapp.com",
  projectId: "sleep-tracker-jjonas",
  storageBucket: "sleep-tracker-jjonas.firebasestorage.app",
  messagingSenderId: "88412366724",
  appId: "1:88412366724:web:17658267090fc35d1f1fd1",
  measurementId: "G-Y8PJLKTJNM"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Check if username is available in Firestore
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) return false;
  
  try {
    const usernameDocRef = doc(db, "usernames", cleanUsername);
    const snap = await getDoc(usernameDocRef);
    return !snap.exists();
  } catch (err) {
    console.warn("Firestore username check encountered error, checking local registry:", err);
    const localUsernames = JSON.parse(localStorage.getItem("somnify_usernames") || "{}");
    return !localUsernames[cleanUsername];
  }
}

// Register user with Email, Password & Username
export async function registerUser(email: string, pass: string, username: string): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase();
  const available = await isUsernameAvailable(cleanUsername);
  if (!available) {
    throw new Error("Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.");
  }

  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCred.user.uid;

  await updateProfile(userCred.user, { displayName: cleanUsername });

  const profile: UserProfile = {
    uid,
    email: userCred.user.email,
    username: cleanUsername,
  };

  try {
    await setDoc(doc(db, "usernames", cleanUsername), {
      uid,
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, "users", uid), {
      username: cleanUsername,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore write encountered error:", err);
  }

  const localUsernames = JSON.parse(localStorage.getItem("somnify_usernames") || "{}");
  localUsernames[cleanUsername] = uid;
  localStorage.setItem("somnify_usernames", JSON.stringify(localUsernames));
  localStorage.setItem(`somnify_profile_${uid}`, JSON.stringify(profile));

  return profile;
}

// Log in user
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  const userCred = await signInWithEmailAndPassword(auth, email, pass);
  const uid = userCred.user.uid;
  
  let username = userCred.user.displayName || "";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists() && snap.data()?.username) {
      username = snap.data().username;
    }
  } catch (err) {
    console.warn("Firestore profile read fallback:", err);
  }

  if (!username) {
    const localProfile = localStorage.getItem(`somnify_profile_${uid}`);
    if (localProfile) {
      try {
        username = JSON.parse(localProfile).username;
      } catch (e) {
        username = email.split("@")[0];
      }
    } else {
      username = email.split("@")[0];
    }
  }

  const profile: UserProfile = {
    uid,
    email: userCred.user.email,
    username,
  };
  localStorage.setItem(`somnify_profile_${uid}`, JSON.stringify(profile));
  return profile;
}

// Update Username
export async function changeUsername(currentUsername: string, newUsername: string): Promise<string> {
  const cleanNew = newUsername.trim().toLowerCase();
  const cleanCurrent = currentUsername.trim().toLowerCase();
  
  if (cleanNew === cleanCurrent) return currentUsername;
  if (cleanNew.length < 3) {
    throw new Error("Der Benutzername muss mindestens 3 Zeichen lang sein.");
  }

  const available = await isUsernameAvailable(cleanNew);
  if (!available) {
    throw new Error("Dieser Benutzername ist bereits vergeben.");
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Kein angemeldeter Benutzer gefunden.");
  }

  // 1. Update Profile in Firebase Auth
  await updateProfile(currentUser, { displayName: cleanNew });

  // 2. Update Firestore Doc
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, {
      username: cleanNew,
      updatedAt: serverTimestamp(),
    });

    // Reserve new username
    await setDoc(doc(db, "usernames", cleanNew), {
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    // Remove old username reservation
    if (cleanCurrent) {
      await deleteDoc(doc(db, "usernames", cleanCurrent));
    }
  } catch (err) {
    console.warn("Firestore change username warning:", err);
  }

  // Update local storage
  const profileKey = `somnify_profile_${currentUser.uid}`;
  const localProf = localStorage.getItem(profileKey);
  if (localProf) {
    try {
      const parsed = JSON.parse(localProf);
      parsed.username = cleanNew;
      localStorage.setItem(profileKey, JSON.stringify(parsed));
    } catch {}
  }

  return cleanNew;
}

// Change Password with Re-Authentication
export async function changeUserPassword(currentPass: string, newPass: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Kein Benutzer angemeldet.");
  }
  if (newPass.length < 6) {
    throw new Error("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
  }

  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPass);
}

// Change Email with Re-Authentication
export async function changeUserEmail(currentPass: string, newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Kein Benutzer angemeldet.");
  }
  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail.includes("@")) {
    throw new Error("Bitte eine gültige E-Mail-Adresse eingeben.");
  }

  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);
  await verifyBeforeUpdateEmail(user, cleanEmail);
}

// Delete Entire Account (Auth & All Data)
export async function deleteEntireAccount(currentPass: string, username: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Kein Benutzer angemeldet.");
  }

  // Re-authenticate first to ensure secure permission
  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);

  const uid = user.uid;

  // 1. Delete all Firestore sleepLogs
  try {
    const logsCol = collection(db, "users", uid, "sleepLogs");
    const logsSnap = await getDocs(logsCol);
    for (const logDoc of logsSnap.docs) {
      await deleteDoc(logDoc.ref);
    }

    // 2. Delete config docs
    await deleteDoc(doc(db, "users", uid, "config", "factors"));

    // 3. Delete user document
    await deleteDoc(doc(db, "users", uid));

    // 4. Release username
    if (username) {
      await deleteDoc(doc(db, "usernames", username.toLowerCase()));
    }
  } catch (err) {
    console.error("Fehler beim Löschen der Firestore-Daten:", err);
    throw new Error("Datenbank-Einträge konnten nicht vollständig entfernt werden. Konto wurde zum Schutz nicht gelöscht.");
  }

  // 5. Clean up local caches
  localStorage.removeItem(`somnify_profile_${uid}`);
  localStorage.removeItem(`somnify_logs_${uid}`);
  localStorage.removeItem(`somnify_factors_${uid}`);
  localStorage.removeItem(`somnify_archived_factors_${uid}`);

  // 6. Delete Firebase Auth user
  await deleteUser(user);
}

// Sign out
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Save Sleep Log
export async function saveSleepLog(uid: string, log: SleepLog): Promise<void> {
  try {
    const logRef = doc(db, "users", uid, "sleepLogs", log.date);
    await setDoc(logRef, {
      ...log,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore save log fallback to local storage:", err);
  }

  const existing = getLocalSleepLogs(uid);
  const updated = [log, ...existing.filter(l => l.date !== log.date)].sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(`somnify_logs_${uid}`, JSON.stringify(updated));
}

// Fetch Sleep Logs
export async function fetchSleepLogs(uid: string): Promise<SleepLog[]> {
  try {
    const colRef = collection(db, "users", uid, "sleepLogs");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const logs: SleepLog[] = [];
      snap.forEach(d => {
        const data = d.data() as SleepLog;
        logs.push(data);
      });
      logs.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(`somnify_logs_${uid}`, JSON.stringify(logs));
      return logs;
    }
  } catch (err) {
    console.warn("Firestore fetch logs fallback to local storage:", err);
  }
  return getLocalSleepLogs(uid);
}

// Save Factors & Archived Factors
export async function saveUserFactors(
  uid: string,
  factors: Factor[],
  archivedFactors: Factor[] = []
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", uid, "config", "factors");
    await setDoc(userDocRef, {
      factors,
      archivedFactors,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Firestore factors save fallback:", err);
  }
  localStorage.setItem(`somnify_factors_${uid}`, JSON.stringify(factors));
  localStorage.setItem(`somnify_archived_factors_${uid}`, JSON.stringify(archivedFactors));
}

// Fetch Factors & Archived Factors
export async function fetchUserFactors(
  uid: string,
  defaultFactors: Factor[]
): Promise<{ factors: Factor[]; archivedFactors: Factor[] }> {
  try {
    const userDocRef = doc(db, "users", uid, "config", "factors");
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.factors) {
      const data = snap.data();
      const factors = (data.factors as Factor[]) || defaultFactors;
      const archivedFactors = (data.archivedFactors as Factor[]) || [];
      localStorage.setItem(`somnify_factors_${uid}`, JSON.stringify(factors));
      localStorage.setItem(`somnify_archived_factors_${uid}`, JSON.stringify(archivedFactors));
      return { factors, archivedFactors };
    }
  } catch (err) {
    console.warn("Firestore fetch factors fallback:", err);
  }

  const local = localStorage.getItem(`somnify_factors_${uid}`);
  const localArchived = localStorage.getItem(`somnify_archived_factors_${uid}`);
  let factors = defaultFactors;
  let archivedFactors: Factor[] = [];

  if (local) {
    try {
      factors = JSON.parse(local);
    } catch (e) {
      factors = defaultFactors;
    }
  }
  if (localArchived) {
    try {
      archivedFactors = JSON.parse(localArchived);
    } catch (e) {
      archivedFactors = [];
    }
  }

  return { factors, archivedFactors };
}

// Local storage helper
export function getLocalSleepLogs(uid: string): SleepLog[] {
  const raw = localStorage.getItem(`somnify_logs_${uid}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
