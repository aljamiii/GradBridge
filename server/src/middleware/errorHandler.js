// Central error handler: any error thrown in a controller lands here,
// so every error response has the same shape.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
};

export default errorHandler;
