#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Advanced translation function with pattern matching
function smartTranslate(text) {
  // Common action patterns
  const patterns = [
    [/^Create (.+)$/i, '{{1}}を作成'],
    [/^Edit (.+)$/i, '{{1}}を編集'],
    [/^Delete (.+)$/i, '{{1}}を削除'],
    [/^View (.+)$/i, '{{1}}を表示'],
    [/^Add (.+)$/i, '{{1}}を追加'],
    [/^Remove (.+)$/i, '{{1}}を削除'],
    [/^Update (.+)$/i, '{{1}}を更新'],
    [/^Save (.+)$/i, '{{1}}を保存'],
    [/^Cancel (.+)$/i, '{{1}}をキャンセル'],
    [/^Send (.+)$/i, '{{1}}を送信'],
    [/^Accept (.+)$/i, '{{1}}を承認'],
    [/^Reject (.+)$/i, '{{1}}を却下'],
    [/^Join (.+)$/i, '{{1}}に参加'],
    [/^Leave (.+)$/i, '{{1}}を脱退'],
    [/^Enable (.+)$/i, '{{1}}を有効化'],
    [/^Disable (.+)$/i, '{{1}}を無効化'],
    [/^Loading (.+)\.\.\.$/i, '{{1}}を読み込み中...'],
    [/^(.+) not found$/i, '{{1}}が見つかりません'],
    [/^(.+) deleted$/i, '{{1}}を削除しました'],
    [/^(.+) created$/i, '{{1}}を作成しました'],
    [/^(.+) updated$/i, '{{1}}を更新しました'],
    [/^Failed to (.+)$/i, '{{1}}に失敗しました'],
    [/^Error (.+)$/i, '{{1}}エラー'],
    [/^No (.+)$/i, '{{1}}がありません'],
    [/^(.+) required$/i, '{{1}}は必須です'],
    [/^(.+) is required$/i, '{{1}}は必須です'],
    [/^(.+) already exists$/i, '{{1}}は既に存在します'],
    [/^(.+) successfully$/i, '{{1}}に成功しました'],
    [/^Current (.+)$/i, '現在の{{1}}'],
    [/^Total (.+)$/i, '総{{1}}'],
    [/^All (.+)$/i, '全{{1}}'],
    [/^My (.+)$/i, 'マイ{{1}}'],
  ];

  // Word replacements
  const words = {
    league: 'リーグ',
    tournament: 'トーナメント',
    match: '試合',
    matches: '試合',
    event: 'イベント',
    events: 'イベント',
    club: 'クラブ',
    clubs: 'クラブ',
    member: 'メンバー',
    members: 'メンバー',
    player: 'プレーヤー',
    players: 'プレーヤー',
    team: 'チーム',
    teams: 'チーム',
    user: 'ユーザー',
    users: 'ユーザー',
    profile: 'プロフィール',
    settings: '設定',
    notification: '通知',
    notifications: '通知',
    message: 'メッセージ',
    messages: 'メッセージ',
    request: '申請',
    requests: '申請',
    invitation: '招待',
    invitations: '招待',
    participant: '参加者',
    participants: '参加者',
    score: 'スコア',
    scores: 'スコア',
    standing: '順位',
    standings: '順位表',
    schedule: 'スケジュール',
    schedules: 'スケジュール',
    statistics: '統計',
    stats: '統計',
    history: '履歴',
    details: '詳細',
    overview: '概要',
    information: '情報',
    info: '情報',
    data: 'データ',
    payment: '支払い',
    payments: '支払い',
    dues: '会費',
    fee: '料金',
    fees: '料金',
    amount: '金額',
    total: '合計',
    status: 'ステータス',
    type: 'タイプ',
    name: '名前',
    title: 'タイトル',
    description: '説明',
    date: '日付',
    time: '時刻',
    location: '場所',
    address: '住所',
    email: 'メール',
    password: 'パスワード',
    admin: '管理者',
    administrator: '管理者',
    moderator: 'モデレーター',
    owner: 'オーナー',
    policy: 'ポリシー',
    policies: 'ポリシー',
    rule: 'ルール',
    rules: 'ルール',
    prize: '賞品',
    prizes: '賞品',
    winner: '勝者',
    loser: '敗者',
    pending: '保留中',
    approved: '承認済み',
    rejected: '却下',
    cancelled: 'キャンセル',
    completed: '完了',
    active: 'アクティブ',
    inactive: '非アクティブ',
    loading: '読み込み中',
    error: 'エラー',
    success: '成功',
    failed: '失敗',
    unknown: '不明',
  };

  // Try pattern matching first
  for (const [pattern, template] of patterns) {
    const match = text.match(pattern);
    if (match) {
      let result = template;
      for (let i = 1; i < match.length; i++) {
        let translated = match[i].toLowerCase();
        for (const [eng, jap] of Object.entries(words)) {
          translated = translated.replace(new RegExp('\\b' + eng + '\\b', 'gi'), jap);
        }
        result = result.replace(`{{${i}}}`, translated);
      }
      return result;
    }
  }

  // If no pattern matches, do word-by-word replacement
  let result = text;
  for (const [eng, jap] of Object.entries(words)) {
    result = result.replace(new RegExp('\\b' + eng + '\\b', 'gi'), jap);
  }

  // Return translated version if different from original, else return original
  return result !== text ? result : text;
}

// Recursively translate all untranslated keys
function translateAll(enObj, jaObj) {
  for (const key in enObj) {
    const enVal = enObj[key];
    const jaVal = jaObj[key];

    if (typeof enVal === 'object' && enVal !== null) {
      if (!jaObj[key] || typeof jaObj[key] !== 'object') {
        jaObj[key] = {};
      }
      translateAll(enVal, jaObj[key]);
    } else if (typeof enVal === 'string') {
      // If untranslated or doesn't exist, translate it
      if (enVal === jaVal || jaVal === undefined) {
        jaObj[key] = smartTranslate(enVal);
      }
    }
  }
}

// Read files
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const jaPath = path.join(__dirname, '..', 'src', 'locales', 'ja.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

console.log('🚀 Starting aggressive translation...');
translateAll(en, ja);

fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2) + '\n', 'utf8');

console.log('✅ Aggressive translation completed!');
