/**
 * Temporary minimal index.ts for deploying only the submitScoreAndAdvanceWinner function
 * This bypasses all the TypeScript compilation errors in other functions
 */

// Export only the function we need to fix the tournament score submission issue
export { submitScoreAndAdvanceWinner } from './submitScoreAndAdvanceWinner.js';

// 🏆 THOR'S HERALD OF VICTORY: Automatically announce tournament winners on club home
export { onTournamentCompleted } from './triggers/onTournamentCompleted.js';

// 🏆 THOR'S HERALD OF VICTORY: Automatically announce league winners on club home
export { onLeagueCompleted } from './triggers/onLeagueCompleted.js';

// 🏆 THOR'S TROPHY CEREMONY: Manually award trophies to tournament winners (Callable)
export { awardTournamentTrophies } from './awardTournamentTrophies.js';

// 📲 THOR'S TELEGRAM: Send push notifications for team invitations
export { sendPushOnTeamInvite } from './triggers/sendPushOnTeamInvite.js';

// 🔨 THOR'S HERALD: Create notifications and feed items for team invitations
export { onTeamInviteCreated } from './triggers/onTeamInviteCreated.js';

// 🎾 SOLO LOBBY: Create notifications and feed items for solo team proposals
export { onSoloProposalCreated } from './triggers/onSoloProposalCreated.js';

// 🔨 THOR'S HERALD: Create feed items when team status changes (accepted/rejected)
export { onTeamStatusChanged } from './triggers/onTeamStatusChanged.js';

// 🏛️ OLYMPUS MISSION: Add tournament participant with admin privileges
export { addTournamentParticipant } from './addTournamentParticipant.js';

// 🎯 HYBRID ARCHITECTURE Phase 2: Background tournament event processor
export { processTournamentEvent } from './processTournamentEvents.js';

// 📨 LIGHTNING EVENTS: Application approval/decline system
export {
  approveApplication,
  declineApplication,
  onApplicationCreated,
} from './approveApplication.js';

// ❌ LIGHTNING EVENTS: Participant cancellation system
export { cancelParticipantByHost, cancelMyParticipation } from './cancelParticipant.js';

// 🛡️ [CAPTAIN AMERICA] Application management system
export { applyToEvent } from './applyToEvent';
export { cancelApplication } from './cancelApplication';

// 🎯 [OPERATION DUO - PHASE 2A] Team application with partner invitation workflow
export { applyAsTeam } from './applyAsTeam';

// 🎯 [OPERATION SOLO LOBBY - PHASE 1] Solo application for doubles matches
export { applyAsSolo } from './triggers/applyAsSolo';

// 🎯 [OPERATION SOLO LOBBY - PHASE 4] Merge solo applicants into team application
export { mergeSoloToTeam } from './triggers/mergeSoloToTeam';

// 🎯 [OPERATION DUO] Match creation and partner invitation system
export { createMatchAndInvite } from './triggers/createMatchAndInvite';
export { respondToInvitation } from './triggers/respondToInvitation';
export { reinvitePartner } from './triggers/reinvitePartner';

// 🎯 [FRIEND INVITE] Friend invitation response system
export { respondToFriendInvite } from './triggers/respondToFriendInvite';

// 🎯 [SINGLES REINVITE] Friend re-invitation for singles matches
export { reinviteFriend } from './triggers/reinviteFriend';

// 🎯 [OPERATION DUO - PHASE 2A] Team application partner re-invitation
export { reinviteApplicationPartner } from './triggers/reinviteApplicationPartner';

// ⚡ [OPERATION DUO] Partner invitation notifications
export { sendPushOnPartnerInvite } from './triggers/sendPushOnPartnerInvite';
export { onPartnerInviteCreated } from './triggers/onPartnerInviteCreated';

// ❌ LIGHTNING EVENTS: Event cancellation by host
export { cancelEvent } from './cancelEvent.js';

// 🚪 CLUB MANAGEMENT: Member leave club functionality
export { leaveClub } from './leaveClub.js';

// 🔄 CLUB OWNERSHIP: Transfer club ownership to another admin/manager
export { transferClubOwnership } from './transferClubOwnership.js';

// 🏰 OPERATION CITADEL: Secure club join request management & member removal
export { approveJoinRequest, rejectJoinRequest, removeClubMember } from './clubJoinRequests.js';

