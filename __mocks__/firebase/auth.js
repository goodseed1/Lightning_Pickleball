// Firebase Auth Mock
const mockUser = { uid: 'mock-user-id', email: 'test@example.com' };

const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
  signOut: jest.fn(() => Promise.resolve()),
};

export const getAuth = jest.fn(() => mockAuth);
export const onAuthStateChanged = jest.fn((auth, callback) => {
  // 즉시 콜백 실행으로 초기화 완료
  callback(mockUser);
  return jest.fn(); // unsubscribe function
});
export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: mockUser }));
export const signOut = jest.fn(() => Promise.resolve());

export default {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
};
