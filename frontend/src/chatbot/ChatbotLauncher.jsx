// src/chatbot/ChatbotLauncher.jsx
// THIS IS THE UPDATED CODE WITH SPEECH RECOGNITION REMOVED

import React, { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';

import config from './config';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';
import './Chatbot.css';

const ChatbotLauncher = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Check for user role to determine if the chatbot should be shown
    const role = localStorage.getItem('role');

    const toggleChatbot = () => {
        setIsOpen((prev) => !prev);
    };

    // If the user is not logged in, this component renders nothing.
    if (!role || role === 'guest') {
        return null;
    }

    // This part of the component will only be rendered if a user is logged in.
    return (
        <div>
            {isOpen && (
                <div className="chatbot-container">
                    <Chatbot
                        config={config}
                        messageParser={MessageParser}
                        actionProvider={ActionProvider}
                    />
                </div>
            )}
            <button className="chatbot-launcher-button" onClick={toggleChatbot} title="Chatbot">
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
};

export default ChatbotLauncher;