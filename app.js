require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const sitemapRoutes = require('./routes/sitemap');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the view engine (for error pages)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow requests from the frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api', sitemapRoutes); // Prefix all sitemap routes with '/api'

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API is running on http://localhost:${PORT}`);
});