// src/chatbot/ActionProvider.jsx

import { aboutUsData, contactData } from './staticData';
import ChatbotDataStore from './ChatbotDataStore';
import API from '../utils/api'; 

let conversationalState = {
    lastMentionedEntity: null,
};

class ActionProvider {
    constructor(createChatBotMessage, setStateFunc) {
        this.createChatBotMessage = createChatBotMessage;
        this.setState = setStateFunc;
        this.context = ChatbotDataStore;
    }

    // --- UTILITY FUNCTIONS ---
    addBotMessage = (message, options = {}) => {
        const botMessage = this.createChatBotMessage(message, options);
        this.setState((prev) => ({ ...prev, messages: [...prev.messages, botMessage] }));
    };

    getRole = () => localStorage.getItem('role') || 'guest';

    _findEntities = (query, findAll = false) => {
        const { employees, managers, stacks, purchases } = this.context;
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return [];
        
        const allEntities = [
            ...employees.map(e => ({ type: 'Employee', name: e.name.toLowerCase(), data: e })),
            ...managers.map(m => ({ type: 'Manager', name: m.name.toLowerCase(), data: m })),
            ...stacks.map(s => ({ type: 'Stack', name: s.stackId.toLowerCase(), data: s })),
            ...stacks.map(s => ({ type: 'Stack', name: s.material.toLowerCase(), data: s })),
            ...purchases.map(p => ({ type: 'Purchase', name: p.materialName.toLowerCase(), data: p })),
        ].sort((a, b) => b.name.length - a.name.length);

        if (findAll) {
            let found = [];
            let remainingQuery = lowerQuery;
            allEntities.forEach(entity => {
                if (remainingQuery.includes(entity.name)) {
                    found.push(entity);
                    remainingQuery = remainingQuery.replace(entity.name, '').trim();
                }
            });
            return found;
        } else {
            return allEntities.filter(e => e.name.includes(lowerQuery));
        }
    };

    _getAttendanceSummary = async (entityData) => {
        if (!entityData || !entityData._id) return null;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        try {
            const leaveRes = await API.get(`/attendance/leave/${year}/${month}`);
            const officialLeaveDays = leaveRes.data.map(l => new Date(l.date).getDate());
            const daysInMonth = new Date(year, month, 0).getDate();
            let workingDays = 0;
            for (let i = 1; i <= daysInMonth; i++) {
                const day = new Date(year, month - 1, i).getDay();
                if (day !== 0 && !officialLeaveDays.includes(i)) workingDays++;
            }
            const attendanceRes = await API.get(`/attendance/monthly/${entityData._id}/${year}/${month}`);
            const records = attendanceRes.data;
            const present = records.filter((d) => d.status === "Present").length;
            const leave = records.filter((d) => d.status === "Leave").length;
            const totalHours = records.reduce((sum, d) => sum + (d.hoursWorked || 0), 0);
            if (workingDays <= 0 || !entityData.baseSalary) return { workingDays, present, leave, totalHours, salary: 0 };
            const totalMonthHours = workingDays * 8;
            const perHourSalary = entityData.baseSalary / totalMonthHours;
            const calculatedSalary = perHourSalary * (totalHours + leave * 8);
            return { workingDays, present, leave, totalHours, salary: calculatedSalary.toFixed(2) };
        } catch (error) {
            console.error("Error calculating attendance summary in chatbot:", error);
            return null;
        }
    };

