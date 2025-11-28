// src/context/DataContext.jsx
import React, { createContext, useState, useCallback } from 'react';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [stacks, setStacks] = useState([]);
    const [purchases, setPurchases] = useState([]);

    // This function is now only for the main application, not the chatbot.
    const loadAllData = useCallback(async (api) => {
        try {
            const [empRes, mgrRes, stkRes, purRes] = await Promise.all([
                api.get('/employees').catch(() => ({ data: [] })),
                api.get('/managers').catch(() => ({ data: [] })),
                api.get('/stacks').catch(() => ({ data: [] })),
                api.get('/purchases').catch(() => ({ data: [] })),
            ]);
            setEmployees(empRes.data);
            setManagers(mgrRes.data);
            setStacks(stkRes.data);
            setPurchases(purRes.data);
        } catch (error) {
            console.error("Failed to load central app data:", error);
        }
    }, []);

    const value = { employees, managers, stacks, purchases, loadAllData };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};