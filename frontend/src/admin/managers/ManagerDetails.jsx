import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../utils/api";
import "./ManagerDetails.css"; // Intha CSS file ah create pannikonga

const ManagerDetails = () => {
    const { managerId } = useParams(); // URL la irunthu _id edukkum
    const [manager, setManager] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchManager = async () => {
            if (!managerId) {
                setError("Manager ID is missing in the URL.");
                setLoading(false);
                return;
            }
            try {
                const res = await API.get(`/managers/${managerId}`);
                setManager(res.data);
            } catch (err) {
                console.error("Error fetching manager:", err);
                setError("Failed to fetch manager details.");
            } finally {
                setLoading(false);
            }
        };

        fetchManager();
    }, [managerId]);

    // Bootstrap Spinner for loading state
    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
    }

    // Bootstrap Alert for error state
    if (error) {
        return <div className="container mt-4"><div className="alert alert-danger">{error} <Link to="/admin/managers" className="alert-link">Go Back</Link></div></div>;
    }

    // Manager illana antha message ah kaatum
    if (!manager) {
        return <div className="container mt-4"><div className="alert alert-warning">Manager not found.</div></div>
    }

    return (
        <div className="container-fluid">
            <div className="card shadow-sm manager-details-card">
                <div className="card-header bg-dark text-white">
                    <h3 className="mb-0">Manager Profile</h3>
                </div>
                <div className="card-body">
                    <div className="row mb-4 align-items-center">
                        <div className="col-md-8">
                            <h4 className="card-title">{manager.name}</h4>
                            <h6 className="card-subtitle mb-2 text-muted">{manager.email}</h6>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <p className="mb-0"><strong>Manager ID:</strong> {manager.managerId}</p>
                        </div>
                    </div>
                    
                    <hr />

                    <div className="row g-4">
                        {/* Personal Information */}
                        <div className="col-lg-6">
                            <h5 className="section-title">Personal Information</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item"><strong>Date of Birth:</strong> {new Date(manager.dob).toLocaleDateString('en-GB')}</li>
                                <li className="list-group-item"><strong>Gender:</strong> {manager.gender}</li>
                                <li className="list-group-item"><strong>Aadhar Number:</strong> {manager.aadhar}</li>
                            </ul>
                        </div>

                        {/* Professional Information */}
                        <div className="col-lg-6">
                            <h5 className="section-title">Professional Information</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item"><strong>Shift:</strong> {manager.shift}</li>
                                <li className="list-group-item"><strong>Experience:</strong> {manager.experience} years</li>
                                <li className="list-group-item"><strong>Base Salary:</strong> ₹{manager.baseSalary.toLocaleString('en-IN')}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <Link to="/admin/managers" className="btn btn-secondary">Back to Manager List</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDetails;