// Centralized AuthService Mock
// This mock provides consistent authentication state across all tests

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  photoURL: null,
  phoneNumber: null,
  providerId: 'firebase',
};

// Create controllable mock functions that tests can manipulate
// Support both sync and async calls - some services call getCurrentUser() synchronously
const _mockGetCurrentUser = jest.fn(() => mockUser); // Return directly, not Promise
const _mockIsAuthenticated = jest.fn(() => true); // Return directly, not Promise
const _mockOnAuthStateChanged = jest.fn(() => () => {}); // Returns unsubscribe function
const _mockSignIn = jest.fn(() => Promise.resolve({ user: mockUser }));
const _mockSignOut = jest.fn(() => Promise.resolve());
const _mockCreateAccount = jest.fn(() => Promise.resolve({ user: mockUser }));
const _mockSendPasswordReset = jest.fn(() => Promise.resolve());
const _mockDeleteAccount = jest.fn(() => Promise.resolve());
const _mockUpdateProfile = jest.fn(() => Promise.resolve());

// AuthService mock object matching the real API
const authService = {
  __esModule: true, // ES Module 호환성을 위한 필수 키

  // Default export - 실제 authService와 동일한 API
  default: {
    getCurrentUser: _mockGetCurrentUser,
    isAuthenticated: _mockIsAuthenticated,
    onAuthStateChanged: _mockOnAuthStateChanged,
    signInWithEmailAndPassword: _mockSignIn,
    signOut: _mockSignOut,
    createUserWithEmailAndPassword: _mockCreateAccount,
    sendPasswordResetEmail: _mockSendPasswordReset,
    deleteUser: _mockDeleteAccount,
    updateUserProfile: _mockUpdateProfile,
  },

  // 테스트에서 직접 제어할 수 있는 mock 함수들을 export
  _mockGetCurrentUser,
  _mockIsAuthenticated,
  _mockOnAuthStateChanged,
  _mockSignIn,
  _mockSignOut,
  _mockCreateAccount,
  _mockSendPasswordReset,
  _mockDeleteAccount,
  _mockUpdateProfile,

  // 테스트에서 사용할 수 있는 헬퍼 함수들
  _setMockUser: user => {
    _mockGetCurrentUser.mockReturnValue(user);
    _mockIsAuthenticated.mockReturnValue(!!user);
  },

  _setLoggedOut: () => {
    _mockGetCurrentUser.mockReturnValue(null);
    _mockIsAuthenticated.mockReturnValue(false);
  },

  _setLoggedIn: (user = mockUser) => {
    _mockGetCurrentUser.mockReturnValue(user);
    _mockIsAuthenticated.mockReturnValue(true);
  },

  _simulateAuthError: (error = new Error('Authentication failed')) => {
    _mockGetCurrentUser.mockImplementation(() => {
      throw error;
    });
    _mockIsAuthenticated.mockImplementation(() => {
      throw error;
    });
  },

  _reset: () => {
    // 모든 mock 함수들을 초기 상태로 리셋
    _mockGetCurrentUser.mockReturnValue(mockUser);
    _mockIsAuthenticated.mockReturnValue(true);
    _mockOnAuthStateChanged.mockReturnValue(() => {});
    _mockSignIn.mockResolvedValue({ user: mockUser });
    _mockSignOut.mockResolvedValue();
    _mockCreateAccount.mockResolvedValue({ user: mockUser });
    _mockSendPasswordReset.mockResolvedValue();
    _mockDeleteAccount.mockResolvedValue();
    _mockUpdateProfile.mockResolvedValue();
  },
};

// 초기화
authService._reset();

module.exports = authService;
