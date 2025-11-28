// src/chatbot/MessageParser.jsx

class MessageParser {
    constructor(actionProvider) {
        this.actionProvider = actionProvider;
    }

    parse(message) {
        const lowerCaseMessage = message.toLowerCase().trim();

        if (lowerCaseMessage === "") return;

        // Pass the entire user query to the new intelligent handler in ActionProvider
        this.actionProvider.handleUserInput(lowerCaseMessage);
    }
}

export default MessageParser;