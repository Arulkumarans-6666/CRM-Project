import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// We are already using API here, so this file is correct. No changes needed.
import API from '../../utils/api';
import './EmployeeList.css';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', dob: '', gender: '',
        aadhar: '', experience: '', shift: '', baseSalary: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await API.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    
    const resetForm = () => {
        setForm({
            name: '', email: '', phone: '', dob: '', gender: '',
            aadhar: '', experience: '', shift: '', baseSalary: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/employees/${editingId}`, form);
            } else {
                await API.post('/employees', form);
            }
            resetForm();
            fetchEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Failed to save employee. Please check the details and try again.');
        }
    };

    const handleEdit = (emp) => {
        setForm({
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            dob: emp.dob ? emp.dob.split('T')[0] : '',
            gender: emp.gender,
            aadhar: emp.aadhar,
            experience: emp.experience,
            shift: emp.shift,
            baseSalary: emp.baseSalary
        });
        setEditingId(emp._id);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            await API.delete(`/employees/${id}`);
            fetchEmployees();
        }
    };

    return (
        <div className="container-fluid">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                    <h4 className="mb-0">{editingId ? '✍️ Edit Employee' : '➕ Add New Employee'}</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4"><input name="name" className="form-control" placeholder="Full Name" value={form.name} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="email" type="email" className="form-control" placeholder="Email" value={form.email} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="phone" type="tel" className="form-control" placeholder="Phone" value={form.phone} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="dob" type="date" className="form-control" value={form.dob} onChange={handleChange} required /></div>
                            <div className="col-md-4">
                                <select name="gender" className="form-select" value={form.gender} onChange={handleChange} required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="col-md-4"><input name="aadhar" className="form-control" placeholder="Aadhar Number" value={form.aadhar} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="experience" type="number" className="form-control" placeholder="Experience (Years)" value={form.experience} onChange={handleChange} required /></div>
                            <div className="col-md-4">
                                <select name="shift" className="form-select" value={form.shift} onChange={handleChange} required>
                                    <option value="">Select Shift</option>
                                    <option value="A">Shift A</option>
                                    <option value="B">Shift B</option>
                                    <option value="C">Shift C</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <input 
                                    name="baseSalary" 
                                    type="number" 
                                    className="form-control" 
                                    placeholder="Base Salary (₹)" 
                                    value={form.baseSalary} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <button type="submit" className="btn btn-primary me-2">{editingId ? 'Update Employee' : 'Add Employee'}</button>
                            {editingId && (<button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>)}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header">
                    <h4 className="mb-0">📋 Employee List</h4>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped table-bordered table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr className="text-center">
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Shift</th>
                                    <th>Base Salary</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center p-5"><div className="spinner-border"></div></td></tr>
                                ) : employees.map((emp) => (
                                    <tr key={emp._id}>
                                        <td><Link to={`/admin/employees/${emp._id}`}>{emp.name}</Link></td>
                                        <td className="text-center">{emp.phone}</td>
                                        <td className="text-center">{emp.shift}</td>
                                        <td className="text-end">₹{emp.baseSalary ? emp.baseSalary.toLocaleString('en-IN') : 'N/A'}</td>
                                        <td className="text-center">
                                            <div className="d-flex gap-2 justify-content-center">
                                                <button onClick={() => handleEdit(emp)} className="btn btn-warning btn-sm">Edit</button>
                                                <button onClick={() => handleDelete(emp._id)} className="btn btn-danger btn-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeList;
