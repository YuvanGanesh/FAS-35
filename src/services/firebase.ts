// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  runTransaction,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDoj44Mkkb2znB-4lpu1v3WjMTilD25SIs",
  authDomain: "fcs-erp.firebaseapp.com",
  databaseURL: "https://fcs-erp-default-rtdb.firebaseio.com",
  projectId: "fcs-erp",
  storageBucket: "fcs-erp.firebasestorage.app",
  messagingSenderId: "346374937760",
  appId: "1:346374937760:web:799e9bfd6c5fc16f4cbdc5"
};

const app = initializeApp(firebaseConfig);
 const database = getDatabase(app);

 // ---------------------------------------------------------------------------
// SANITIZE — strips undefined values (Firebase rejects them)
// ---------------------------------------------------------------------------
const sanitize = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = sanitize(val);
      }
    }
    return clean;
  }
  return obj;
};

// ---------------------------------------------------------------------------
// CREATE RECORD
// ---------------------------------------------------------------------------
export const createRecord = async (path: string, data: any) => {
  const listRef = ref(database, path);
  const newRef = push(listRef);

  await set(newRef, sanitize({
    ...data,
    id: newRef.key,
    createdAt: Date.now(),
  }));

  return newRef.key;
};

// ---------------------------------------------------------------------------
// UPDATE SINGLE RECORD
// ---------------------------------------------------------------------------
export const updateRecord = async (path: string, id: string, data: any) => {
  const recordRef = ref(database, `${path}/${id}`);
  await update(recordRef, sanitize({
    ...data,
    updatedAt: Date.now(),
  }));
};

// ---------------------------------------------------------------------------
// BATCH UPDATE (Multiple fields across multiple records in one atomic write)
// ---------------------------------------------------------------------------
export const batchUpdate = async (path: string, updates: Array<{ id: string; updates: any }>) => {
  const updatesObj: Record<string, any> = {};

  updates.forEach(({ id, updates }) => {
    updatesObj[`${path}/${id}`] = sanitize({
      ...updates,
      updatedAt: Date.now(),
    });
  });

  await update(ref(database), updatesObj);
};
// ---------------------------------------------------------------------------
// DELETE RECORD
// ---------------------------------------------------------------------------
export const deleteRecord = async (path: string, id: string) => {
  const recordRef = ref(database, `${path}/${id}`);
  await remove(recordRef);
};

// ---------------------------------------------------------------------------
// GET RECORD BY ID
// ---------------------------------------------------------------------------
export const getRecordById = async (path: string, id: string) => {
  const recordRef = ref(database, `${path}/${id}`);
  const snapshot = await get(recordRef);

  return snapshot.exists() ? { ...snapshot.val(), id } : null;
};

// Legacy alias (for backward compatibility)
export const getRecord = getRecordById;

// ---------------------------------------------------------------------------
// GET ALL RECORDS
// ---------------------------------------------------------------------------
export const getAllRecords = async (path: string) => {
  const listRef = ref(database, path);
  const snapshot = await get(listRef);

  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.keys(data).map((key) => ({ ...data[key], id: key }));
};

// ---------------------------------------------------------------------------
// QUERY RECORDS BY CHILD
// ---------------------------------------------------------------------------
export const queryRecords = async (path: string, child: string) => {
  const listRef = ref(database, path);
  const q = query(listRef, orderByChild(child));
  const snapshot = await get(q);

  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.keys(data).map((key) => ({ ...data[key], id: key }));
};

// ---------------------------------------------------------------------------
// RUN TRANSACTION (Used for safe stock deduction)
// ---------------------------------------------------------------------------
export { runTransaction };

// ---------------------------------------------------------------------------
// EXPORTS FOR DIRECT USE (commonly needed in components)
// ---------------------------------------------------------------------------
export { ref, database };
