import crypto from 'crypto';

export const generateRandomBytes = (size = 32) => {
  return crypto.randomBytes(size).toString('hex');
};

export const hashToken = token => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateResetToken = () => {
  const resetToken = generateRandomBytes();
  const hashedToken = hashToken(resetToken);

  return {
    resetToken,
    hashedToken,
  };
};

export const compareTokens = (plainToken, hashedToken) => {
  const hashOfPlain = hashToken(plainToken);
  return hashOfPlain === hashedToken;
};

export const generateTokenExpiry = (minutes = 30) => {
  return Date.now() + minutes * 60 * 1000;
};

export const isTokenExpired = expiryTime => {
  return Date.now() > expiryTime;
};

export const sanitizeUserData = user => {
  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.resetPasswordToken;
  delete sanitizedUser.resetPasswordExpire;
  return sanitizedUser;
};
