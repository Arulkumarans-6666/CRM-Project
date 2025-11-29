// src/chatbot/widgets.jsx
import React from 'react';
import './widgets.css';

// Initial options when bot opens
export const GeneralOptions = (props) => {
    const role = localStorage.getItem('role');
    const options = [
        { text: "Total Employees", handler: props.actionProvider.handleTotalEmployees },
        { text: "Total Managers", handler: props.actionProvider.handleTotalManagers },
        { text: "All Stacks Balance", handler: props.actionProvider.handleTotalStackBalance },
        { text: "Help", handler: props.actionProvider.handleHelp },
    ];
    // Filter options based on role
    const filteredOptions = role === 'admin' 
        ? options 
        : (role === 'manager' ? [options[0], options[3]] : [options[3]]);

    return (
        <div className="options-container">
            {filteredOptions.map((opt, i) => <button key={i} onClick={opt.handler} className="option-button">{opt.text}</button>)}
        </div>
    );
};

// Options for an Employee or Manager
export const EmployeeOptions = (props) => {
    const options = [
        { text: "Phone Number", handler: () => props.actionProvider.handleFollowUp('phone') },
        { text: "Shift", handler: () => props.actionProvider.handleFollowUp('shift') },
        { text: "Salary", handler: () => props.actionProvider.handleFollowUp('salary') },
        { text: "Full Details", handler: () => props.actionProvider.handleFollowUp('full details') },
    ];
    return (
        <div className="options-container">
            {options.map((opt, i) => <button key={i} onClick={opt.handler} className="option-button">{opt.text}</button>)}
        </div>
    );
};
export const ManagerOptions = EmployeeOptions; // Managers have the same options

// Options for a Stack
export const StackOptions = (props) => {
    const options = [
        { text: "Stock Summary", handler: () => props.actionProvider.handleFollowUp('summary') },
        { text: "Last Price", handler: () => props.actionProvider.handleFollowUp('price') },
        { text: "Total Balance Due", handler: () => props.actionProvider.handleFollowUp('balance') },
    ];
    return (
        <div className="options-container">
            {options.map((opt, i) => <button key={i} onClick={opt.handler} className="option-button">{opt.text}</button>)}
        </div>
    );
};

// Options for a Purchase record
export const PurchaseOptions = (props) => {
    const options = [
        { text: "Stock Summary", handler: () => props.actionProvider.handleFollowUp('summary') },
        { text: "Balance Due", handler: () => props.actionProvider.handleFollowUp('balance') },
    ];
    return (
        <div className="options-container">
            {options.map((opt, i) => <button key={i} onClick={opt.handler} className="option-button">{opt.text}</button>)}
        </div>
    );
};

// Widget to handle ambiguity when multiple results are found
export const DisambiguationOptions = (props) => {
    const { results } = props;
    return (
        <div className="options-container">
            {results.map((res, i) => (
                <button 
                    key={i} 
                    onClick={() => props.actionProvider.handleDisambiguation(i)} 
                    className="option-button"
                >
                   {res.type}: {res.data.name || res.data.material || res.data.materialName}
                </button>
            ))}
        </div>
    );
};