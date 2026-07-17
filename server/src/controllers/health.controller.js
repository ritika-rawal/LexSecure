export const getHealthStatus = async (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LexSecure API is running',
  });
};
