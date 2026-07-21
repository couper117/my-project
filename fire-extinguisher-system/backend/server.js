require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { initDatabase } = require('./config/db');
const { errorHandler, requestLogger, notFound } = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth');
const extRoutes         = require('./routes/extinguishers');
const activityRoutes    = require('./routes/activity');
const adminRoutes       = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Swagger Docs ──────────────────────────────────────────────────────────────
try {
  const swaggerDoc = YAML.load('./swagger.yaml');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  console.log('📄 Swagger docs available at /api/docs');
} catch (e) {
  console.warn('Swagger YAML not found, skipping docs.');
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({ message: 'TZW LTD Fire Extinguisher Management API v1.0', docs: '/api/docs' })
);

app.use('/api/auth',          authRoutes);
app.use('/api/extinguishers', extRoutes);
app.use('/api',               activityRoutes);   // /api/inspections + /api/maintenance
app.use('/api',               adminRoutes);       // /api/reports + /api/users

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

start();