// 🔔 [HEIMDALL] CLUB JOIN REQUEST: Notification trigger for club admins
export { onClubJoinRequestCreated } from './triggers/onClubJoinRequest.js';

// 📢 [HEIMDALL] TOURNAMENT FEED: Advertisement for tournament registration
export { onTournamentRegistrationOpened } from './triggers/onTournamentRegistrationOpened.js';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 1: Tournament Operations
export { createTournament } from './createTournament';
export { registerForTournament } from './registerForTournament';
export { registerTeamForTournament } from './registerTeamForTournament';
export { updateTournamentStatus } from './updateTournamentStatus';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.2: Bpaddle Generation
export { generateBpaddle } from './generateBpaddle';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.3: Critical Security Functions
export { deleteTournament } from './deleteTournament';
export { withdrawFromTournament } from './withdrawFromTournament';
export { assignSeeds } from './assignSeeds';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.4: Match Operations
export { submitMatchResult } from './submitMatchResult';
export { generateNextRound } from './generateNextRound';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.5: Admin Tools
export { deleteMatch } from './deleteMatch';
export { updateParticipantInfo } from './updateParticipantInfo';
export { migrateMatchHistory } from './migrateMatchHistory';

// 🚨 [SECURITY AUDIT 2025-01-08] REMOVED DANGEROUS FUNCTIONS
// The following functions were removed for production security:
// - resetAllMatchData (no admin check - could delete all match data)
// - resetLeagueStats (no admin check - could reset all league stats)
// - cleanupTestApplications (no admin check - could delete all applications)
// - deleteAllUsers (no admin check - could delete all users)
// - deleteAllActivityData (no admin check - could delete all activity data)
// These functions should only be run locally via Firebase Admin SDK if needed.

// 🏛️ [PROJECT OLYMPUS] Honor System Phase 2: Season Management
export { recordSeasonStartGrades } from './scheduled/recordSeasonStartGrades';
export { finalizeSeasonRankings } from './scheduled/finalizeSeasonRankings';

// 🌍 [TIMEZONE-AWARE NOTIFICATIONS] Send season notifications at users' local time
export { sendSeasonNotificationsHourly } from './scheduled/sendSeasonNotificationsHourly';

// 🏛️ [HEIMDALL] CLUB MANAGEMENT: Delete club with cascade
export { deleteClub } from './deleteClub';

// 🌉 [HEIMDALL] LEAGUE MANAGEMENT: Delete league with cascade
export { deleteLeague } from './deleteLeague';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.8: League Participant Management
export { addLeagueParticipant } from './addLeagueParticipant';

// 🔔 [HEIMDALL] LEAGUE PLAYOFFS: Notification trigger for playoff creation
export { onLeaguePlayoffsCreated } from './triggers/onLeaguePlayoffsCreated';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.9: League Completion
export { completeLeague } from './completeLeague';
export { checkLeaguePlayoffCompletion } from './checkLeaguePlayoffCompletion';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.10: Playoff Match Results
export { updatePlayoffMatchResult } from './updatePlayoffMatchResult';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.11: League Match Results & Standings
export { submitLeagueMatchResult } from './submitLeagueMatchResult';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.12: League Match Generation
export { generateRoundRobinMatches } from './generateRoundRobinMatches';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.13: Playoff Creation
export { createPlayoffs } from './createPlayoffs';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 5.14: League Participant & Status Management
export { approveLeagueParticipant, rejectLeagueParticipant } from './approveLeagueParticipant';
export { updateLeagueStatus } from './updateLeagueStatus';

// 🎾 [DOUBLES SUPPORT] League Team Management
export { createLeagueTeam } from './createLeagueTeam';
export { addLeagueTeam } from './addLeagueTeam';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 2: League Participation
export { applyForLeague } from './applyForLeague';
export { applyForLeagueAsTeam } from './applyForLeagueAsTeam';

// 🌉 [HEIMDALL] SERVER-SIDE MIGRATION Phase 3: League Creation
export { createLeague } from './createLeague';

// 🗄️ [DATA ARCHIVING] Automatic archiving and TTL system
export { archiveOldData } from './scheduledFunctions/archiveOldData';

// 🌤️ [MEETUP AUTO-COMPLETE] Auto-complete meetup events after 24 hours
export { autoCompleteMeetups } from './scheduledFunctions/autoCompleteMeetups';

