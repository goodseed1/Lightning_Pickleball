// Firebase App Mock
export const initializeApp = jest.fn();
export const getApp = jest.fn(() => ({ name: 'mock-app' }));
export const getApps = jest.fn(() => []);

export default {
  initializeApp,
  getApp,
  getApps,
};
