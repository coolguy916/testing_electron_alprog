// lib/firebase.js
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, push, set, get } = require("firebase/database");
const firebaseConfig = require('../firebaseConfig');

class FirebaseDB {
    constructor() {
        const firebaseApp = initializeApp(firebaseConfig);
        this.db = getDatabase(firebaseApp);
    }

    async postData(tableName, data) {
        try {
            const dataRef = ref(this.db, tableName);
            const newDataRef = push(dataRef);
            await set(newDataRef, data);
            return { success: true, id: newDataRef.key };
        } catch (error) {
            console.error("Firebase postData error:", error);
            return { success: false, error: error.message };
        }
    }

    async getDataByFilters(tableName, filters = {}) {
        try {
            const dataRef = ref(this.db, tableName);
            const snapshot = await get(dataRef);
            if (snapshot.exists()) {
                const data = [];
                snapshot.forEach(childSnapshot => {
                    const item = childSnapshot.val();
                    let match = true;
                    for (const key in filters) {
                        if (item[key] !== filters[key]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        data.push({ id: childSnapshot.key, ...item });
                    }
                });
                return { success: true, data };
            } else {
                return { success: true, data: [] };
            }
        } catch (error) {
            console.error("Firebase getDataByFilters error:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = FirebaseDB;