const { pool } = require('../config/db');

// GET /api/reports/summary — Dashboard summary stats
const getSummary = async (req, res, next) => {
  try {
    const [[total]]    = await pool.execute('SELECT COUNT(*) AS count FROM extinguishers');
    const [[active]]   = await pool.execute("SELECT COUNT(*) AS count FROM extinguishers WHERE status = 'Active'");
    const [[expired]]  = await pool.execute("SELECT COUNT(*) AS count FROM extinguishers WHERE status = 'Expired' OR expiry_date < CURDATE()");
    const [[maintenance]] = await pool.execute("SELECT COUNT(*) AS count FROM extinguishers WHERE status = 'Under Maintenance'");
    const [[inspections_total]] = await pool.execute('SELECT COUNT(*) AS count FROM inspections');
    const [[inspections_pending]] = await pool.execute("SELECT COUNT(*) AS count FROM inspections WHERE status = 'Pending'");
    const [[maintenance_total]] = await pool.execute('SELECT COUNT(*) AS count FROM maintenance');

    res.json({
      success: true,
      data: {
        extinguishers: {
          total: total.count,
          active: active.count,
          expired: expired.count,
          under_maintenance: maintenance.count,
        },
        inspections: {
          total: inspections_total.count,
          pending: inspections_pending.count,
        },
        maintenance: {
          total: maintenance_total.count,
        },
      },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/stock — Total number of extinguishers grouped by type/status
const getStock = async (req, res, next) => {
  try {
    const [byType]   = await pool.execute('SELECT type, COUNT(*) AS count FROM extinguishers GROUP BY type');
    const [byStatus] = await pool.execute('SELECT status, COUNT(*) AS count FROM extinguishers GROUP BY status');
    const [bySize]   = await pool.execute('SELECT size, COUNT(*) AS count FROM extinguishers GROUP BY size');

    res.json({ success: true, data: { by_type: byType, by_status: byStatus, by_size: bySize } });
  } catch (err) { next(err); }
};

// GET /api/reports/daily — Inspections + maintenance for today
const getDaily = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const [inspections] = await pool.execute(
      `SELECT i.*, e.serial_number, e.location, u.first_name, u.last_name
       FROM inspections i
       JOIN extinguishers e ON i.extinguisher_id = e.id
       JOIN users u ON i.inspector_id = u.id
       WHERE DATE(i.inspection_date) = ?`,
      [date]
    );
    const [maintenances] = await pool.execute(
      `SELECT m.*, e.serial_number, u.first_name, u.last_name
       FROM maintenance m
       JOIN extinguishers e ON m.extinguisher_id = e.id
       JOIN users u ON m.inspector_id = u.id
       WHERE DATE(m.maintenance_date) = ?`,
      [date]
    );

    res.json({
      success: true,
      report_type: 'daily',
      date,
      data: { inspections, maintenance: maintenances },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/monthly — Activity grouped by month
const getMonthly = async (req, res, next) => {
  try {
    const year  = req.query.year  || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1);

    const [inspections] = await pool.execute(
      `SELECT i.*, e.serial_number, e.location, u.first_name, u.last_name
       FROM inspections i
       JOIN extinguishers e ON i.extinguisher_id = e.id
       JOIN users u ON i.inspector_id = u.id
       WHERE YEAR(i.inspection_date) = ? AND MONTH(i.inspection_date) = ?`,
      [year, month]
    );
    const [maintenances] = await pool.execute(
      `SELECT m.*, e.serial_number, u.first_name, u.last_name
       FROM maintenance m
       JOIN extinguishers e ON m.extinguisher_id = e.id
       JOIN users u ON m.inspector_id = u.id
       WHERE YEAR(m.maintenance_date) = ? AND MONTH(m.maintenance_date) = ?`,
      [year, month]
    );

    res.json({
      success: true,
      report_type: 'monthly',
      year,
      month,
      data: { inspections, maintenance: maintenances },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/yearly
const getYearly = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const [inspectionsByMonth] = await pool.execute(
      `SELECT MONTH(inspection_date) AS month, COUNT(*) AS count,
              SUM(status = 'Pass') AS passed, SUM(status = 'Fail') AS failed
       FROM inspections WHERE YEAR(inspection_date) = ? GROUP BY MONTH(inspection_date)`,
      [year]
    );
    const [maintenanceByMonth] = await pool.execute(
      `SELECT MONTH(maintenance_date) AS month, COUNT(*) AS count
       FROM maintenance WHERE YEAR(maintenance_date) = ? GROUP BY MONTH(maintenance_date)`,
      [year]
    );
    const [expiredThisYear] = await pool.execute(
      'SELECT * FROM extinguishers WHERE YEAR(expiry_date) = ?',
      [year]
    );

    res.json({
      success: true,
      report_type: 'yearly',
      year,
      data: {
        inspections_by_month: inspectionsByMonth,
        maintenance_by_month: maintenanceByMonth,
        expired_extinguishers: expiredThisYear,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/export — CSV export of extinguishers
const exportCSV = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM extinguishers ORDER BY id');

    const headers = ['ID', 'Serial Number', 'Type', 'Size', 'Location', 'Installation Date', 'Expiry Date', 'Status', 'Created At'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r =>
        [r.id, r.serial_number, r.type, r.size, `"${r.location}"`, r.installation_date, r.expiry_date, r.status, r.created_at].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="extinguishers.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) { next(err); }
};

// GET /api/reports/export/pdf — simple PDF-like text report
const exportPDF = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM extinguishers ORDER BY id');
    const [[total]] = await pool.execute('SELECT COUNT(*) AS count FROM extinguishers');

    // Return structured data; client will render PDF
    res.json({
      success: true,
      report: {
        title: 'Fire Extinguisher Inventory Report',
        generated_at: new Date().toISOString(),
        total: total.count,
        records: rows,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getSummary, getStock, getDaily, getMonthly, getYearly, exportCSV, exportPDF };
