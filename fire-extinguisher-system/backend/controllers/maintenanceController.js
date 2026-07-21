const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

// GET /api/maintenance
const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { extinguisher_id } = req.query;

    let query = `
      SELECT m.*, e.serial_number, e.location, u.first_name, u.last_name
      FROM maintenance m
      JOIN extinguishers e ON m.extinguisher_id = e.id
      JOIN users u ON m.inspector_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (extinguisher_id) { query += ' AND m.extinguisher_id = ?'; params.push(extinguisher_id); }

    const [countRows] = await pool.execute(
      query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) AS total FROM'), params
    );
    const total = countRows[0].total;

    query += ' ORDER BY m.maintenance_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// GET /api/maintenance/:id
const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, e.serial_number, e.location, u.first_name, u.last_name
       FROM maintenance m
       JOIN extinguishers e ON m.extinguisher_id = e.id
       JOIN users u ON m.inspector_id = u.id
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/maintenance
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { extinguisher_id, maintenance_date, action_taken, notes, next_maintenance_date } = req.body;
    const inspector_id = req.user.id;

    const [result] = await pool.execute(
      `INSERT INTO maintenance (extinguisher_id, inspector_id, maintenance_date, action_taken, notes, next_maintenance_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [extinguisher_id, inspector_id, maintenance_date, action_taken, notes || null, next_maintenance_date || null]
    );

    // Auto-update extinguisher status to 'Under Maintenance'
    await pool.execute("UPDATE extinguishers SET status = 'Under Maintenance' WHERE id = ?", [extinguisher_id]);

    res.status(201).json({ success: true, message: 'Maintenance logged.', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create };
