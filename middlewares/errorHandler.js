module.exports = (err, req, res, next) => {
  console.error('Error Details:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  // In development, send detailed error info
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    return res.status(500).json({ 
      message: err.message,
      stack: err.stack,
      error: 'Internal Server Error'
    });
  }
  
  // In production, send generic error
  res.status(500).json({ message: 'Internal Server Error' });
};
