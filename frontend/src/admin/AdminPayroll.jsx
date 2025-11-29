import React, { useEffect, useState } from "react";
import API from "../utils/api";

const AdminPayroll = () => {
  const [managers, setManagers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);

  useEffect(() => {
    API.get("/managers").then(res => setManagers(res.data));
  }, []);

  const fetchPayroll = async () => {
    const res = await API.get(`/payroll/manager/${selected}/${year}/${month}`);
    setReport(res.data);
  };

  return (
    <div className="container py-4">
      <h2>Payroll Processing</h2>

      <select className="form-select mt-3" onChange={(e) => setSelected(e.target.value)}>
        <option>Select Manager</option>
        {managers.map(m => (
          <option key={m._id} value={m._id}>{m.name}</option>
        ))}
      </select>

      <button className="btn btn-primary mt-3" onClick={fetchPayroll}>
        Generate Payroll
      </button>

      {report && (
        <div className="card mt-4 p-3">
          <h4>{report.name}</h4>
          <p><strong>Base Salary:</strong> ₹{report.baseSalary}</p>
          <p>Present Days: {report.presentDays}</p>
          <p>Leave Days: {report.leaveDays}</p>
          <p>Absent Days: {report.absentDays}</p>
          <p><strong>PF:</strong> ₹{report.pfAmount.toFixed(2)}</p>
          <p><strong>ESI:</strong> ₹{report.esiAmount.toFixed(2)}</p>
          <p><strong>Leave Deduction:</strong> ₹{report.leaveDeduction.toFixed(2)}</p>
          <h4 className="text-success">Net Salary: ₹{report.netSalary.toFixed(2)}</h4>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
