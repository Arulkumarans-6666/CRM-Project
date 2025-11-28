const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Salary = require('../models/Salary');

exports.calculateSalary = async (req, res) => {
  const { employeeId, month } = req.body;
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    const attendance = await Attendance.find({
      employeeId,
      date: { $regex: `^${month}` },
      status: 'present'
    });

    const workedDays = attendance.length;
    const base = 20000;
    const bonus = employee.experience >= 5 ? 20000 : 5000;
    const totalSalary = ((base + bonus) / 30) * workedDays;

    const salary = await Salary.create({
      employeeId,
      month,
      baseSalary: base + bonus,
      workedDays,
      totalSalary,
    });

    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
