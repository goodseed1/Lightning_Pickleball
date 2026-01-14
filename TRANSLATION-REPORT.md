# Translation Status Report

**Generated:** 2025-12-29
**Base Language:** English (en.json)
**Total English Keys:** 4,474

---

## Executive Summary

### Overall Statistics

| Language            | Total Keys | Missing | Untranslated | Completion % |
| ------------------- | ---------- | ------- | ------------ | ------------ |
| **Spanish (es)**    | 3,905      | 742     | 611          | **87.3%**    |
| **Korean (ko)**     | 4,211      | 380     | 11           | **94.1%**    |
| **German (de)**     | 3,820      | 831     | 680          | **81.4%**    |
| **French (fr)**     | 3,885      | 743     | 742          | **86.8%**    |
| **Italian (it)**    | 3,890      | 738     | 724          | **87.0%**    |
| **Japanese (ja)**   | 3,833      | 831     | 675          | **85.7%**    |
| **Portuguese (pt)** | 3,864      | 800     | 675          | **86.4%**    |
| **Russian (ru)**    | 3,787      | 877     | 666          | **84.6%**    |
| **Chinese (zh)**    | 3,845      | 819     | 665          | **86.0%**    |

**Legend:**

- **Missing:** Keys that don't exist in the locale file
- **Untranslated:** Keys that exist but have the same English text (not translated)

---

## Priority Sections Analysis

### 1. Discover Section (71 missing keys in Spanish)

**Status:** ❌ **Completely Missing in Spanish**

All discover screen translations are missing, including:

#### Search & Tabs

```
discover.search.players: "Search players"
discover.search.clubs: "Search clubs"
discover.search.events: "Search events"
discover.tabs.events: "Events"
discover.tabs.players: "Players"
discover.tabs.clubs: "Clubs"
discover.tabs.coaches: "Coaches"
discover.tabs.services: "Services"
```

#### Skill Filters

```
discover.skillFilters.all: "All"
discover.skillFilters.beginner: "Beginner"
discover.skillFilters.intermediate: "Intermediate"
discover.skillFilters.advanced: "Advanced"
discover.skillFilters.expert: "Expert"
```

#### Distance Settings

```
discover.distance.eventsWithin: "events within"
discover.distance.playersWithin: "players within"
discover.distance.clubsWithin: "clubs within"
discover.distance.coachesWithin: "lessons within"
discover.distance.servicesWithin: "services within"
discover.distance.changeButton: "Change"
discover.distance.applyButton: "Apply"
```

#### Empty States

```
discover.emptyState.noPlayers: "No players found nearby"
discover.emptyState.noClubs: "No clubs found nearby"
discover.emptyState.noEvents: "No events found nearby"
discover.emptyState.noCoaches: "No coaches found nearby"
discover.emptyState.noServices: "No services found nearby"
discover.emptyState.suggestion: "Try expanding search range or different filters"
```

#### Quick Match Alerts

```
discover.alerts.quickMatch.title: "⚡ Quick Match"
discover.alerts.quickMatch.challenge: "Challenge"
discover.alerts.quickMatch.cancel: "Cancel"
discover.alerts.quickMatch.success: "Challenge Sent!"
discover.alerts.quickMatch.sameGenderOnly: "You can only challenge players of the same gender."
discover.alerts.quickMatch.ntrpOutOfRange: "LTR {{ntrp}} is beyond your challenge range. (max +1.0)"
```

---

### 2. Leagues Section (47 keys)

**Status:** ⚠️ **Present but UNTRANSLATED in all non-English languages**

All 47 league-related keys exist in Spanish but are **identical to English** (not translated).

#### Admin Dashboard

```
leagues.admin.dashboardTitle: "Admin Dashboard"
leagues.admin.dashboardSubtitle: "Manage participants and settings before league starts"
leagues.admin.startAcceptingApplications: "🎭 Start Accepting Applications"
leagues.admin.leaguePrivateTitle: "League is Private"
leagues.admin.leaguePrivateMessage: "The league is currently being prepared and is not visible to members. Start accepting applications when ready."
```

#### Participant Management

```
leagues.admin.participantList: "Participant List"
leagues.admin.participantStatus: "Participant Status"
leagues.admin.applicant: "Applicant"
leagues.admin.approve: "Approve"
leagues.admin.approved: "Approved"
leagues.admin.pending: "Pending"
leagues.admin.rejected: "Rejected"
leagues.admin.maxParticipants: "Max"
leagues.admin.noApplicants: "No applicants yet"
leagues.admin.applicantsWillAppear: "Applicants will appear here in real-time"
```

#### Match Status