    // --- MASTER HANDLER (Entry point for all messages) ---
    handleUserInput = (query) => {
        const role = this.getRole();
        if (role === 'guest') {
            if (query.includes('about')) return this.handleAbout();
            if (['contact', 'phone', 'address'].includes(query)) return this.handleContact();
            return this.addBotMessage("Welcome! Please login to access CRM data. You can ask about 'contact' or 'about'.");
        }

        if (['hello', 'hi', 'vanakkam'].some(g => query.startsWith(g))) return this.handleHello();
        if (query.includes('help')) return this.handleHelp();
        if (query.includes('total employee')) return this.handleTotalEmployees();
        if (query.includes('total manager')) return this.handleTotalManagers();
        if (query.includes('total balance') || query.includes('overall balance')) return this.handleTotalStackBalance();
        if (query.includes('official leave')) return this.handleOfficialLeaves();
        if (query.includes('low stock')) return this.handleLowStockReport();
        if (query.match(/shift\s+([a-c])\s+(employees|managers)/)) return this.handleShiftQuery(query);
        
        this.handleNaturalLanguageQuery(query);
    };

    // --- NATURAL LANGUAGE PROCESSOR ---
    handleNaturalLanguageQuery = async (query) => {
        if (!this.context.isDataLoaded) return this.addBotMessage("Data innum load aagala, konjam wait pannunga...");
        
        const entities = this._findEntities(query, true); 
        
        if (entities.length === 0) return this.handleDetails(query);

        let response = "";
        if (entities.length > 1 && entities[0].type === 'Stack' && (entities[1].type === 'Employee' || entities[1].type === 'Manager')) {
            response = this.getBuyerInStackResponse(entities[0], entities[1], query);
        } else {
            const foundEntity = entities[0];
            if (query.includes('salary')) response = await this.getSalaryResponse(foundEntity, query);
            else if (query.includes('attendance') || query.includes('hours') || query.includes('present') || query.includes('leave')) response = await this.getAttendanceResponse(foundEntity);
            else if (query.includes('buyer') || query.includes('order details')) response = this.getStackOrderResponse(foundEntity);
            else if (query.includes('stock') || query.includes('quantity') || query.includes('pending') || query.includes('available')) response = this.getStockResponse(foundEntity);
            else if (['phone', 'email', 'dob', 'experience', 'shift', 'aadhar'].some(q => query.includes(q))) response = this.getPersonalDetailsResponse(foundEntity, query);
            else if (query.includes('supplier') || query.includes('purchase')) response = this.getPurchaseResponse(foundEntity);
        }

        if (response) this.addBotMessage(response);
        else this.handleDetails(entities[0].data.name || entities[0].data.stackId || entities[0].data.materialName);
    };

    // --- RESPONSE GENERATORS (NEW & UPGRADED) ---
    getBuyerInStackResponse = (stackEntity, buyerEntity, query) => {
        if (this.getRole() !== 'admin') return "Sorry, only admins can view these details.";
        const { data: stackData } = stackEntity;
        const { data: buyerData } = buyerEntity;
        const buyerOrders = stackData.orders?.filter(o => o.buyer.toLowerCase() === buyerData.name.toLowerCase()) || [];

        if (buyerOrders.length === 0) return `Buyer '${buyerData.name}' has no orders in Stack ${stackData.stackId}.`;

        let response = `**Order Details for ${buyerData.name} in Stack ${stackData.stackId}:**\n`;
        buyerOrders.forEach((order, index) => {
            const totalWithGst = (order.totalValue || 0) + (order.gstAmount || 0);
            const totalPaid = (order.advancePaid || 0) + (order.payments || []).reduce((s, p) => s + p.amount, 0);
            const balance = totalWithGst - totalPaid;
            const delivered = (order.deliveries || []).reduce((s, d) => s + d.qty, 0);
            
            response += `\n--- Order ${index + 1} ---\n`;
            response += `- Ordered: ${order.qty} ${stackData.unit} at ₹${order.pricePerUnit}\n`;
            response += `- Total+GST: ₹${totalWithGst.toLocaleString('en-IN')}\n`;
            response += `- Paid: ₹${totalPaid.toLocaleString('en-IN')}\n`;
            response += `- **Balance: ₹${balance.toLocaleString('en-IN')}**\n`;

            if (query.includes('delivery')) {
                response += `- Delivered: ${delivered} of ${order.qty} ${stackData.unit}\n`;
                if(order.deliveries.length > 0){
                    order.deliveries.forEach(d => {
                        response += `  - ${d.qty} ${stackData.unit} on ${new Date(d.date).toLocaleDateString()}\n`
                    });
                }
            }
        });
        return response;
    }

