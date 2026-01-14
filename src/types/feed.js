/**
 * Feed Types
 * Lightning Tennis 피드 시스템 타입 정의
 */

/**
 * 피드 아이템 타입
 * @typedef {'match_result' | 'league_winner' | 'tournament_winner' | 'club_event' | 'new_member' | 'new_club'} FeedItemType
 */

/**
 * 피드 아이템 가시성 설정
 * @typedef {'public' | 'friends' | 'club_members' | 'private'} FeedVisibility
 */

/**
 * 피드 아이템 인터페이스
 * @typedef {Object} FeedItem
 * @property {string} id - 피드 아이템 고유 ID
 * @property {FeedItemType} type - 피드 아이템 타입
 * @property {string} actorId - 행위자 사용자 ID
 * @property {string} actorName - 행위자 이름
 * @property {string} [targetId] - 대상 사용자 ID (상대방)
 * @property {string} [targetName] - 대상 사용자 이름
 * @property {string} [clubId] - 클럽 ID (클럽 관련 피드만)
 * @property {string} [clubName] - 클럽 이름
 * @property {string} [eventId] - 이벤트/매치 ID
 * @property {string} [leagueId] - 리그 ID
 * @property {string} [tournamentId] - 토너먼트 ID
 * @property {Object} metadata - 추가 메타데이터
 * @property {string} [metadata.score] - 경기 스코어
 * @property {number} [metadata.eloChange] - ELO 변화량
 * @property {string} [metadata.eventName] - 이벤트 이름
 * @property {string} [metadata.location] - 위치 정보
 * @property {Date} timestamp - 생성 시간
 * @property {FeedVisibility} visibility - 가시성 설정
 * @property {string[]} visibleTo - 볼 수 있는 사용자 ID 목록
 * @property {boolean} isActive - 활성 상태
 */

/**
 * 피드 아이템 생성 요청
 * @typedef {Object} CreateFeedItemRequest
 * @property {FeedItemType} type
 * @property {string} actorId
 * @property {string} actorName
 * @property {string} [targetId]
 * @property {string} [targetName]
 * @property {string} [clubId]
 * @property {string} [clubName]
 * @property {string} [eventId]
 * @property {string} [leagueId]
 * @property {string} [tournamentId]
 * @property {Object} [metadata]
 * @property {FeedVisibility} [visibility]
 * @property {string[]} [visibleTo]
 */

/**
 * 피드 템플릿 정의
 */
