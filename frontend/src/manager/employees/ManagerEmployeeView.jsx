import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

const ManagerEmployeeView = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!user?.shift) return;
            try {
                const { data } = await API.get(`/employees/shift/${user.shift}`);
                setEmployees(data);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [user.shift]);

    if (loading) return <div className="spinner-border"></div>;

    return (
        <div className="container-fluid">
            <h3>Employees in Your Shift ({user.shift})</h3>
            <div className="list-group">
                {employees.map(emp => (
                    <Link 
                        key={emp._id}
                        // ✨ THIS IS THE LINE THAT HAS BEEN CHANGED ✨
                        to={`/manager/employees/${emp._id}`} 
                        className="list-group-item list-group-item-action"
                    >
                        <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">{emp.name}</h5>
                            <small>Experience: {emp.experience} yrs</small>
                        </div>
                        <p className="mb-1">Phone: {emp.phone}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ManagerEmployeeView;