import express from 'express';
import path from 'path';
import morgan from 'morgan';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';
import bookRouter from './routes/bookRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import viewRouter from './routes/viewRoutes.js';

const app = express();

// PUG setup
app.set('view engine', 'pug');
app.set('views', path.join(import.meta.dirname, 'views'));

// Serve Static Files
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Global Security HTTP Headers Setter Middleware
app.use(helmet({ contentSecurityPolicy: false })); // for axios in frontend

// Global Rate Limiting Middleware (For requests coming from the same IP address)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, message: 'Too many requests, try again later.' });
app.use('/api', limiter);

// 3rd Party Middleware (Logger for development)
process.env.NODE_ENV === 'development' && app.use(morgan('dev'));

// Body Parser Middleware (With limiter)
app.use(express.json({ limit: '10kb' }));

// For sending form data coming from the front
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// For parsing cookies coming from the front-end
app.use(cookieParser());

// Query Parser Middleware (to parse brackets into objects)
app.set('query parser', 'extended');

// Own Middleware (For testing)
app.use((req, res, next) => {
  req.requestTime = new Date().toLocaleString('lt-LT');
  next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Unmatched routes
app.use((req, res, next) => {
  next(new AppError(`🔎 Can't find ${req.url} on this server...`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

export default app;