```
leagues.match.status.scheduled: "Scheduled"
leagues.match.status.inProgress: "In Progress"
leagues.match.status.completed: "Completed"
leagues.match.status.cancelled: "Cancelled"
leagues.match.status.postponed: "Postponed"
leagues.match.status.pendingApproval: "Pending Approval"
leagues.match.status.walkover: "Walkover"
```

#### Match Details

```
leagues.match.matchNumber: "Match #{{number}}"
leagues.match.court: "Court"
leagues.match.result: "Result"
leagues.match.winner: "Winner"
leagues.match.submitResult: "Submit Result"
leagues.match.submitResultAdmin: "Submit Result (Admin)"
leagues.match.correctResult: "Correct Result"
leagues.match.reschedule: "Reschedule"
leagues.match.walkover: "Walkover"
leagues.match.noMatches: "No matches yet"
leagues.match.matchesWillAppear: "Matches will appear here once created."
```

---

### 3. Club Overview Section

**Status:** ✅ **Appears to be translated** (needs verification)

The `clubOverview.tabs` section includes:

- home
- admin
- members
- activities
- leagues

_Note: These may be using shared translation keys from other sections._

---

### 4. Club Home Section

**Status:** ✅ **Appears to be translated** (needs verification)

Expected keys:

- Club Announcements
- Activities in Progress
- Registration Open

_Note: This section may be using shared keys or dynamic content._

---

### 5. Members Section

**Status:** ✅ **Appears to be translated** (needs verification)

Expected keys:

- Join Requests
- All Members
- Role Management
- Member
- Manager

_Note: These keys may exist under different paths in the locale files._

---

### 6. Create New Section

**Status:** ✅ **Appears to be translated** (needs verification)

Expected keys:

- Create New
- What would you like to create?
- Lightning Match
- Ranked Match
- Lightning Meetup
- Casual Meetup
- Create Club
- Tennis Community

---

## Language-Specific Issues

### All Languages (Except Korean)

The following sections have **identical issues** across German, French, Italian, Japanese, Portuguese, Russian, and Chinese:

1. **Discover Section** - All 46+ keys untranslated
2. **Leagues Section** - All 47 keys untranslated

### Korean (ko) - Best Performing

- **94.1% completion**
- Only **11 untranslated keys**
- Missing **380 keys** (likely new additions)
- **Recommendation:** Use Korean as translation reference for other languages

---

## Critical Missing Translations (All Languages)

These English phrases appear untranslated in **ALL non-Korean languages:**

### User-Facing UI Elements

- "Search players" / "Search clubs" / "Search events"
- "Events" / "Players" / "Clubs" / "Coaches" / "Services" (tabs)
- "All" / "Beginner" / "Intermediate" / "Advanced" / "Expert" (filters)
- "No players found nearby" / "No clubs found nearby" (empty states)
- "Try expanding search range or different filters"

### Quick Match Flow

- "⚡ Quick Match"
- "Challenge {{name}} to a match?"
- "Challenge Sent!"
- "You can only challenge players of the same gender."
- "LTR {{ntrp}} is beyond your challenge range. (max +1.0)"

### League Administration

- "Admin Dashboard"
- "Manage participants and settings before league starts"
- "Start Accepting Applications"
- "Participant List"
- "Approve" / "Approved" / "Pending" / "Rejected"
- "Match #{{number}}"
- "In Progress" / "Completed" / "Scheduled"

---

## Recommendations

### Immediate Actions (High Priority)

1. **Spanish (es.json)**
   - Add all 71 missing `discover.*` keys
   - Translate all 47 `leagues.*` keys (currently just copied from English)
   - Focus on user-facing UI elements first

2. **All Non-Korean Languages**
   - Use Korean translations as reference
   - Prioritize discover screen (most visible to users)
   - Translate league administration (affects club managers)

### Medium Priority

3. **German, Japanese, Portuguese, Russian, Chinese**
   - Similar issues to Spanish
   - Focus on discover and leagues sections
   - Use Korean as quality reference

### Low Priority

4. **French, Italian**
   - Slightly better completion than others
   - Still need discover and leagues sections
   - Follow same pattern as Spanish

---

## Translation Workflow Suggestion

### Phase 1: Critical UI (Week 1)

1. Discover screen tabs and search
2. Empty states and error messages
3. Quick Match flow

### Phase 2: Admin Features (Week 2)

1. League admin dashboard
2. Participant management
3. Match status labels

### Phase 3: Remaining Keys (Week 3)

1. All other missing keys
2. Quality review using Korean as reference
3. Context verification with screenshots

---

## Technical Notes

- All locale files are valid JSON
- Total English keys: **4,474**
- Korean has highest completion: **94.1%**
- Average completion across all languages: **87.7%**

---

**Report Generated By:** compare-locales.js script
**Last Updated:** 2025-12-29
