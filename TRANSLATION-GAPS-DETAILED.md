# Translation Gaps - Detailed Report

**Date:** 2025-12-29
**Focus:** Priority sections mentioned in screenshots

---

## 🔴 CRITICAL: Spanish (es.json) Missing/Untranslated Keys

### 1. Club Detail Tabs - PARTIALLY MISSING

**Location:** `clubDetail.tabs`

**English (7 keys):**

```json
{
  "home": "Home",
  "admin": "Admin",
  "members": "Members",
  "activities": "Activities",
  "leagues": "Leagues/Tournaments", // ❌ MISSING IN SPANISH
  "hallOfFame": "Hall of Fame", // ❌ MISSING IN SPANISH
  "policy": "Policies/Dues" // ❌ MISSING IN SPANISH
}
```

**Spanish (4 keys only):**

```json
{
  "home": "Home", // ⚠️ UNTRANSLATED (should be "Inicio")
  "admin": "Admin", // ⚠️ UNTRANSLATED (should be "Administrador")
  "members": "Members", // ⚠️ UNTRANSLATED (should be "Miembros")
  "activities": "Activities" // ⚠️ UNTRANSLATED (should be "Actividades")
  // Missing: leagues, hallOfFame, policy
}
```

**Required Spanish Translations:**

```json
{
  "home": "Inicio",
  "admin": "Administrador",
  "members": "Miembros",
  "activities": "Actividades",
  "leagues": "Ligas/Torneos",
  "hallOfFame": "Salón de la Fama",
  "policy": "Políticas/Cuotas"
}
```

---

### 2. Club Overview Screen - PARTIALLY UNTRANSLATED

**Location:** `clubOverviewScreen`

**Problem Keys in Spanish:**

```json
{
  "clubAnnouncements": "Club Announcements", // ⚠️ Should be "Anuncios del Club"
  "activitiesInProgress": "Activities in Progress", // ⚠️ Should be "Actividades en Progreso"
  "registrationOpen": "Registration Open", // ⚠️ Should be "Registro Abierto"
  "inProgress": "In Progress", // ⚠️ Should be "En Progreso"
  "roundRobinInProgress": "Round Robin in Progress" // ⚠️ Should be "Round Robin en Progreso"
}
```

---

### 3. Discover Screen - COMPLETELY MISSING (71 keys)

**Location:** `discover.*`

**ALL of these are MISSING in Spanish:**

#### Tabs (Navigation)

```json
{
  "discover.tabs.events": "Events", // ❌ MISSING → "Eventos"
  "discover.tabs.players": "Players", // ❌ MISSING → "Jugadores"
  "discover.tabs.clubs": "Clubs", // ❌ MISSING → "Clubes"
  "discover.tabs.coaches": "Coaches", // ❌ MISSING → "Entrenadores"
  "discover.tabs.services": "Services" // ❌ MISSING → "Servicios"
}
```

#### Search Placeholders

```json
{
  "discover.search.events": "Search events", // ❌ MISSING → "Buscar eventos"
  "discover.search.players": "Search players", // ❌ MISSING → "Buscar jugadores"
  "discover.search.clubs": "Search clubs" // ❌ MISSING → "Buscar clubes"
}
```

#### Empty States (User sees when no results)

```json
{
  "discover.emptyState.noEvents": "No events found nearby", // ❌ MISSING
  "discover.emptyState.noPlayers": "No players found nearby", // ❌ MISSING
  "discover.emptyState.noClubs": "No clubs found nearby", // ❌ MISSING
  "discover.emptyState.noCoaches": "No coaches found nearby", // ❌ MISSING
  "discover.emptyState.noServices": "No services found nearby", // ❌ MISSING
  "discover.emptyState.suggestion": "Try expanding search range or different filters" // ❌ MISSING
}
```

**Suggested Spanish:**

```json
{
  "discover.emptyState.noEvents": "No se encontraron eventos cercanos",
  "discover.emptyState.noPlayers": "No se encontraron jugadores cercanos",
  "discover.emptyState.noClubs": "No se encontraron clubes cercanos",
  "discover.emptyState.noCoaches": "No se encontraron entrenadores cercanos",
  "discover.emptyState.noServices": "No se encontraron servicios cercanos",
  "discover.emptyState.suggestion": "Intenta ampliar el rango de búsqueda o usar diferentes filtros"
}
```

---

### 4. Create New Screen - NEED TO VERIFY

**Expected keys (based on screenshot description):**

- "Create New"
- "What would you like to create?"
- "Lightning Match"
- "Ranked Match"
- "Lightning Meetup"
- "Casual Meetup"
- "Create Club"
- "Tennis Community"

**Action Required:** Need to identify the actual key path in en.json (might be under `createNew` or `navigation` or `actions`)

---

### 5. Members Tabs - NEED TO VERIFY

**Expected keys:**

- "Join Requests"
- "All Members"
- "Role Management"
- "Member"
- "Manager"

**Partial Information:**

- `roles.member` exists and IS translated to "Miembro" ✅
- `roles.manager` exists and IS translated to "Gerente" ✅
- But tab labels for "Join Requests", "All Members", "Role Management" need to be located

---

### 6. Leagues/Tournaments - COMPLETELY UNTRANSLATED (47 keys)

**Location:** `leagues.*` and `clubLeaguesTournaments.*`

**Status:** Keys exist in Spanish but are **exact copies of English text**

