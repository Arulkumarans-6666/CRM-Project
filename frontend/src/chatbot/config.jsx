// src/chatbot/config.jsx
import { createChatBotMessage } from 'react-chatbot-kit';
import { 
    GeneralOptions, 
    EmployeeOptions,
    ManagerOptions,
    StackOptions,
    PurchaseOptions,
    DisambiguationOptions
} from './widgets';

const botName = 'Cemento';

const config = {
    botName: botName,
    initialMessages: [
        createChatBotMessage(`Hello! Naan than ${botName}. Ungaluku epadi help panna?`, {
            widget: 'generalOptions',
        }),
    ],
    customStyles: {
        botMessageBox: { backgroundColor: '#343a40' },
        chatButton: { backgroundColor: '#343a40' },
    },
    widgets: [
        {
            widgetName: 'generalOptions',
            widgetFunc: (props) => <GeneralOptions {...props} />,
        },
        {
            widgetName: 'employeeOptions',
            widgetFunc: (props) => <EmployeeOptions {...props} />,
        },
        {
            widgetName: 'managerOptions',
            widgetFunc: (props) => <ManagerOptions {...props} />,
        },
        {
            widgetName: 'stackOptions',
            widgetFunc: (props) => <StackOptions {...props} />,
        },
        {
            widgetName: 'purchaseOptions',
            widgetFunc: (props) => <PurchaseOptions {...props} />,
        },
        {
            widgetName: 'disambiguationOptions',
            widgetFunc: (props) => <DisambiguationOptions {...props} />,
            props: {
                results: [],
            },
            mapStateToProps: ["results"]
        },
    ],
};

export default config;