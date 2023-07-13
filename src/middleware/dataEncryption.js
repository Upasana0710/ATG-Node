import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD;
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_PASSWORD, 'salt', 32).toString('hex'); // Convert the key buffer to a hexadecimal string

const IV_LENGTH = 16; // AES block size is 16 bytes

// Function to encrypt data using AES algorithm
export const encryptData = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => encryptText(item));
  }
  return encryptText(data);
};

// Function to encrypt text using AES algorithm
const encryptText = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH).toString('hex'); // Convert the IV buffer to a hexadecimal string
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv}:${encrypted.toString('hex')}`;
};

// Function to decrypt data using AES algorithm
export const decryptData = (data) => {
  if (!data) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => decryptText(item));
  }
  return decryptText(data);
};

// Function to decrypt text using AES algorithm
// const decryptText = (text) => {
//   if (!text) {
//     return text;
//   }

//   const [iv, encryptedData] = text.split(':');
//   const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
//   let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   console.log(decrypted.toString());
//   return decrypted.toString();
// };
// Function to decrypt text using AES algorithm
export const decryptText = (text) => {
  if (!text) {
    return text;
  }

  const [iv, encryptedData] = text.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
