// controllers/managerSalaryController.js
const Manager = require('../models/Manager');

exports.calculateManagerSalary = async (req, res) => {
  const { managerId, month } = req.body;
  try {
    const manager = await Manager.findOne({ managerId });
    if (!manager) return res.status(404).json({ msg: 'Manager not found' });

    const attendance = manager.attendance.filter(a => 
      a.date.toISOString().startsWith(month) && a.status === 'present'
    );

    const totalDays = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
    const workedDays = attendance.length;

    const dailySalary = manager.baseSalary / totalDays;

    let salary = 0;
    attendance.forEach(a => {
      const hrsRatio = a.hoursWorked / 8;
      salary += dailySalary * hrsRatio;
    });

    res.json({
      managerId,
      month,
      workedDays,
      totalDays,
      baseSalary: manager.baseSalary,
      totalSalary: salary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
