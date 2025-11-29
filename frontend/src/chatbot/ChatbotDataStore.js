// src/chatbot/ChatbotDataStore.js
import API from '../utils/api';

const ChatbotDataStore = {
    employees: [],
    managers: [],
    stacks: [],
    purchases: [],
    isDataLoaded: false,

    init: async function() {
        if (this.isDataLoaded) return;
        console.log("🤖 ChatbotDataStore initializing and fetching its own data...");
        try {
            const [empRes, mgrRes, stkRes, purRes] = await Promise.all([
                API.get('/employees').catch(() => ({ data: [] })),
                API.get('/managers').catch(() => ({ data: [] })),
                API.get('/stacks').catch(() => ({ data: [] })),
                API.get('/purchases').catch(() => ({ data: [] })),
            ]);
            this.employees = empRes.data || [];
            this.managers = mgrRes.data || [];
            this.stacks = stkRes.data || [];
            this.purchases = purRes.data || [];
            this.isDataLoaded = true;
            console.log("✅ ChatbotDataStore has been successfully loaded with live data.");
        } catch (error) {
            console.error("🔥 Failed to initialize ChatbotDataStore:", error);
            this.isDataLoaded = false;
        }
    },

    // This function is the key to fixing the security issue.
    reset: function() {
        console.log("🗑️ Clearing all data from ChatbotDataStore.");
        this.employees = [];
        this.managers = [];
        this.stacks = [];
        this.purchases = [];
        this.isDataLoaded = false;
    }
};

export default ChatbotDataStore;