import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../lib/firebase';
import type { PlayerState } from '../types/game';

const initialState: PlayerState = {
  maxUnlockedLevel: 1,
  shards: 500,
  unlockedSkins: ["classic"],
  equippedSkin: "classic",
  unlockedTrails: ["basic"],
  equippedTrail: "basic",
};

export const usePlayerState = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(initialState);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const unsubscribeSnap = onSnapshot(
          doc(db!, "artifacts", appId, "users", user.uid, "playerState"),
          (docSnap) => {
            if (docSnap.exists()) {
              setPlayerState(docSnap.data() as PlayerState);
            } else {
              // Initialize new user
              setDoc(doc(db!, "artifacts", appId, "users", user.uid, "playerState"), initialState);
            }
            setLoading(false);
          },
          (error) => {
            console.error(error);
            setLoading(false);
          }
        );
        return () => unsubscribeSnap();
      } else {
        if (auth) signInAnonymously(auth);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updatePlayerState = async (updates: Partial<PlayerState>) => {
    setPlayerState(prev => {
      const newState = { ...prev, ...updates };
      if (userId && db) {
        setDoc(doc(db, "artifacts", appId, "users", userId, "playerState"), newState, { merge: true });
      }
      return newState;
    });
  };

  return { playerState, updatePlayerState, loading };
};
