import Book from '../models/bookModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

const getBooks = async (req, res) => {
  // 1. Get books data from collection
  const books = await Book.find().sort('-createdAt');
  // 2. Build template
  // 3. Render template using books data
  res.status(200).render('books', { title: 'All books', books });
};

const getBook = async (req, res, next) => {
  // 1. Get data for the requested book
  const book = await Book.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'rating review user',
  });
  if (!book) return next(new AppError('There is no book with that name.', 404));
  // 2. Build a template
  // 3. Render template using data
  res.status(200).render('book', { title: book.title, book });
};

const addBook = (req, res) => {
  res.status(200).render('addBook', { title: 'Add new book' });
};

const editBook = async (req, res, next) => {
  const book = await Book.findOne({ slug: req.params.slug });
  if (!book) return next(new AppError('There is no book with that name.', 404));
  res.status(200).render('editBook', { title: 'Update book', book });
};

const getLogin = (req, res) => {
  res.status(200).render('login', { title: 'Login' });
};

const getSignUp = (req, res) => {
  res.status(200).render('signup', { title: 'Sign up' });
};

const getAccount = (req, res) => {
  res.status(200).render('account', { title: 'My Account' });
};

const updateUser = async (req, res) => {
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { username: req.body.username, email: req.body.email },
    { new: true, runValidators: true },
  );
  res.status(200).render('account', { title: 'My Account', user: updatedUser });
};

export { getBooks, getBook, addBook, editBook, getLogin, getSignUp, getAccount, updateUser };
