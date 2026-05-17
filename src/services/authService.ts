import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase.ts";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { geoService } from "./geoService.ts";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  phone?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  flag?: string;
  plan: "basic" | "premium" | "nexo";
  isAdmin: boolean;
  createdAt: any;
  lastLoginAt?: any;
    locationInfo?: any;
}

export const authService = {
  subscribe: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await authService.syncUser(result.user);
    return result.user;
  },

  signUp: async (email: string, pass: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await authService.syncUser(result.user, { displayName: name });
    return result.user;
  },

  signIn: async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  },

  logout: async () => {
    await signOut(auth);
  },

  syncUser: async (user: FirebaseUser, extra: Partial<UserProfile> = {}) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const geo = await geoService.detectLocation();

    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        displayName: extra.displayName || user.displayName || "Utilisateur",
        email: user.email || "",
        photoURL: user.photoURL || "",
        plan: "basic",
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        city: geo?.city || "Brazzaville",
        country: geo?.country_name || "Congo",
        countryCode: geo?.country_code || "CG",
        currency: geo?.currency || "XAF",
        flag: geo ? geoService.getFlagEmoji(geo.country_code) : "🇨🇬",
        locationInfo: geo
      };
      await setDoc(userRef, profile);
      // Increment global stats
      try {
        await setDoc(doc(db, "metadata", "stats"), { userCount: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Stats increment failed", e);
      }
    } else {
        // Prepare update data
        const updateData: any = {
            lastLoginAt: serverTimestamp(),
            locationInfo: geo || null
        };
        
        // If we explicitly passed a new photoURL or displayName in the user object or extra
        if (user.photoURL && user.photoURL !== snap.data().photoURL) {
            updateData.photoURL = user.photoURL;
        }
        if (extra.displayName) {
            updateData.displayName = extra.displayName;
        }
        if (extra.city) {
            updateData.city = extra.city;
        }
        if (extra.phone) {
            updateData.phone = extra.phone;
        }

        await updateDoc(userRef, updateData);
    }
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
};