    getSalaryResponse = async (entity, query) => {
        if (this.getRole() !== 'admin') return "Sorry, admin mattum than salary paaka mudiyum.";
        const { type, data } = entity;
        if (type === 'Manager' || type === 'Employee') {
            if (query.includes('month') && type === 'Manager') {
                const summary = await this._getAttendanceSummary(data);
                return summary ? `${data.name} oda intha maasa salary (calculated): ₹${parseFloat(summary.salary).toLocaleString('en-IN')}.` : `Sorry, ${data.name} ku salary calculate panna mudila.`;
            }
            return `${data.name} oda base salary ₹${data.baseSalary.toLocaleString('en-IN')}.`;
        }
        return `Sorry, '${data.name}' ku salary details illa.`;
    }

    getAttendanceResponse = async (entity) => {
        if (this.getRole() !== 'admin') return "Sorry, admin mattum than attendance paaka mudiyum.";
        if (entity.type !== 'Manager') return `Sorry, ippo-thaiku manager attendance mattum than support panrom.`;
        const summary = await this._getAttendanceSummary(entity.data);
        if (summary) {
            return `**${entity.data.name} - This Month's Attendance:**\n- Present: ${summary.present} / ${summary.workingDays} days\n- Leave: ${summary.leave} days\n- Total Hours: ${summary.totalHours}`;
        }
        return `Sorry, ${entity.data.name} ku attendance details eduka mudila.`;
    }
    
    getStackOrderResponse = (entity) => {
        if (this.getRole() !== 'admin') return "Sorry, admin mattum than order details paaka mudiyum.";
        if (entity.type !== 'Stack') return `Sorry, '${entity.data.name || 'this'}' oru stack illa.`;
        const { data } = entity;
        const buyers = data.orders?.map(o => o.buyer) || [];
        if (buyers.length === 0) return `Stack ${data.stackId} ku innum yaarum order pannala.`;
        const uniqueBuyers = [...new Set(buyers)];
        return `**Stack ${data.stackId} (${data.material}) Orders:**\n- Buyers: ${uniqueBuyers.join(', ')}\n- Total Orders: ${data.orders.length}\n- Total Paid: ₹${(data.summary?.totalAdvance || 0).toLocaleString('en-IN')}\n- Total Balance Due: ₹${(data.summary?.totalBalance || 0).toLocaleString('en-IN')}`;
    }

    getStockResponse = (entity) => {
        if (this.getRole() !== 'admin') return "Sorry, admin mattum than stock details paaka mudiyum.";
        if (entity.type === 'Stack') {
            const { data } = entity;
            const remaining = data.totalQty - (data.usedQty || 0);
            return `**Stack ${data.stackId} (${data.material}):**\n- Total: ${data.totalQty} ${data.unit}\n- Used: ${data.usedQty || 0} ${data.unit}\n- Available: ${remaining} ${data.unit}`;
        }
        if (entity.type === 'Purchase') {
            const { data } = entity;
            return `**Purchase (${data.materialName}):**\n- Received: ${data.summary.totalReceived} ${data.unit}\n- Used: ${data.summary.totalUsed} ${data.unit}\n- **Available:** ${data.availableStock.toFixed(2)} ${data.unit}`;
        }
        return `Sorry, '${entity.data.name}' ku stock details illa.`;
    }

