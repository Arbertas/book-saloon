import multer from 'multer';
import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { getAll, getOne, addNewOne, updateOne, deleteOne } from './handlerFactory.js';

// For saving img straight to disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'public/img/users/'),
//   filename: (req, file, cb) => {
//     const ext = file.originalname.split('.').at(-1);
//     const filename = `user-${req.user.id}-${Date.now()}.${ext}`;
//     cb(null, filename);
//   },
// });

// For saving img to memory (as buffer)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Only images are allowed.', 400), false);
};

// const upload = multer({ dest: 'public/img/users/' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadAvatar = upload.single('photo');

const resizeAvatar = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;
  await sharp(req.file.buffer)
    .resize(500, 500, { fit: 'cover', position: 'top' })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

const updateMe = async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.file);
  // 1. Create error if user POSTs password data
  const msg = 'This route is not for password updates.';
  if (req.body.password || req.body.passwordConfirm) return next(new AppError(msg, 400));
  // 2. Update user document
  // if (req.body.role) delete req.body.role;
  const allowedFields = ['username', 'email'];
  const filteredBody = {};
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });
  // Photo
  if (req.file) filteredBody.photo = req.file.filename;
  // console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
};

// Fake delete user (set active to false)
const deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
};

const getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = getAll(User);
const getOneUser = getOne(User);
const addNewUser = addNewOne(User);
const updateUser = updateOne(User);
const deleteUser = deleteOne(User);

export {
  getAllUsers,
  getOneUser,
  addNewUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadAvatar,
  resizeAvatar,
};
