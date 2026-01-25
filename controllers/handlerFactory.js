import AppError from '../utils/appError.js';

const getAll = Model => async (req, res) => {
  const queryString = JSON.stringify(req.query);
  const queryReplaced = queryString.replace(/\b(gte|gt|lte|lt)\b/g, op => '$' + op);
  const queryObject = JSON.parse(queryReplaced);
  if (req.params.bookId) queryObject.book = req.params.bookId; // for reviews on book
  const limit = req.query.limit * 1 || 100;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;

  // TO DO: manually clear parameter pollution, because hpp doesn't do shit
  // if there are multiple parameters with the same name, ignore the array (that is built by express)
  // also there should be an option to select multiple field values, like publisher="Vaga,Mintis"

  const docs = await Model.find(queryObject)
    .sort(req.query.sort?.replaceAll(',', ' ') || '-createdAt _id')
    .select(req.query.fields?.replaceAll(',', ' ') || '-__v')
    .limit(limit)
    .skip(skip);
  // .explain(); - meta info about the query

  res.status(200).json({ status: 'success', requestedAt: req.requestTime, results: docs.length, data: { docs } });
};

const getOne = (Model, populateOptions) => async (req, res, next) => {
  let query = Model.findById(req.params.id);
  if (populateOptions) query = query.populate(populateOptions);
  const doc = await query;
  if (!doc) return next(new AppError('No document found with that ID', 404));
  res.status(200).json({ status: 'success', data: { data: doc } });
};

const addNewOne = Model => async (req, res) => {
  req.body.librarian = req.user?._id;
  const newDoc = await Model.create(req.body);
  res.status(201).json({ status: 'success', data: { data: newDoc } });
};

const updateOne = Model => async (req, res, next) => {
  if (req.body.password) delete req.body.password; // use update my password route
  req.body.librarian = req.user?._id;
  const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updatedDoc) return next(new AppError('No document found with that ID', 404));
  res.status(200).json({ status: 'success', data: { data: updatedDoc } });
};

const deleteOne = Model => async (req, res, next) => {
  const docToRemove = await Model.findByIdAndDelete(req.params.id);
  if (!docToRemove) return next(new AppError('No document found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
};

export { getAll, getOne, addNewOne, updateOne, deleteOne };
