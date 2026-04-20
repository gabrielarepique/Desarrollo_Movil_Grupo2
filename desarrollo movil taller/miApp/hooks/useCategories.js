import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, mapFirebaseError } from '../firebase';

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const nextCategories = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));

        setCategories(nextCategories);
        setError('');
        setLoading(false);
      },
      (snapshotError) => {
        setError(mapFirebaseError(snapshotError, 'No pudimos cargar las categorías.'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const createCategory = useCallback(
    async (name) => {
      const trimmedName = name?.trim();
      if (!trimmedName || !userId) {
        return null;
      }

      const existing = categories.find(
        (category) => category.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      try {
        const docRef = await addDoc(collection(db, 'categories'), {
          userId,
          name: trimmedName,
          createdAt: serverTimestamp(),
        });

        return { id: docRef.id, name: trimmedName };
      } catch (creationError) {
        throw new Error(mapFirebaseError(creationError, 'No pudimos guardar la categoría.'));
      }
    },
    [categories, userId]
  );

  return {
    categories,
    loading,
    error,
    createCategory,
  };
}
