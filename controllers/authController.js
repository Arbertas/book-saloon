import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import Email from '../utils/email.js';

// Email class replaced sendEmail fn
const sendEmail = async options => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    // FOR GMAIL (max 500 emails/day)
    // service: 'Gmail',
    // auth: {user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD}
    // activate gmail 'less secure app' (in gmail settings)
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    // secure: false,
    // logger: true,
  });
  // 2. Define email options
  const mailOptions = {
    from: 'Eraam X <info@booksaloon.io>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    // html: ''
  };
  // 3. Send email via nodemailer
  await transporter.sendMail(mailOptions);
};

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const expires = new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600 * 1000);
  const options = { expires, secure: false, httpOnly: true };
  if (process.env.NODE_ENV === 'production') options.secure = true;
  res.cookie('jwt', token, options);
  res.status(statusCode).json({ status: 'success', token });
};

const signup = async (req, res) => {
  if (req.body.role) delete req.body.role;
  const newUser = await User.create(req.body);
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const token = signToken(newUser._id);
  const expires = new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600 * 1000);
  const options = { expires, secure: false, httpOnly: true };
  if (process.env.NODE_ENV === 'production') options.secure = true;
  res.cookie('jwt', token, options);
  newUser.password = undefined;
  const url = `${req.protocol}://${req.get('host')}/account`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  res.status(201).json({ status: 'success', token, data: { user: newUser } });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email & password exist
  if (!email || !password) return next(new AppError('Provide email and password.', 400));
  // 2. Check if the user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  const correct = await user?.correctPassword(password, user.password);
  if (!user || !correct) return next(new AppError('Incorrect email or password.', 401));
  // 3. If all ok, sent jwt token to client
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  // const token = signToken(user._id);
  // res.status(200).json({ status: 'success', token });
  createAndSendToken(user, 200, res);
};

// Logout for the frontend
const logout = (req, res) => {
  // res.cookie('jwt', 'logged-out', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

const protect = async (req, res, next) => {
  // 1. Get token and check
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) token = req.headers.authorization.split(' ').at(1);
  else if (req.cookies.jwt) token = req.cookies.jwt;
  if (!token) return next(new AppError('Log in to get access.', 401));
  // 2. Validate token (verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3. Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError('User belonging to this token no longer exists.', 401));
  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password. Log in again.', 401));
  }
  // 5. Grant access to protected route and add user into the request object
  req.user = currentUser;
  res.locals.user = currentUser; // for frontend
  next();
};

// Only for the rendered pages, no errors.
const isLoggedIn = async (req, res, next) => {
  // 1. Get token and check
  if (req.cookies.jwt) {
    const token = req.cookies.jwt;
    // 1. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 2. Check if user still exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();
    // 3. Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();
    // 4. Add current user to the locals
    res.locals.user = currentUser;
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'librarian'], req.user.role = 'user'
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have a permission to perform this action.", 403));
    }
    next();
  };
};

const forgottenPassword = async (req, res, next) => {
  // 1. Get user based on email
  const user = await User.findOne({ email: req.body.email });
  // Not a good practice to inform about existing emails
  // if (!user) return next(new AppError('No user was found with email provided.', 404));
  const message = 'If your email exists in our database, you will receive a link to reset your password.';
  if (!user) {
    return res.status(200).json({ status: 'success', message });
  }
  // 2. Generate random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateModifiedOnly: true });
  // 3. Send it to user's email
  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  // let text = `Forgot password? Change your password using the following URL:\n${resetURL}`;
  // text += "\nIf you didn't forget your password, ignore this email.";
  try {
    // await sendEmail({ email: user.email, subject: 'Password reset token (valid for 10 minutes)', text });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({ status: 'success', message });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('An error sending password reset email. Try again later.', 500));
  }
};

const resetPassword = async (req, res, next) => {
  // 1. Get user by token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  // 2. If token not expired and the user exists, set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. Update changedPasswordAt property for the user (moved to model pre hook)
  // 4. Log user in, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({ status: 'success', token });
  createAndSendToken(user, 200, res);
};

const updatePassword = async (req, res, next) => {
  // 1. Get user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new AppError('Log in to update password.', 401));
  // 2. Check if POSTed password correct
  const correct = await user.correctPassword(req.body.passwordCurrent, user.password);
  if (!correct) return next(new AppError('Current password was incorrect.', 401));
  // 3. If true, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4. Log user in, send JWT
  // const token = signToken(user._id);
  // res.status(200).json({ status: 'success', token });
  createAndSendToken(user, 200, res);
};

export { signup, login, protect, restrictTo, forgottenPassword, resetPassword, updatePassword, isLoggedIn, logout };
