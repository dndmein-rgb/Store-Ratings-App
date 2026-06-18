import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import storeOwnerRoutes from './routes/storeOwnerRoutes.js';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file. See .env.example for reference.');
  process.exit(1);
}

const app = express();

// CORS configuration - restrict to specific frontend URL
const allowedOrigins = [
  'http://localhost:5173', // Development
  'http://localhost:3000',  // Alternative dev
  process.env.FRONTEND_URL, // Production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Serve static frontend files
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Serve frontend for all non-API routes (SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Generic error handler (catches anything thrown synchronously in routes)
app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Frontend served from ${frontendDistPath}`);
});

export default app;
