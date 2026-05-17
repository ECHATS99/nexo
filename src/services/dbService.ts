import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  setDoc
} from "firebase/firestore";
import { db, auth } from "../lib/firebase.ts";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Shops
  createShop: async (data: any, profile: any) => {
    const path = "shops";
    try {
      const slug = data.name.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7);
      const res = await addDoc(collection(db, path), {
        ...data,
        slug,
        ownerId: auth.currentUser?.uid,
        isVerified: false,
        followerCount: 0,
        likeCount: 0,
        countryCode: profile?.countryCode || "CG",
        city: profile?.city || data.city,
        flag: profile?.flag || "🇨🇬",
        createdAt: serverTimestamp(),
      });
      
      // Increment global stats
      try {
        await setDoc(doc(db, "metadata", "stats"), { shopCount: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Stats increment failed", e);
      }

      return res.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  getShopBySlug: async (slug: string) => {
    const path = "shops";
    try {
      const q = query(collection(db, path), where("slug", "==", slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  getShopByOwner: async (ownerId: string) => {
    const path = "shops";
    try {
      const q = query(collection(db, path), where("ownerId", "==", ownerId), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  updateShop: async (shopId: string, data: any) => {
    const path = `shops/${shopId}`;
    try {
      await updateDoc(doc(db, "shops", shopId), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  // Products
  createProduct: async (data: any, profile: any) => {
    const path = "products";
    try {
      // Filter out undefined values as Firestore doesn't support them
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      const productData = {
        ...cleanData,
        ownerId: auth.currentUser?.uid,
        countryCode: profile?.countryCode || "CG",
        flag: profile?.flag || "🇨🇬",
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt: serverTimestamp(),
      };
      const res = await addDoc(collection(db, path), productData);
      
      // TRIGGER ALERTS (Simplified Client-Side for Demo)
      dbService.checkAlerts(res.id, productData);
      
      return res.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  checkAlerts: async (productId: string, productData: any) => {
    try {
      // Find all users who have alerts
      const usersSnap = await getDocs(collection(db, "users"));
      
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const alertsSnap = await getDocs(query(collection(db, "users", userId, "alerts"), where("active", "==", true)));
        
        for (const alertDoc of alertsSnap.docs) {
          const alert = alertDoc.data();
          let match = true;

          // Keyword check
          if (alert.keyword && !productData.title.toLowerCase().includes(alert.keyword.toLowerCase()) && !productData.description.toLowerCase().includes(alert.keyword.toLowerCase())) {
            match = false;
          }

          // Price check
          if (alert.maxPrice && productData.price > alert.maxPrice) {
            match = false;
          }

          // Category check
          if (alert.category && alert.category !== "all" && productData.category !== alert.category) {
            match = false;
          }

          if (match) {
            await dbService.sendNotification(userId, {
              title: "Alerte Produit ! 🔔",
              message: `Un nouveau produit correspond à votre recherche "${alert.keyword || "Alerte"}": ${productData.title}`,
              type: "alert",
              productId: productId,
              link: `/product/${productId}`
            });
            
            // Update last triggered
            await updateDoc(alertDoc.ref, { lastTriggered: serverTimestamp() });
          }
        }
      }
    } catch (e) {
      console.error("Alert check failed:", e);
    }
  },

  sendNotification: async (userId: string, notif: any) => {
    const path = `users/${userId}/notifications`;
    try {
      await addDoc(collection(db, "users", userId, "notifications"), {
        ...notif,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  listenNotifications: (userId: string, callback: (notifs: any[]) => void) => {
    const path = `users/${userId}/notifications`;
    const q = query(collection(db, "users", userId, "notifications"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  listenProducts: (filters: any, callback: (prods: any[]) => void) => {
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50));
    if (filters.category) q = query(q, where("category", "==", filters.category));
    if (filters.city) q = query(q, where("city", "==", filters.city));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, "products"));
  },

  listenShops: (callback: (shops: any[]) => void) => {
    const q = query(collection(db, "shops"), limit(20));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, "shops"));
  },

  getProducts: async (filters: any = {}) => {
    const path = "products";
    try {
      let q = query(collection(db, path), orderBy("createdAt", "desc"));
      if (filters.category) q = query(q, where("category", "==", filters.category));
      if (filters.city) q = query(q, where("city", "==", filters.city));
      if (filters.shopId) q = query(q, where("shopId", "==", filters.shopId));
      
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  // Messages & Conversations
  markNotificationAsRead: async (userId: string, notifId: string) => {
    const path = `users/${userId}/notifications/${notifId}`;
    try {
      await updateDoc(doc(db, "users", userId, "notifications", notifId), { isRead: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  getOrCreateConversation: async (participants: string[]) => {
    const path = "conversations";
    try {
      // Find existing
      const q = query(collection(db, path), where("participantIds", "array-contains", auth.currentUser?.uid));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const ids = d.data().participantIds;
        return participants.every(p => ids.includes(p)) && ids.length === participants.length;
      });

      if (existing) return existing.id;

      // Create new
      const res = await addDoc(collection(db, path), {
        participantIds: participants,
        createdAt: serverTimestamp(),
        lastMessage: null,
      });
      return res.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  sendMessage: async (conversationId: string, content: string, imageURL?: string) => {
    const path = `conversations/${conversationId}/messages`;
    try {
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        conversationId,
        senderId: auth.currentUser?.uid,
        content,
        imageURL: imageURL || null,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: {
          content,
          senderId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        }
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  listenMessages: (conversationId: string, callback: (msgs: any[]) => void) => {
    const path = `conversations/${conversationId}/messages`;
    const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  // Interactions
  toggleLike: async (entityId: string, type: "shop" | "product") => {
    const path = "likes";
    const likeId = `${auth.currentUser?.uid}_${entityId}`;
    try {
      const likeRef = doc(db, path, likeId);
      const snap = await getDoc(likeRef);

      if (snap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, type === "shop" ? "shops" : "products", entityId), {
          likeCount: increment(-1)
        });
        return false;
      } else {
        await setDoc(likeRef, {
          userId: auth.currentUser?.uid,
          entityId,
          type,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, type === "shop" ? "shops" : "products", entityId), {
          likeCount: increment(1)
        });
        return true;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // Go AI History & Alerts
  saveGoMessage: async (userId: string, role: "user" | "model", text: string, context: string = "general") => {
    const path = `users/${userId}/go_history`;
    try {
      await addDoc(collection(db, "users", userId, "go_history"), {
        role,
        text,
        context,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  getGoHistory: async (userId: string) => {
    const path = `users/${userId}/go_history`;
    try {
      const q = query(collection(db, "users", userId, "go_history"), orderBy("timestamp", "asc"), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ role: d.data().role, parts: [{ text: d.data().text }] }));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  listenGoHistory: (userId: string, callback: (msgs: any[]) => void) => {
    const path = `users/${userId}/go_history`;
    const q = query(collection(db, "users", userId, "go_history"), orderBy("timestamp", "asc"), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  },

  createAlert: async (userId: string, alert: any) => {
    const path = `users/${userId}/alerts`;
    try {
      await addDoc(collection(db, "users", userId, "alerts"), {
        ...alert,
        active: true,
        createdAt: serverTimestamp(),
        lastTriggered: null
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  getAlerts: async (userId: string) => {
    const path = `users/${userId}/alerts`;
    try {
      const q = query(collection(db, "users", userId, "alerts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  deleteAlert: async (userId: string, alertId: string) => {
    const path = `users/${userId}/alerts/${alertId}`;
    try {
      await deleteDoc(doc(db, "users", userId, "alerts", alertId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  toggleAlert: async (userId: string, alertId: string, active: boolean) => {
    const path = `users/${userId}/alerts/${alertId}`;
    try {
      await updateDoc(doc(db, "users", userId, "alerts", alertId), { active });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  // Wishlist
  toggleWishlist: async (userId: string, productId: string) => {
    const path = `users/${userId}/wishlist/${productId}`;
    try {
      const ref = doc(db, "users", userId, "wishlist", productId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        return false;
      } else {
        await setDoc(ref, { 
          productId, 
          addedAt: serverTimestamp() 
        });
        return true;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  getWishlist: async (userId: string) => {
    const path = `users/${userId}/wishlist`;
    try {
      const snap = await getDocs(collection(db, "users", userId, "wishlist"));
      return snap.docs.map(d => d.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  markAsSold: async (productId: string) => {
    const path = `products/${productId}`;
    try {
      await updateDoc(doc(db, "products", productId), { status: "sold" });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  createStatus: async (data: any) => {
    const path = "statuses";
    try {
      await addDoc(collection(db, path), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  listenGlobalStats: (callback: (stats: any) => void) => {
    return onSnapshot(doc(db, "metadata", "stats"), (snap) => {
       if (snap.exists()) {
         callback(snap.data());
       } else {
         // Fallback or Initial
         callback({ userCount: 0, shopCount: 0 });
       }
    });
  },

  // Follow & Ratings
  toggleFollow: async (shopId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const followId = `${userId}_${shopId}`;
    const followRef = doc(db, "follows", followId);
    try {
      const snap = await getDoc(followRef);
      if (snap.exists()) {
        await deleteDoc(followRef);
        await updateDoc(doc(db, "shops", shopId), { followerCount: increment(-1) });
        return false;
      } else {
        await setDoc(followRef, { userId, shopId, createdAt: serverTimestamp() });
        await updateDoc(doc(db, "shops", shopId), { followerCount: increment(1) });
        return true;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "follows");
    }
  },

  isFollowing: async (shopId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;
    const followId = `${userId}_${shopId}`;
    const snap = await getDoc(doc(db, "follows", followId));
    return snap.exists();
  },

  getFollowedShopIds: async (userId: string) => {
    const path = "follows";
    try {
      const q = query(collection(db, path), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data().shopId);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return [];
    }
  },

  getCategoryTrends: async () => {
    const path = "products";
    try {
      const q = query(collection(db, path), limit(100));
      const snap = await getDocs(q);
      const counts: Record<string, number> = {};
      snap.docs.forEach(d => {
        const cat = d.data().category;
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    } catch (e) {
      return [];
    }
  },

  rateShop: async (shopId: string, rating: number) => {
    const path = `shops/${shopId}`;
    try {
      const shopRef = doc(db, "shops", shopId);
      const shopSnap = await getDoc(shopRef);
      if (!shopSnap.exists()) return;
      const shop = shopSnap.data();
      const oldRating = shop.rating || 0;
      const oldCount = shop.reviewCount || 0;
      const newCount = oldCount + 1;
      const newRating = ((oldRating * oldCount) + rating) / newCount;
      await updateDoc(shopRef, { rating: newRating, reviewCount: newCount });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  listenStatuses: (callback: (statuses: any[]) => void) => {
    // Listen to all statuses for now, or filter by follow if desired later
    const q = query(collection(db, "statuses"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, "statuses"));
  },

  addComment: async (productId: string, text: string, profile: any) => {
    const path = `products/${productId}/comments`;
    try {
      await addDoc(collection(db, "products", productId, "comments"), {
        userId: auth.currentUser?.uid,
        userName: profile?.fullName || "Utilisateur",
        userAvatar: profile?.avatarURL || "",
        text,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "products", productId), {
        commentCount: increment(1)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  listenComments: (productId: string, callback: (comments: any[]) => void) => {
    const path = `products/${productId}/comments`;
    const q = query(collection(db, "products", productId, "comments"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (e) => handleFirestoreError(e, OperationType.GET, path));
  }
};
