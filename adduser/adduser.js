const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../backend/models/User'); // Update the path if needed

const MONGO_URI = 'mongodb://127.0.0.1:27017/cementcrm';

async function createUser(name, email, password, role, shift = '') {
  try {
    await mongoose.connect(MONGO_URI);

    const existing = await User.findOne({ email });
    if (existing) return console.log(`${email} already exists`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, role, shift });
    await user.save();

    console.log(`✅ Created user: ${email}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

createUser('Arul', 'arul@gmail.com', '123', 'admin');
createUser('Kumar', 'kumar@gmail.com', '123', 'manager', 'morning');