    getPersonalDetailsResponse = (entity, query) => {
        if (entity.type !== 'Employee' && entity.type !== 'Manager') return `Sorry, '${entity.data.name}' ku personal details illa.`;
        const { data } = entity;
        if (query.includes('phone')) return `${data.name} oda phone number: ${data.phone}.`;
        if (query.includes('email')) return `${data.name} oda email: ${data.email}.`;
        if (query.includes('shift')) return `${data.name}, Shift ${data.shift} la work panranga.`;
        if (query.includes('experience')) return `${data.name} ku ${data.experience} years experience iruku.`;
        if (query.includes('dob')) return `${data.name} oda date of birth: ${new Date(data.dob).toLocaleDateString('en-GB')}.`;
        if (query.includes('aadhar')) return this.getRole() === 'admin' ? `${data.name} oda Aadhar: ${data.aadhar}` : "Sorry, admin mattum than Aadhar number paaka mudiyum.";
        return this.handleDetails(entity.name);
    }
    
    getPurchaseResponse = (entity) => {
        if (this.getRole() !== 'admin') return "Sorry, admin mattum than purchase details paaka mudiyum.";
        if (entity.type !== 'Purchase') return `Sorry, '${entity.data.name}' oru purchase record illa.`;
        const { data } = entity;
        return `**Purchase: ${data.materialName}**\n- Supplier: ${data.supplierName}\n- Available Stock: ${data.availableStock.toFixed(2)} ${data.unit}\n- Total Balance Due: ₹${data.summary.totalBalance.toLocaleString('en-IN')}`;
    }

    handleShiftQuery = (query) => {
        const role = this.getRole();
        if (role !== 'admin') return this.addBotMessage("Sorry, only admins can view shift details.");
        
        const match = query.match(/shift\s+([a-c])\s+(employees|managers)/);
        const shift = match[1].toUpperCase();
        const type = match[2];

        if (type === 'employees') {
            const shiftEmployees = this.context.employees.filter(e => e.shift === shift);
            if (shiftEmployees.length === 0) return this.addBotMessage(`Shift ${shift} la employees yaarum illa.`);
            const employeeNames = shiftEmployees.map(e => e.name).join(', ');
            this.addBotMessage(`**Shift ${shift} Employees (${shiftEmployees.length}):**\n${employeeNames}`);
        } else { // managers
            const shiftManagers = this.context.managers.filter(m => m.shift === shift);
            if (shiftManagers.length === 0) return this.addBotMessage(`Shift ${shift} la managers yaarum illa.`);
            const managerNames = shiftManagers.map(m => m.name).join(', ');
            this.addBotMessage(`**Shift ${shift} Managers (${shiftManagers.length}):**\n${managerNames}`);
        }
    }

    // --- BASIC HANDLERS ---
    handleHello = () => {
        const role = this.getRole();
        let response = "Hello! I'm Cemento. Ungaluku epadi help panna?";
        if (role === 'admin') response = `Hello Admin! Ungaluku enna information venum?`;
        if (role === 'manager') response = `Hello Manager! Unga shift details venuma?`;
        this.addBotMessage(response, { widget: 'generalOptions' });
        conversationalState = {};
    };

    handleHelp = () => {
        const role = this.getRole();
        let helpText = "You can ask about 'contact' or 'about'.";
        if (role !== 'guest') helpText = "You can ask about employees, managers, or stacks (e.g., 'arul details' or 'total employees').";
        this.addBotMessage(helpText, { widget: 'generalOptions' });
    };

    handleAbout = () => this.addBotMessage(aboutUsData);
    handleContact = () => this.addBotMessage(contactData);
    handleUnknown = () => this.addBotMessage("Sorry, I don't understand. Type 'help' for options.");

    handleTotalEmployees = () => {
        if (!this.context.isDataLoaded) return this.addBotMessage("Data is still loading, please wait...");
        const { employees } = this.context;
        if (this.getRole() === 'manager') {
            const user = JSON.parse(localStorage.getItem('user'));
            const shiftEmployees = employees.filter(e => e.shift === user.shift);
            this.addBotMessage(`In your shift (${user.shift}), there are ${shiftEmployees.length} employees.`);
        } else {
            this.addBotMessage(`There are a total of ${employees.length} employees.`);
        }
    };

