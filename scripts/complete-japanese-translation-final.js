const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, 'untranslated-keys-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// MASSIVE comprehensive translation map - ALL remaining keys
const translationMap = {
  // Already done but repeated
  OK: 'OK',
  km: 'km',
  '{{distance}} km': '{{distance}} km',

  // Club Members
  Manager: 'マネージャー',
  Manage: '管理',
  'Promote to Manager': 'マネージャーに昇格',
  'Change Role': '役割を変更',
  Change: '変更',
  'Change {{userName}} to {{role}}?': '{{userName}}を{{role}}に変更しますか？',
  '{{userName}} has been changed to {{role}}.': '{{userName}}が{{role}}に変更されました。',
  'Successfully promoted to manager.': 'マネージャーに昇格しました。',
  'Enter removal reason...': '削除理由を入力...',
  'Promote to Manager': 'マネージャーに昇格',
  'Promote {{userName}} to manager?': '{{userName}}をマネージャーに昇格しますか？',

  // Club Chat
  '{{hours}}h ago': '{{hours}}時間前',
  '{{minutes}}m ago': '{{minutes}}分前',
  Staff: 'スタッフ',
  Announcement: 'お知らせ',

  // Rate Sportsmanship
  'Selected tags: {{count}}': '選択したタグ: {{count}}',
  'Submitting...': '送信中...',
  'Tags are processed anonymously and help build a positive community culture.':
    'タグは匿名で処理され、ポジティブなコミュニティ文化を構築するのに役立ちます。',
  '#SharpEyed': '#鋭い目',
  '#FullOfEnergy': '#エネルギッシュ',
  '#MrManner': '#マナーの良い',
  '#PunctualPro': '#時間厳守',
  '#MentalFortress': '#メンタル強い',
  '#CourtJester': '#コートの道化師',

  // Edit Profile extended
  'Tap to change photo': 'タップして写真を変更',
  'Nickname *': 'ニックネーム *',
  'Enter your nickname': 'ニックネームを入力',
  'Nickname is available!': 'ニックネームは利用可能です！',
  Checking: '確認中',
  'Checking nickname availability. Please wait.':
    'ニックネームの利用可能性を確認しています。お待ちください。',
  'Nickname Unavailable': 'ニックネームは利用できません',
  'Not specified': '未指定',
  '💡 Gender is set during onboarding and cannot be changed.':
    '💡 性別はオンボーディング時に設定され、変更できません。',
  'NTRP Skill Level': 'NTRPスキルレベル',
  Beginner: '初心者',
  Intermediate: '中級者',
  Expert: '上級者',
  'After your first match, your skill level will be automatically calculated based on your match results.':
    '最初のマッチ後、スキルレベルはマッチ結果に基づいて自動的に計算されます。',
  Aggressive: 'アグレッシブ',
  Defensive: 'ディフェンシブ',
  'All-Court': 'オールコート',
  Baseline: 'ベースライン',
  'Net Player': 'ネットプレイヤー',
  'Max Travel Distance ({{unit}})': '最大移動距離 ({{unit}})',
  Goals: '目標',
  'Enter your pickleball goals...': 'テニスの目標を入力...',

  // More edit profile
  'Bio *': 'プロフィール *',
  'Introduce yourself to other players...': '他のプレイヤーに自己紹介...',
  'Playing Hand': 'プレイハンド',
  Right: '右',
  Left: '左',
  Both: '両方',
  'Availability *': '空き状況 *',
  'Select at least one day': '少なくとも1日を選択',
  'Preferred Time Slots': '希望時間帯',
  'Select at least one time slot': '少なくとも1つの時間帯を選択',
  '6-9 AM': '6-9時',
  '9-12 PM': '9-12時',
  '12-3 PM': '12-15時',
  '3-6 PM': '15-18時',
  '6-9 PM': '18-21時',
  '9 PM+': '21時以降',
  'Social Media': 'ソーシャルメディア',
  'Instagram handle': 'Instagramハンドル',
  'Save Profile': 'プロフィールを保存',
  'Saving...': '保存中...',
  'Profile saved successfully!': 'プロフィールが正常に保存されました！',
  'Failed to save profile. Please try again.':
    'プロフィールの保存に失敗しました。もう一度試してください。',
  'Please fill in all required fields.': '必須フィールドをすべて入力してください。',
  'Required Fields': '必須フィールド',

  // Services - Auth
  'Email is required': 'メールアドレスは必須です',
  'Password is required': 'パスワードは必須です',
  'Email must be valid': '有効なメールアドレスを入力してください',
  'Password must be at least 6 characters': 'パスワードは6文字以上である必要があります',
  'Passwords do not match': 'パスワードが一致しません',
  'Account created successfully': 'アカウントが正常に作成されました',
  'Welcome back!': 'おかえりなさい！',
  'Invalid email format': '無効なメールアドレス形式',
  'Account disabled': 'アカウントが無効化されています',
  'Too many attempts. Try again later.': '試行回数が多すぎます。後でもう一度試してください。',
  'This email is already registered': 'このメールアドレスは既に登録されています',
  'Password reset email sent': 'パスワードリセットメールを送信しました',
  'Failed to send password reset email': 'パスワードリセットメールの送信に失敗しました',

  // Services - Firestore
  'Document not found': 'ドキュメントが見つかりません',
  'Permission denied': '許可が拒否されました',
  'Failed to fetch data': 'データの取得に失敗しました',
  'Failed to save data': 'データの保存に失敗しました',
  'Failed to update data': 'データの更新に失敗しました',
  'Failed to delete data': 'データの削除に失敗しました',
  'Data validation failed': 'データ検証に失敗しました',
  'Required field missing': '必須フィールドが不足しています',
  'Invalid format': '無効な形式',

  // Services - Match
  'Match created successfully': 'マッチが正常に作成されました',
  'Match updated successfully': 'マッチが正常に更新されました',
  'Match cancelled successfully': 'マッチが正常にキャンセルされました',
  'Failed to create match': 'マッチの作成に失敗しました',
  'Failed to update match': 'マッチの更新に失敗しました',
  'Failed to cancel match': 'マッチのキャンセルに失敗しました',
  'You have already joined this match': '既にこのマッチに参加しています',
  'This match is full': 'このマッチは満員です',
  'You are not a participant in this match': 'このマッチの参加者ではありません',
  'Match has already started': 'マッチは既に開始されています',
  'Match has ended': 'マッチは終了しました',
  'Cannot join past match': '過去のマッチには参加できません',

  // Services - Club
  'Club created successfully': 'クラブが正常に作成されました',
  'Club updated successfully': 'クラブが正常に更新されました',
  'Failed to create club': 'クラブの作成に失敗しました',
  'Failed to update club': 'クラブの更新に失敗しました',
  'Failed to delete club': 'クラブの削除に失敗しました',
  'You are already a member of this club': '既にこのクラブのメンバーです',
  'You are not a member of this club': 'このクラブのメンバーではありません',
  'Member removed successfully': 'メンバーが正常に削除されました',
  'Failed to remove member': 'メンバーの削除に失敗しました',
  'Application submitted successfully': '申請が正常に送信されました',
  'Application approved successfully': '申請が正常に承認されました',
  'Application rejected successfully': '申請が正常に却下されました',

  // Services - Notification
  'Notification sent successfully': '通知が正常に送信されました',
  'Failed to send notification': '通知の送信に失敗しました',
  'Notification permission required': '通知の許可が必要です',
  'Failed to register device token': 'デバイストークンの登録に失敗しました',
  'Notification settings updated': '通知設定が更新されました',
  'Failed to update notification settings': '通知設定の更新に失敗しました',

  // Dues Management extended
  'Payment Reminder Sent': '支払いリマインダーを送信しました',
  'Failed to send payment reminder': '支払いリマインダーの送信に失敗しました',
  'Payment Status Updated': '支払いステータスが更新されました',
  'Failed to update payment status': '支払いステータスの更新に失敗しました',
  'Settings Saved': '設定が保存されました',
  'Failed to save settings': '設定の保存に失敗しました',
  'Export in Progress': 'エクスポート中',
  'Export Complete': 'エクスポート完了',
  'Export Failed': 'エクスポートに失敗しました',
  'No Members Found': 'メンバーが見つかりません',
  'Loading Members...': 'メンバーを読み込み中...',
  'Confirm Payment': '支払いを確認',
  'Are you sure you want to mark this payment as paid?':
    'この支払いを支払い済みとしてマークしてもよろしいですか？',
  'Are you sure you want to mark this payment as unpaid?':
    'この支払いを未払いとしてマークしてもよろしいですか？',
  'Payment reminder will be sent via email and push notification.':
    '支払いリマインダーはメールとプッシュ通知で送信されます。',
  'Reminder sent to {{name}}': '{{name}}にリマインダーを送信しました',
  'Mark as Paid for {{name}}': '{{name}}を支払い済みにする',
  'Mark as Unpaid for {{name}}': '{{name}}を未払いにする',
  'Monthly dues amount': '月会費額',
  'Enter amount': '金額を入力',
  'Default due day of month': 'デフォルト支払日（月の）',
  'Enable automatic payment reminders': '自動支払いリマインダーを有効にする',
  'Send reminder X days before due date': '支払期日のX日前にリマインダーを送信',
  'Enter number of days': '日数を入力',
  'Update Dues Settings': '会費設定を更新',
  '{{count}} members': '{{count}}人のメンバー',
  '{{count}} paid this month': '今月{{count}}人が支払い済み',
  '{{count}} unpaid': '{{count}}人が未払い',
  '{{percentage}}% collection rate': '{{percentage}}%の回収率',
  'View History': '履歴を見る',

  // League Detail extended
  'League Table': 'リーグテーブル',
  Fixtures: '試合予定',
  Results: '結果',
  'Team Info': 'チーム情報',
  'League Format': 'リーグ形式',
  'Number of Teams': 'チーム数',
  'Matches per Team': 'チームあたりのマッチ数',
  'Season Duration': 'シーズン期間',
  'Registration Open Until': '登録受付期限',
  'League Commissioner': 'リーグコミッショナー',
  'Contact Info': '連絡先情報',
  'League Sponsors': 'リーグスポンサー',
  'Match Format': 'マッチ形式',
  'Best of 3 Sets': '3セットマッチ',
  'Best of 5 Sets': '5セットマッチ',
  'Pro Set': 'プロセット',
  Tiebreak: 'タイブレーク',
  'No-Ad Scoring': 'ノーアドスコア',
  'League Awards': 'リーグ賞',
  MVP: 'MVP',
  'Most Improved Player': '最も向上したプレイヤー',
  'Best Newcomer': 'ベストルーキー',
  'Sportsmanship Award': 'スポーツマンシップ賞',
  'Golden Racquet': 'ゴールデンラケット',
  'Current Form': '現在の調子',
  'Last 10 Matches': '直近10試合',
  'Head to Head': '対戦成績',
  'Previous Encounters': '過去の対戦',
  'Next Fixture': '次の試合',
  'Recent Results': '最近の結果',

  // Performance Dashboard extended (more)
  'Career Statistics': 'キャリア統計',
  'This Season': '今シーズン',
  'Last Season': '前シーズン',
  'Career Best': 'キャリアベスト',
  'Personal Record': '個人記録',
  'Match Performance': 'マッチパフォーマンス',
  'Serve Performance': 'サーブパフォーマンス',
  'Return Performance': 'リターンパフォーマンス',
  'Court Coverage': 'コートカバレッジ',
  'Shot Analysis': 'ショット分析',
  Forehand: 'フォアハンド',
  Backhand: 'バックハンド',
  Volley: 'ボレー',
  Overhead: 'オーバーヘッド',
  'Drop Shot': 'ドロップショット',
  Lob: 'ロブ',
  Slice: 'スライス',
  Topspin: 'トップスピン',
  Flat: 'フラット',
  'Shot Placement': 'ショット配置',
  'Cross Court': 'クロスコート',
  'Down the Line': 'ダウンザライン',
  'Inside In': 'インサイドイン',
  'Inside Out': 'インサイドアウト',
  'Movement Analysis': '動き分析',
  Speed: 'スピード',
  Agility: '俊敏性',
  Endurance: '持久力',
  'Recovery Time': '回復時間',
  'Match Fitness': 'マッチフィットネス',
  'Physical Stats': '身体統計',
  'Mental Stats': 'メンタル統計',
  Concentration: '集中力',
  Consistency: '一貫性',
  'Pressure Handling': 'プレッシャー対応',
  'Comeback Ability': 'カムバック能力',

  // AI Matching extended (more)
  'Perfect Match': 'パーフェクトマッチ',
  'Strong Match': '強いマッチ',
  'Average Match': '平均的マッチ',
  'Weak Match': '弱いマッチ',
  'Location Score': 'ロケーションスコア',
  'Skill Score': 'スキルスコア',
  'Schedule Score': 'スケジュールスコア',
  'Compatibility Score': '相性スコア',
  'Overall Match Score': '総合マッチスコア',
  'Recommended Match Time': '推奨マッチ時間',
  'Recommended Match Location': '推奨マッチ場所',
  'Why this match?': 'なぜこのマッチ？',
  'Similar skill level': '同様のスキルレベル',
  'Close proximity': '近い距離',
  'Compatible schedules': '互換性のあるスケジュール',
  'Similar playing style': '同様のプレイスタイル',
  'Good past experience': '良い過去の経験',
  'Highly rated partner': '高評価のパートナー',
  'Active player': 'アクティブなプレイヤー',
  'Reliable player': '信頼できるプレイヤー',
  'Searching...': '検索中...',
  'Analyzing compatibility...': '相性を分析中...',
  'Finding the best match for you...': 'あなたに最適なマッチを検索中...',
  'No matches found. Try adjusting your preferences.':
    'マッチが見つかりません。設定を調整してみてください。',
  'Match Timeout': 'マッチタイムアウト',
  'Unable to find a match. Please try again.': 'マッチが見つかりません。もう一度試してください。',

  // Admin extended (more)
  'User Activity': 'ユーザーアクティビティ',
  'Active Sessions': 'アクティブセッション',
  'Failed Login Attempts': 'ログイン失敗回数',
  'Account Status': 'アカウント状態',
  'Verification Status': '検証状態',
  'Email Verified': 'メール検証済み',
  'Email Unverified': 'メール未検証',
  'Phone Verified': '電話検証済み',
  'Phone Unverified': '電話未検証',
  'Last Login': '最終ログイン',
  'Registration Date': '登録日',
  'Account Age': 'アカウント年齢',
  'Total Sessions': '総セッション数',
  'Average Session Duration': '平均セッション時間',
  'User Engagement': 'ユーザーエンゲージメント',
  'Daily Active Users': '日次アクティブユーザー',
  'Monthly Active Users': '月次アクティブユーザー',
  'User Retention': 'ユーザー保持率',
  'Churn Rate': '解約率',
  'Growth Rate': '成長率',
  'New Users': '新規ユーザー',
  'Returning Users': '復帰ユーザー',
  'Dormant Users': '休眠ユーザー',

  // Hosted Event Card extended
  'Event Capacity': 'イベント定員',
  'Spots Remaining': '残り枠',
  'Registration Status': '登録ステータス',
  'Payment Status': '支払いステータス',
  'Payment Required': '支払い必須',
  'Payment Optional': '支払い任意',
  Paid: '支払い済み',
  'Payment Pending': '支払い保留中',
  'Refund Requested': '払い戻し要求済み',
  'Refund Approved': '払い戻し承認済み',
  'Refund Denied': '払い戻し拒否',
  'Registration Confirmed': '登録確認済み',
  'Registration Pending': '登録保留中',
  'On Waiting List': 'ウェイティングリスト中',
  'Event Calendar': 'イベントカレンダー',
  'Add to Calendar': 'カレンダーに追加',
  'Set Reminder': 'リマインダーを設定',
  'Share Event': 'イベントを共有',
  'Invite Friends to Event': '友達をイベントに招待',
  'Event QR Code': 'イベントQRコード',
  'Show QR Code': 'QRコードを表示',
  'Scan QR Code': 'QRコードをスキャン',
  'Check-in Complete': 'チェックイン完了',
  'Check-in Failed': 'チェックイン失敗',

  // Create Event extended
  'Event Photo': 'イベント写真',
  'Choose from Library': 'ライブラリから選択',
  'Take Photo': '写真を撮る',
  'Remove Image': '画像を削除',
  'Event Category': 'イベントカテゴリー',
  Competitive: '競技的',
  Training: 'トレーニング',
  'Beginner Friendly': '初心者歓迎',
  'Advanced Only': '上級者のみ',
  'Mixed Levels': 'ミックスレベル',
  'Age Restriction': '年齢制限',
  'All Ages': 'すべての年齢',
  'Adults Only': '大人のみ',
  'Juniors Only': 'ジュニアのみ',
  'Seniors Only': 'シニアのみ',
  'Gender Restriction': '性別制限',
  'All Genders': 'すべての性別',
  'Men Only': '男性のみ',
  'Women Only': '女性のみ',
  'Event Rules': 'イベントルール',
  'Code of Conduct': '行動規範',
  'Equipment Required': '必要な装備',
  'What to Bring': '持ち物',
  'Dress Code': 'ドレスコード',
  'Casual Attire': 'カジュアルな服装',
  'Athletic Wear': 'スポーツウェア',
  'Formal Attire': 'フォーマルな服装',

  // Cards extended
  'Drag to reorder': 'ドラッグして並べ替え',
  'Swipe to delete': 'スワイプして削除',
  'Pull to refresh': '引っ張って更新',
  'Tap to expand': 'タップして展開',
  'Double tap': 'ダブルタップ',
  'Long press': '長押し',
  'Pinch to zoom': 'ピンチしてズーム',
  'Swipe left': '左にスワイプ',
  'Swipe right': '右にスワイプ',
  'Scroll down': '下にスクロール',
  'Scroll up': '上にスクロール',

  // Club Tournament Management extended
  'Tournament Bpaddle': 'トーナメントブラケット',
  'Match Pairings': 'マッチペアリング',
  'Seed List': 'シードリスト',
  'Wild Card': 'ワイルドカード',
  Bye: '不戦勝',
  Walkover: '不戦勝',
  Retirement: '棄権',
  Disqualification: '失格',
  Default: 'デフォルト',
  'Match Official': '試合審判',
  'Line Judge': '線審',
  'Ball Person': 'ボールパーソン',
  'Match Duration': 'マッチ時間',
  'Warm-up Time': 'ウォームアップ時間',
  'Changeover Time': 'チェンジオーバー時間',
  'Rest Period': '休憩時間',
  'Medical Timeout': 'メディカルタイムアウト',
  'Rain Delay': '雨天中断',
  Suspended: '中断',
  Resumed: '再開',

  // Badge Gallery extended (more)
  'Total Badges': '総バッジ数',
  'Badges Earned': '獲得バッジ',
  'Badges Remaining': '残りバッジ',
  'Completion Rate': '完了率',
  'Rarest Badge': '最もレアなバッジ',
  'Latest Badge': '最新バッジ',
  'First Badge': '最初のバッジ',
  'Badge Categories': 'バッジカテゴリー',
  'Performance Badges': 'パフォーマンスバッジ',
  'Social Badges': 'ソーシャルバッジ',
  'Achievement Badges': '実績バッジ',
  'Special Badges': '特別バッジ',
  'Limited Edition': '限定版',
  'Seasonal Badge': 'シーズンバッジ',
  'Event Badge': 'イベントバッジ',
  'Milestone Badge': 'マイルストーンバッジ',

  // Matches extended
  'Upcoming Match': '今後のマッチ',
  'Live Match': 'ライブマッチ',
  'Past Match': '過去のマッチ',
  'Match Result': 'マッチ結果',
  'Final Score': '最終スコア',
  'Match Duration': 'マッチ時間',
  'Court Number': 'コート番号',
  'Match Time': 'マッチ時間',
  'Match Date': 'マッチ日',
  'Match Venue': 'マッチ会場',
  'Match Conditions': 'マッチ条件',
  Weather: '天気',
  Temperature: '気温',
  Wind: '風',
  Humidity: '湿度',
  'Surface Condition': 'サーフェス状態',
  'Ball Type': 'ボールタイプ',
  'Match Referee': 'マッチ審判',
  'Chair Umpire': '主審',

  // Event Card extended
  'Event Highlights': 'イベントハイライト',
  'Event Photos': 'イベント写真',
  'Event Videos': 'イベントビデオ',
  'Event Results': 'イベント結果',
  'Event Winners': 'イベント勝者',
  'Participant List': '参加者リスト',
  'Event Sponsors': 'イベントスポンサー',
  'Media Coverage': 'メディアカバレッジ',
  'Press Release': 'プレスリリース',
  'Event Feedback': 'イベントフィードバック',
  'Event Rating': 'イベント評価',
  'Would Attend Again': '再度参加したい',
  'Event Recap': 'イベント要約',
  'Next Event': '次のイベント',
  'Similar Events': '類似イベント',

  // Misc additional
  'Show Details': '詳細を表示',
  'Hide Details': '詳細を非表示',
  'Full Screen': 'フルスクリーン',
  'Exit Full Screen': 'フルスクリーンを終了',
  Play: '再生',
  Pause: '一時停止',
  Stop: '停止',
  Replay: '再生',
  Mute: 'ミュート',
  Unmute: 'ミュート解除',
  Volume: '音量',
  Brightness: '明るさ',
  Contrast: 'コントラスト',
  Saturation: '彩度',
  Quality: '品質',
  Resolution: '解像度',
  'High Quality': '高品質',
  'Medium Quality': '中品質',
  'Low Quality': '低品質',
  Auto: '自動',
  Manual: '手動',
  Automatic: '自動',
  Custom: 'カスタム',
  Default: 'デフォルト',
  'Reset to Default': 'デフォルトにリセット',
  Undo: '元に戻す',
  Redo: 'やり直す',
  Clear: 'クリア',
  'Clear All': 'すべてクリア',
  Select: '選択',
  Deselect: '選択解除',
  Toggle: '切り替え',
  Enable: '有効にする',
  Disable: '無効にする',
  Activate: 'アクティブ化',
  Deactivate: '非アクティブ化',
  Lock: 'ロック',
  Unlock: 'ロック解除',
  Pin: 'ピン留め',
  Unpin: 'ピン留め解除',
  Star: 'スター',
  Unstar: 'スター解除',
  Bookmark: 'ブックマーク',
  'Remove Bookmark': 'ブックマークを削除',
  Flag: 'フラグ',
  Unflag: 'フラグ解除',
  Archive: 'アーカイブ',
  Unarchive: 'アーカイブ解除',
  Restore: '復元',
  'Permanently Delete': '完全に削除',
  'Move to Trash': 'ゴミ箱に移動',
  'Empty Trash': 'ゴミ箱を空にする',
  Recover: '回復',
  Duplicate: '複製',
  Rename: '名前変更',
  Move: '移動',
  'Copy Link': 'リンクをコピー',
  'Share Link': 'リンクを共有',
  'Open Link': 'リンクを開く',
  Preview: 'プレビュー',
  'Full View': '全表示',
  'Grid View': 'グリッド表示',
  'List View': 'リスト表示',
  'Compact View': 'コンパクト表示',
  'Detailed View': '詳細表示',
};

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Read existing Japanese translations
const jaPath = path.join(__dirname, '../src/locales/ja.json');
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Apply translations
let translatedCount = 0;
const translatedSections = {};

report.keys.forEach(item => {
  const translation = translationMap[item.enValue];
  if (translation) {
    setNestedValue(ja, item.path, translation);
    translatedCount++;
    const section = item.section || 'root';
    translatedSections[section] = (translatedSections[section] || 0) + 1;
  }
});

// Write updated file
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2), 'utf8');

console.log(`\n✨ TRANSLATION COMPLETE! ✨\n`);
console.log(`✅ Translated ${translatedCount} keys in this run`);
console.log(`📝 Remaining untranslated: ${report.total - translatedCount} keys\n`);

console.log('📊 Sections updated:');
Object.entries(translatedSections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .forEach(([section, count]) => {
    console.log(`   ${section}: +${count} keys`);
  });

console.log(`\n💾 Japanese locale file saved!\n`);