#### League Tabs

```json
{
  "clubLeaguesTournaments.tabs.leagues": "Leagues", // ⚠️ Should be "Ligas"
  "clubLeaguesTournaments.tabs.tournaments": "Tournaments" // ⚠️ Should be "Torneos"
}
```

#### Admin Dashboard (All Untranslated)

```json
{
  "leagues.admin.dashboardTitle": "Admin Dashboard",
  "leagues.admin.dashboardSubtitle": "Manage participants and settings before league starts",
  "leagues.admin.participantList": "Participant List",
  "leagues.admin.approve": "Approve",
  "leagues.admin.approved": "Approved",
  "leagues.admin.pending": "Pending",
  "leagues.admin.rejected": "Rejected"
}
```

**Should be:**

```json
{
  "leagues.admin.dashboardTitle": "Panel de Administración",
  "leagues.admin.dashboardSubtitle": "Gestionar participantes y configuración antes de que comience la liga",
  "leagues.admin.participantList": "Lista de Participantes",
  "leagues.admin.approve": "Aprobar",
  "leagues.admin.approved": "Aprobado",
  "leagues.admin.pending": "Pendiente",
  "leagues.admin.rejected": "Rechazado"
}
```

#### Match Status Labels (All Untranslated)

```json
{
  "leagues.match.status.scheduled": "Scheduled", // ⚠️ Should be "Programado"
  "leagues.match.status.inProgress": "In Progress", // ⚠️ Should be "En Progreso"
  "leagues.match.status.completed": "Completed", // ⚠️ Should be "Completado"
  "leagues.match.status.cancelled": "Cancelled", // ⚠️ Should be "Cancelado"
  "leagues.match.status.postponed": "Postponed", // ⚠️ Should be "Pospuesto"
  "leagues.match.status.pendingApproval": "Pending Approval", // ⚠️ Should be "Pendiente de Aprobación"
  "leagues.match.matchNumber": "Match #{{number}}" // ⚠️ Should be "Partido #{{number}}"
}
```

#### Results View

```json
{
  "// Common pattern seen in code": "View Results", // Need to find key
  "// Common pattern": "Status: Completed", // Need to find key
  "// Common pattern": "Participants" // Need to find key
}
```

---

## Summary of Issues by Priority

### 🔥 P0 - User-Facing UI (Immediately Visible)

1. **Discover Tabs** (5 keys) - Users see English tabs: "Events", "Players", "Clubs", "Coaches", "Services"
2. **Discover Search** (3 keys) - Placeholder text is in English
3. **Discover Empty States** (6 keys) - Error/empty messages shown in English
4. **Club Detail Tabs** (7 keys) - Tab navigation shows English

**Total: 21 keys** - High visibility, easy to translate

---

### ⚠️ P1 - Admin/Management Features

1. **Leagues Admin Dashboard** (20+ keys) - Club admins see English interface
2. **Match Status Labels** (7 keys) - Match statuses in English
3. **League Tabs** (2 keys) - "Leagues" and "Tournaments" tabs

**Total: 29+ keys** - Important for club managers

---

### 📝 P2 - Content/Messages

1. **Club Overview Screen** (10+ keys) - Announcements, status messages
2. **Quick Match Alerts** (10+ keys) - Challenge notifications
3. **Application Alerts** (10+ keys) - Event application messages

**Total: 30+ keys** - Important for user experience

---

## Comparison: Other Languages

### Korean (ko.json) - 94% Complete ✅

- Only **11 untranslated keys** (best reference for translation quality)
- Can be used as example for translation style

### All Other Languages (de, fr, it, ja, pt, ru, zh) - 81-87% Complete

- **Same 46+ keys untranslated** in Discover section
- **Same 47 keys untranslated** in Leagues section
- Pattern suggests bulk copy-paste from English without translation

---

## Recommended Action Plan

### Week 1: Critical User-Facing UI

1. ✅ Translate all `discover.tabs.*` (5 keys)
2. ✅ Translate all `discover.search.*` (3 keys)
3. ✅ Translate all `discover.emptyState.*` (6 keys)
4. ✅ Complete `clubDetail.tabs.*` (add 3 missing + translate 4 existing)

**Deliverable:** Users see fully Spanish Discover screen and Club tabs

### Week 2: Admin Features

1. ✅ Translate all `leagues.admin.*` (20+ keys)
2. ✅ Translate all `leagues.match.status.*` (7 keys)
3. ✅ Translate `clubLeaguesTournaments.tabs.*` (2 keys)

**Deliverable:** Club admins can manage leagues in Spanish

### Week 3: Polish & Complete

1. ✅ Translate `clubOverviewScreen.*` remaining keys
2. ✅ Translate all `discover.alerts.*` (30+ keys)
3. ✅ Quality review using Korean as reference
4. ✅ Test with actual users

**Deliverable:** 100% Spanish translation completion

---

## Technical Notes

- **Files to edit:** `src/locales/es.json` (and 8 other language files)
- **Reference file:** `src/locales/ko.json` (highest quality)
- **Test approach:** Change device language to Spanish and navigate through app
- **Validation:** Run `npm run lint` after editing JSON files

---

**Report compiled by:** Translation analysis scripts
**Files analyzed:** 10 locale files (en, es, ko, de, fr, it, ja, pt, ru, zh)
**Total issues found:** 742 missing keys + 611 untranslated keys in Spanish alone
