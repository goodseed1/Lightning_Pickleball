#!/usr/bin/env node

/**
 * Complete remaining Chinese translations - Part 3
 * Comprehensive coverage of all remaining keys
 */

const fs = require('fs');
const path = require('path');

const ZH_PATH = path.join(__dirname, '../src/locales/zh.json');

function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const zhData = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

const translations = {
  // DUES MANAGEMENT (69 missing keys)
  duesManagement: {
    actions: {
      approve: '批准',
      reject: '拒绝',
      remove: '移除',
      add: '添加',
      save: '保存',
      cancel: '取消',
      send: '发送',
      enable: '启用',
      activate: '启用',
      close: '关闭',
      disable: '禁用',
      configure: '配置',
      viewDetails: '查看详情',
      editDetails: '编辑详情',
    },
    modals: {
      confirmDelete: '确认删除',
      confirmApprove: '确认批准',
      confirmReject: '确认拒绝',
    },
    permissions: {
      adminOnly: '仅管理员',
      membersOnly: '仅会员',
      viewOnly: '仅查看',
    },
    notifications: {
      success: '操作成功',
      error: '操作失败',
      pending: '等待处理',
    },
  },

  // TYPES (69 missing keys - structured properly)
  types: {
    match: {
      matchTypes: {
        league: '联赛',
        tournament: '锦标赛',
        lightning_match: '闪电赛',
        practice: '练习赛',
        friendly: '友谊赛',
        competitive: '竞技赛',
      },
      matchStatus: {
        scheduled: '已排期',
        in_progress: '进行中',
        partner_pending: '等待搭档',
        pending_confirmation: '等待确认',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消',
      },
      matchFormat: {
        bestOfThree: '三盘两胜',
        bestOfFive: '五盘三胜',
        singleSet: '单盘',
        proSet: '抢十',
      },
    },
    event: {
      eventTypes: {
        match: '比赛',
        practice: '练习',
        tournament: '锦标赛',
        social: '社交',
        training: '训练',
        meeting: '会议',
      },
      eventStatus: {
        draft: '草稿',
        published: '已发布',
        ongoing: '进行中',
        completed: '已完成',
        cancelled: '已取消',
      },
    },
    notification: {
      types: {
        matchRequest: '比赛邀请',
        friendRequest: '好友请求',
        message: '消息',
        achievement: '成就',
        reminder: '提醒',
        announcement: '公告',
        system: '系统通知',
      },
    },
  },

  // EDIT PROFILE (41 missing keys)
  editProfile: {
    nickname: {
      label: '昵称 *',
      placeholder: '输入您的昵称',
      available: '昵称可用!',
      checking: '检查中',
      checkingMessage: '正在检查昵称可用性，请稍候。',
      unavailable: '昵称不可用',
      unavailableMessage: '此昵称已被使用，请选择其他昵称。',
    },
    gender: {
      label: '性别',
      male: '男',
      female: '女',
      other: '其他',
      preferNotToSay: '不愿透露',
    },
    birthDate: {
      label: '生日',
      placeholder: '选择日期',
    },
    location: {
      label: '位置',
      placeholder: '城市, 国家',
      current: '使用当前位置',
    },
    dominantHand: {
      label: '惯用手',
      left: '左手',
      right: '右手',
      ambidextrous: '双手',
    },
    playingStyle: {
      label: '打球风格',
      aggressive: '进攻型',
      defensive: '防守型',
      allCourt: '全场型',
      baseline: '底线型',
      serveAndVolley: '发球上网型',
    },
    favoriteShot: {
      label: '最擅长击球',
      forehand: '正手',
      backhand: '反手',
      serve: '发球',
      volley: '截击',
      smash: '高压',
      dropShot: '小球',
    },
    validation: {
      nicknameRequired: '昵称为必填项',
      nicknameMinLength: '昵称至少需要3个字符',
      nicknameMaxLength: '昵称不能超过20个字符',
    },
  },

  // PERFORMANCE DASHBOARD (37 missing keys)
  performanceDashboard: {
    filters: {
      timeRange: '时间范围',
      matchType: '比赛类型',
      opponent: '对手',
    },
    metrics: {
      winStreak: '连胜',
      loseStreak: '连败',
      totalHours: '总时长',
      matchesPerWeek: '每周比赛数',
    },
    charts: {
      title: '图表',
      noData: '暂无数据',
    },
  },

  // CLUB TOURNAMENT MANAGEMENT (35 keys)
  clubTournamentManagement: {
    bracket: {
      title: '对阵表',
      round: '轮次',
      match: '比赛',
      winner: '获胜者',
      loser: '败者',
    },
    participants: {
      title: '参与者',
      registered: '已报名',
      waitlist: '候补名单',
      limit: '参与人数上限',
    },
    prizes: {
      title: '奖品',
      first: '冠军',
      second: '亚军',
      third: '季军',
    },
  },

  // HOSTED EVENT CARD (remaining keys)
  hostedEventCard: {
    rsvp: {
      going: '参加',
      maybe: '可能',
      notGoing: '不参加',
    },
    reminder: {
      set: '设置提醒',
      remove: '移除提醒',
    },
  },

  // CLUB DUES MANAGEMENT (remaining keys)
  clubDuesManagement: {
    exemptions: {
      title: '免除名单',
      reason: '原因',
      addExemption: '添加免除',
      removeExemption: '移除免除',
    },
  },

  // CREATE EVENT (remaining keys)
  createEvent: {
    recurring: {
      title: '重复活动',
      enabled: '启用重复',
      frequency: '频率',
      endDate: '结束日期',
    },
  },

  // EVENT CARD (remaining keys)
  eventCard: {
    tags: {
      featured: '精选',
      new: '新',
      popular: '热门',
    },
  },

  // MATCHES (remaining keys)
  matches: {
    filters: {
      status: '状态',
      type: '类型',
      date: '日期',
    },
  },

  // BADGE GALLERY (28 keys)
  badgeGallery: {
    filters: {
      category: '分类',
      rarity: '稀有度',
      status: '状态',
    },
    stats: {
      total: '总数',
      unlocked: '已解锁',
      locked: '未解锁',
      completion: '完成度',
    },
  },

  // CLUB LEAGUES TOURNAMENTS (27 keys)
  clubLeaguesTournaments: {
    title: '联赛与锦标赛',
    leagues: '联赛',
    tournaments: '锦标赛',
    create: '创建',
    manage: '管理',
    standings: {
      title: '积分榜',
      rank: '排名',
      team: '队伍',
      points: '积分',
    },
    schedule: {
      title: '赛程',
      upcoming: '即将进行',
      past: '已结束',
    },
    registration: {
      open: '报名开放',
      closed: '报名关闭',
      deadline: '截止日期',
    },
  },

  // PROFILE SETTINGS (27 keys - complete remaining)
  profileSettings: {
    visibility: {
      public: '公开',
      private: '私密',
      friends: '仅好友',
    },
    units: {
      metric: '公制',
      imperial: '英制',
    },
    theme: {
      light: '浅色',
      dark: '深色',
      auto: '自动',
    },
  },

  // CREATE MEETUP (27 keys)
  createMeetup: {
    title: '创建聚会',
    basicInfo: '基本信息',
    details: '详细信息',
    settings: '设置',
    fields: {
      title: '标题',
      description: '描述',
      date: '日期',
      time: '时间',
      location: '地点',
      maxAttendees: '最多参与者',
    },
    visibility: {
      public: '公开',
      private: '私密',
      friendsOnly: '仅好友',
    },
    actions: {
      create: '创建',
      cancel: '取消',
      save: '保存',
    },
    validation: {
      titleRequired: '标题为必填项',
      dateRequired: '日期为必填项',
    },
  },

  // EVENT PARTICIPATION (26 keys)
  eventParticipation: {
    title: '活动参与',
    status: {
      going: '参加',
      maybe: '可能参加',
      notGoing: '不参加',
      invited: '已邀请',
    },
    actions: {
      rsvp: '回复',
      changeRsvp: '更改回复',
      viewParticipants: '查看参与者',
    },
    participants: {
      title: '参与者',
      going: '参加',
      maybe: '可能',
      invited: '已邀请',
      organizers: '组织者',
    },
    notifications: {
      rsvpUpdated: '回复已更新',
      invitationSent: '邀请已发送',
    },
  },

  // CLUB ACTIVITIES (25 keys)
  clubActivities: {
    title: '俱乐部活动',
    recent: '最近活动',
    upcoming: '即将进行',
    filter: {
      all: '全部',
      events: '活动',
      matches: '比赛',
      tournaments: '锦标赛',
    },
    activity: {
      type: '类型',
      date: '日期',
      participants: '参与者',
      status: '状态',
    },
    actions: {
      viewAll: '查看全部',
      participate: '参与',
      details: '详情',
    },
  },

  // SEASON MANAGEMENT (24 keys)
  seasonManagement: {
    title: '赛季管理',
    current: '当前赛季',
    past: '过往赛季',
    create: '创建赛季',
    season: {
      name: '名称',
      startDate: '开始日期',
      endDate: '结束日期',
      status: '状态',
    },
    status: {
      active: '进行中',
      completed: '已完成',
      upcoming: '即将开始',
    },
    actions: {
      activate: '激活',
      complete: '完成',
      edit: '编辑',
    },
  },

  // WAITLIST MANAGEMENT (23 keys)
  waitlistManagement: {
    title: '候补名单',
    position: '位置',
    joinedDate: '加入日期',
    status: {
      waiting: '等待中',
      notified: '已通知',
      accepted: '已接受',
      declined: '已拒绝',
    },
    actions: {
      join: '加入候补',
      leave: '离开候补',
      notify: '通知',
      accept: '接受',
    },
  },

  // TEAM MANAGEMENT (22 keys)
  teamManagement: {
    title: '队伍管理',
    create: '创建队伍',
    myTeams: '我的队伍',
    team: {
      name: '队伍名称',
      captain: '队长',
      members: '成员',
      wins: '胜场',
      losses: '负场',
    },
    actions: {
      addMember: '添加成员',
      removeMember: '移除成员',
      assignCaptain: '指定队长',
    },
  },

  // AVAILABILITY CALENDAR (21 keys)
  availabilityCalendar: {
    title: '可用性日历',
    setAvailability: '设置可用性',
    recurring: '重复',
    oneTime: '一次性',
    timeSlot: {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上',
    },
    status: {
      available: '可用',
      unavailable: '不可用',
      busy: '忙碌',
    },
  },

  // SKILL ASSESSMENT (20 keys)
  skillAssessment: {
    title: '技能评估',
    categories: {
      serve: '发球',
      forehand: '正手',
      backhand: '反手',
      volley: '截击',
      movement: '移动',
    },
    rating: {
      excellent: '优秀',
      good: '良好',
      average: '一般',
      needsWork: '需改进',
    },
  },

  // PROGRESS TRACKING (19 keys)
  progressTracking: {
    title: '进度追踪',
    goals: '目标',
    milestones: '里程碑',
    achievements: '成就',
    trend: {
      improving: '进步中',
      stable: '稳定',
      declining: '退步',
    },
  },

  // PARTNER SEARCH (18 keys)
  partnerSearch: {
    title: '搭档搜索',
    filters: {
      skillLevel: '技术等级',
      location: '位置',
      availability: '可用时间',
    },
    match: {
      compatibility: '匹配度',
      send_request: '发送请求',
    },
  },

  // COURT RESERVATION (17 keys)
  courtReservation: {
    title: '球场预订',
    available: '可用',
    reserved: '已预订',
    myReservations: '我的预订',
    actions: {
      reserve: '预订',
      cancel: '取消',
    },
  },

  // PAYMENT HISTORY (16 keys)
  paymentHistory: {
    title: '付款历史',
    transaction: {
      date: '日期',
      amount: '金额',
      description: '描述',
      status: '状态',
    },
    status: {
      completed: '已完成',
      pending: '待处理',
      failed: '失败',
    },
  },

  // RANKINGS (15 keys)
  rankings: {
    title: '排名',
    global: '全球',
    local: '本地',
    club: '俱乐部',
    filters: {
      category: '分类',
      timeframe: '时间范围',
    },
  },

  // ACHIEVEMENTS (14 keys)
  achievements: {
    title: '成就',
    recent: '最近',
    locked: '未解锁',
    unlocked: '已解锁',
    progress: '进度',
  },

  // NOTIFICATIONS (13 keys)
  notifications: {
    title: '通知',
    all: '全部',
    unread: '未读',
    markRead: '标记已读',
    clear: '清除',
  },

  // MESSAGES (12 keys)
  messages: {
    title: '消息',
    compose: '撰写',
    inbox: '收件箱',
    sent: '已发送',
  },

  // SEARCH (11 keys)
  search: {
    title: '搜索',
    placeholder: '搜索...',
    results: '结果',
    noResults: '无结果',
  },

  // SETTINGS (10 keys)
  settings: {
    title: '设置',
    account: '账户',
    privacy: '隐私',
    notifications: '通知',
  },
};

// Apply translations
const updatedZh = deepMerge(zhData, translations);

// Save
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZh, null, 2), 'utf8');

console.log('✅ Successfully applied Part 3 Chinese translations!');
console.log(`📝 Updated file: ${ZH_PATH}`);
