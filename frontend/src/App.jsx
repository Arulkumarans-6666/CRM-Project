// src/App.jsx

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import ChatbotDataStore from './chatbot/ChatbotDataStore';
import axios from 'axios';
import { SpeedInsights } from "@vercel/speed-insights/react"; // Intha line add panniruken ✨

// --- All your other component imports ---
import LoginPage from './home/login/LoginPage';
import HomePage from './home/homepage/HomePage';
import About from './home/about/About';
import Contact from './home/contact/Contact';
import Admin from './admin/Admin';
import AdminDashboard from './admin/dashboard/AdminDashboard';
import EmployeeList from './admin/employees/EmployeeList';
import EmployeeDetails from './admin/employees/EmployeeDetails';
import ManagerList from './admin/managers/ManagerList';
import ManagerDetails from './admin/managers/ManagerDetails';
import StackList from './admin/stacks/StackList';
import StackDetails from './admin/stacks/StackDetails';
import AdminManagerAttendance from './admin/managers/AdminManagerAttendance';
import PurchaseList from './admin/purchases/PurchaseList';
import PurchaseDetails from './admin/purchases/PurchaseDetails';
import Manager from './manager/Manager';
import ManagerDashboard from './manager/dashboard/ManagerDashboard';
import ManagerAttendance from './manager/attendance/ManagerAttendance';
import ManagerEmployeeView from './manager/employees/ManagerEmployeeView';
import Stackmaintain from './stack/StackMaintain';

const App = () => {
    const [role, setRole] = useState(localStorage.getItem('role'));
    const navigate = useNavigate();

    useEffect(() => {
        if (role && role !== 'guest') {
            ChatbotDataStore.init();
        }
    }, [role]);

    const handleLogout = () => {
        delete axios.defaults.headers.common["Authorization"];
        localStorage.clear();
        ChatbotDataStore.reset();
        setRole(null);
        navigate("/login");
    };

    return (
        <>
            <Routes>
                {/* --- All your Route components --- */}
                <Route path="/" element={<LoginPage setRole={setRole}/>} />
                {/* <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} /> */}
                {/* <Route path="/login" element={<LoginPage setRole={setRole} />} /> */}

                <Route path="/admin" element={role === 'admin' ? <Admin handleLogout={handleLogout} /> : <Navigate to="/login" />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="employees" element={<EmployeeList />} />
                    <Route path="employees/:id" element={<EmployeeDetails />} />
                    <Route path="managers" element={<ManagerList />} />
                    <Route path="managers/attendance" element={<AdminManagerAttendance />} />
                    <Route path="managers/:managerId" element={<ManagerDetails />} />
                    <Route path="stacks" element={<StackList />} />
                    <Route path="stacks/:id" element={<StackDetails />} />
                    <Route path="purchases" element={<PurchaseList />} />
                    <Route path="purchases/:id" element={<PurchaseDetails />} />
                </Route>

                <Route path="/manager" element={role === 'manager' ? <Manager handleLogout={handleLogout} /> : <Navigate to="/login" />}>
                    <Route index element={<ManagerDashboard />} />
                    <Route path="attendance" element={<ManagerAttendance />} />
                    <Route path="employees" element={<ManagerEmployeeView />} />
                    <Route path="employees/:id" element={<EmployeeDetails />} />
                </Route>
                
                <Route path="/stack/*" element={role === 'stack' ? <Stackmaintain /> : <Navigate to="/login" />} />
            </Routes>
            <SpeedInsights /> {/* Intha line add panniruken ✨ */}
        </>
    );
};

export default App;