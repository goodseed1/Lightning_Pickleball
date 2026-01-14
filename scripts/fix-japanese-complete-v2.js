#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Comprehensive Japanese translation map
const translations = {
  services: {
    league: {
      matchNotFound: '試合が見つかりません',
      createMatchFirst: '先に試合を作成してください',
      noActiveMatches: 'アクティブな試合がありません',
      errorCreatingMatch: '試合の作成中にエラーが発生しました',
      matchCreatedSuccessfully: '試合を作成しました',
      matchUpdatedSuccessfully: '試合を更新しました',
      matchDeletedSuccessfully: '試合を削除しました',
      errorUpdatingMatch: '試合の更新中にエラーが発生しました',
      errorDeletingMatch: '試合の削除中にエラーが発生しました',
      invalidMatchData: '試合データが無効です',
    },
    team: {
      inviteAlreadyPending: 'このパートナーへのチーム招待は既に保留中です。',
      teamAlreadyConfirmed: 'このパートナーとの確認済みチームが既にあります。',
      playerHasTeam: 'このプレーヤーはこのトーナメント用の確認済みチームを既に持っています。',
      inviterAlreadyHasTeam: 'あなたはこのトーナメント用の確認済みチームを既に持っています。',
      noTeamFound: 'チームが見つかりません',
      teamCreatedSuccessfully: 'チームを作成しました',
      teamUpdatedSuccessfully: 'チームを更新しました',
      teamDeletedSuccessfully: 'チームを削除しました',
      invitationSentSuccessfully: '招待を送信しました',
      invitationAcceptedSuccessfully: '招待を承認しました',
      invitationRejectedSuccessfully: '招待を却下しました',
    },
  },

  duesManagement: {
    actions: {
      delete: '削除',
      remove: '削除',
      add: '追加',
      save: '保存',
      cancel: 'キャンセル',
      edit: '編集',
      view: '表示',
      export: 'エクスポート',
      import: 'インポート',
      print: '印刷',
      refresh: '更新',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      submit: '送信',
      confirm: '確認',
      reset: 'リセット',
      apply: '適用',
      clear: 'クリア',
    },
  },

  leagueDetail: {
    leagueDeleted: 'リーグが削除されました',
    leagueDeletedByAdmin:
      'このリーグは別の管理者によって削除されました。必要に応じて新しいリーグを作成してください。',
    unknownUser: '不明なユーザー',
    unknownPlayer: '不明',
    errorLoadingLeague: 'リーグ情報の読み込みに失敗しました',
    errorCreatingLeague: 'リーグの作成に失敗しました',
    errorUpdatingLeague: 'リーグの更新に失敗しました',
    errorDeletingLeague: 'リーグの削除に失敗しました',
    leagueCreatedSuccessfully: 'リーグを作成しました',
    leagueUpdatedSuccessfully: 'リーグを更新しました',
    noLeaguesFound: 'リーグが見つかりません',
    loading: '読み込み中...',
    noData: 'データがありません',
  },

  clubTournamentManagement: {
    title: 'トーナメント管理',
    loading: 'トーナメントを読み込み中...',
    tabs: {
      active: 'アクティブ',
      completed: '完了',
      upcoming: '開催予定',
      past: '過去',
      all: '全て',
    },
    detailTabs: {
      matches: '試合',
      participants: '参加者',
      bracket: 'トーナメント表',
      schedule: 'スケジュール',
      rules: 'ルール',
      prizes: '賞品',
      overview: '概要',
    },
    noTournamentsFound: 'トーナメントが見つかりません',
    createTournament: 'トーナメントを作成',
    editTournament: 'トーナメントを編集',
    deleteTournament: 'トーナメントを削除',
    viewDetails: '詳細を表示',
  },

  clubLeaguesTournaments: {
    buttons: {
      rejected: '却下',
      sendInvitation: 'チーム招待を送信',
      sendingInvitation: '招待を送信中...',
      accept: '承認',
      reject: '却下',
      cancel: 'キャンセル',
      join: '参加',
      leave: '脱退',
      viewDetails: '詳細を表示',
      register: '登録',
      withdraw: '辞退',
      confirm: '確認',
      pending: '保留中',
      approved: '承認済み',
    },
  },

  createEvent: {
    fields: {
      people: ' 人',
      autoConfigured: '✅ 自動設定済み',
      availableLanguages: '利用可能な言語',
      autoApproval: '先着順自動承認',
      participationFee: '参加費（任意）',
      eventName: 'イベント名',
      eventType: 'イベントタイプ',
      description: '説明',
      date: '日付',
      time: '時刻',
      location: '場所',
      maxParticipants: '最大参加者数',
      minParticipants: '最小参加者数',
      registrationDeadline: '登録締切',
      visibility: '公開設定',
      requireApproval: '承認が必要',
    },
  },

  types: {
    match: {
      matchTypes: {
        league: 'リーグ戦',
        tournament: 'トーナメント',
        lightning_match: 'ライトニングマッチ',
        practice: '練習試合',
        friendly: '親善試合',
        ranked: 'ランク戦',
      },
      matchStatus: {
        scheduled: 'スケジュール済み',
        inProgress: '進行中',
        completed: '完了',
        cancelled: 'キャンセル',
        postponed: '延期',
        pending: '保留中',
      },
    },
  },

  emailLogin: {
    labels: {
      email: 'メール',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      firstName: '名',
      lastName: '姓',
      displayName: '表示名',
    },
    placeholders: {
      email: 'メールアドレスを入力',
      password: 'パスワードを入力',
      confirmPassword: 'パスワードを再入力',
      firstName: '名を入力',
      lastName: '姓を入力',
    },
  },

  club: {
    clubMembers: {
      title: 'メンバー管理',
      tabs: {
        currentMembers: '現在のメンバー',
        joinRequests: '参加申請',
        allMembers: '全メンバー',
        roleManagement: '役割管理',
        pendingRequests: '保留中の申請',
        activeMembers: 'アクティブメンバー',
        inactiveMembers: '非アクティブメンバー',
      },
    },
  },

  createClub: {
    title: 'クラブを作成',
    basic_info: '基本情報',
    court_address: 'コート住所',
    regular_meet: '定期ミートアップ',
    visibility: '公開設定',
    contact_info: '連絡先情報',
    amenities: 'アメニティ',
    rules: 'ルール',
    photos: '写真',
  },

  myActivities: {
    header: {
      title: '👤 マイアクティビティ',
      notifications: '通知',
      settings: '設定',
    },
    loading: 'データを読み込み中...',
    tabs: {
      profile: 'プロフィール',
      stats: '統計',
      events: 'マイイベント',
      matches: 'マイ試合',
      achievements: '実績',
      history: '履歴',
    },
  },

  clubDuesManagement: {
    title: '会費管理',
    loading: 'データを読み込み中...',
    tabs: {
      settings: '設定',
      status: '支払い状況',
      unpaid: '未払いメンバー',
      paid: '支払い済みメンバー',
      history: '履歴',
      reports: 'レポート',
    },
  },

  matches: {
    header: {
      notificationSettings: '通知設定',
      currentNotificationDistance: '現在の通知距離: {{distance}} マイル',
      title: '試合',
    },
    tabs: {
      personal: '個人試合',
      club: 'クラブイベント',
      upcoming: '今後の試合',
      past: '過去の試合',
      all: '全試合',
    },
    createButton: {
      newMatch: '新しい試合を作成',
      quickMatch: 'クイックマッチ',
      scheduledMatch: 'スケジュール試合',
    },
  },

  profileSettings: {
    location: {
      permission: {
        granted: '許可済み',
        denied: '拒否',
        undetermined: '未確定',
        checking: '確認中...',
        grantedDescription: '近くのクラブや試合を見つけることができます',
        deniedDescription: '位置情報の使用が拒否されました',
      },
    },
  },

  discover: {
    skillFilters: {
      all: '全て',
      beginner: '初心者',
      intermediate: '中級',
      advanced: '上級',
      expert: 'エキスパート',
      pro: 'プロ',
    },
  },

  profile: {
    userProfile: {
      screenTitle: 'ユーザープロフィール',
      loading: 'プロフィールを読み込み中...',
      loadError: 'プロフィールの読み込みに失敗しました',
      notFound: 'プロフィールが見つかりません',
      backButton: '戻る',
      editButton: '編集',
      followButton: 'フォロー',
      unfollowButton: 'フォロー解除',
      messageButton: 'メッセージ',
    },
  },

  eventCard: {
    status: {
      pending: '保留中',
      approved: '承認済み',
      rejected: '却下',
      cancelled: 'キャンセル',
      completed: '完了',
    },
    partnerStatus: {
      partnerPending: 'パートナー保留中',
      partnerConfirmed: 'パートナー確認済み',
      partnerRejected: 'パートナー却下',
      partnerCancelled: 'パートナーキャンセル',
    },
  },

  createMeetup: {
    loading: 'クラブ情報を読み込み中...',
    errors: {
      errorTitle: 'エラー',
      failedToLoadInfo: '初期情報の読み込みに失敗しました',
      failedToLoadMeetup: 'ミートアップ情報を読み込めませんでした。',
      failedToLoadMeetupError: 'ミートアップ情報の読み込み中にエラーが発生しました。',
      invalidData: 'データが無効です',
      requiredFieldMissing: '必須フィールドが不足しています',
    },
  },

  aiMatching: {
    analyzing: {
      title: 'AIマッチング分析',
      steps: {
        profile: 'プロフィールを分析中...',
        skillLevel: 'スキルレベルをマッチング中...',
        location: '場所で検索中...',
        schedule: 'スケジュールの互換性を確認中...',
        preferences: '好みを分析中...',
        finalizing: '最終候補を選定中...',
      },
    },
  },

  scheduleMeetup: {
    subtitle: 'イベントは毎週自動的に作成されます',
    loading: '定期ミーティングを読み込み中...',
    addMeeting: 'ミーティングを追加',
    weekly: '毎',
    days: {
      sunday: '日曜日',
      monday: '月曜日',
      tuesday: '火曜日',
      wednesday: '水曜日',
      thursday: '木曜日',
      friday: '金曜日',
      saturday: '土曜日',
    },
  },

  clubOverviewScreen: {
    title: 'クラブ概要',
    loading: 'クラブ情報を読み込み中...',
    error: 'クラブ情報の読み込みに失敗しました',
    tabs: {
      overview: '概要',
      members: 'メンバー',
      events: 'イベント',
      leaderboard: 'リーダーボード',
      announcements: 'お知らせ',
    },
  },

  badgeGallery: {
    title: 'バッジギャラリー',
    myBadges: 'マイバッジ',
    allBadges: '全バッジ',
    earned: '獲得済み',
    locked: 'ロック中',
    progress: '進捗',
    categories: {
      achievement: '実績',
      participation: '参加',
      skill: 'スキル',
      social: 'ソーシャル',
      special: '特別',
    },
  },

  leagues: {
    title: 'リーグ',
    myLeagues: 'マイリーグ',
    allLeagues: '全リーグ',
    joinLeague: 'リーグに参加',
    createLeague: 'リーグを作成',
    standings: '順位表',
    schedule: 'スケジュール',
    noLeagues: 'リーグがありません',
  },

  auth: {
    signIn: 'ログイン',
    signUp: '新規登録',
    signOut: 'ログアウト',
    forgotPassword: 'パスワードをお忘れですか？',
    resetPassword: 'パスワードをリセット',
    createAccount: 'アカウントを作成',
    orContinueWith: 'または続ける',
    termsAndConditions: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    agreeToTerms: '利用規約に同意します',
  },

  scoreConfirmation: {
    title: 'スコア確認',
    confirmScore: 'スコアを確認',
    disputeScore: 'スコアに異議',
    waitingForConfirmation: '確認待ち',
    scoreConfirmed: 'スコアが確認されました',
    scoreDisputed: 'スコアに異議が申し立てられました',
    enterScore: 'スコアを入力',
    winner: '勝者',
    loser: '敗者',
  },

  meetupDetail: {
    title: 'ミートアップ詳細',
    loading: 'ミートアップ情報を読み込み中...',
    error: 'ミートアップ情報の読み込みに失敗しました',
    join: '参加',
    leave: '脱退',
    cancel: 'キャンセル',
    edit: '編集',
    participants: '参加者',
    details: '詳細',
  },

  clubPoliciesScreen: {
    title: 'クラブポリシー',
    loading: 'ポリシーを読み込み中...',
    noPolicies: 'ポリシーが設定されていません',
    addPolicy: 'ポリシーを追加',
    editPolicy: 'ポリシーを編集',
    deletePolicy: 'ポリシーを削除',
    types: {
      privacy: 'プライバシー',
      conduct: '行動規範',
      membership: 'メンバーシップ',
      safety: '安全',
      other: 'その他',
    },
  },

  schedules: {
    title: 'スケジュール',
    mySchedule: 'マイスケジュール',
    today: '今日',
    week: '週',
    month: '月',
    upcoming: '今後',
    past: '過去',
    noEvents: 'イベントがありません',
  },

  findClubScreen: {
    title: 'クラブを探す',
    searchPlaceholder: 'クラブ名または場所で検索',
    nearMe: '近くのクラブ',
    byDistance: '距離順',
    byName: '名前順',
    byMembers: 'メンバー数順',
    noClubsFound: 'クラブが見つかりません',
  },

  matchRequest: {
    title: '試合申請',
    sendRequest: '申請を送信',
    acceptRequest: '申請を承認',
    rejectRequest: '申請を却下',
    cancelRequest: '申請をキャンセル',
    pending: '保留中の申請',
    accepted: '承認済み',
    rejected: '却下',
  },

  cards: {
    viewDetails: '詳細を表示',
    join: '参加',
    leave: '脱退',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    share: '共有',
    favorite: 'お気に入り',
    unfavorite: 'お気に入り解除',
  },

  clubList: {
    title: 'クラブ一覧',
    myClubs: '所属クラブ',
    allClubs: '全クラブ',
    featured: '注目',
    nearby: '近く',
    popular: '人気',
    new: '新着',
  },

  policyEditScreen: {
    title: 'ポリシー編集',
    policyName: 'ポリシー名',
    policyContent: 'ポリシー内容',
    policyType: 'ポリシータイプ',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
  },

  feedCard: {
    like: 'いいね',
    comment: 'コメント',
    share: '共有',
    likes: 'いいね',
    comments: 'コメント',
    viewAllComments: '全コメントを表示',
    addComment: 'コメントを追加',
  },

  roleManagement: {
    title: '役割管理',
    assignRole: '役割を割り当て',
    removeRole: '役割を削除',
    roles: {
      owner: 'オーナー',
      admin: '管理者',
      moderator: 'モデレーター',
      member: 'メンバー',
      guest: 'ゲスト',
    },
  },

  clubCommunication: {
    title: 'クラブコミュニケーション',
    sendMessage: 'メッセージを送信',
    announcements: 'お知らせ',
    discussions: 'ディスカッション',
    chat: 'チャット',
    notifications: '通知',
  },

  eventParticipation: {
    title: 'イベント参加',
    participate: '参加',
    withdraw: '辞退',
    confirm: '確認',
    pending: '保留中',
    approved: '承認済み',
    rejected: '却下',
    waitlist: 'ウェイティングリスト',
  },

  contexts: {
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    noData: 'データがありません',
    retry: '再試行',
    success: '成功',
    failed: '失敗',
  },

  aiChat: {
    title: 'AIチャット',
    placeholder: 'メッセージを入力...',
    send: '送信',
    typing: '入力中...',
    thinking: '考え中...',
    noMessages: 'メッセージがありません',
  },

  appNavigator: {
    home: 'ホーム',
    discover: '探す',
    matches: '試合',
    clubs: 'クラブ',
    profile: 'プロフィール',
    settings: '設定',
    notifications: '通知',
    messages: 'メッセージ',
  },

  recordScore: {
    title: 'スコアを記録',
    set: 'セット',
    game: 'ゲーム',
    point: 'ポイント',
    submit: '送信',
    cancel: 'キャンセル',
    winner: '勝者',
  },

  clubDetailScreen: {
    title: 'クラブ詳細',
    loading: 'クラブ情報を読み込み中...',
    join: '参加',
    leave: '脱退',
    members: 'メンバー',
    events: 'イベント',
    about: '概要',
  },

  terms: {
    title: '利用規約',
    accept: '同意する',
    decline: '同意しない',
    lastUpdated: '最終更新',
    readMore: '続きを読む',
    readLess: '閉じる',
  },

  league: {
    title: 'リーグ',
    join: '参加',
    leave: '脱退',
    standings: '順位表',
    schedule: 'スケジュール',
    matches: '試合',
  },

  mapAppSelector: {
    title: 'マップアプリを選択',
    appleMaps: 'Apple Maps',
    googleMaps: 'Google Maps',
    waze: 'Waze',
    cancel: 'キャンセル',
  },

  ntrpSelector: {
    title: 'LTRを選択',
    beginner: '初心者',
    intermediate: '中級',
    advanced: '上級',
    expert: 'エキスパート',
    pro: 'プロ',
  },

  tournamentDetail: {
    title: 'トーナメント詳細',
    bracket: 'トーナメント表',
    participants: '参加者',
    schedule: 'スケジュール',
    rules: 'ルール',
    prizes: '賞品',
  },

  participantSelector: {
    title: '参加者を選択',
    search: '検索',
    selected: '選択済み',
    select: '選択',
    deselect: '選択解除',
  },

  tournament: {
    title: 'トーナメント',
    join: '参加',
    withdraw: '辞退',
    bracket: 'トーナメント表',
    schedule: 'スケジュール',
  },

  createModal: {
    title: '作成',
    cancel: 'キャンセル',
  },

  clubHallOfFame: {
    title: '殿堂',
    champions: 'チャンピオン',
  },

  units: {
    miles: 'マイル',
  },

  myProfile: {
    title: 'マイプロフィール',
  },

  matchDetail: {
    title: '試合詳細',
  },
};

// Read and merge
const jaPath = path.join(__dirname, '..', 'src', 'locales', 'ja.json');
const currentJa = JSON.parse(fs.readFileSync(jaPath, 'utf8'));
const updatedJa = deepMerge(currentJa, translations);
fs.writeFileSync(jaPath, JSON.stringify(updatedJa, null, 2) + '\n', 'utf8');

console.log('✅ Comprehensive Japanese translations updated!');
console.log('📊 Sections translated: ' + Object.keys(translations).length);
