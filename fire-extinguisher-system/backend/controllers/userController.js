const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/users — Admin: list all users
const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/users/:id
const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// PUT /api/users/:id — Admin: update role
const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Inspector', 'User'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true, message: 'User role updated.' });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id — Admin only
const remove = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, updateRole, remove };
