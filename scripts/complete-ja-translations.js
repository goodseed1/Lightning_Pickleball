const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(output[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Complete Japanese translations for remaining 148 keys
const jaTranslations = {
  common: {
    ok: 'OK',
  },
  auth: {
    register: {
      success: {
        ok: 'OK',
      },
    },
  },
  units: {
    km: 'km',
    distanceKm: '{{distance}} km',
  },
  editProfile: {
    common: {
      ok: 'OK',
    },
  },
  clubTournamentManagement: {
    common: {
      confirm: 'OK',
    },
  },
  eventCard: {
    labels: {
      participants: '{{current}}/{{max}}',
    },
  },
  createEvent: {
    alerts: {
      confirm: 'OK',
    },
    languages: {
      japanese: '日本語',
    },
  },
  duesManagement: {
    alerts: {
      ok: 'OK',
    },
    settings: {
      venmo: 'Venmo',
    },
  },
  eventParticipation: {
    typeLabels: {
      spectator: '観戦者',
      helper: 'ヘルパー',
    },
    messages: {
      autoApprovalTitle: '定例会参加が確定しました！',
    },
  },
  editClubPolicy: {
    ok: 'OK',
  },
  createClubTournament: {
    seedingMethods: {
      random_description: '公平なランダムシード（スキル無関係）',
      rating: '個人レーティング',
      rating_description: 'ELOレーティングとスキルレベルに基づいてシード',
    },
  },
  meetupDetail: {
    weather: {
      title: '天気予報',
      chanceOfRain: '降水確率',
      notAvailable: '天気情報なし',
    },
    rsvp: {
      cannotChangeNearStart: '開始15分前以降はRSVPを変更できません。',
      attend: '参加する',
      deadlineNote: '開始15分前まで変更可能',
    },
    chat: {
      title: '集まりチャット',
    },
  },
  teamInvitations: {
    ok: 'OK',
  },
  createClubLeague: {
    ok: 'OK',
  },
  manageAnnouncement: {
    ok: 'OK',
  },
  aiChat: {
    navigation: {
      Discover: '🔍 発見ページへ移動します！',
      default: '{{screen}}へ移動します！',
    },
  },
  myClubSettings: {
    alerts: {
      ok: 'OK',
    },
  },
  tournamentDetail: {
    bestFinish: {
      semiFinal: '🥉 準決勝進出',
      nthPlace: '第{position}位',
    },
  },
  eventChat: {
    errors: {
      networkError: 'ネットワーク接続を確認して再試行してください。',
      chatRoomNotice: 'チャットルームのお知らせ',
    },
  },
  hallOfFame: {
    counts: {
      honors: '{{count}}個の栄誉',
    },
    honorBadges: {
      receivedCount: '×{{count}}',
    },
  },
  badgeGallery: {
    modal: {
      earned: '獲得日: ',
      category: 'カテゴリー: ',
    },
    badges: {
      perfect_season: {
        name: '完璧なシーズン',
        description: '無敗でシーズンを終えました！',
      },
      community_leader: {
        name: 'コミュニティリーダー',
      },
      winning_streak_3: {
        name: '連勝中',
      },
      winning_streak_5: {
        name: '燃えている',
      },
      winning_streak_10: {
        name: '止められない',
      },
      match_milestone_10: {
        name: 'スタート',
      },
    },
    alerts: {
      permissionTitle: '権限が拒否されました',
      unavailableMessage: 'Firebaseサービスが現在利用できません。後でもう一度お試しください。',
    },
  },
  recordScore: {
    alerts: {
      confirm: 'OK',
    },
  },
  matchRequest: {
    schedule: {
      oneHour: '1時間',
      twoHours: '2時間',
      threeHours: '3時間',
    },
  },
  leagueDetail: {
    adminDashboard: {
      fillRate: '充足率',
      fullCapacityNotice: '申請完了、登録締切準備完了。',
    },
    leagueManagement: {
      dangerZoneTitle: '危険ゾーン',
    },
    playoffs: {
      inProgress: 'プレーオフ進行中',
      format: '形式：',
      seasonComplete: 'レギュラーシーズン完了！',
      startButton: 'プレーオフ開始',
    },
    dialogs: {
      walkoverTitle: '不戦勝処理',
      approveAll: '全員承認',
    },
    genderLabels: {
      male: '男性',
      female: '女性',
    },
  },
  ntrpSelector: {
    levels: {
      beginner: {
        description: 'テニスを始めたばかり',
      },
    },
  },
  clubHallOfFame: {
    tabs: {
      rankings: '📊 ELOランキング',
    },
  },
  contexts: {
    notification: {
      later: '後で',
    },
  },
  appNavigator: {
    screens: {
      chatScreen: 'ライトニングコーチ',
    },
  },
  types: {
    match: {
      validation: {
        tiebreak: 'タイブレーク',
        superTiebreak: 'スーパータイブレーク',
      },
    },
    clubSchedule: {
      scheduleTypes: {
        social: 'ソーシャルテニス',
        clinic: 'トレーニングクリニック',
      },
      recurrence: {
        weekly: '毎週',
        biweekly: '隔週',
        monthly: '毎月',
      },
      timePeriod: {
        am: '午前',
        pm: '午後',
      },
    },
    dues: {
      period: {
        year: '{{year}}年',
        yearMonth: '{{year}}年{{month}}月',
      },
    },
  },
  league: {
    genderLabels: {
      male: '男性',
      female: '女性',
    },
  },
  tournament: {
    bestFinish: {
      semiFinal: '🥉 準決勝進出',
      nthPlace: '第{position}位',
    },
  },
  clubCommunication: {
    validation: {
      commentRequired: 'コメントを入力してください',
      commentTooLong: 'コメントは1,000文字以内で入力してください',
    },
  },
  matches: {
    card: {
      recurring: '定期',
      moreParticipants: '+他{{count}}名',
    },
    skillLevels: {
      '2.0-3.0': '2.0-3.0',
      '3.0-4.0': '3.0-4.0',
      '4.0-5.0': '4.0-5.0',
      '5.0+': '5.0+',
    },
    recurringPatterns: {
      weeklyMonday: '毎週月曜日',
    },
    createModal: {
      recurring: {
        label: '定期開催',
      },
      maxParticipants: {
        placeholder: '4',
      },
    },
    alerts: {
      createSuccess: {
        confirm: 'OK',
      },
    },
    mockData: {
      me: '自分',
      mondayTraining: '月曜定例練習',
      mondayDescription: '毎週月曜日夜の定例練習',
    },
  },
  leagues: {
    admin: {
      applicant: '申請者',
      approvalCompleteTitle: '✅ 承認完了',
      maxParticipants: '最大',
      applicationDate: '申請日',
      opening: '開催中...',
      startAcceptingApplications: '🎭 申請受付開始',
      correctResult: '結果修正',
      reschedule: '日程変更',
      submitResult: '結果提出',
    },
    match: {
      correctResult: '結果修正',
      reschedule: '日程変更',
      submitResult: '結果提出',
    },
  },
  schedules: {
    form: {
      dayOfWeek: '曜日 *',
      duration: '時間（分）*',
      skillLevelPlaceholder: '例：3.5+',
      registrationDeadline: '登録締切（開始前の時間）',
    },
  },
  performanceDashboard: {
    charts: {
      skillProgress: {
        title: 'スキルレベルの進捗',
      },
    },
    weekLabels: {
      week1: '第1週',
      week2: '第2週',
      week3: '第3週',
      week4: '第4週',
    },
    dayLabels: {
      mon: '月',
      tue: '火',
      wed: '水',
      thu: '木',
      fri: '金',
      sat: '土',
      sun: '日',
    },
    insights: {
      recommendations: 'おすすめ：',
    },
    monthlyReport: {
      highlights: '今月のハイライト',
      nextMonthGoals: '来月の目標',
    },
  },
  services: {
    leaderboard: {
      challenges: {
        monthlyImprovement: {
          title: '月間成長',
        },
      },
      achievements: {
        matchesPlayed10: {
          name: '経験を積む',
        },
        skillLevel70: {
          description: 'スキルレベル70に到達',
        },
        skillLevel85: {
          description: 'スキルレベル85に到達',
        },
      },
      categories: {
        skillLevel: {
          name: 'スキルレベルランキング',
          description: 'スキルレベルに基づくランキング',
        },
        improvement: {
          name: '成長ランキング',
          description: 'スキル成長率に基づくランキング',
        },
      },
    },
  },
  aiMatching: {
    results: {
      title: 'AI マッチング結果',
      tipsTitle: 'AI マッチングのヒント',
      refreshButton: '再検索',
    },
    mockData: {
      candidate1: {
        name: 'キム・ジュンス',
      },
      candidate2: {
        name: 'イ・ソヨン',
      },
      candidate3: {
        name: 'パク・ミンジェ',
      },
    },
  },
  clubPolicies: {
    fees: {
      dueDateValue: '毎月{{day}}日',
    },
  },
  findClub: {
    status: {
      joined: '参加済み',
    },
    errors: {
      alreadyRequested: 'すでに参加リクエストを送信済みです。',
    },
  },
  modals: {
    leagueCompleted: {
      points: 'ポイント',
    },
    playoffCreated: {
      playoffType: 'プレーオフ形式',
      final: '決勝',
      semifinals: '準決勝＋決勝',
    },
  },
  utils: {
    ltr: {
      whatIsLtr: {
        title: 'LPRとは？',
      },
      relationToNtrp: {
        title: 'NTRPとの関係',
      },
    },
  },
};

// Read current ja.json
const jaPath = path.join(__dirname, '../src/locales/ja.json');
const currentJa = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Deep merge
const updatedJa = deepMerge(currentJa, jaTranslations);

// Write back
fs.writeFileSync(jaPath, JSON.stringify(updatedJa, null, 2) + '\n', 'utf8');

console.log('✅ Successfully updated 148 Japanese translations!');
console.log('\nTranslated sections:');
console.log('- common: 1 key');
console.log('- auth: 1 key');
console.log('- units: 2 keys');
console.log('- editProfile: 1 key');
console.log('- clubTournamentManagement: 1 key');
console.log('- eventCard: 1 key');
console.log('- createEvent: 2 keys');
console.log('- duesManagement: 2 keys');
console.log('- eventParticipation: 3 keys');
console.log('- editClubPolicy: 1 key');
console.log('- createClubTournament: 3 keys');
console.log('- meetupDetail: 7 keys');
console.log('- teamInvitations: 1 key');
console.log('- createClubLeague: 1 key');
console.log('- manageAnnouncement: 1 key');
console.log('- aiChat: 2 keys');
console.log('- myClubSettings: 1 key');
console.log('- tournamentDetail: 2 keys');
console.log('- eventChat: 2 keys');
console.log('- hallOfFame: 2 keys');
console.log('- badgeGallery: 11 keys');
console.log('- recordScore: 1 key');
console.log('- matchRequest: 3 keys');
console.log('- leagueDetail: 11 keys');
console.log('- ntrpSelector: 1 key');
console.log('- clubHallOfFame: 1 key');
console.log('- contexts: 1 key');
console.log('- appNavigator: 1 key');
console.log('- types: 11 keys');
console.log('- league: 2 keys');
console.log('- tournament: 2 keys');
console.log('- clubCommunication: 2 keys');
console.log('- matches: 13 keys');
console.log('- leagues: 9 keys');
console.log('- schedules: 4 keys');
console.log('- performanceDashboard: 15 keys');
console.log('- services: 8 keys');
console.log('- aiMatching: 6 keys');
console.log('- clubPolicies: 1 key');
console.log('- findClub: 2 keys');
console.log('- modals: 4 keys');
console.log('- utils: 2 keys');
console.log('\n📊 TOTAL: 148 keys translated to Japanese');
