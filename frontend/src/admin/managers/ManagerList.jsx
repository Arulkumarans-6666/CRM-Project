import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// We are already using API here, so this file is correct. No changes needed.
import API from "../../utils/api";
import * as XLSX from "xlsx";
import "./ManagerList.css";

const ManagerList = () => {
    const [managers, setManagers] = useState([]);
    const [form, setForm] = useState({
        managerId: "", name: "", email: "", password: "", dob: "",
        gender: "", aadhar: "", shift: "", experience: 0, baseSalary: 0,
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const res = await API.get("/managers");
            setManagers(res.data);
        } catch (error) {
            console.error("❌ Error fetching managers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            managerId: "", name: "", email: "", password: "", dob: "",
            gender: "", aadhar: "", shift: "", experience: 0, baseSalary: 0,
        });
        setEditingId(null);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/managers/${editingId}`, form);
            } else {
                await API.post("/managers", form);
            }
            resetForm();
            fetchManagers();
        } catch (error) {
            console.error("❌ Error saving manager:", error);
            alert("Failed to save manager. Check console for details.");
        }
    };

    const handleEdit = (mgr) => {
        setForm({
            managerId: mgr.managerId,
            name: mgr.name,
            email: mgr.email,
            password: "",
            dob: mgr.dob.split('T')[0],
            gender: mgr.gender,
            aadhar: mgr.aadhar,
            shift: mgr.shift,
            experience: mgr.experience,
            baseSalary: mgr.baseSalary,
        });
        setEditingId(mgr._id);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this manager?")) {
            await API.delete(`/managers/${id}`);
            fetchManagers();
        }
    };

    const exportToExcel = () => {
        const data = managers.map((mgr) => ({
            Name: mgr.name, ManagerID: mgr.managerId, Email: mgr.email,
            DOB: mgr.dob, Gender: mgr.gender, Aadhar: mgr.aadhar,
            Shift: mgr.shift, Experience: mgr.experience, BaseSalary: mgr.baseSalary,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Managers");
        XLSX.writeFile(wb, "managers_report.xlsx");
    };

    return (
        <div className="container-fluid">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                    <h4 className="mb-0">{editingId ? "✍️ Edit Manager" : "➕ Add New Manager"}</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4"><input name="managerId" className="form-control" placeholder="Manager ID" value={form.managerId} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="name" className="form-control" placeholder="Full Name" value={form.name} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="email" type="email" className="form-control" placeholder="Email Address" value={form.email} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="password" type="password" className="form-control" placeholder="Password" value={form.password} onChange={handleChange} required={!editingId} /></div>
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
                            <div className="col-md-4">
                                <select name="shift" className="form-select" value={form.shift} onChange={handleChange} required>
                                    <option value="">Select Shift</option>
                                    <option value="A">Shift A</option>
                                    <option value="B">Shift B</option>
                                    <option value="C">Shift C</option>
                                </select>
                            </div>
                            <div className="col-md-4"><input name="experience" type="number" className="form-control" placeholder="Experience (Years)" value={form.experience} onChange={handleChange} required /></div>
                            <div className="col-md-4"><input name="baseSalary" type="number" className="form-control" placeholder="Base Salary (₹)" value={form.baseSalary} onChange={handleChange} required /></div>
                        </div>
                        <div className="mt-3">
                            <button type="submit" className="btn btn-primary me-2">{editingId ? "Update Manager" : "Add Manager"}</button>
                            {editingId && (<button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>)}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">📋 Manager List</h4>
                    <button onClick={exportToExcel} className="btn btn-success btn-sm">Download Report (Excel)</button>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped table-bordered table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr className="text-center">
                                    <th>Manager ID</th><th>Name</th><th>Email</th><th>Shift</th>
                                    <th>Experience</th><th>Base Salary (₹)</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center p-5"><div className="spinner-border"></div></td></tr>
                                ) : managers.map((mgr) => (
                                    <tr key={mgr._id}>
                                        <td className="text-center">{mgr.managerId}</td>
                                        <td><Link to={`/admin/managers/${mgr._id}`}>{mgr.name}</Link></td>
                                        <td>{mgr.email}</td>
                                        <td className="text-center">{mgr.shift}</td>
                                        <td className="text-center">{mgr.experience} yrs</td>
                                        <td className="text-end">₹{mgr.baseSalary.toLocaleString('en-IN')}</td>
                                        <td className="text-center">
                                            <div className="d-flex gap-2 justify-content-center">
                                                <button onClick={() => handleEdit(mgr)} className="btn btn-warning btn-sm">Edit</button>
                                                <button onClick={() => handleDelete(mgr._id)} className="btn btn-danger btn-sm">Delete</button>
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

export default ManagerList;
