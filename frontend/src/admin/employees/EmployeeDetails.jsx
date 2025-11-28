import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../../utils/api';
import './EmployeeDetails.css'; // Intha CSS file ah create pannikonga

const EmployeeDetails = () => {
    // Unga original state and functions ellam apdiye iruku, no changes.
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [salary, setSalary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await API.get(`/employees/${id}`);
                setEmployee(res.data);

                // Salary calculation based on attendance & experience (Unga original logic)
                const attendanceDays = res.data.attendance?.length || 0;
                const dailyRate = res.data.experience >= 5 ? 1600 : 800;
                const calculatedSalary = attendanceDays * dailyRate;
                setSalary(calculatedSalary);
            } catch (err) {
                console.error("Error fetching employee details:", err);
                setError("Failed to fetch employee details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    // Bootstrap Spinner for loading state
    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    // Bootstrap Alert for error state
    if (error) {
        return <div className="container mt-4"><div className="alert alert-danger">{error} <Link to="/admin/employees" className="alert-link">Go Back</Link></div></div>;
    }
    
    if (!employee) {
        return <div className="container mt-4"><div className="alert alert-warning">Employee not found.</div></div>
    }

    return (
        <div className="container-fluid">
            <div className="card shadow-sm employee-details-card">
                <div className="card-header bg-dark text-white">
                    <h3 className="mb-0">Employee Profile</h3>
                </div>
                <div className="card-body">
                    <div className="row mb-4 align-items-center">
                        <div className="col-md-8">
                            <h4 className="card-title">{employee.name}</h4>
                            <h6 className="card-subtitle mb-2 text-muted">{employee.email}</h6>
                        </div>
                    </div>
                    
                    <hr />

                    <div className="row g-4">
                        {/* Personal Information */}
                        <div className="col-lg-6">
                            <h5 className="section-title">Personal Information</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item"><strong>Phone:</strong> {employee.phone}</li>
                                <li className="list-group-item"><strong>Date of Birth:</strong> {new Date(employee.dob).toLocaleDateString('en-GB')}</li>
                                <li className="list-group-item"><strong>Gender:</strong> {employee.gender}</li>
                                <li className="list-group-item"><strong>Aadhar Number:</strong> {employee.aadhar}</li>
                            </ul>
                        </div>

                        {/* Professional Information */}
                        <div className="col-lg-6">
                            <h5 className="section-title">Professional Information</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item"><strong>Experience:</strong> {employee.experience} years</li>
                                <li className="list-group-item"><strong>Shift:</strong> {employee.shift}</li>
                                <li className="list-group-item"><strong>Attendance (This Month):</strong> {employee.attendance?.length || 0} days</li>
                                <li className="list-group-item salary-highlight"><strong>Calculated Salary:</strong> ₹{salary ? salary.toLocaleString('en-IN') : '0'}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <Link to="/admin/employees" className="btn btn-secondary">Back to Employee List</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetails;