// src/chatbot/BotChatMessage.jsx

import React from 'react';

const BotChatMessage = (props) => {
  // ✅ THE FIX IS HERE: The message is directly on props, not inside payload.
  const message = props.message;

  return (
    <div className="react-chatbot-kit-chat-bot-message">
      <div
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </div>
  );
};

export default BotChatMessage;