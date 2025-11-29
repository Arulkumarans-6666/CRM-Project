// src/admin/Admin.jsx
import React, { useState, useEffect } from "react"; // ✨ 1. Import useEffect
import { Outlet, NavLink, useLocation } from "react-router-dom"; // ✨ 2. Import useLocation
import "./Admin.css";

const Admin = ({ handleLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation(); // ✨ 3. Get the current page location

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // ✨ 4. Create a dedicated function to close the sidebar
    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    // ✨ 5. This is the new magic part!
    //    When the user clicks a NavLink and the page changes, close the sidebar automatically.
    useEffect(() => {
        closeSidebar();
    }, [location]); // This runs every time the URL changes

    return (
        <div className="admin-layout d-flex">
            {/* ✨ 6. This is the new backdrop div. It only appears when the sidebar is open on mobile. */}
            {isSidebarOpen && <div className="sidebar-backdrop d-lg-none" onClick={closeSidebar}></div>}
            
            <div className={`sidebar bg-dark text-white ${isSidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header p-3">
                    <h2 className="fs-4 mb-0">Admin Panel</h2>
                    {/* Use closeSidebar here instead of toggleSidebar */}
                    <button className="btn-close btn-close-white d-lg-none" onClick={closeSidebar}></button>
                </div>
                {/* The NavLink clicks will now also close the sidebar because of the useEffect hook */}
                <nav className="nav flex-column p-3">
                    <NavLink to="/admin" className="nav-link" end>Dashboard</NavLink>
                    <NavLink to="/admin/employees" className="nav-link">Employees</NavLink>
                    <NavLink to="/admin/managers" className="nav-link">Managers</NavLink>
                    <NavLink to="/admin/stacks" className="nav-link">Stacks</NavLink>
                    <NavLink to="/admin/purchases" className="nav-link">Purchases</NavLink>
                    <NavLink to="/admin/managers/attendance" className="nav-link">Mark Attendance</NavLink>
                    <button onClick={handleLogout} className="btn btn-danger mt-auto mx-3">
                        Logout
                    </button>
                </nav>
            </div>
            
            <div className="content-area flex-grow-1 p-3 p-md-4">
                <button className="btn btn-dark d-lg-none mb-3" onClick={toggleSidebar}>
                    ☰ Menu
                </button>
                <Outlet />
            </div>
        </div>
    );
};

export default Admin;