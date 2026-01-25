import multer from 'multer';
import sharp from 'sharp';
import slugify from 'slugify';

import Book from '../models/bookModel.js';
import AppError from '../utils/appError.js';
import { getAll, getOne, addNewOne, updateOne, deleteOne } from './handlerFactory.js';

// For saving img to memory (as buffer)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Only images are allowed.', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload.single('cover') --> req.file
// upload.array('images', 3) --> req.files
const uploadBookImgs = upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'images' }]);

const resizeBookImgs = async (req, res, next) => {
  // req.body.librarian = req.user?._id;
  let slug = req.params?.id;
  if (req.body?.title) slug = slugify(req.body.title, { lower: true });

  // 1. COVER
  if (req.files?.cover) {
    req.body.cover = `cover-${slug}-${Date.now()}.jpg`;
    await sharp(req.files.cover[0].buffer)
      .resize(1000, 1500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/covers/${req.body.cover}`);
  } else if (req.body.originalCover !== 'default-cover.jpg') {
    req.body.cover = req.body.originalCover;
    delete req.body.originalCover;
  } else {
    req.body.cover = 'default-cover.jpg';
  }

  // 2. IMAGES
  // if (req.files?.images) {
  //   req.body.images = [];
  //   const promises = req.files.images.map((img, index) => {
  //     const filename = `image-${req.params.id}-${Date.now()}-${index + 1}.jpg`;
  //     sharp(img.buffer)
  //       .resize(1000, 1500)
  //       .toFormat('jpeg')
  //       .jpeg({ quality: 90 })
  //       .toFile(`public/img/images/${filename}`);
  //     req.body.images.push(filename);
  //   });
  //   await Promise.all(promises);
  // }
  next();
};

const getAllBooks = getAll(Book);
const getOneBook = getOne(Book, { path: 'reviews' }); // populate reviews
const addNewBook = addNewOne(Book);
const updateBook = updateOne(Book);
const deleteBook = deleteOne(Book);

// Middleware Function:
const aliasTop10 = (req, res, next) => {
  const sort = '-ratingsAverage,-ratingsQuantity,-createdAt,_id';
  const limit = '10';
  const fields = 'firstName,lastName,title,year,ratingsAverage';
  const qString = `?sort=${sort}&limit=${limit}&fields=${fields}`;
  req.url += qString;
  next();
};

// Aggregations:

const getBookStats = async (req, res) => {
  const bookStats = await Book.aggregate([
    // filter
    { $match: { ratingsAverage: { $gte: 0 } } },
    {
      $group: {
        // _id: null,
        // _id: '$publisher',
        _id: { $toUpper: '$publisher' },
        numBooks: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgYear: { $avg: '$year' },
        minYear: { $min: '$year' },
        maxYear: { $max: '$year' },
      },
    },
    { $sort: { numBooks: -1 } },
    // { $match: { _id: { $ne: 'VAGA1' } } },
  ]);
  res.status(200).json({ status: 'success', data: { bookStats } });
};

const getBooksByMonth = async (req, res) => {
  const year = req.params.year * 1;
  const readingStats = await Book.aggregate([
    // Separate a document for each date in the array
    { $unwind: '$readDates' },
    { $match: { readDates: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
    { $group: { _id: { $month: '$readDates' }, numBooksRead: { $sum: 1 }, books: { $push: '$title' } } },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numBooksRead: -1 } },
    // { $limit: 1 },
  ]);
  res.status(200).json({ status: 'success', data: { readingStats } });
};

// Geo spacial queries
// /bookstores-within/:distance/center/:latlng/unit/:unit
// /bookstores-within/:distance/center/:54.6841394,25.285956/unit/:unit
const getBooksWithin = async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) next(new AppError('Provide latitude and longitude in the format "lat,lng".', 400));
  // console.log({ distance, lat, lng, unit });
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const books = await Book.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });
  // const books = await Book.find({});
  res.status(200).json({ status: 'success', results: books.length, data: { books } });
};

const getDistances = async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) next(new AppError('Provide latitude and longitude in the format "lat,lng".', 400));
  const multiplier = unit === 'mi' ? 0.000621 : 0.001;
  const distances = await Book.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [+lng, +lat] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    { $project: { title: 1, distance: 1 } },
  ]);
  res.status(200).json({ status: 'success', data: { data: distances } });
};

export {
  getAllBooks,
  getOneBook,
  addNewBook,
  updateBook,
  deleteBook,
  aliasTop10,
  getBookStats,
  getBooksByMonth,
  getBooksWithin,
  getDistances,
  uploadBookImgs,
  resizeBookImgs,
};