export const FEED_TEMPLATES = {
  match_result: {
    ko: {
      win: '{actorName}님이 {targetName}님과의 경기에서 승리했습니다!',
      loss: '{actorName}님이 {targetName}님과 좋은 경기를 했습니다',
      first_win: '{actorName}님의 첫 승리입니다! {targetName}님과의 경기에서 이겼어요!',
      first_match: '{actorName}님이 첫 번째 경기를 완료했습니다! {targetName}님과 함께',
      practice: '{actorName}님이 {targetName}님과 연습 경기를 했습니다',
    },
    en: {
      win: '{actorName} won against {targetName}!',
      loss: '{actorName} played a great match with {targetName}',
      first_win: "{actorName}'s first victory! Beat {targetName} in their first win!",
      first_match: '{actorName} completed their first match with {targetName}!',
      practice: '{actorName} had a practice session with {targetName}',
    },
  },
  league_winner: {
    ko: '{actorName}님이 {clubName}의 {metadata.leagueName}에서 우승했습니다! 축하해주세요!',
    en: '{actorName} won {metadata.leagueName} in {clubName}! Congratulations!',
  },
  tournament_winner: {
    ko: '{actorName}님이 {metadata.tournamentName} 토너먼트에서 우승했습니다!',
    en: '{actorName} won the {metadata.tournamentName} tournament!',
  },
  club_event: {
    ko: {
      regular:
        '{actorName}님이 {clubName}에서 새로운 정기 모임을 만들었습니다: "{metadata.eventName}"',
      coaching: '{actorName}님이 {clubName}에서 코칭 클리닉을 개최합니다: "{metadata.eventName}"',
      social: '{actorName}님이 {clubName}에서 소셜 이벤트를 만들었습니다: "{metadata.eventName}"',
      default:
        '{actorName}님이 {clubName}에서 새로운 이벤트를 만들었습니다: "{metadata.eventName}"',
    },
    en: {
      regular: '{actorName} created a new regular meetup at {clubName}: "{metadata.eventName}"',
      coaching: '{actorName} is hosting a coaching clinic at {clubName}: "{metadata.eventName}"',
      social: '{actorName} created a social event at {clubName}: "{metadata.eventName}"',
      default: '{actorName} created a new event at {clubName}: "{metadata.eventName}"',
    },
  },
  new_member: {
    ko: '{actorName}님이 {clubName}에 새로 가입했습니다! 환영해주세요',
    en: '{actorName} joined {clubName}! Welcome them!',
  },
  new_club: {
    ko: {
      milestone:
        '{clubName}이 {metadata.milestone} 달성했습니다! 현재 {metadata.currentMembers}명의 멤버가 있어요!',
      created: '{actorName}님이 새로운 클럽 "{clubName}"을 만들었습니다! 함께 해요!',
    },
    en: {
      milestone:
        '{clubName} reached {metadata.milestone}! Now {metadata.currentMembers} members strong!',
      created: '{actorName} created a new club "{clubName}"! Join the community!',
    },
  },
  skill_improvement: {
    ko: '{actorName}님의 실력이 향상되었습니다! {metadata.skillImprovement}',
    en: '{actorName} improved their skills! {metadata.skillImprovement}',
  },
  doubles_success: {
    ko: '{actorName}님이 {targetName}님과의 복식에서 {metadata.streak}연승을 달성했습니다!',
    en: '{actorName} achieved a {metadata.streak}-win streak in doubles with {targetName}!',
  },
  elo_milestone: {
    ko: '{actorName}님이 새로운 ELO 기록을 달성했습니다! 현재 {metadata.currentElo}점',
    en: '{actorName} reached a new ELO milestone! Current rating: {metadata.currentElo}',
  },
  coaching_success: {
    ko: '{actorName} 코치 덕분에 {metadata.coachCredit}',
    en: 'Thanks to coach {actorName}, {metadata.coachCredit}',
  },
  club_team_invite_pending: {
    ko: '{actorName}님이 {targetName}님을 {metadata.tournamentName} 토너먼트 팀에 초대했습니다',
    en: '{actorName} invited {targetName} to join their team for {metadata.tournamentName}',
  },
  // 🎾 [SOLO LOBBY] Team proposal from solo lobby
  solo_team_proposal_pending: {
    ko: "{actorName}님이 '{metadata.eventTitle}' 모임에서 당신과 팀을 구성하고 싶어합니다!",
    en: "{actorName} wants to team up with you for '{metadata.eventTitle}'!",
    de: "{actorName} möchte mit Ihnen ein Team für '{metadata.eventTitle}' bilden!",
    es: "¡{actorName} quiere formar equipo contigo para '{metadata.eventTitle}'!",
    fr: "{actorName} veut former une équipe avec vous pour '{metadata.eventTitle}' !",
    it: "{actorName} vuole formare una squadra con te per '{metadata.eventTitle}'!",
    ja: '{actorName}さんが「{metadata.eventTitle}」であなたとチームを組みたがっています！',
    pt: "{actorName} quer formar uma equipe com você para '{metadata.eventTitle}'!",
    ru: "{actorName} хочет сформировать с вами команду для '{metadata.eventTitle}'!",
    zh: '{actorName} 想在「{metadata.eventTitle}」中与您组队！',
  },
  club_team_invite_accepted: {
    ko: '{actorName}님이 {targetName}님의 팀 초대를 수락했습니다!',
    en: "{actorName} accepted {targetName}'s team invitation!",
  },
  club_join_request_pending: {
    ko: '{actorName}님이 {clubName} 클럽 가입을 신청했습니다',
    en: '{actorName} requested to join {clubName}',
  },
  club_join_request_approved: {
    ko: {
      self: "'{clubName}' 클럽 가입이 승인되었습니다!",
      others: '{actorName}님이 {clubName} 클럽에 합류했습니다! 환영해주세요!',
    },
    en: {
      self: "You've been approved to join '{clubName}'!",
      others: '{actorName} joined {clubName}! Welcome them!',
    },
  },
  club_join_request_rejected: {
    ko: '{clubName} 클럽 가입 신청이 거절되었습니다',
    en: 'Your request to join {clubName} was declined',
  },
  // Club member removed/expelled (private - only visible to removed user)
  club_member_removed: {
    ko: '{clubName} 클럽에서 제명되었습니다',
    en: 'You have been removed from {clubName}',
  },
  // Club deleted (private - only visible to each former member)
  club_deleted: {
    ko: '{clubName} 클럽이 삭제되었습니다',
    en: '{clubName} has been deleted',
  },
  // Tournament registration advertising
  tournament_registration_open: {
    ko: '{metadata.tournamentName} 참가 신청이 시작되었습니다! {clubName}에서 지금 신청하세요!',
    en: 'Registration is now open for {metadata.tournamentName}! Sign up now at {clubName}!',
  },
  // Tournament completion celebration (winner & runner-up)
  tournament_completed: {
    ko: {
      winner: '축하합니다! {actorName}님이 {metadata.tournamentName}에서 우승했습니다!',
      runner_up: '{actorName}님이 {metadata.tournamentName}에서 준우승을 차지했습니다! 훌륭합니다!',
    },
    en: {
      winner: 'Congratulations! {actorName} won {metadata.tournamentName}!',
      runner_up: '{actorName} finished as runner-up in {metadata.tournamentName}! Well done!',
    },
  },
  // League completion celebration (winner & runner-up)
  league_completed: {
    ko: {
      winner: '축하합니다! {actorName}님이 {metadata.leagueName}에서 우승했습니다!',
      runner_up: '{actorName}님이 {metadata.leagueName}에서 준우승을 차지했습니다! 훌륭합니다!',
    },
    en: {
      winner: 'Congratulations! {actorName} won {metadata.leagueName}!',
      runner_up: '{actorName} finished as runner-up in {metadata.leagueName}! Well done!',
    },
  },
  // League playoffs created
  league_playoffs_created: {
    ko: '{metadata.leagueName} 플레이오프가 시작되었습니다! 상위 진출자들의 대결을 지켜보세요!',
    en: '{metadata.leagueName} playoffs have started! Watch the top players compete!',
  },
  // [OPERATION DUO] Partner invitation feed
  partner_invite_pending: {
    ko: '{actorName}님이 {targetName}님에게 복식 파트너 초대를 보냈습니다',
    en: '{actorName} invited {targetName} to be their doubles partner',
  },
  // 🎯 [KIM FIX] Partner invitation accepted
  partner_invite_accepted: {
    ko: '{actorName}님이 복식 파트너 초대를 수락했습니다! 함께 경기해요!',
    en: '{actorName} accepted your doubles partner invitation! Time to play!',
  },
  // 🎯 [KIM FIX] Partner invitation rejected
  partner_invite_rejected: {
    ko: '{actorName}님이 복식 파트너 초대를 거절했습니다',
    en: '{actorName} declined your doubles partner invitation',
  },
  // 🎾 [KIM FIX] Match invitation accepted (notification to host)
  match_invite_accepted: {
    ko: '{actorName}님이 "{metadata.eventTitle}" 매치 초대를 수락했습니다! 🎾',
    en: '{actorName} accepted your match invitation for "{metadata.eventTitle}"! 🎾',
    de: '{actorName} hat Ihre Spieleinladung für "{metadata.eventTitle}" angenommen! 🎾',
    es: '¡{actorName} aceptó tu invitación al partido "{metadata.eventTitle}"! 🎾',
    fr: '{actorName} a accepté votre invitation au match "{metadata.eventTitle}" ! 🎾',
    it: '{actorName} ha accettato il tuo invito alla partita "{metadata.eventTitle}"! 🎾',
    ja: '{actorName}さんが「{metadata.eventTitle}」の試合招待を承諾しました！ 🎾',
    pt: '{actorName} aceitou seu convite para a partida "{metadata.eventTitle}"! 🎾',
    ru: '{actorName} принял(а) ваше приглашение на матч "{metadata.eventTitle}"! 🎾',
    zh: '{actorName} 接受了您的「{metadata.eventTitle}」比赛邀请！🎾',
  },
  // 🎾 [KIM FIX] Match invitation rejected (notification to host)
  match_invite_rejected: {
    ko: '{actorName}님이 "{metadata.eventTitle}" 매치 초대를 거절했습니다',
    en: '{actorName} declined your match invitation for "{metadata.eventTitle}"',
    de: '{actorName} hat Ihre Spieleinladung für "{metadata.eventTitle}" abgelehnt',
    es: '{actorName} rechazó tu invitación al partido "{metadata.eventTitle}"',
    fr: '{actorName} a refusé votre invitation au match "{metadata.eventTitle}"',
    it: '{actorName} ha rifiutato il tuo invito alla partita "{metadata.eventTitle}"',
    ja: '{actorName}さんが「{metadata.eventTitle}」の試合招待を辞退しました',
    pt: '{actorName} recusou seu convite para a partida "{metadata.eventTitle}"',
    ru: '{actorName} отклонил(а) ваше приглашение на матч "{metadata.eventTitle}"',
    zh: '{actorName} 拒绝了您的「{metadata.eventTitle}」比赛邀请',
  },
  // Club member invitation feed
  club_member_invite_pending: {
    ko: '{actorName}님이 {targetName}님을 {clubName} 클럽에 초대했습니다',
    en: '{actorName} invited {targetName} to join {clubName}',
  },
  // Club member left voluntarily
  club_member_left: {
    ko: '{actorName}님이 {clubName} 클럽을 떠났습니다',
    en: '{actorName} has left {clubName}',
  },
  // Club admin (owner) changed
  club_owner_changed: {
    ko: '{actorName}님이 {clubName} 클럽의 새로운 관리자가 되었습니다',
    en: '{actorName} is now the admin of {clubName}',
  },
  // 🎯 [KIM] Application approved - host approved team application
  application_approved: {
    ko: "'{metadata.eventTitle}' 모임 참여가 승인되었습니다! 🎉",
    en: "Your application for '{metadata.eventTitle}' has been approved! 🎉",
    de: "Ihre Teilnahme an '{metadata.eventTitle}' wurde genehmigt! 🎉",
    es: "¡Tu solicitud para '{metadata.eventTitle}' ha sido aprobada! 🎉",
    fr: "Votre demande pour '{metadata.eventTitle}' a été approuvée ! 🎉",
    it: "La tua richiesta per '{metadata.eventTitle}' è stata approvata! 🎉",
    ja: '「{metadata.eventTitle}」への参加が承認されました！🎉',
    pt: "Sua solicitação para '{metadata.eventTitle}' foi aprovada! 🎉",
    ru: "Ваша заявка на участие в '{metadata.eventTitle}' одобрена! 🎉",
    zh: '您的「{metadata.eventTitle}」参与申请已获批准！🎉',
  },
  // 🎯 [KIM] Application rejected - host rejected team application
  application_rejected: {
    ko: "'{metadata.eventTitle}' 모임 참여 신청이 거절되었습니다",
    en: "Your application for '{metadata.eventTitle}' has been declined",
    de: "Ihre Teilnahme an '{metadata.eventTitle}' wurde abgelehnt",
    es: "Tu solicitud para '{metadata.eventTitle}' ha sido rechazada",
    fr: "Votre demande pour '{metadata.eventTitle}' a été refusée",
    it: "La tua richiesta per '{metadata.eventTitle}' è stata rifiutata",
    ja: '「{metadata.eventTitle}」への参加申請が却下されました',
    pt: "Sua solicitação para '{metadata.eventTitle}' foi recusada",
    ru: "Ваша заявка на участие в '{metadata.eventTitle}' отклонена",
    zh: '您的「{metadata.eventTitle}」参与申请已被拒绝',
  },
  // 🎯 [KIM FIX] Application auto-rejected - another team was approved
  application_auto_rejected: {
    ko: "'{metadata.eventTitle}' 모임에 다른 팀이 승인되어 신청이 자동 마감되었습니다",
    en: "Your application for '{metadata.eventTitle}' was closed because another team was approved",
    de: "Ihre Bewerbung für '{metadata.eventTitle}' wurde geschlossen, da ein anderes Team genehmigt wurde",
    es: "Tu solicitud para '{metadata.eventTitle}' fue cerrada porque otro equipo fue aprobado",
    fr: "Votre demande pour '{metadata.eventTitle}' a été clôturée car une autre équipe a été approuvée",
    it: "La tua richiesta per '{metadata.eventTitle}' è stata chiusa perché un altro team è stato approvato",
    ja: '「{metadata.eventTitle}」への申請は、他のチームが承認されたため自動的に終了しました',
    pt: "Sua solicitação para '{metadata.eventTitle}' foi encerrada porque outra equipe foi aprovada",
    ru: "Ваша заявка на '{metadata.eventTitle}' была закрыта, так как другая команда была одобрена",
    zh: '您的「{metadata.eventTitle}」申请已自动关闭，因为另一个团队已被批准',
  },
  // 🎯 [KIM] Solo lobby team proposal accepted
  proposal_accepted: {
    ko: "{metadata.acceptorName}님이 '{metadata.eventTitle}' 팀 제안을 수락했습니다! 🎉",
    en: "{metadata.acceptorName} accepted your team proposal for '{metadata.eventTitle}'! 🎉",
    de: "{metadata.acceptorName} hat Ihren Teamvorschlag für '{metadata.eventTitle}' angenommen! 🎉",
    es: "¡{metadata.acceptorName} aceptó tu propuesta de equipo para '{metadata.eventTitle}'! 🎉",
    fr: "{metadata.acceptorName} a accepté votre proposition d'équipe pour '{metadata.eventTitle}' ! 🎉",
    it: "{metadata.acceptorName} ha accettato la tua proposta di squadra per '{metadata.eventTitle}'! 🎉",
    ja: '{metadata.acceptorName}さんが「{metadata.eventTitle}」のチーム提案を承諾しました！🎉',
    pt: "{metadata.acceptorName} aceitou sua proposta de equipe para '{metadata.eventTitle}'! 🎉",
    ru: "{metadata.acceptorName} принял(а) ваше предложение команды для '{metadata.eventTitle}'! 🎉",
    zh: '{metadata.acceptorName} 接受了您的「{metadata.eventTitle}」组队邀请！🎉',
  },
  // 🎯 [KIM] Solo lobby team proposal rejected
  proposal_rejected: {
    ko: "{metadata.rejectorName}님이 '{metadata.eventTitle}' 팀 제안을 거절했습니다",
    en: "{metadata.rejectorName} declined your team proposal for '{metadata.eventTitle}'",
    de: "{metadata.rejectorName} hat Ihren Teamvorschlag für '{metadata.eventTitle}' abgelehnt",
    es: "{metadata.rejectorName} rechazó tu propuesta de equipo para '{metadata.eventTitle}'",
    fr: "{metadata.rejectorName} a refusé votre proposition d'équipe pour '{metadata.eventTitle}'",
    it: "{metadata.rejectorName} ha rifiutato la tua proposta di squadra per '{metadata.eventTitle}'",
    ja: '{metadata.rejectorName}さんが「{metadata.eventTitle}」のチーム提案を辞退しました',
    pt: "{metadata.rejectorName} recusou sua proposta de equipe para '{metadata.eventTitle}'",
    ru: "{metadata.rejectorName} отклонил(а) ваше предложение команды для '{metadata.eventTitle}'",
    zh: '{metadata.rejectorName} 拒绝了您的「{metadata.eventTitle}」组队邀请',
  },
  // 🎯 [KIM] Team application cancelled by partner (notify the other team member)
  team_application_cancelled_by_partner: {
    ko: "{actorName}님이 '{metadata.eventTitle}' 팀 신청을 취소했습니다",
    en: "{actorName} cancelled your team application for '{metadata.eventTitle}'",
    de: "{actorName} hat die Teamanmeldung für '{metadata.eventTitle}' storniert",
    es: "{actorName} canceló la solicitud de equipo para '{metadata.eventTitle}'",
    fr: "{actorName} a annulé la demande d'équipe pour '{metadata.eventTitle}'",
    it: "{actorName} ha annullato la richiesta di squadra per '{metadata.eventTitle}'",
    ja: '{actorName}さんが「{metadata.eventTitle}」のチーム申請をキャンセルしました',
    pt: "{actorName} cancelou a inscrição da equipe para '{metadata.eventTitle}'",
    ru: "{actorName} отменил(а) командную заявку на '{metadata.eventTitle}'",
    zh: '{actorName} 取消了「{metadata.eventTitle}」的团队申请',
  },
  // 🎾 [KIM] Event cancelled by host (notify all participants, applicants, and host's partner)
  event_cancelled_by_host: {
    ko: "'{metadata.eventTitle}' 모임이 호스트에 의해 취소되었습니다 😔",
    en: "'{metadata.eventTitle}' has been cancelled by the host 😔",
    de: "'{metadata.eventTitle}' wurde vom Gastgeber abgesagt 😔",
    es: "'{metadata.eventTitle}' ha sido cancelado por el anfitrión 😔",
    fr: "'{metadata.eventTitle}' a été annulé par l'hôte 😔",
    it: "'{metadata.eventTitle}' è stato cancellato dall'host 😔",
    ja: '「{metadata.eventTitle}」がホストによりキャンセルされました 😔',
    pt: "'{metadata.eventTitle}' foi cancelado pelo anfitrião 😔",
    ru: "'{metadata.eventTitle}' был отменён организатором 😔",
    zh: '「{metadata.eventTitle}」已被主办方取消 😔',
  },
  // 🎾 [KIM FIX] Application cancelled by participant (notify the host)
  application_cancelled: {
    ko: "{actorName}님이 '{metadata.eventTitle}' 참여 신청을 취소했습니다",
    en: "{actorName} cancelled their application for '{metadata.eventTitle}'",
    de: "{actorName} hat die Teilnahme an '{metadata.eventTitle}' zurückgezogen",
    es: "{actorName} canceló su solicitud para '{metadata.eventTitle}'",
    fr: "{actorName} a annulé sa demande pour '{metadata.eventTitle}'",
    it: "{actorName} ha annullato la richiesta per '{metadata.eventTitle}'",
    ja: '{actorName}さんが「{metadata.eventTitle}」への参加申請をキャンセルしました',
    pt: "{actorName} cancelou sua inscrição para '{metadata.eventTitle}'",
    ru: "{actorName} отменил(а) заявку на '{metadata.eventTitle}'",
    zh: '{actorName} 取消了「{metadata.eventTitle}」的参与申请',
  },
  // 📬 [KIM] Admin received user feedback (shown to admins)
  admin_feedback_received: {
    ko: '{actorName}님이 피드백을 보냈습니다',
    en: '{actorName} sent feedback',
    de: '{actorName} hat Feedback gesendet',
    es: '{actorName} envió comentarios',
    fr: '{actorName} a envoyé un commentaire',
    it: '{actorName} ha inviato un feedback',
    ja: '{actorName}さんがフィードバックを送信しました',
    pt: '{actorName} enviou feedback',
    ru: '{actorName} отправил(а) отзыв',
    zh: '{actorName} 发送了反馈',
  },
  // 📬 [KIM] User received admin response to their feedback
  feedback_response_received: {
    ko: '관리자가 피드백에 답변했습니다',
    en: 'Admin responded to your feedback',
    de: 'Der Administrator hat auf Ihr Feedback geantwortet',
    es: 'El administrador respondió a tus comentarios',
    fr: "L'administrateur a répondu à votre commentaire",
    it: "L'amministratore ha risposto al tuo feedback",
    ja: '管理者がフィードバックに返信しました',
    pt: 'O administrador respondeu ao seu feedback',
    ru: 'Администратор ответил на ваш отзыв',
    zh: '管理员回复了您的反馈',
  },
  // 📬 [KIM] User replied to admin's feedback response (shown to admins)
  feedback_user_reply: {
    ko: '{actorName}님이 피드백에 답변했습니다',
    en: '{actorName} replied to feedback',
    de: '{actorName} hat auf Feedback geantwortet',
    es: '{actorName} respondió al comentario',
    fr: '{actorName} a répondu au commentaire',
    it: '{actorName} ha risposto al feedback',
    ja: '{actorName}さんがフィードバックに返信しました',
    pt: '{actorName} respondeu ao feedback',
    ru: '{actorName} ответил(а) на отзыв',
    zh: '{actorName} 回复了反馈',
  },
  // ULTIMATE FALLBACK: Template for completely unknown feed types
  unknown_activity: {
    ko: '{actorName}님이 새로운 활동을 시작했습니다',
    en: '{actorName} has a new activity',
  },
};

/**
 * 피드 필터링 옵션
 * @typedef {Object} FeedFilterOptions
 * @property {FeedItemType[]} [types] - 필터링할 타입들
 * @property {string[]} [clubIds] - 특정 클럽들만
 * @property {string[]} [friendIds] - 친구들만
 * @property {Date} [since] - 특정 시간 이후
 * @property {number} [limit] - 가져올 개수 제한
 */

/**
 * 피드 정렬 옵션
 * @typedef {'timestamp' | 'relevance'} FeedSortBy
 */

export default {
  FEED_TEMPLATES,
};
