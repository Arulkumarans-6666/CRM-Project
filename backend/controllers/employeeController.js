const Employee = require('../models/Employee');
const EmployeeAttendance = require('../models/EmployeeAttendance');

// CREATE a new employee
exports.createEmployee = async (req, res) => {
  try {
    const emp = new Employee(req.body);
    await emp.save();
    res.status(201).json(emp);
  } catch (err) {
    console.error("Error creating employee:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// GET ALL employees (basic list)
exports.getAllEmployees = async (req, res) => {
  try {
    const emps = await Employee.find();
    res.json(emps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET employees BY SHIFT (with salary calculation)
exports.getEmployeesByShift = async (req, res) => {
  try {
    const employees = await Employee.find({ shift: req.params.shift });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const employeeIds = employees.map(emp => emp._id);
    const allAttendanceRecords = await EmployeeAttendance.find({
        employeeId: { $in: employeeIds },
        date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const employeesWithSalary = employees.map(employee => {
        const recordsForThisEmployee = allAttendanceRecords.filter(
            record => record.employeeId.toString() === employee._id.toString()
        );

        let totalHoursWorked = 0;
        recordsForThisEmployee.forEach(record => {
            if (record.status === 'Present') totalHoursWorked += record.hoursWorked;
            else if (record.status === 'Half-day') totalHoursWorked += 4;
        });

        const monthlyTotalStandardHours = 26 * 8;
        const perHourRate = employee.baseSalary > 0 ? employee.baseSalary / monthlyTotalStandardHours : 0;
        const calculatedSalary = totalHoursWorked * perHourRate;

        return {
            ...employee.toObject(),
            calculatedSalary: calculatedSalary.toFixed(2),
        };
    });

    res.json(employeesWithSalary);
  } catch (err) {
    console.error("Error fetching employees by shift with salary:", err.message);
    res.status(500).json({ error: "Server Error: Could not fetch employees." });
  }
};

// GET a single employee BY ID (with salary calculation)
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const attendanceRecords = await EmployeeAttendance.find({
        employeeId: req.params.id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalHoursWorked = 0;
    let presentDays = 0;
    attendanceRecords.forEach(record => {
        if (record.status === 'Present') {
            totalHoursWorked += record.hoursWorked;
            presentDays++;
        } else if (record.status === 'Half-day') {
            totalHoursWorked += 4;
            presentDays += 0.5;
        }
    });

    const monthlyTotalStandardHours = 26 * 8;
    const perHourRate = employee.baseSalary > 0 ? employee.baseSalary / monthlyTotalStandardHours : 0;
    const calculatedSalary = totalHoursWorked * perHourRate;
    
    const employeeData = employee.toObject();
    employeeData.calculatedSalary = calculatedSalary.toFixed(2);
    employeeData.attendanceDays = presentDays;

    res.json(employeeData);
  } catch (err) {
    console.error("Error fetching employee by ID:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE an employee
exports.updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ msg: "Employee not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Employee not found" });
    res.json({ msg: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};