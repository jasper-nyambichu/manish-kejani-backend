// src/shared/utils/apiResponse.js
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode = 500, message = 'Something went wrong') => {
  return res.status(statusCode).json({ success: false, message });
};