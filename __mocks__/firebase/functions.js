/**
 * 중앙화된 Firebase Functions Mock
 * This sophisticated mock supports httpsCallable and provides controllable mock functions for testing
 */

// This is the controllable mock function that tests can import and configure
export const _mockCallable = jest.fn(() =>
  Promise.resolve({
    data: {
      success: true,
      result: 'mock-result',
      recommendations: [],
      activityFeedId: 'mock-activity-id',
    },
  })
);

// Mock the Firebase Functions instance
export const getFunctions = jest.fn(() => ({
  region: 'us-central1',
  timeout: 60,
  name: 'mock-functions-instance',
}));

// Mock httpsCallable - returns our controllable mock function
export const httpsCallable = jest.fn((functions, functionName) => {
  console.log(`🔧 Mock httpsCallable created for function: ${functionName}`);

  // Create a function-specific mock that delegates to the controllable _mockCallable
  const callableFunction = jest.fn(data => {
    console.log(`🔥 Mock Firebase Function called: ${functionName}`, data);

    // If _mockCallable has a custom implementation, use it
    if (_mockCallable.getMockImplementation()) {
      return _mockCallable(data, functionName);
    }

    // Otherwise, return the mocked resolved value or default
    if (_mockCallable._isMockFunction && _mockCallable.mock.results.length > 0) {
      return _mockCallable(data, functionName);
    }

    // Default successful response
    return Promise.resolve({
      data: {
        success: true,
        functionName,
        receivedData: data,
        mockResponse: true,
        recommendations: data?.recommendations || [],
        activityFeedId: `activity-${Date.now()}`,
        result: `Mock result for ${functionName}`,
      },
    });
  });

  // Add metadata for debugging and testing
  callableFunction.functionName = functionName;
  callableFunction._isMockCallable = true;

  return callableFunction;
});

// Mock Firebase Functions emulator connection
export const connectFunctionsEmulator = jest.fn((functions, host, port) => {
  console.log(`🔧 Mock Functions Emulator connected to ${host}:${port}`);
});

// Helper function to reset all mocks (useful for test cleanup)
export const __resetFunctionsMocks = () => {
  getFunctions.mockClear();
  httpsCallable.mockClear();
  connectFunctionsEmulator.mockClear();
  _mockCallable.mockReset();

  // Reset to default successful implementation
  _mockCallable.mockResolvedValue({
    data: {
      success: true,
      result: 'mock-result',
      recommendations: [],
      activityFeedId: 'mock-activity-id',
    },
  });
};

// Initialize with default implementation
_mockCallable.mockResolvedValue({
  data: {
    success: true,
    result: 'mock-result',
    recommendations: [],
    activityFeedId: 'mock-activity-id',
  },
});

// Default export for compatibility
export default {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  _mockCallable,
  __resetFunctionsMocks,
};
