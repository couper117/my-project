const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

// GET /api/extinguishers — List all (paginated)
const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, type } = req.query;

    let query = 'SELECT * FROM extinguishers WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (type)   { query += ' AND type = ?';   params.push(type); }

    const [countRows] = await pool.execute(
      query.replace('SELECT *', 'SELECT COUNT(*) AS total'), params
    );
    const total = countRows[0].total;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// GET /api/extinguishers/:id
const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM extinguishers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Extinguisher not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// POST /api/extinguishers
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { serial_number, type, size, location, installation_date, expiry_date, status } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO extinguishers (serial_number, type, size, location, installation_date, expiry_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serial_number, type, size, location, installation_date, expiry_date, status || 'Active']
    );
    const [newRow] = await pool.execute('SELECT * FROM extinguishers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Extinguisher created.', data: newRow[0] });
  } catch (err) { next(err); }
};

// PUT /api/extinguishers/:id
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { serial_number, type, size, location, installation_date, expiry_date, status } = req.body;
    const [check] = await pool.execute('SELECT id FROM extinguishers WHERE id = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Extinguisher not found.' });

    await pool.execute(
      `UPDATE extinguishers SET serial_number=?, type=?, size=?, location=?,
       installation_date=?, expiry_date=?, status=? WHERE id=?`,
      [serial_number, type, size, location, installation_date, expiry_date, status, req.params.id]
    );
    const [updated] = await pool.execute('SELECT * FROM extinguishers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Extinguisher updated.', data: updated[0] });
  } catch (err) { next(err); }
};

// DELETE /api/extinguishers/:id
const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id FROM extinguishers WHERE id = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Extinguisher not found.' });

    await pool.execute('DELETE FROM extinguishers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Extinguisher deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
