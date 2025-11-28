// src/hooks/useChatbotData.js

import { useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import API from '../utils/api';

/**
 * A custom hook to load all necessary data for the chatbot.
 * This should be called from a top-level component that is
 * guaranteed to be inside the DataProvider, like Admin.jsx or Manager.jsx.
 */
export const useChatbotData = () => {
    const context = useContext(DataContext);

    useEffect(() => {
        // We only proceed if the context and the loadAllData function are available.
        if (context && context.loadAllData) {
            const role = localStorage.getItem('role');
            if (role && role !== 'guest') {
                context.loadAllData(API);
            }
        }
    }, [context]); // This effect will re-run if the context becomes available after the initial render.
};