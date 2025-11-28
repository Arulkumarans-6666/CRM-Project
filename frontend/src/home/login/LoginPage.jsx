// frontend/src/home/login/LoginPage.jsx

import React, { useState } from "react";
import API from "../../utils/api"; // Make sure you are using API, not axios
import { useNavigate } from "react-router-dom";

import './LoginPage.css';
import backgroundImage from '../../assets/background.png';
import ramcoLogo from '../../assets/login logo.jpeg';

// Make sure you are receiving 'setRole' from App.jsx props
const LoginPage = ({ setRole }) => { 
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await API.post("/auth/login", {
                email,
                password,
            });

            const { token, user } = res.data;

            // --- ✨ THIS IS THE MOST IMPORTANT FIX ✨ ---
            // 1. Set token in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("role", user.role);
            localStorage.setItem("user", JSON.stringify(user));

            // 2. IMMEDIATELY set the token in the headers for all future requests
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // 3. Update the app's state
            if (setRole) {
                setRole(user.role);
            }
            
            console.log("✅ Login successful & token set in headers!");

            // --- Navigation Logic ---
            const userRole = user.role.trim().toLowerCase();
            if (userRole === "admin") {
                navigate("/admin");
            } else if (userRole === "manager") {
                navigate("/manager");
            } else if (userRole === "stack") {
                navigate("/stack");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("❌ Login failed! Error:", err);
            setError("Invalid Username or Password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Your JSX code needs no changes
        <div
            className="login-container"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="login-form-container">
                <div className="text-center">
                    <img src={ramcoLogo} alt="Ramco Cements Logo" className="login-logo d-block mx-auto" />
                </div>
                <form>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="mb-4">
                        <input
                            type="email"
                            className="form-control"
                            placeholder="USERNAME"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary w-100 btn-submit"
                        disabled={isLoading}
                        onClick={handleLogin}
                    >
                        {isLoading ? "Submitting..." : "SUBMIT"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;