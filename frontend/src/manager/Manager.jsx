// src/manager/Manager.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import ChatbotDataStore from "../chatbot/ChatbotDataStore"; // 1. Import the store
import "./Manager.css"; 

const Manager = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        ChatbotDataStore.reset(); // 2. THIS IS THE CRITICAL FIX
        window.location.href = "/";
    };
    
    // ... rest of the component is unchanged
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    useEffect(() => {
        if (isSidebarOpen) closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('.menu-toggle-button')) {
                closeSidebar();
            }
        };
        if (isSidebarOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSidebarOpen]);

    return (
        <div className="admin-layout d-flex">
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar}></div>}
            <div className={`sidebar bg-dark text-white ${isSidebarOpen ? "open" : ""}`} ref={sidebarRef}>
                <div className="sidebar-header p-3">
                    <h2 className="fs-4 mb-0">Manager Panel</h2>
                    <button className="btn-close btn-close-white d-lg-none" onClick={toggleSidebar}></button>
                </div>
                <nav className="nav flex-column p-3">
                    <NavLink to="/manager" className="nav-link" end>Dashboard</NavLink>
                    <NavLink to="/manager/attendance" className="nav-link">Mark Attendance</NavLink>
                    <NavLink to="/manager/employees" className="nav-link">View Employees</NavLink>
                    <button onClick={handleLogout} className="btn btn-danger mt-auto mx-3">Logout</button>
                </nav>
            </div>
            <div className="content-area flex-grow-1 p-3 p-md-4">
                <button className="btn btn-dark d-lg-none mb-3 menu-toggle-button" onClick={toggleSidebar}>☰ Menu</button>
                <Outlet />
            </div>
        </div>
    );
};

export default Manager;