// 📢 [MEETUP NOTIFICATIONS] 모임 푸시 알림 - 당일 9시 또는 즉시 전송
export {
  sendDailyMeetupReminders,
  onMeetupCreated,
} from './scheduledFunctions/meetupNotifications';

// 💬 [CHAT NOTIFICATIONS] Event Chat - Mark as read
export { markEventChatAsRead } from './markEventChatAsRead';

// 💬 [CHAT] Event Chat - Save message with unreadCount increment
export { saveChatMessage } from './saveChatMessage';

// 🌐 Public Match Result Submission
export { submitPublicMatchResult } from './submitPublicMatchResult';

// 🛡️ [CAPTAIN AMERICA] SERVER-SIDE MIGRATION: Match Creation
export { createMatch } from './createMatch';

// 🤝 [FRIENDSHIP] Friend Request Management
export { sendFriendRequest } from './friendship/sendFriendRequest';
export { acceptFriendRequest } from './friendship/acceptFriendRequest';
export { declineFriendRequest } from './friendship/declineFriendRequest';

// ⚡ [QUICK MATCH] Quick Match Creation & Management
export { createQuickMatch } from './createQuickMatch';
export { setEventLocationTime } from './setEventLocationTime';

// 💰 [HEIMDALL] CLUB DUES: Notification trigger for dues payment status changes
export { onMemberDuesRecordUpdated } from './triggers/onMemberDuesRecordUpdated';

// 💰 [HEIMDALL] CLUB DUES: Notification trigger for dues record creation
export { onMemberDuesRecordCreated } from './triggers/onMemberDuesRecordCreated';

// 💰 [HEIMDALL] CLUB DUES: Scheduled functions for automated dues management
export { generateMonthlyDues } from './scheduled/generateMonthlyDues';
export { sendDuesReminders, sendDuesSoonReminders } from './scheduled/sendDuesReminders';
export { generateAnnualDuesReports } from './scheduled/generateAnnualReport';

// 🎯 [KIM FIX] Migration function to backfill hostId for existing applications
export { backfillApplicationHostId } from './backfillApplicationHostId';

// 🚨 [PROJECT SENTINEL] AI-powered user issue detection & feedback system
export { reportUserFeedback } from './triggers/reportUserFeedback';

// 🔥 [PROJECT SENTINEL] App crash reporting from ErrorBoundary
export { reportAppCrash } from './triggers/reportAppCrash';

// 📊 [CONVERSATION ANALYTICS] AI conversation topic tracking & analytics
export { saveConversationAnalytics } from './triggers/saveConversationAnalytics';

// 🔒 [TOP SECRET] Admin Custom Claims
export { setAdminClaim } from './triggers/setAdminClaim';

// 📊 [THOR - KPI] Daily User Statistics Calculator
export { calculateDailyUserStats } from './triggers/calculateDailyUserStats';

// 📬 [FEEDBACK SYSTEM] Bidirectional feedback conversation notifications
export { onFeedbackResponse, onUserReplyToFeedback } from './triggers/feedbackTriggers';
export { onUserFeedbackCreated } from './triggers/onUserFeedbackCreated';

// 🏷️ [NICKNAME SYSTEM] Unique nickname enforcement
export { checkNicknameAvailability } from './checkNicknameAvailability';
export { onUserNicknameChanged } from './triggers/onUserNicknameChanged';

// 📧 [EMAIL SYSTEM] Email availability check for sign-up
export { checkEmailAvailability } from './checkEmailAvailability';

// 🗑️ [ACCOUNT MANAGEMENT] Complete account deletion with Admin SDK
export { deleteUserAccount } from './deleteUserAccount';

// ⚡ [THOR] LPR MIGRATION: Migrate ELO data to LPR (Lightning Pickleball Rating) system
export { migrateLtrFromElo, getUserLtrLevel } from './migrateLtrFromElo';

// 💬 [MEETUP CHAT] Push notifications and unread badge updates for meetup chat
export { onMeetupChatMessageCreated } from './triggers/meetupChatTriggers';

// 💬 [DIRECT CHAT] Push notifications for direct messages
export { onDirectChatCreated } from './triggers/onDirectChatCreated';

// 🏟️ [CLUB CHAT] Push notifications for club chat messages
export { onClubChatCreated } from './triggers/onClubChatCreated';
