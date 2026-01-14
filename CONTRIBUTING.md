# 🏛️ Lightning Tennis Project Constitution

## 📜 Project Structure Charter

This document serves as the **constitutional law** for Lightning Tennis project structure. All developers (human and AI) MUST adhere to these principles to maintain code quality and prevent structural chaos.

> **Golden Rule**: "_One Screen = One File. No Duplicates. Ever._"

---

## 🎯 Core Principles

### 1. **Single Source of Truth** ⚡

- Each functionality must have ONE authoritative implementation
- NO duplicate files (like the eliminated `DiscoverScreen` doppelgänger)
- Context-driven architecture over scattered state management

### 2. **Structural Clarity** 🏗️

- Clear separation of concerns by directory
- Consistent naming conventions enforced by automation
- No nested complexity beyond necessary levels

### 3. **Automated Enforcement** 🤖

- ESLint catches dead code and unused imports
- ls-lint enforces file naming conventions
- Pre-commit hooks prevent rule violations

### 4. **Context-First Architecture** 🧠

- All screens should prioritize Context hooks over local state
- Services handle business logic, Contexts manage state
- Components focus purely on presentation

---

## 📁 Directory Structure Laws

### 🚫 **FORBIDDEN ZONES**

```
❌ src/screens/main/          # BANNED - Causes duplicate chaos
❌ src/components/main/       # BANNED - Unclear purpose
❌ Any nested /main folders   # BANNED - Creates confusion
```

### ✅ **AUTHORIZED STRUCTURE**

```
src/
├── components/           # 🧩 Reusable UI components (PascalCase.tsx)
│   ├── cards/           # Specific component categories
│   ├── forms/
│   └── ui/              # Generic UI elements
├── screens/             # 📱 Top-level screens (PascalCase.tsx)
│   ├── auth/           # Authentication screens
│   ├── clubs/          # Club-related screens
│   └── profile/        # Profile screens
├── contexts/            # 🌐 State management (PascalCase.tsx)
├── services/            # ⚙️ Business logic & API calls (camelCase.ts)
├── hooks/               # 🪝 Custom React hooks (useXxx.ts)
├── utils/               # 🔧 Utility functions (camelCase.ts)
├── types/               # 📝 TypeScript definitions (PascalCase.ts)
└── navigation/          # 🧭 Navigation configuration
```

---

## 📏 Naming Conventions

### File Naming Rules (Enforced by ls-lint)

| File Type      | Convention     | Examples                                     |
| -------------- | -------------- | -------------------------------------------- |
| **Screens**    | PascalCase.tsx | `DiscoverScreen.tsx`, `ClubDetailScreen.tsx` |
| **Components** | PascalCase.tsx | `EventCard.tsx`, `PlayerList.tsx`            |
| **Services**   | camelCase.ts   | `authService.ts`, `clubService.ts`           |
| **Contexts**   | PascalCase.tsx | `AuthContext.tsx`, `ClubContext.tsx`         |
| **Hooks**      | camelCase.ts   | `useAuth.ts`, `useDiscovery.ts`              |
| **Utils**      | camelCase.ts   | `dateUtils.ts`, `validationUtils.ts`         |
| **Types**      | PascalCase.ts  | `UserTypes.ts`, `EventTypes.ts`              |

### Component Architecture Rules

1. **Screen Components**:

   ```typescript
   // ✅ CORRECT - Context-driven, lightweight
   const DiscoverScreen = () => {
     const { events, loading } = useDiscovery();
     return <EventList events={events} loading={loading} />;
   };
   ```

2. **Service Integration**:

   ```typescript
   // ✅ CORRECT - Services handle business logic
   const authService = {
     login: async credentials => {
       /* logic */
     },
     logout: async () => {
       /* logic */
     },
   };
   ```

3. **Context Usage**:
   ```typescript
   // ✅ CORRECT - Single source of truth
   const AuthContext = createContext(null);
   const useAuth = () => useContext(AuthContext);
   ```

---

## 🛡️ Quality Gates

### Pre-commit Automated Checks

Every commit is automatically validated by:

1. **ESLint** - Dead code detection, code quality
2. **ls-lint** - File naming convention enforcement
3. **Prettier** - Code formatting consistency
4. **TypeScript** - Type safety validation

### Manual Review Checklist

Before creating a PR, ensure:

- [ ] No duplicate files or functionality
- [ ] Context hooks used over local state where appropriate
- [ ] File names follow naming conventions
- [ ] No dead code or unused imports
- [ ] TypeScript errors resolved
- [ ] Tests pass (if applicable)

---

## 🚨 Emergency Protocols

### If You Find Duplicate Files:

1. **STOP** - Do not ignore duplicates
2. **ANALYZE** - Determine which version is authoritative
3. **CONSOLIDATE** - Merge functionality if needed
4. **DELETE** - Remove duplicate files completely
5. **UPDATE** - Fix all import paths
6. **TEST** - Verify functionality works
7. **COMMIT** - Document the consolidation

### If Structure Rules Are Violated:

1. Automated tools will **BLOCK** your commit
2. Fix the naming/structure violations
3. Re-run quality checks
4. Commit only when all checks pass

---

## 🎓 Onboarding for New Developers

### Required Reading:

1. This `CONTRIBUTING.md` document
2. `start.md` - Daily development checklist
3. `PROJECT_BLUEPRINT.md` - Overall project vision
4. `ECOSYSTEM_CHARTER.md` - Tennis app philosophy

### Setup Commands:

```bash
# 1. Install dependencies
npm install

# 2. Run quality checks
npm run lint
npm run format:check

# 3. Test file structure validation
npx @ls-lint/ls-lint

# 4. Verify pre-commit hooks work
git add . && git commit -m "test commit" --dry-run
```

---

## ⚖️ Enforcement

**This document is CONSTITUTIONAL LAW for this project.**

- 🤖 Automated tools enforce compliance 24/7
- 🚫 Non-compliant code cannot be committed
- 📊 Regular audits identify structural debt
- 🔧 Continuous improvement of quality systems

### Violation Consequences:

1. **Commit Blocked** - Pre-commit hooks prevent rule violations
2. **PR Rejected** - Code review will catch structural issues
3. **Technical Debt** - Violations create maintenance burden

---

## 🏆 Success Metrics

Our structural integrity system has:

- ✅ **Eliminated** the DiscoverScreen doppelgänger problem
- ✅ **Prevented** 6,000+ lines of duplicate code
- ✅ **Enforced** consistent file naming across the project
- ✅ **Automated** quality checks in every commit
- ✅ **Established** clear architectural principles

---

## 📞 Questions & Support

If you have questions about project structure:

1. Check this document first
2. Review existing similar implementations
3. Ask for clarification with specific examples
4. When in doubt, follow the **Golden Rule**: One Screen = One File

---

_"A well-structured codebase is the foundation of sustainable software development."_

**Last Updated**: September 2025  
**Version**: 1.0 (Project Phoenix Constitution)
