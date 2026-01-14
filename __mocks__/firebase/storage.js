// Firebase Storage Mock
const mockStorageRef = {
  child: jest.fn(() => mockStorageRef),
  put: jest.fn(() => Promise.resolve({ ref: mockStorageRef })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mock-url.com/image.jpg')),
};

export const getStorage = jest.fn(() => ({}));
export const ref = jest.fn(() => mockStorageRef);
export const uploadBytes = jest.fn(() => Promise.resolve({ ref: mockStorageRef }));
export const getDownloadURL = jest.fn(() => Promise.resolve('https://mock-url.com/image.jpg'));

export default {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
};
