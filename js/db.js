/**
 * Database Layer for My Gold Melting Web
 * Exact replica of Room Database: MyRoomDatabase (MeltingDao, JewelleryCostDao)
 * Uses IndexedDB with localStorage fallback for 100% offline persistence.
 */

const DB_NAME = "MyGoldMelting_db";
const DB_VERSION = 1;
export const TBL_MELTING_DATA = "MeltingData";
export const TBL_JEWELLERY_COST = "JewelleryCost";

let dbInstance = null;

function openDB() {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn("IndexedDB not supported, falling back to localStorage");
            resolve(null);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(TBL_MELTING_DATA)) {
                db.createObjectStore(TBL_MELTING_DATA, { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(TBL_JEWELLERY_COST)) {
                db.createObjectStore(TBL_JEWELLERY_COST, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error("IndexedDB open error:", event.target.error);
            resolve(null);
        };
    });
}

// LocalStorage helpers for fallback
function getLocalList(table) {
    try {
        const raw = localStorage.getItem(`db_${table}`);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function setLocalList(table, list) {
    localStorage.setItem(`db_${table}`, JSON.stringify(list));
}

export const MeltingDao = {
    async getAll() {
        const db = await openDB();
        if (!db) {
            const list = getLocalList(TBL_MELTING_DATA);
            return list.sort((a, b) => b.id - a.id);
        }

        return new Promise((resolve) => {
            const tx = db.transaction([TBL_MELTING_DATA], "readonly");
            const store = tx.objectStore(TBL_MELTING_DATA);
            const request = store.getAll();

            request.onsuccess = () => {
                const list = request.result || [];
                list.sort((a, b) => (b.id || 0) - (a.id || 0));
                resolve(list);
            };

            request.onerror = () => {
                const list = getLocalList(TBL_MELTING_DATA);
                resolve(list.sort((a, b) => b.id - a.id));
            };
        });
    },

    async insert(item) {
        const db = await openDB();
        if (!db) {
            const list = getLocalList(TBL_MELTING_DATA);
            const maxId = list.reduce((m, cur) => Math.max(m, cur.id || 0), 0);
            item.id = maxId + 1;
            list.unshift(item);
            setLocalList(TBL_MELTING_DATA, list);
            return item;
        }

        return new Promise((resolve, reject) => {
            const tx = db.transaction([TBL_MELTING_DATA], "readwrite");
            const store = tx.objectStore(TBL_MELTING_DATA);
            const copy = { ...item };
            delete copy.id; // Allow autoIncrement
            const request = store.add(copy);

            request.onsuccess = () => {
                item.id = request.result;
                resolve(item);
            };

            request.onerror = (e) => {
                console.error("Insert error:", e);
                // Fallback to local
                const list = getLocalList(TBL_MELTING_DATA);
                const maxId = list.reduce((m, cur) => Math.max(m, cur.id || 0), 0);
                item.id = maxId + 1;
                list.unshift(item);
                setLocalList(TBL_MELTING_DATA, list);
                resolve(item);
            };
        });
    },

    async delete(id) {
        const numId = Number(id);
        const db = await openDB();
        if (!db) {
            let list = getLocalList(TBL_MELTING_DATA);
            list = list.filter(item => item.id !== numId);
            setLocalList(TBL_MELTING_DATA, list);
            return true;
        }

        return new Promise((resolve) => {
            const tx = db.transaction([TBL_MELTING_DATA], "readwrite");
            const store = tx.objectStore(TBL_MELTING_DATA);
            const request = store.delete(numId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                let list = getLocalList(TBL_MELTING_DATA);
                list = list.filter(item => item.id !== numId);
                setLocalList(TBL_MELTING_DATA, list);
                resolve(true);
            };
        });
    }
};

export const JewelleryCostDao = {
    async getAll() {
        const db = await openDB();
        if (!db) {
            const list = getLocalList(TBL_JEWELLERY_COST);
            return list.sort((a, b) => b.id - a.id);
        }

        return new Promise((resolve) => {
            const tx = db.transaction([TBL_JEWELLERY_COST], "readonly");
            const store = tx.objectStore(TBL_JEWELLERY_COST);
            const request = store.getAll();

            request.onsuccess = () => {
                const list = request.result || [];
                list.sort((a, b) => (b.id || 0) - (a.id || 0));
                resolve(list);
            };

            request.onerror = () => {
                const list = getLocalList(TBL_JEWELLERY_COST);
                resolve(list.sort((a, b) => b.id - a.id));
            };
        });
    },

    async insert(item) {
        const db = await openDB();
        if (!db) {
            const list = getLocalList(TBL_JEWELLERY_COST);
            const maxId = list.reduce((m, cur) => Math.max(m, cur.id || 0), 0);
            item.id = maxId + 1;
            list.unshift(item);
            setLocalList(TBL_JEWELLERY_COST, list);
            return item;
        }

        return new Promise((resolve) => {
            const tx = db.transaction([TBL_JEWELLERY_COST], "readwrite");
            const store = tx.objectStore(TBL_JEWELLERY_COST);
            const copy = { ...item };
            delete copy.id;
            const request = store.add(copy);

            request.onsuccess = () => {
                item.id = request.result;
                resolve(item);
            };

            request.onerror = () => {
                const list = getLocalList(TBL_JEWELLERY_COST);
                const maxId = list.reduce((m, cur) => Math.max(m, cur.id || 0), 0);
                item.id = maxId + 1;
                list.unshift(item);
                setLocalList(TBL_JEWELLERY_COST, list);
                resolve(item);
            };
        });
    },

    async delete(id) {
        const numId = Number(id);
        const db = await openDB();
        if (!db) {
            let list = getLocalList(TBL_JEWELLERY_COST);
            list = list.filter(item => item.id !== numId);
            setLocalList(TBL_JEWELLERY_COST, list);
            return true;
        }

        return new Promise((resolve) => {
            const tx = db.transaction([TBL_JEWELLERY_COST], "readwrite");
            const store = tx.objectStore(TBL_JEWELLERY_COST);
            const request = store.delete(numId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                let list = getLocalList(TBL_JEWELLERY_COST);
                list = list.filter(item => item.id !== numId);
                setLocalList(TBL_JEWELLERY_COST, list);
                resolve(true);
            };
        });
    }
};