    handleTotalManagers = () => {
        if (this.getRole() !== 'admin') return this.addBotMessage("Sorry, only admins can view manager details.");
        if (!this.context.isDataLoaded) return this.addBotMessage("Data is still loading...");
        this.addBotMessage(`There are a total of ${this.context.managers.length} managers.`);
    };

    handleTotalStackBalance = () => {
        if (this.getRole() !== 'admin') return this.addBotMessage("Sorry, only admins can view financial data.");
        if (!this.context.isDataLoaded) return this.addBotMessage("Data is still loading...");
        const totalBalance = this.context.stacks.reduce((sum, stack) => sum + (stack.summary?.totalBalance || 0), 0);
        this.addBotMessage(`The combined total balance owed for all stacks is ₹${totalBalance.toLocaleString('en-IN')}.`);
    };

    handleOfficialLeaves = async () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const monthName = today.toLocaleString('default', { month: 'long' });
        try {
            const res = await API.get(`/attendance/leave/${year}/${month}`);
            const leaves = res.data;
            if (leaves && leaves.length > 0) {
                let response = `**Official Leaves for ${monthName}:**\n`;
                leaves.forEach(leave => {
                    response += `- ${new Date(leave.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${leave.reason}\n`;
                });
                this.addBotMessage(response);
            } else {
                this.addBotMessage(`There are no official leaves for ${monthName}.`);
            }
        } catch (error) {
            this.addBotMessage("Sorry, I could not fetch the official leaves data.");
        }
    };

    handleLowStockReport = () => {
        if (this.getRole() !== 'admin') return this.addBotMessage("Sorry, only admins can view stock reports.");
        let lowStockItems = [];
        this.context.purchases.forEach(p => {
            if(p.availableStock <= p.lowStockThreshold) {
                lowStockItems.push(`- ${p.materialName}: ${p.availableStock.toFixed(2)} ${p.unit} left (Threshold: ${p.lowStockThreshold})`);
            }
        });
        if(lowStockItems.length === 0) return this.addBotMessage("Great! No materials are currently below their low stock threshold.");
        this.addBotMessage(`**Low Stock Alert:**\n${lowStockItems.join('\n')}`);
    };

    handleDetails = (query) => {
        if (!this.context.isDataLoaded) return this.addBotMessage("Data is still loading...");
        const results = this._findEntities(query);
        if (results.length === 0) return this.addBotMessage(`Sorry, I couldn't find anything for '${query}'.`);
        if (results.length > 1) {
            this.setState(prev => ({ ...prev, results: results }));
            this.addBotMessage(`I found multiple results for '${query}'. Please select one:`, { widget: 'disambiguationOptions' });
            return;
        }
        const result = results[0];
        conversationalState.lastMentionedEntity = result;
        this.addBotMessage(`OK, I found '${result.data.name || result.data.material || result.data.materialName}'. What would you like to know?`, {
            widget: `${result.type.toLowerCase()}Options`
        });
    };

    handleDisambiguation = (index) => {
       this.setState(prev => {
            const selectedResult = prev.results[index];
            if (selectedResult) {
                conversationalState.lastMentionedEntity = selectedResult;
                this.addBotMessage(`OK, you selected '${selectedResult.data.name || selectedResult.data.material || selectedResult.data.materialName}'. What would you like to know?`, {
                    widget: `${selectedResult.type.toLowerCase()}Options`
                });
            }
            return { ...prev, results: [] };
       });
    }

    // ✅ BUG FIX IS HERE
    handleFollowUp = (query) => {
        const { lastMentionedEntity } = conversationalState;
        if (!lastMentionedEntity) return this.addBotMessage("Sorry, who are you asking about? Please tell me their name first.");
        
        // Correctly get the name from the 'data' object
        const entityName = lastMentionedEntity.data.name || lastMentionedEntity.data.stackId || lastMentionedEntity.data.materialName;
        
        if (!entityName) return this.addBotMessage("Sorry, I lost track of who we were talking about. Please ask again.");
        
        this.handleNaturalLanguageQuery(`${entityName} ${query}`);
    };
}

export default ActionProvider;