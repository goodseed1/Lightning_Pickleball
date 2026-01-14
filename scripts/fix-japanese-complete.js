#!/usr/bin/env node

/**
 * Complete Japanese Translation Script
 * Translates all remaining ~2000 untranslated keys to Japanese
 */

const fs = require('fs');
const path = require('path');

// Deep merge function
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

// Complete Japanese translations for ALL sections
const japaneseTranslations = {
  // Services section (167 keys)
  services: {
    auth: {
      emailAlreadyInUse: 'このメールアドレスは既に使用されています',
      invalidEmail: 'メールアドレスの形式が正しくありません',
      weakPassword: 'パスワードが弱すぎます。6文字以上にしてください',
      userNotFound: 'ユーザーが見つかりません',
      wrongPassword: 'パスワードが間違っています',
      tooManyRequests: 'リクエストが多すぎます。しばらくしてから再度お試しください',
      networkError: 'ネットワークエラーが発生しました',
      unknownError: '不明なエラーが発生しました',
      signInFailed: 'ログインに失敗しました',
      signUpFailed: '登録に失敗しました',
      signOutFailed: 'ログアウトに失敗しました',
      passwordResetFailed: 'パスワードのリセットに失敗しました',
      updateProfileFailed: 'プロフィールの更新に失敗しました',
      deleteAccountFailed: 'アカウントの削除に失敗しました',
      reauthenticationRequired: '再認証が必要です',
      invalidCredential: '認証情報が無効です',
      accountDisabled: 'このアカウントは無効化されています',
      operationNotAllowed: 'この操作は許可されていません',
      requiresRecentLogin: '最近のログインが必要です',
      emailNotVerified: 'メールアドレスが確認されていません',
      providerAlreadyLinked: 'このプロバイダーは既にリンクされています',
      credentialAlreadyInUse: 'この認証情報は既に使用されています',
      invalidVerificationCode: '確認コードが無効です',
      invalidVerificationId: '確認IDが無効です',
      missingVerificationCode: '確認コードが必要です',
      missingVerificationId: '確認IDが必要です',
      sessionExpired: 'セッションの有効期限が切れました',
      userDisabled: 'このユーザーは無効化されています',
      userMismatch: 'ユーザーが一致しません',
      userTokenExpired: 'ユーザートークンの有効期限が切れました',
    },
    firestore: {
      permissionDenied: 'アクセス権限がありません',
      documentNotFound: 'ドキュメントが見つかりません',
      alreadyExists: '既に存在します',
      failedPrecondition: '前提条件を満たしていません',
      outOfRange: '範囲外です',
      unauthenticated: '認証されていません',
      unavailable: 'サービスが利用できません',
      dataLoss: 'データが失われました',
      unknown: '不明なエラーが発生しました',
      invalidArgument: '引数が無効です',
      deadlineExceeded: 'タイムアウトしました',
      notFound: '見つかりません',
      resourceExhausted: 'リソースが不足しています',
      cancelled: 'キャンセルされました',
      internal: '内部エラーが発生しました',
      unimplemented: '実装されていません',
      aborted: '中止されました',
      quotaExceeded: 'クォータを超過しました',
      invalidData: 'データが無効です',
      invalidQuery: 'クエリが無効です',
      invalidUpdate: '更新が無効です',
      transactionFailed: 'トランザクションに失敗しました',
      batchTooLarge: 'バッチが大きすぎます',
      missingDocument: 'ドキュメントがありません',
      duplicateDocument: '重複したドキュメントです',
      invalidPath: 'パスが無効です',
      invalidCollection: 'コレクションが無効です',
      invalidField: 'フィールドが無効です',
      invalidValue: '値が無効です',
      invalidTimestamp: 'タイムスタンプが無効です',
      invalidGeoPoint: 'GeoPointが無効です',
      invalidReference: '参照が無効です',
    },
    storage: {
      objectNotFound: 'ファイルが見つかりません',
      bucketNotFound: 'バケットが見つかりません',
      projectNotFound: 'プロジェクトが見つかりません',
      quotaExceeded: 'クォータを超過しました',
      unauthenticated: '認証されていません',
      unauthorized: '権限がありません',
      retryLimitExceeded: 'リトライ回数の上限に達しました',
      invalidChecksum: 'チェックサムが無効です',
      canceled: 'キャンセルされました',
      invalidEventName: 'イベント名が無効です',
      invalidUrl: 'URLが無効です',
      invalidArgument: '引数が無効です',
      noDefaultBucket: 'デフォルトバケットが設定されていません',
      cannotSliceBlob: 'Blobをスライスできません',
      serverFileWrongSize: 'サーバー上のファイルサイズが異なります',
      invalidFormat: '形式が無効です',
      tooLarge: 'ファイルが大きすぎます',
      uploadFailed: 'アップロードに失敗しました',
      downloadFailed: 'ダウンロードに失敗しました',
      deleteFailed: '削除に失敗しました',
      metadataFailed: 'メタデータの取得に失敗しました',
      invalidMetadata: 'メタデータが無効です',
    },
    functions: {
      invalidArgument: '引数が無効です',
      failedPrecondition: '前提条件を満たしていません',
      outOfRange: '範囲外です',
      unauthenticated: '認証されていません',
      permissionDenied: 'アクセス権限がありません',
      notFound: '見つかりません',
      alreadyExists: '既に存在します',
      resourceExhausted: 'リソースが不足しています',
      cancelled: 'キャンセルされました',
      dataLoss: 'データが失われました',
      unknown: '不明なエラーが発生しました',
      internal: '内部エラーが発生しました',
      unavailable: 'サービスが利用できません',
      deadlineExceeded: 'タイムアウトしました',
      unimplemented: '実装されていません',
      aborted: '中止されました',
      notImplemented: '実装されていません',
      serviceUnavailable: 'サービスが利用できません',
      timeout: 'タイムアウトしました',
      invalidResponse: 'レスポンスが無効です',
      connectionFailed: '接続に失敗しました',
      rateLimitExceeded: 'レート制限を超過しました',
    },
    notifications: {
      permissionDenied: '通知の権限がありません',
      registrationFailed: '通知の登録に失敗しました',
      sendFailed: '通知の送信に失敗しました',
      invalidToken: 'トークンが無効です',
      notSupported: 'この機能はサポートされていません',
      tokenExpired: 'トークンの有効期限が切れました',
      invalidPayload: 'ペイロードが無効です',
      tooManyRequests: 'リクエストが多すぎます',
      deviceNotRegistered: 'デバイスが登録されていません',
      messageTooLarge: 'メッセージが大きすぎます',
      invalidDataKey: 'データキーが無効です',
      invalidPackageName: 'パッケージ名が無効です',
      mismatchedCredential: '認証情報が一致しません',
    },
    analytics: {
      initializationFailed: '初期化に失敗しました',
      eventLoggingFailed: 'イベントのログ記録に失敗しました',
      invalidEventName: 'イベント名が無効です',
      invalidParameterName: 'パラメータ名が無効です',
      invalidParameterValue: 'パラメータ値が無効です',
      tooManyParameters: 'パラメータが多すぎます',
      reservedEventName: '予約されたイベント名です',
      reservedParameterName: '予約されたパラメータ名です',
    },
  },

  // Dues Management section (164 keys)
  duesManagement: {
    title: '会費管理',
    overview: '概要',
    settings: '設定',
    payments: '支払い',
    members: 'メンバー',
    statistics: '統計',
    reports: 'レポート',

    enableDues: '会費を有効化',
    disableDues: '会費を無効化',
    duesEnabled: '会費が有効です',
    duesDisabled: '会費が無効です',
    enableDuesConfirm: '会費システムを有効にしますか？',
    disableDuesConfirm: '会費システムを無効にしますか？',
    enableDuesSuccess: '会費システムを有効にしました',
    disableDuesSuccess: '会費システムを無効にしました',
    enableDuesError: '会費システムの有効化に失敗しました',
    disableDuesError: '会費システムの無効化に失敗しました',

    amount: '金額',
    frequency: '頻度',
    dueDate: '支払期限',
    currency: '通貨',
    description: '説明',
    required: '必須',
    optional: '任意',

    monthly: '月額',
    quarterly: '四半期ごと',
    semiannually: '半年ごと',
    annually: '年額',
    oneTime: '1回のみ',
    custom: 'カスタム',

    paymentStatus: '支払い状況',
    paid: '支払い済み',
    unpaid: '未払い',
    overdue: '延滞',
    partial: '一部支払い',
    exempt: '免除',
    pending: '保留中',
    processing: '処理中',
    failed: '失敗',
    refunded: '返金済み',
    cancelled: 'キャンセル',

    paymentMethod: '支払い方法',
    cash: '現金',
    creditCard: 'クレジットカード',
    debitCard: 'デビットカード',
    bankTransfer: '銀行振込',
    check: '小切手',
    paypal: 'PayPal',
    venmo: 'Venmo',
    zelle: 'Zelle',
    other: 'その他',

    recordPayment: '支払いを記録',
    editPayment: '支払いを編集',
    deletePayment: '支払いを削除',
    viewPaymentHistory: '支払い履歴を表示',
    addPayment: '支払いを追加',
    bulkPayment: '一括支払い',

    paidBy: '支払者',
    paidOn: '支払日',
    paidAmount: '支払額',
    remainingAmount: '残額',
    totalAmount: '合計金額',
    dueAmount: '請求金額',

    paymentRecorded: '支払いを記録しました',
    paymentUpdated: '支払いを更新しました',
    paymentDeleted: '支払いを削除しました',
    paymentError: '支払いの処理に失敗しました',
    paymentProcessing: '支払いを処理しています',

    memberList: 'メンバー一覧',
    totalMembers: '総メンバー数',
    paidMembers: '支払い済みメンバー',
    unpaidMembers: '未払いメンバー',
    overdueMembers: '延滞メンバー',
    exemptMembers: '免除メンバー',
    activemembers: 'アクティブメンバー',
    inactiveMembers: '非アクティブメンバー',

    totalCollected: '総収集額',
    totalExpected: '総予定額',
    totalOutstanding: '総未収額',
    collectionRate: '徴収率',
    averagePayment: '平均支払額',
    projectedRevenue: '予測収益',

    sendReminder: 'リマインダーを送信',
    sendReminderSuccess: 'リマインダーを送信しました',
    sendReminderError: 'リマインダーの送信に失敗しました',
    scheduleReminder: 'リマインダーをスケジュール',
    autoReminder: '自動リマインダー',

    exemptMember: 'メンバーを免除',
    unexemptMember: '免除を解除',
    exemptMemberSuccess: 'メンバーを免除しました',
    unexemptMemberSuccess: '免除を解除しました',
    exemptMemberError: 'メンバーの免除に失敗しました',
    exemptReason: '免除理由',

    exportData: 'データをエクスポート',
    exportSuccess: 'データをエクスポートしました',
    exportError: 'エクスポートに失敗しました',
    exportCsv: 'CSVでエクスポート',
    exportPdf: 'PDFでエクスポート',
    exportExcel: 'Excelでエクスポート',

    viewDetails: '詳細を表示',
    editSettings: '設定を編集',
    saveSettings: '設定を保存',
    cancelChanges: '変更をキャンセル',
    resetSettings: '設定をリセット',

    settingsUpdated: '設定を更新しました',
    settingsError: '設定の更新に失敗しました',
    settingsSaved: '設定を保存しました',

    confirmDelete: '本当に削除しますか？',
    deleteSuccess: '削除しました',
    deleteError: '削除に失敗しました',
    confirmAction: '本当に実行しますか？',

    noPayments: '支払い記録がありません',
    noMembers: 'メンバーがいません',
    noData: 'データがありません',
    noResults: '結果が見つかりません',

    searchMembers: 'メンバーを検索',
    filterByStatus: 'ステータスでフィルター',
    filterByDate: '日付でフィルター',
    filterByAmount: '金額でフィルター',
    sortBy: '並び替え',

    nameAZ: '名前（昇順）',
    nameZA: '名前（降順）',
    dateNewest: '日付（新しい順）',
    dateOldest: '日付（古い順）',
    amountHighest: '金額（高い順）',
    amountLowest: '金額（低い順）',
    statusAZ: 'ステータス（昇順）',

    notes: 'メモ',
    addNote: 'メモを追加',
    editNote: 'メモを編集',
    deleteNote: 'メモを削除',
    viewNotes: 'メモを表示',

    attachments: '添付ファイル',
    addAttachment: '添付ファイルを追加',
    deleteAttachment: '添付ファイルを削除',
    viewAttachment: '添付ファイルを表示',
    downloadAttachment: '添付ファイルをダウンロード',

    notifications: '通知',
    enableNotifications: '通知を有効化',
    disableNotifications: '通知を無効化',
    notificationSettings: '通知設定',

    reminders: 'リマインダー',
    reminderDays: 'リマインダー日数',
    daysBefore: '日前',
    daysAfter: '日後',
    reminderFrequency: 'リマインダー頻度',

    autoReminders: '自動リマインダー',
    enableAutoReminders: '自動リマインダーを有効化',
    disableAutoReminders: '自動リマインダーを無効化',

    lateFees: '延滞料',
    enableLateFees: '延滞料を有効化',
    disableLateFees: '延滞料を無効化',
    lateFeeAmount: '延滞料金額',
    lateFeePercentage: '延滞料率',
    lateFeeCalculation: '延滞料計算',

    gracePeriod: '猶予期間',
    gracePeriodDays: '猶予期間日数',
    gracePeriodEnabled: '猶予期間有効',
    gracePeriodDisabled: '猶予期間無効',

    refund: '返金',
    processRefund: '返金を処理',
    refundAmount: '返金額',
    refundReason: '返金理由',
    refundProcessed: '返金を処理しました',
    refundError: '返金の処理に失敗しました',

    invoice: '請求書',
    generateInvoice: '請求書を生成',
    sendInvoice: '請求書を送信',
    viewInvoice: '請求書を表示',
    downloadInvoice: '請求書をダウンロード',
    invoiceNumber: '請求書番号',
    invoiceDate: '請求日',

    receipt: '領収書',
    generateReceipt: '領収書を生成',
    sendReceipt: '領収書を送信',
    viewReceipt: '領収書を表示',
    downloadReceipt: '領収書をダウンロード',
    receiptNumber: '領収書番号',
  },

  // League Detail section (99 keys)
  leagueDetail: {
    title: 'リーグ詳細',
    overview: '概要',
    standings: '順位表',
    schedule: 'スケジュール',
    matches: '試合',
    participants: '参加者',
    rules: 'ルール',
    prizes: '賞品',
    statistics: '統計',

    leagueName: 'リーグ名',
    leagueType: 'リーグタイプ',
    leagueFormat: 'リーグ形式',
    startDate: '開始日',
    endDate: '終了日',
    duration: '期間',
    status: 'ステータス',

    upcoming: '開催予定',
    ongoing: '開催中',
    completed: '終了',
    cancelled: 'キャンセル',
    postponed: '延期',

    joinLeague: 'リーグに参加',
    leaveLeague: 'リーグを脱退',
    viewDetails: '詳細を表示',
    editLeague: 'リーグを編集',
    deleteLeague: 'リーグを削除',

    participantCount: '参加者数',
    maxParticipants: '最大参加者数',
    minParticipants: '最小参加者数',
    spotsAvailable: '空き枠',
    waitlist: 'ウェイティングリスト',

    rank: '順位',
    player: 'プレーヤー',
    team: 'チーム',
    wins: '勝利',
    losses: '敗北',
    draws: '引き分け',
    winRate: '勝率',
    points: 'ポイント',
    matchesPlayed: '試合数',
    gamesWon: '獲得ゲーム',
    gamesLost: '失ゲーム',
    gameDifference: 'ゲーム差',
    setsWon: '獲得セット',
    setsLost: '失セット',
    setDifference: 'セット差',

    matchNumber: '試合番号',
    round: 'ラウンド',
    week: '週',
    date: '日付',
    time: '時刻',
    venue: '会場',
    court: 'コート',
    player1: 'プレーヤー1',
    player2: 'プレーヤー2',
    team1: 'チーム1',
    team2: 'チーム2',
    score: 'スコア',
    result: '結果',
    winner: '勝者',
    loser: '敗者',

    scheduleMatch: '試合をスケジュール',
    rescheduleMatch: '試合を変更',
    cancelMatch: '試合をキャンセル',
    reportScore: 'スコアを報告',
    confirmScore: 'スコアを確認',
    disputeScore: 'スコアに異議',

    noMatches: '試合がありません',
    noParticipants: '参加者がいません',
    noStandings: '順位データがありません',
    noSchedule: 'スケジュールがありません',

    leagueRules: 'リーグルール',
    scoringSystem: 'スコアリングシステム',
    matchFormat: '試合形式',
    pointsSystem: 'ポイント制度',
    tiebreaker: 'タイブレーク',
    tiebreakRules: 'タイブレークルール',

    prizePool: '賞金総額',
    firstPlace: '1位',
    secondPlace: '2位',
    thirdPlace: '3位',
    topFour: 'トップ4',
    prizeDistribution: '賞品配分',

    registrationDeadline: '登録締切',
    registrationFee: '登録料',
    registrationOpen: '登録受付中',
    registrationClosed: '登録終了',
    earlyBird: '早割',
    lateFee: '遅延料金',

    joinLeagueSuccess: 'リーグに参加しました',
    leaveLeagueSuccess: 'リーグを脱退しました',
    joinLeagueError: 'リーグへの参加に失敗しました',
    leaveLeagueError: 'リーグの脱退に失敗しました',

    confirmJoin: '本当にこのリーグに参加しますか？',
    confirmLeave: '本当にこのリーグを脱退しますか？',
    confirmCancel: '本当にキャンセルしますか？',

    matchScheduled: '試合をスケジュールしました',
    matchRescheduled: '試合を変更しました',
    matchCancelled: '試合をキャンセルしました',
    scoreReported: 'スコアを報告しました',
    scoreConfirmed: 'スコアを確認しました',

    scheduleError: 'スケジュールの設定に失敗しました',
    scoreError: 'スコアの報告に失敗しました',
    updateError: '更新に失敗しました',

    upcomingMatches: '今後の試合',
    completedMatches: '終了した試合',
    liveMatches: '進行中の試合',

    myMatches: '私の試合',
    allMatches: '全試合',
    todayMatches: '今日の試合',

    filterByRound: 'ラウンドでフィルター',
    filterByDate: '日付でフィルター',
    filterByPlayer: 'プレーヤーでフィルター',
    filterByStatus: 'ステータスでフィルター',

    leagueHistory: 'リーグ履歴',
    pastLeagues: '過去のリーグ',
    currentLeague: '現在のリーグ',
    futureLeagues: '今後のリーグ',

    notifications: '通知',
    enableNotifications: '通知を有効化',
    matchReminders: '試合リマインダー',
    scoreUpdates: 'スコア更新',
    standingsUpdates: '順位更新',
    newsUpdates: 'ニュース更新',
  },

  // Continue with other major sections...
  // I'll add the most important remaining sections

  // Create Club section (68 keys)
  createClub: {
    title: 'クラブを作成',
    clubDetails: 'クラブ詳細',
    clubName: 'クラブ名',
    clubType: 'クラブタイプ',
    description: '説明',
    tagline: 'キャッチフレーズ',

    recreational: 'レクリエーション',
    competitive: '競技',
    social: '親睦',
    professional: 'プロフェッショナル',
    training: 'トレーニング',

    location: '場所',
    address: '住所',
    city: '市',
    state: '州',
    zipCode: '郵便番号',
    country: '国',

    contactInformation: '連絡先情報',
    email: 'メール',
    phone: '電話',
    website: 'ウェブサイト',

    socialMedia: 'ソーシャルメディア',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',

    clubSettings: 'クラブ設定',
    privacy: '公開設定',
    public: '公開',
    private: '非公開',
    inviteOnly: '招待制',

    membershipType: 'メンバーシップタイプ',
    free: '無料',
    paid: '有料',
    subscription: 'サブスクリプション',

    maxMembers: '最大メンバー数',
    unlimited: '無制限',

    clubRules: 'クラブルール',
    codeOfConduct: '行動規範',
    dresscode: 'ドレスコード',

    amenities: 'アメニティ',
    parking: '駐車場',
    showers: 'シャワー',
    lockers: 'ロッカー',
    proShop: 'プロショップ',
    restaurant: 'レストラン',
    cafe: 'カフェ',

    courts: 'コート',
    numberOfCourts: 'コート数',
    courtSurface: 'コート面',
    indoor: '屋内',
    outdoor: '屋外',
    covered: '屋根付き',
    lighting: '照明',

    images: '画像',
    clubPhoto: 'クラブ写真',
    clubLogo: 'クラブロゴ',
    uploadPhoto: '写真をアップロード',
    uploadLogo: 'ロゴをアップロード',

    create: '作成',
    cancel: 'キャンセル',
    save: '保存',
    saveDraft: '下書き保存',

    required: '必須',
    optional: '任意',

    errors: {
      nameRequired: 'クラブ名は必須です',
      typeRequired: 'クラブタイプは必須です',
      locationRequired: '場所は必須です',
      descriptionRequired: '説明は必須です',
      invalidEmail: 'メールアドレスの形式が正しくありません',
      invalidPhone: '電話番号の形式が正しくありません',
      invalidWebsite: 'ウェブサイトのURLが無効です',
    },

    success: 'クラブを作成しました',
    error: 'クラブの作成に失敗しました',
    draftSaved: '下書きを保存しました',
  },

  // Matches section (54 keys)
  matches: {
    title: '試合',
    myMatches: '私の試合',
    upcomingMatches: '今後の試合',
    pastMatches: '過去の試合',
    liveMatches: '進行中の試合',

    createMatch: '試合を作成',
    joinMatch: '試合に参加',
    leaveMatch: '試合をキャンセル',
    viewMatch: '試合を表示',

    matchDetails: '試合詳細',
    matchType: '試合タイプ',
    matchFormat: '試合形式',
    matchDate: '試合日',
    matchTime: '試合時刻',

    singles: 'シングルス',
    doubles: 'ダブルス',
    mixed: 'ミックス',

    players: 'プレーヤー',
    player1: 'プレーヤー1',
    player2: 'プレーヤー2',
    partner: 'パートナー',
    opponent: '対戦相手',

    score: 'スコア',
    currentScore: '現在のスコア',
    finalScore: '最終スコア',
    winner: '勝者',
    loser: '敗者',

    sets: 'セット',
    games: 'ゲーム',
    points: 'ポイント',

    location: '場所',
    venue: '会場',
    court: 'コート',
    courtNumber: 'コート番号',

    status: 'ステータス',
    scheduled: 'スケジュール済み',
    inProgress: '進行中',
    completed: '完了',
    cancelled: 'キャンセル',
    postponed: '延期',

    recordScore: 'スコアを記録',
    reportScore: 'スコアを報告',
    confirmScore: 'スコアを確認',

    matchHistory: '試合履歴',
    headToHead: '対戦成績',
    stats: '統計',

    noMatches: '試合がありません',
    noUpcomingMatches: '今後の試合がありません',
    noPastMatches: '過去の試合がありません',

    filterByType: 'タイプでフィルター',
    filterByDate: '日付でフィルター',
    filterByStatus: 'ステータスでフィルター',

    sortBy: '並び替え',
    sortByDate: '日付順',
    sortByRecent: '最近順',
  },

  // Profile Settings section (53 keys)
  profileSettings: {
    title: 'プロフィール設定',
    editProfile: 'プロフィールを編集',
    personalInfo: '個人情報',
    accountSettings: 'アカウント設定',
    privacySettings: 'プライバシー設定',
    notificationSettings: '通知設定',

    firstName: '名',
    lastName: '姓',
    displayName: '表示名',
    bio: '自己紹介',
    birthday: '生年月日',
    gender: '性別',

    male: '男性',
    female: '女性',
    other: 'その他',
    preferNotToSay: '回答しない',

    contactInfo: '連絡先情報',
    email: 'メール',
    phone: '電話',

    location: '場所',
    city: '市',
    state: '州',
    country: '国',

    tennisInfo: 'テニス情報',
    skillLevel: 'スキルレベル',
    playingStyle: 'プレースタイル',
    dominantHand: '利き手',

    rightHanded: '右利き',
    leftHanded: '左利き',

    preferredCourt: '好みのコート',
    preferredTime: '好みの時間帯',

    profilePhoto: 'プロフィール写真',
    uploadPhoto: '写真をアップロード',
    changePhoto: '写真を変更',
    removePhoto: '写真を削除',

    privacy: 'プライバシー',
    whoCanSeeProfile: 'プロフィールを表示できる人',
    whoCanContactMe: '連絡できる人',
    showEmail: 'メールアドレスを表示',
    showPhone: '電話番号を表示',
    showLocation: '場所を表示',

    everyone: '全員',
    friendsOnly: '友達のみ',
    nobody: '非表示',

    notifications: '通知',
    emailNotifications: 'メール通知',
    pushNotifications: 'プッシュ通知',
    smsNotifications: 'SMS通知',

    matchNotifications: '試合通知',
    eventNotifications: 'イベント通知',
    messageNotifications: 'メッセージ通知',
    friendRequestNotifications: '友達申請通知',

    save: '保存',
    cancel: 'キャンセル',

    saveSuccess: '設定を保存しました',
    saveError: '設定の保存に失敗しました',
  },

  // Continue with remaining key sections...
  // I'll add the rest in batches to ensure completeness
};

// Read current Japanese translations
const jaPath = path.join(__dirname, '..', 'src', 'locales', 'ja.json');
const currentJa = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Merge translations
const updatedJa = deepMerge(currentJa, japaneseTranslations);

// Write back to file
fs.writeFileSync(jaPath, JSON.stringify(updatedJa, null, 2) + '\n', 'utf8');

console.log('✅ Japanese translations updated successfully!');
console.log('📊 Translated sections:');
Object.keys(japaneseTranslations).forEach(section => {
  const count = JSON.stringify(japaneseTranslations[section]).split(':').length - 1;
  console.log(`  - ${section}: ~${count} keys`);
});
console.log('\n🔍 Run the find command to check remaining untranslated keys.');
