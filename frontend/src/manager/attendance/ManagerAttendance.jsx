import { useState, useEffect } from 'react';
import API from '../../utils/api';

const ManagerAttendance = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchAllData = async () => {
            if (!user?.shift) return;
            setLoading(true);
            try {
                // This single API call now gets all employees with their calculated salary
                const { data: employeeData } = await API.get(`/employees/shift/${user.shift}`);
                setEmployees(employeeData);

                // Then, we get the saved attendance records for the selected date
                const { data: records } = await API.get(`/employee-attendance/date/${date}`);
                
                const initialAttendance = {};
                employeeData.forEach(emp => {
                    const existingRecord = records.find(r => r.employeeId === emp._id);
                    if (existingRecord) {
                        initialAttendance[emp._id] = { status: existingRecord.status, hoursWorked: existingRecord.hoursWorked };
                    } else {
                        initialAttendance[emp._id] = { status: 'Present', hoursWorked: 8 };
                    }
                });
                setAttendance(initialAttendance);

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [user.shift, date]); // Re-fetches all data when the date changes


    const handleAttendanceChange = (employeeId, field, value) => {
        setAttendance(prev => ({ ...prev, [employeeId]: { ...prev[employeeId], [field]: value } }));
    };

    const handleSelectAll = (status) => {
        const newAttendance = {};
        employees.forEach(emp => {
            newAttendance[emp._id] = { status, hoursWorked: status === 'Present' ? 8 : (status === 'Half-day' ? 4 : 0) };
        });
        setAttendance(newAttendance);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const records = Object.keys(attendance).map(employeeId => ({
            employeeId,
            status: attendance[employeeId].status,
            hoursWorked: attendance[employeeId].status === 'Absent' ? 0 : attendance[employeeId].hoursWorked,
        }));
        try {
            await API.post('/employee-attendance/bulk', { date, records });
            alert('Attendance submitted successfully!');
        } catch (error) {
            console.error('Failed to submit attendance:', error);
            alert('Error submitting attendance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid">
            <h3>Mark Employee Attendance</h3>
            <p>Shift: <strong>{user.shift}</strong></p>

            <div className="card shadow-sm mb-4">
                <div className="card-body d-flex flex-wrap gap-3 align-items-center">
                    <div className="flex-grow-1">
                        <label htmlFor="attendance-date" className="form-label fw-bold">Attendance Date</label>
                        <input type="date" id="attendance-date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    
                    <div className="flex-grow-1">
                        <label htmlFor="search-employee" className="form-label fw-bold">Search Employee</label>
                        <input 
                            type="text" 
                            id="search-employee" 
                            className="form-control" 
                            placeholder="Find by name..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>
                 <div className="card-footer d-flex gap-2">
                    <button onClick={() => handleSelectAll('Present')} className="btn btn-sm btn-outline-primary">Mark All Present</button>
                    <button onClick={() => handleSelectAll('Absent')} className="btn btn-sm btn-outline-danger">Mark All Absent</button>
                </div>
            </div>
            
            {loading ? <div className="text-center p-5"><div className="spinner-border"></div></div> : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Name & Salary</th>
                                <th>Phone</th>
                                <th style={{minWidth: '150px'}}>Status</th>
                                <th style={{width: '150px'}}>Hours Worked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(emp => (
                                <tr key={emp._id}>
                                    {/* ✨ SALARY IS NOW DISPLAYED HERE ✨ */}
                                    <td>
                                        <div>{emp.name}</div>
                                        <small className="text-success fw-bold">
                                            Salary: ₹{parseFloat(emp.calculatedSalary).toLocaleString('en-IN')}
                                        </small>
                                    </td>
                                    <td>{emp.phone}</td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={attendance[emp._id]?.status || ''}
                                            onChange={e => handleAttendanceChange(emp._id, 'status', e.target.value)}
                                        >
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                            <option value="Half-day">Half-day</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number" className="form-control"
                                            min="0" max="12" step="0.5"
                                            value={attendance[emp._id]?.hoursWorked || 0}
                                            onChange={e => handleAttendanceChange(emp._id, 'hoursWorked', e.target.value)}
                                            disabled={attendance[emp._id]?.status === 'Absent'}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button
                className="btn btn-primary mt-3 w-100"
                onClick={handleSubmit}
                disabled={submitting || loading || employees.length === 0}
            >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
            </button>
        </div>
    );
};

export default ManagerAttendance;