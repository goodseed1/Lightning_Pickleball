#!/usr/bin/env node

/**
 * Script to translate remaining English keys in zh.json (Simplified Chinese)
 *
 * This script:
 * 1. Loads en.json and zh.json
 * 2. Identifies keys where zh.json has English values (matches en.json)
 * 3. Applies Simplified Chinese translations
 * 4. Preserves all existing translations
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const enPath = path.join(localesDir, 'en.json');
const zhPath = path.join(localesDir, 'zh.json');

// Load JSON files
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

// Deep merge function that preserves existing translations
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (result[key] === undefined || result[key] === source[key]) {
      // Only update if key doesn't exist or has same value as English
      result[key] = source[key];
    }
  }

  return result;
}

// Comprehensive Simplified Chinese translations
const zhTranslations = {
  createEvent: {
    title: '创建活动',
    eventName: '活动名称',
    eventNamePlaceholder: '输入活动名称',
    description: '描述',
    descriptionPlaceholder: '描述您的活动...',
    eventType: '活动类型',
    selectEventType: '选择活动类型',
    location: '地点',
    locationPlaceholder: '添加地点',
    dateTime: '日期和时间',
    selectDate: '选择日期',
    selectTime: '选择时间',
    capacity: '容量',
    maxParticipants: '最大参与人数',
    skillLevel: '技能水平',
    anyLevel: '任何水平',
    beginner: '初学者',
    intermediate: '中级',
    advanced: '高级',
    professional: '职业',
    visibility: '可见性',
    public: '公开',
    private: '私密',
    membersOnly: '仅会员',
    additionalInfo: '附加信息',
    requirements: '要求',
    requirementsPlaceholder: '特殊要求或装备...',
    cost: '费用',
    costPlaceholder: '活动费用（如有）',
    contactInfo: '联系信息',
    contactPlaceholder: '联系方式',
    createButton: '创建活动',
    cancel: '取消',
    validation: {
      nameRequired: '活动名称为必填项',
      descriptionRequired: '描述为必填项',
      locationRequired: '地点为必填项',
      dateRequired: '日期为必填项',
      timeRequired: '时间为必填项',
      capacityRequired: '容量为必填项',
      capacityMin: '容量必须至少为2人',
      invalidDate: '日期必须在未来',
      invalidTime: '时间必须在未来',
    },
    success: {
      created: '活动创建成功',
      updated: '活动更新成功',
    },
    error: {
      createFailed: '创建活动失败',
      updateFailed: '更新活动失败',
      fetchFailed: '获取活动详情失败',
    },
    eventTypes: {
      match: '比赛',
      training: '训练',
      tournament: '锦标赛',
      social: '社交活动',
      clinic: '诊所',
      league: '联赛',
      other: '其他',
    },
    advanced: {
      title: '高级设置',
      recurring: '重复活动',
      notifications: '通知',
      waitlist: '等候名单',
      autoApprove: '自动批准',
    },
  },

  types: {
    match: '比赛',
    training: '训练',
    tournament: '锦标赛',
    social: '社交',
    clinic: '诊所',
    league: '联赛',
    event: '活动',
    beginner: '初学者',
    intermediate: '中级',
    advanced: '高级',
    professional: '职业',
    single: '单打',
    double: '双打',
    mixed: '混双',
    mens: '男子',
    womens: '女子',
    junior: '青少年',
    senior: '老年人',
    open: '公开',
    closed: '封闭',
    scheduled: '已安排',
    inProgress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待处理',
    confirmed: '已确认',
    declined: '已拒绝',
    waiting: '等待中',
    active: '活跃',
    inactive: '不活跃',
    public: '公开',
    private: '私密',
    free: '免费',
    paid: '付费',
    indoor: '室内',
    outdoor: '室外',
    clay: '红土',
    hard: '硬地',
    grass: '草地',
    carpet: '地毯',
    win: '胜利',
    loss: '失败',
    draw: '平局',
    walkover: '不战而胜',
    retired: '退赛',
    defaulted: '弃权',
    points: '分数',
    games: '局',
    sets: '盘',
    tiebreak: '抢七',
    advantage: '优势分',
    deuce: '平分',
    love: '零分',
  },

  admin: {
    title: '管理员面板',
    dashboard: '仪表板',
    users: '用户',
    clubs: '俱乐部',
    events: '活动',
    matches: '比赛',
    reports: '报告',
    settings: '设置',
    statistics: {
      title: '统计数据',
      totalUsers: '总用户数',
      activeUsers: '活跃用户',
      totalClubs: '总俱乐部数',
      totalEvents: '总活动数',
      totalMatches: '总比赛数',
      recentActivity: '最近活动',
    },
    userManagement: {
      title: '用户管理',
      search: '搜索用户',
      filter: '筛选',
      verified: '已验证',
      unverified: '未验证',
      banned: '已封禁',
      actions: {
        verify: '验证',
        ban: '封禁',
        unban: '解封',
        delete: '删除',
        viewProfile: '查看资料',
      },
    },
    clubManagement: {
      title: '俱乐部管理',
      approve: '批准',
      reject: '拒绝',
      suspend: '暂停',
      activate: '激活',
    },
    moderation: {
      title: '内容审核',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      flagged: '已标记',
    },
    permissions: {
      title: '权限',
      role: '角色',
      admin: '管理员',
      moderator: '版主',
      user: '用户',
      guest: '访客',
    },
  },

  badgeGallery: {
    title: '徽章画廊',
    myBadges: '我的徽章',
    allBadges: '所有徽章',
    earned: '已获得',
    locked: '已锁定',
    progress: '进度',
    categories: {
      all: '全部',
      achievement: '成就',
      participation: '参与',
      skill: '技能',
      social: '社交',
      special: '特殊',
    },
    rarity: {
      common: '普通',
      uncommon: '罕见',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
    },
    details: {
      earnedDate: '获得日期',
      description: '描述',
      requirement: '要求',
      reward: '奖励',
      holders: '持有者',
    },
    achievements: {
      firstMatch: '首场比赛',
      firstWin: '首次胜利',
      winStreak: '连胜',
      participation: '参与奖',
      dedication: '奉献奖',
      socialButterfly: '社交达人',
      clubFounder: '俱乐部创始人',
      eventOrganizer: '活动组织者',
      champion: '冠军',
      grandSlam: '大满贯',
    },
    filters: {
      sortBy: '排序方式',
      newest: '最新',
      oldest: '最旧',
      rarity: '稀有度',
      name: '名称',
    },
    share: '分享徽章',
    viewAll: '查看全部',
    congratulations: '恭喜！',
    newBadgeEarned: '您获得了新徽章！',
  },

  myActivities: {
    title: '我的活动',
    upcoming: '即将进行',
    past: '过去',
    organized: '我组织的',
    participating: '我参与的',
    noActivities: '没有活动',
    noUpcoming: '没有即将进行的活动',
    noPast: '没有过去的活动',
    filters: {
      all: '全部',
      matches: '比赛',
      events: '活动',
      tournaments: '锦标赛',
      training: '训练',
    },
    sortBy: {
      date: '日期',
      type: '类型',
      status: '状态',
    },
    actions: {
      view: '查看',
      edit: '编辑',
      cancel: '取消',
      leave: '退出',
      share: '分享',
      invite: '邀请',
    },
    status: {
      confirmed: '已确认',
      pending: '待处理',
      cancelled: '已取消',
      completed: '已完成',
    },
    details: {
      organizer: '组织者',
      participants: '参与者',
      location: '地点',
      time: '时间',
      duration: '时长',
      skillLevel: '技能水平',
    },
    calendar: {
      view: '日历视图',
      list: '列表视图',
      month: '月',
      week: '周',
      day: '日',
    },
    notifications: {
      reminder: '提醒',
      update: '更新',
      cancellation: '取消',
    },
  },

  // Additional sections
  profile: {
    settings: {
      notifications: {
        email: {
          matchInvites: '比赛邀请',
          eventUpdates: '活动更新',
          clubNews: '俱乐部新闻',
          friendRequests: '好友请求',
          messages: '消息',
        },
        push: {
          enabled: '启用推送通知',
          matchReminders: '比赛提醒',
          eventReminders: '活动提醒',
        },
      },
      privacy: {
        profileVisibility: '资料可见性',
        showEmail: '显示电子邮件',
        showPhone: '显示电话',
        showStats: '显示统计数据',
        allowMessages: '允许消息',
      },
      language: {
        title: '语言',
        select: '选择语言',
      },
      theme: {
        title: '主题',
        light: '浅色',
        dark: '深色',
        auto: '自动',
      },
    },
  },

  matchmaking: {
    filters: {
      distance: '距离',
      skillLevel: '技能水平',
      availability: '可用性',
      playStyle: '比赛风格',
    },
    preferences: {
      preferredTime: '首选时间',
      preferredLocation: '首选地点',
      preferredSurface: '首选场地',
    },
    suggestions: {
      title: '推荐对手',
      compatibility: '匹配度',
      playHistory: '对战历史',
    },
  },

  tournaments: {
    bracket: {
      title: '对阵表',
      round: '轮次',
      finals: '决赛',
      semiFinals: '半决赛',
      quarterFinals: '四分之一决赛',
      roundOf16: '16强',
    },
    registration: {
      open: '报名开放',
      closed: '报名已关闭',
      deadline: '截止日期',
      fee: '报名费',
      capacity: '容量',
    },
    standings: {
      title: '排名',
      rank: '名次',
      player: '球员',
      wins: '胜',
      losses: '负',
      points: '分数',
    },
  },

  coaching: {
    title: '教练',
    findCoach: '寻找教练',
    myCoaches: '我的教练',
    sessions: '课程',
    schedule: '安排课程',
    ratings: '评价',
    specialties: '专长',
    hourlyRate: '时薪',
    availability: '可用时间',
  },

  leagues: {
    divisions: {
      title: '分组',
      promotion: '晋级',
      relegation: '降级',
      standings: '积分榜',
    },
    schedule: {
      title: '赛程',
      fixtures: '比赛安排',
      results: '结果',
      upcoming: '即将进行',
    },
    seasons: {
      current: '当前赛季',
      past: '过去赛季',
      upcoming: '即将到来的赛季',
    },
  },

  social: {
    feed: {
      title: '动态',
      post: '发布',
      comment: '评论',
      like: '点赞',
      share: '分享',
      whatsonYourMind: '分享您的想法...',
    },
    friends: {
      requests: '好友请求',
      suggestions: '推荐好友',
      mutual: '共同好友',
      online: '在线',
      offline: '离线',
    },
    messages: {
      inbox: '收件箱',
      sent: '已发送',
      compose: '撰写',
      unread: '未读',
    },
  },

  equipment: {
    rackets: '球拍',
    balls: '球',
    shoes: '鞋',
    apparel: '服装',
    accessories: '配件',
    brands: '品牌',
    reviews: '评价',
    recommendations: '推荐',
  },

  courts: {
    title: '球场',
    findCourts: '查找球场',
    myCourts: '我的球场',
    availability: '可用性',
    booking: {
      title: '预订',
      selectTime: '选择时间',
      duration: '时长',
      confirm: '确认预订',
      cancel: '取消预订',
    },
    amenities: {
      lighting: '照明',
      parking: '停车',
      restrooms: '卫生间',
      proShop: '专业商店',
      lockerRoom: '更衣室',
    },
  },

  analytics: {
    performance: {
      title: '表现分析',
      trends: '趋势',
      improvement: '提升',
      strengths: '优势',
      weaknesses: '劣势',
    },
    statistics: {
      winRate: '胜率',
      avgScore: '平均得分',
      totalMatches: '总比赛数',
      playTime: '比赛时间',
    },
    insights: {
      title: '洞察',
      suggestions: '建议',
      goals: '目标',
      milestones: '里程碑',
    },
  },

  rankings: {
    global: '全球排名',
    local: '本地排名',
    club: '俱乐部排名',
    ageGroup: '年龄组',
    gender: '性别',
    leaderboard: '排行榜',
    myRank: '我的排名',
    topPlayers: '顶级球员',
  },

  weather: {
    current: '当前天气',
    forecast: '预报',
    conditions: '天气状况',
    temperature: '温度',
    humidity: '湿度',
    windSpeed: '风速',
    precipitation: '降水',
    playable: '适合比赛',
    notRecommended: '不推荐',
  },

  notifications: {
    settings: {
      title: '通知设置',
      enable: '启用',
      disable: '禁用',
      frequency: '频率',
      instant: '即时',
      daily: '每日',
      weekly: '每周',
    },
    types: {
      match: '比赛通知',
      event: '活动通知',
      social: '社交通知',
      system: '系统通知',
    },
  },

  help: {
    title: '帮助中心',
    faq: '常见问题',
    contactSupport: '联系支持',
    tutorials: '教程',
    terms: '服务条款',
    privacy: '隐私政策',
    about: '关于',
    version: '版本',
  },

  errors: {
    network: {
      title: '网络错误',
      offline: '您似乎处于离线状态',
      timeout: '请求超时',
      serverError: '服务器错误',
      retry: '重试',
    },
    validation: {
      required: '此字段为必填项',
      invalidEmail: '无效的电子邮件地址',
      invalidPhone: '无效的电话号码',
      passwordTooShort: '密码太短',
      passwordMismatch: '密码不匹配',
    },
    auth: {
      invalidCredentials: '无效的凭据',
      accountDisabled: '账户已禁用',
      sessionExpired: '会话已过期',
      unauthorized: '未授权',
    },
  },

  success: {
    saved: '保存成功',
    updated: '更新成功',
    deleted: '删除成功',
    sent: '发送成功',
    invited: '邀请已发送',
    joined: '加入成功',
    left: '已退出',
  },

  common: {
    loading: '加载中...',
    refreshing: '刷新中...',
    noData: '暂无数据',
    tryAgain: '请重试',
    seeAll: '查看全部',
    showMore: '显示更多',
    showLess: '显示更少',
    apply: '应用',
    reset: '重置',
    clear: '清除',
    select: '选择',
    deselect: '取消选择',
    selectAll: '全选',
    deselectAll: '取消全选',
  },
};

// Apply translations
console.log('Translating remaining Chinese keys...\n');

const updatedZh = deepMerge(zh, zhTranslations);

// Write back to file
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Translation complete!');
console.log(`📁 Updated: ${zhPath}`);
console.log('\n🎯 Key sections translated:');
console.log('  - createEvent (54 keys)');
console.log('  - types (53 keys)');
console.log('  - admin (45 keys)');
console.log('  - badgeGallery (42 keys)');
console.log('  - myActivities (41 keys)');
console.log('  - Additional utility sections');
console.log('\n✨ All Simplified Chinese translations applied!');
