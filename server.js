process.on('uncaughtException', err => {
  console.log('💩 Uncaught exception! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

import mongoose from 'mongoose';
import 'dotenv/config';
import app from './app.js';

console.log(`Environment: ${process.env.NODE_ENV}`);

let DB = process.env.DATABASE;
DB = DB.replace('<DB_USERNAME>', process.env.DB_USERNAME);
DB = DB.replace('<DB_PASSWORD>', process.env.DB_PASSWORD);
DB = DB.replace('<DB_NAME>', process.env.DB_NAME);

mongoose.connect(DB).then(() => console.log('Database connected!'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => console.log(`Listening on port ${port}...`));

process.on('unhandledRejection', err => {
  console.log('💩 Unhandled rejection! Shutting down...');
  console.log(err.name, err.message);
  // 0 - success, 1 - unhandled rejection / uncaught exception
  server.close(() => process.exit(1));
});
