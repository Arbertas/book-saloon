import AppError from '../utils/appError.js';

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: ${err.keyValue?.uniqueValue}. Use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}. Adjust your values.`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  const message = `Invalid token. Log in again.`;
  return new AppError(message, 401);
};

const handleExpiredTokenError = () => {
  const message = `Token has expired. Log in again.`;
  return new AppError(message, 401);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message, error: err, stack: err.stack.split('\n    ') });
  } else {
    // WEBSITE
    console.error('💩 Error!', err);
    res.status(err.statusCode).render('error', { title: 'Something went wrong!', msg: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API
    if (err.isOperational) {
      // For operational, trusted errors: send message to client
      res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
      // Programming, unknown errors: don't leak error details to client
      console.error('💩 Error!', err);
      res.status(500).json({ status: 'error', message: '💩 Something went very very wrong...' });
    }
  } else {
    // WEBSITE
    if (err.isOperational) {
      // For operational, trusted errors: send message to client
      res.status(err.statusCode).render('error', { title: 'Something went wrong!', msg: err.message });
    } else {
      // Programming, unknown errors: don't leak error details to client
      console.error('💩 Error!', err);
      res.status(err.statusCode).render('error', { title: 'Something went wrong!', msg: 'Try again later.' });
    }
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrorDev(err, req, res);

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleExpiredTokenError();

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
