import { useEffect, useState } from 'react';
// We are already using API here, so this file is correct. No changes needed.
import API from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState({
    employees: [],
    managers: [],
    stacks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, mgrRes, stkRes] = await Promise.all([
          API.get('/employees'),
          API.get('/managers'),
          API.get('/stacks'),
        ]);
        setData({
          employees: empRes.data,
          managers: mgrRes.data,
          stacks: stkRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  return (
    <div className="container-fluid">
      <h3 className="mb-4">Welcome, Admin</h3>
      <div className="row g-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 dashboard-card shadow-sm">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Total Employees</h5>
              <p className="card-text display-4 fw-bold">{data.employees.length}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 dashboard-card shadow-sm">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Total Managers</h5>
              <p className="card-text display-4 fw-bold">{data.managers.length}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100 dashboard-card shadow-sm">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h5 className="card-title">Materials Tracked</h5>
              <p className="card-text display-4 fw-bold">{data.stacks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
