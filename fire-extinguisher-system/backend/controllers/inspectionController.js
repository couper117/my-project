const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

// GET /api/inspections
const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { extinguisher_id, inspector_id, status } = req.query;

    let query = `
      SELECT i.*, e.serial_number, e.location, e.type AS extinguisher_type,
             u.first_name, u.last_name
      FROM inspections i
      JOIN extinguishers e ON i.extinguisher_id = e.id
      JOIN users u ON i.inspector_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (extinguisher_id) { query += ' AND i.extinguisher_id = ?'; params.push(extinguisher_id); }
    if (inspector_id)    { query += ' AND i.inspector_id = ?';    params.push(inspector_id); }
    if (status)          { query += ' AND i.status = ?';          params.push(status); }

    const [countRows] = await pool.execute(
      query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) AS total FROM'), params
    );
    const total = countRows[0].total;

    query += ' ORDER BY i.inspection_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// GET /api/inspections/:id
const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT i.*, e.serial_number, e.location, u.first_name, u.last_name
       FROM inspections i
       JOIN extinguishers e ON i.extinguisher_id = e.id
       JOIN users u ON i.inspector_id = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Inspection not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/inspections
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { extinguisher_id, inspection_date, status, notes } = req.body;
    const inspector_id = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO inspections (extinguisher_id, inspector_id, inspection_date, status, notes) VALUES (?, ?, ?, ?, ?)',
      [extinguisher_id, inspector_id, inspection_date, status, notes || null]
    );
    res.status(201).json({ success: true, message: 'Inspection logged.', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

// Schedule an inspection (user selects date + extinguisher)
// POST /api/inspections/schedule
const schedule = async (req, res, next) => {
  try {
    const { extinguisher_id, scheduled_date, notes } = req.body;
    const inspector_id = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO inspections (extinguisher_id, inspector_id, inspection_date, status, notes) VALUES (?, ?, ?, ?, ?)',
      [extinguisher_id, inspector_id, scheduled_date, 'Pending', notes || null]
    );
    res.status(201).json({ success: true, message: 'Inspection scheduled.', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, schedule };
