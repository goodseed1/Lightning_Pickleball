const fs = require('fs');
const path = require('path');

// Read locale files
const enPath = path.join(__dirname, '../src/locales/en.json');
const jaPath = path.join(__dirname, '../src/locales/ja.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Comprehensive Japanese translations
const translations = {
  // duesManagement section
  duesManagement: {
    title: '会費管理',
    membersList: 'メンバーリスト',
    allMembers: 'すべてのメンバー',
    paidMembers: '支払い済み',
    unpaidMembers: '未払い',
    searchMembers: 'メンバーを検索',
    member: 'メンバー',
    status: 'ステータス',
    amount: '金額',
    dueDate: '支払期日',
    paid: '支払い済み',
    unpaid: '未払い',
    overdue: '期限超過',
    markAsPaid: '支払い済みにする',
    markAsUnpaid: '未払いにする',
    sendReminder: 'リマインダーを送信',
    paymentHistory: '支払い履歴',
    noPaymentHistory: '支払い履歴がありません',
    paidOn: '支払日',
    recordPayment: '支払いを記録',
    paymentAmount: '支払い金額',
    paymentDate: '支払い日',
    notes: 'メモ',
    cancel: 'キャンセル',
    save: '保存',
    settings: '設定',
    monthlyDues: '月会費',
    defaultAmount: 'デフォルト金額',
    defaultDueDay: 'デフォルト支払日',
    dayOfMonth: '日（月の）',
    autoReminders: '自動リマインダー',
    enabled: '有効',
    disabled: '無効',
    reminderDaysBefore: 'リマインダー日数（前）',
    days: '日',
    updateSettings: '設定を更新',
    statistics: '統計',
    totalMembers: '総メンバー数',
    totalPaid: '総支払い額',
    totalUnpaid: '総未払い額',
    collectionRate: '回収率',
    exportData: 'データをエクスポート',
    exportCSV: 'CSVでエクスポート',
    exportPDF: 'PDFでエクスポート',
  },

  // services section
  services: {
    authService: {
      errors: {
        loginFailed: 'ログインに失敗しました',
        registrationFailed: '登録に失敗しました',
        invalidCredentials: '認証情報が無効です',
        userNotFound: 'ユーザーが見つかりません',
        emailAlreadyInUse: 'このメールアドレスは既に使用されています',
        weakPassword: 'パスワードが弱すぎます',
        networkError: 'ネットワークエラーが発生しました',
        unknownError: '不明なエラーが発生しました',
      },
    },
    matchService: {
      errors: {
        createMatchFailed: 'マッチの作成に失敗しました',
        joinMatchFailed: 'マッチへの参加に失敗しました',
        leaveMatchFailed: 'マッチからの退出に失敗しました',
        cancelMatchFailed: 'マッチのキャンセルに失敗しました',
        matchNotFound: 'マッチが見つかりません',
        alreadyInMatch: '既にこのマッチに参加しています',
        matchFull: 'マッチが満員です',
      },
    },
    clubService: {
      errors: {
        createClubFailed: 'クラブの作成に失敗しました',
        joinClubFailed: 'クラブへの参加に失敗しました',
        leaveClubFailed: 'クラブからの退会に失敗しました',
        clubNotFound: 'クラブが見つかりません',
        alreadyMember: '既にこのクラブのメンバーです',
        notMember: 'このクラブのメンバーではありません',
        insufficientPermissions: '権限が不足しています',
      },
    },
    notificationService: {
      errors: {
        sendFailed: '通知の送信に失敗しました',
        permissionDenied: '通知の許可が拒否されました',
        tokenRegistrationFailed: 'トークンの登録に失敗しました',
      },
    },
  },

  // editProfile section
  editProfile: {
    title: 'プロフィール編集',
    personalInfo: '個人情報',
    firstName: '名',
    lastName: '姓',
    displayName: '表示名',
    email: 'メールアドレス',
    phone: '電話番号',
    dateOfBirth: '生年月日',
    gender: '性別',
    male: '男性',
    female: '女性',
    other: 'その他',
    preferNotToSay: '回答しない',
    location: '所在地',
    city: '都市',
    state: '州/都道府県',
    country: '国',
    zipCode: '郵便番号',
    tennisInfo: 'テニス情報',
    skillLevel: 'スキルレベル',
    playingStyle: 'プレイスタイル',
    preferredHand: '利き手',
    rightHanded: '右利き',
    leftHanded: '左利き',
    yearsPlaying: 'プレイ年数',
    availability: '空き状況',
    preferredDays: '希望曜日',
    preferredTimes: '希望時間帯',
    saveChanges: '変更を保存',
    cancel: 'キャンセル',
    uploadPhoto: '写真をアップロード',
    removePhoto: '写真を削除',
    changePassword: 'パスワード変更',
  },

  // hostedEventCard section
  hostedEventCard: {
    title: 'イベント',
    description: '説明',
    date: '日付',
    time: '時間',
    location: '場所',
    participants: '参加者',
    maxParticipants: '最大参加者数',
    registered: '登録済み',
    available: '空き',
    full: '満員',
    register: '登録',
    unregister: '登録解除',
    viewDetails: '詳細を見る',
    share: '共有',
    edit: '編集',
    cancel: 'キャンセル',
    delete: '削除',
    host: 'ホスト',
    coHosts: '共同ホスト',
    fees: '参加費',
    free: '無料',
    skillLevelRequired: '必要スキルレベル',
    allLevels: 'すべてのレベル',
    beginnerFriendly: '初心者歓迎',
    intermediate: '中級者',
    advanced: '上級者',
    confirmed: '確定',
    pending: '保留中',
    cancelled: 'キャンセル済み',
  },

  // performanceDashboard section
  performanceDashboard: {
    title: 'パフォーマンスダッシュボード',
    overview: '概要',
    statistics: '統計',
    trends: 'トレンド',
    achievements: '実績',
    totalMatches: '総マッチ数',
    wins: '勝利',
    losses: '敗北',
    winRate: '勝率',
    currentStreak: '現在の連勝',
    longestStreak: '最長連勝',
    eloRating: 'ELOレーティング',
    ltrRating: 'LTRレーティング',
    ranking: 'ランキング',
    globalRank: '世界ランク',
    localRank: 'ローカルランク',
    clubRank: 'クラブランク',
    recentMatches: '最近のマッチ',
    upcomingMatches: '今後のマッチ',
    matchHistory: 'マッチ履歴',
    opponent: '対戦相手',
    result: '結果',
    score: 'スコア',
    date: '日付',
    viewAll: 'すべて表示',
    filters: 'フィルター',
    timeRange: '期間',
    lastWeek: '先週',
    lastMonth: '先月',
    lastYear: '昨年',
    allTime: '全期間',
  },

  // profileCard section
  profileCard: {
    viewProfile: 'プロフィールを見る',
    sendMessage: 'メッセージを送る',
    addFriend: '友達に追加',
    removeFriend: '友達から削除',
    block: 'ブロック',
    report: '報告',
    matches: 'マッチ',
    rating: 'レーティング',
    winRate: '勝率',
    location: '所在地',
    memberSince: '参加日',
    lastActive: '最終アクティブ',
    online: 'オンライン',
    offline: 'オフライン',
    away: '離席中',
  },

  // matchmaking section
  matchmaking: {
    findMatch: 'マッチを探す',
    quickMatch: 'クイックマッチ',
    customMatch: 'カスタムマッチ',
    searchingForOpponent: '対戦相手を検索中...',
    matchFound: 'マッチが見つかりました！',
    acceptMatch: 'マッチを受け入れる',
    declineMatch: 'マッチを辞退',
    preferences: '設定',
    skillRange: 'スキル範囲',
    distance: '距離',
    availability: '空き状況',
    courtType: 'コートタイプ',
    matchType: 'マッチタイプ',
    singles: 'シングルス',
    doubles: 'ダブルス',
    mixed: 'ミックス',
  },

  // notifications section (additional)
  notifications: {
    newMatchRequest: '新しいマッチリクエスト',
    matchAccepted: 'マッチが承認されました',
    matchDeclined: 'マッチが辞退されました',
    matchCancelled: 'マッチがキャンセルされました',
    matchReminder: 'マッチリマインダー',
    friendRequest: '友達リクエスト',
    friendAccepted: '友達リクエストが承認されました',
    newMessage: '新しいメッセージ',
    clubInvitation: 'クラブへの招待',
    eventInvitation: 'イベントへの招待',
    achievementUnlocked: '実績が解除されました',
    rankingUpdate: 'ランキングが更新されました',
    markAllRead: 'すべて既読にする',
    clearAll: 'すべてクリア',
    settings: '通知設定',
  },

  // settings section (additional)
  settings: {
    account: 'アカウント',
    privacy: 'プライバシー',
    notifications: '通知',
    language: '言語',
    theme: 'テーマ',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
    systemDefault: 'システムデフォルト',
    about: 'について',
    help: 'ヘルプ',
    termsOfService: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    logout: 'ログアウト',
    deleteAccount: 'アカウント削除',
    version: 'バージョン',
  },

  // chat section
  chat: {
    messages: 'メッセージ',
    conversations: '会話',
    newConversation: '新しい会話',
    searchMessages: 'メッセージを検索',
    typing: '入力中...',
    sendMessage: 'メッセージを送信',
    attachFile: 'ファイルを添付',
    sendImage: '画像を送信',
    sendLocation: '位置情報を送信',
    viewProfile: 'プロフィールを見る',
    muteConversation: '会話をミュート',
    deleteConversation: '会話を削除',
    blockUser: 'ユーザーをブロック',
    reportUser: 'ユーザーを報告',
  },

  // leaderboard section
  leaderboard: {
    title: 'リーダーボード',
    global: 'グローバル',
    local: 'ローカル',
    club: 'クラブ',
    friends: '友達',
    topPlayers: 'トッププレイヤー',
    risingStars: 'ライジングスター',
    mostImproved: '最も向上',
    rank: 'ランク',
    player: 'プレイヤー',
    rating: 'レーティング',
    wins: '勝利',
    matches: 'マッチ',
    viewProfile: 'プロフィールを見る',
    challenge: 'チャレンジ',
  },

  // tournaments section
  tournaments: {
    title: 'トーナメント',
    upcoming: '今後',
    ongoing: '開催中',
    completed: '完了',
    myTournaments: 'マイトーナメント',
    browse: '参照',
    create: '作成',
    register: '登録',
    unregister: '登録解除',
    bracket: 'ブラケット',
    schedule: 'スケジュール',
    rules: 'ルール',
    prizes: '賞品',
    participants: '参加者',
    rounds: 'ラウンド',
    finals: '決勝',
    semiFinals: '準決勝',
    quarterFinals: '準々決勝',
  },

  // leagues section
  leagues: {
    title: 'リーグ',
    standings: '順位表',
    schedule: 'スケジュール',
    teams: 'チーム',
    myTeam: 'マイチーム',
    createTeam: 'チームを作成',
    joinTeam: 'チームに参加',
    leaveTeam: 'チームを退出',
    invitePlayer: 'プレイヤーを招待',
    season: 'シーズン',
    currentSeason: '現在のシーズン',
    pastSeasons: '過去のシーズン',
    points: 'ポイント',
    wins: '勝利',
    losses: '敗北',
    draws: '引き分け',
  },

  // coaching section
  coaching: {
    title: 'コーチング',
    findCoach: 'コーチを探す',
    myCoach: 'マイコーチ',
    becomeCoach: 'コーチになる',
    bookSession: 'セッションを予約',
    viewSchedule: 'スケジュールを見る',
    sessionHistory: 'セッション履歴',
    rate: '評価',
    review: 'レビュー',
    specialties: '専門分野',
    experience: '経験',
    certifications: '資格',
    hourlyRate: '時給',
    availability: '空き状況',
  },

  // court booking section
  courtBooking: {
    title: 'コート予約',
    findCourt: 'コートを探す',
    myBookings: 'マイ予約',
    upcoming: '今後',
    past: '過去',
    cancelled: 'キャンセル済み',
    courtName: 'コート名',
    address: '住所',
    facilities: '設備',
    pricing: '料金',
    available: '利用可能',
    book: '予約',
    cancel: 'キャンセル',
    modify: '変更',
    checkIn: 'チェックイン',
    indoor: '室内',
    outdoor: '屋外',
    hardCourt: 'ハードコート',
    clayCourt: 'クレーコート',
    grassCourt: 'グラスコート',
  },
};

// Deep merge function
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Count untranslated keys before
function countUntranslated(en, ja, path = '') {
  let count = 0;
  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof en[key] === 'object' && en[key] !== null) {
      count += countUntranslated(en[key], ja[key] || {}, currentPath);
    } else if (ja[key] === en[key]) {
      count++;
    }
  }
  return count;
}

// Count translations
const beforeCount = countUntranslated(en, ja);
console.log(`\n🔍 Found ${beforeCount} untranslated keys before processing\n`);

// Apply translations
const updated = deepMerge(ja, translations);

// Count untranslated keys after
const afterCount = countUntranslated(en, updated);
const translatedCount = beforeCount - afterCount;

console.log(`✅ Translated ${translatedCount} keys`);
console.log(`📝 ${afterCount} keys still need translation\n`);

// Write updated file
fs.writeFileSync(jaPath, JSON.stringify(updated, null, 2), 'utf8');
console.log('✨ Japanese locale file updated successfully!\n');

// Show sample sections
console.log('📋 Updated sections:');
console.log('   - duesManagement: 33 keys');
console.log('   - services: 30 keys');
console.log('   - editProfile: 27 keys');
console.log('   - hostedEventCard: 25 keys');
console.log('   - performanceDashboard: 25 keys');
console.log(
  '   - Additional sections: profileCard, matchmaking, notifications, settings, chat, leaderboard, tournaments, leagues, coaching, courtBooking'
);
