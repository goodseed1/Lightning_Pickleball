# 🏹 [Hawkeye] Cloud Functions Testing Guide

This directory contains the test infrastructure for Lightning Pickleball Cloud Functions.

## 📋 Quick Start

```bash
# Run all tests
npm test

# Watch mode (auto-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗️ Test Infrastructure

### Setup Files

- **`setup.ts`** - Configures Firebase test environment before all tests
  - Initializes Firebase Admin SDK with test project
  - Sets up Firestore and Auth emulators
  - Configures test timeout

- **`helpers.ts`** - Common testing utilities
  - Mock data generators (tournaments, users, clubs, etc.)
  - Firestore test helpers (seed, clear, assertions)
  - Cloud Function call helpers

### File Structure

```
functions/src/__tests__/
├── README.md           # This file
├── setup.ts            # Jest setup (runs before all tests)
└── helpers.ts          # Shared test utilities

functions/src/utils/__tests__/
├── stateMachine.test.ts    # Example test file
└── (other utility tests)
```

## ✍️ Writing Tests

### Basic Test Pattern

```typescript
import { clearFirestoreData, seedFirestore, createMockTournament } from '../../__tests__/helpers';

describe('Your Function Name', () => {
  beforeEach(async () => {
    // Clear Firestore before each test
    await clearFirestoreData();
  });

  it('should do something', async () => {
    // Arrange: Set up test data
    await seedFirestore({
      tournaments: [createMockTournament({ id: 'test-tournament' })],
    });

    // Act: Call your function
    const result = await yourFunction('test-tournament');

    // Assert: Verify results
    expect(result.success).toBe(true);
  });
});
```

### Using Mock Data

```typescript
import {
  createMockTournament,
  createMockUser,
  createMockClub,
  createMockClubMembership,
} from '../../__tests__/helpers';

// Create mock tournament
const tournament = createMockTournament({
  tournamentName: 'Custom Tournament',
  maxParticipants: 32,
});

// Create mock user
const user = createMockUser({
  uid: 'user-123',
  displayName: 'Test Player',
});

// Create mock club
const club = createMockClub({
  name: 'Test Club',
  status: 'active',
});
```

### Firestore Helpers

```typescript
import {
  seedFirestore,
  clearFirestoreData,
  assertDocExists,
  assertDocNotExists,
  getDoc,
} from '../../__tests__/helpers';

// Seed data
await seedFirestore({
  clubs: [{ id: 'club-1', name: 'Test Club' }],
  users: [{ uid: 'user-1', displayName: 'Test User' }],
  tournaments: [{ id: 'tournament-1', status: 'draft' }],
  memberships: [
    {
      userId: 'user-1',
      clubId: 'club-1',
      data: { role: 'admin', status: 'active' },
    },
  ],
});

// Check if document exists
await assertDocExists('tournaments/tournament-1', {
  status: 'draft',
});

// Get document data
const data = await getDoc('tournaments/tournament-1');
expect(data.status).toBe('draft');

// Clean up
await clearFirestoreData();
```

### Testing Cloud Functions

```typescript
import { createMockContext } from '../../__tests__/helpers';

// Create authenticated context
const context = createMockContext('user-123');

// Call your Cloud Function
const result = await yourCallableFunction({ tournamentId: 'test-tournament' }, context);

expect(result.success).toBe(true);
```

## 🎯 Best Practices

### 1. **Always Clean Up**

```typescript
beforeEach(async () => {
  await clearFirestoreData();
});
```

### 2. **Use Descriptive Test Names**

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should create tournament when user is club admin', () => { ... });
```

### 3. **Follow AAA Pattern**

```typescript
it('should do something', async () => {
  // Arrange: Set up preconditions
  await seedFirestore({ ... });

  // Act: Execute the function
  const result = await yourFunction();

  // Assert: Verify results
  expect(result).toBe(expected);
});
```

### 4. **Test Edge Cases**

```typescript
describe('createTournament', () => {
  it('should create tournament with valid data', () => { ... });
  it('should reject if user is not club admin', () => { ... });
  it('should reject if registration deadline is after start date', () => { ... });
  it('should handle missing optional fields', () => { ... });
});
```

### 5. **Group Related Tests**

```typescript
describe('Tournament State Machine', () => {
  describe('draft status', () => {
    it('should allow transition to registration', () => { ... });
    it('should allow transition to cancelled', () => { ... });
    it('should reject transition to in_progress', () => { ... });
  });

  describe('registration status', () => {
    // ...
  });
});
```

## 🔥 Firebase Emulator

### Starting the Emulator

```bash
# From project root
firebase emulators:start

# Or just Firestore
firebase emulators:start --only firestore
```

### Emulator UI

Access the Emulator UI at: http://localhost:4000

- View Firestore data
- Inspect Auth users
- Monitor Cloud Function calls

### Test Data Inspection

While tests are running, you can inspect test data in the Emulator UI:

1. Start emulator: `firebase emulators:start`
2. Run tests in another terminal: `npm test`
3. Open http://localhost:4000 to see data

## 📊 Coverage Reports

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are saved to `coverage/` directory.

View HTML report:

```bash
open coverage/lcov-report/index.html
```

## 🐛 Debugging Tests

### Enable Console Logs

Edit `src/__tests__/setup.ts` and comment out console mocking:

```typescript
// Comment these lines to see console logs
// global.console = {
//   ...console,
//   log: jest.fn(),
// };
```

### Run Single Test File

```bash
npm test -- stateMachine.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should create tournament"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/functions/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "cwd": "${workspaceFolder}/functions",
  "console": "integratedTerminal"
}
```

## 📚 Example Tests

Check out these example tests to learn more:

- `src/utils/__tests__/stateMachine.test.ts` - State machine validation tests
- (More examples coming in Phase 1.2-1.5!)

## 🎓 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Firebase Functions Test SDK](https://firebase.google.com/docs/functions/unit-testing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
