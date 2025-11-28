import { useState, useEffect } from 'react';
import API from '../../utils/api'; // ✅ Correct
const ManagerDashboard = () => {
    const [manager, setManager] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchManagerData = async () => {
            try {
                const { data } = await API.get('/managers/me');
                setManager(data);
            } catch (error) {
                console.error("Failed to fetch manager data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchManagerData();
    }, []);

    if (loading) return <div className="spinner-border"></div>;
    if (!manager) return <div className="alert alert-danger">Could not load manager details.</div>;

    return (
        <div className="container">
            <h2 className="mb-4">Welcome, {manager.name}!</h2>
            <div className="card">
                <div className="card-header">
                    Your Profile
                </div>
                <div className="card-body">
                    <p><strong>Manager ID:</strong> {manager.managerId}</p>
                    <p><strong>Email:</strong> {manager.email}</p>
                    <p><strong>Assigned Shift:</strong> {manager.shift}</p>
                    <p><strong>Experience:</strong> {manager.experience} years</p>
                    <p><strong>Base Salary:</strong> ₹{manager.baseSalary.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;