const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

exports.register = async (req, res) => {
const { name, email, password, role, phone } = req.body;
const exists = await User.findOne({ email });
if (exists) return res.status(StatusCodes.CONFLICT).json({ message: 'Email already in use' });
const user = await User.create({ name, email, password, role: role || 'user', phone });
const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });
res.status(StatusCodes.CREATED).json({
user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
token,
});


// this.set == set ;
// thsi.data == data;
};// the module backend will be set to the 
// the export will be set to the main frame of the hierkey
exports.login = async (req, res) => {
const { email, password } = req.body;
const user = await User.findOne({ email }).select('+password');
if (!user) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
const ok = await user.comparePassword(password);
if (!ok) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });
res.json({
user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
token,
});
};