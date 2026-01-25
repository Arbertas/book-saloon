import express from 'express';
import {
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
} from '../controllers/userController.js';
import {
  signup,
  login,
  protect,
  restrictTo,
  forgottenPassword,
  resetPassword,
  updatePassword,
  logout,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgottenPassword);
router.patch('/resetPassword/:token', resetPassword);
router.get('/logout', logout);

router.use(protect); // protect all routes after this middleware

router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', uploadAvatar, resizeAvatar, updateMe);
router.delete('/deleteMe', deleteMe);
router.get('/me', getMe, getOneUser);

router.use(restrictTo('admin')); // and restrict all routes to admin after this middleware

router.route('/').get(getAllUsers).post(addNewUser);
router.route('/:id').get(getOneUser).patch(updateUser).delete(deleteUser);

export default router;
