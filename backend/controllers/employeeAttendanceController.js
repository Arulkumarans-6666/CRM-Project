const EmployeeAttendance = require('../models/EmployeeAttendance');

/**
 * @desc    Mark or update attendance for multiple employees at once
 * @route   POST /api/employee-attendance/bulk
 * @access  Private
 */
exports.markBulkAttendance = async (req, res) => {
  const { date, records } = req.body; // records is an array: [{ employeeId, status, hoursWorked }]
  
  try {
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { employeeId: record.employeeId, date: new Date(date) },
        update: {
          $set: {
            status: record.status,
            hoursWorked: record.hoursWorked
          }
        },
        upsert: true // Creates a new document if one doesn't exist to update
      }
    }));

    if (bulkOps.length > 0) {
      await EmployeeAttendance.bulkWrite(bulkOps);
    }
    
    res.status(200).json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Bulk attendance marking failed:', error);
    res.status(500).json({ error: 'Server error while marking attendance.' });
  }
};

/**
 * @desc    Get all attendance records for a single employee
 * @route   GET /api/employee-attendance/:employeeId
 * @access  Private
 */
exports.getAttendanceByEmployee = async (req, res) => {
    try {
        const records = await EmployeeAttendance.find({ employeeId: req.params.employeeId }).sort({ date: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance records.' });
    }
};

/**
 * @desc    Get all attendance records for a specific date
 * @route   GET /api/employee-attendance/date/:date
 * @access  Private
 */
exports.getAttendanceByDate = async (req, res) => {
    try {
        const records = await EmployeeAttendance.find({ date: new Date(req.params.date) });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance records for the date.' });
    }
};