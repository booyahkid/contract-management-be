module.exports = (err, req, res, next) => {
  console.error('Error Details:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      message: 'File size too large. Maximum size is 10MB.' 
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      message: 'Unexpected file field.' 
    });
  }
  
  if (err.message && err.message.includes('File type') && err.message.includes('not allowed')) {
    return res.status(400).json({ 
      message: err.message 
    });
  }
  
  // Handle other validation errors
  if (err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({ 
      message: err.message || 'Bad Request' 
    });
  }
  
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
