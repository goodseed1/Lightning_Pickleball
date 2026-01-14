#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Deep merge utility
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

// Batch 2 Chinese translations
const zhTranslations = {
  createEvent: {
    fields: {
      selectLanguages: '选择语言',
      levelNotSet: '未设置等级',
    },
    placeholders: {
      titleMatch: '例如：晚间单打比赛',
      titleMeetup: '例如：周末趣味对打',
      description: '输入关于聚会的其他信息...',
    },
    gameTypes: {
      mens_singles: '男子单打',
      womens_singles: '女子单打',
      mens_doubles: '男子双打',
      womens_doubles: '女子双打',
      mixed_doubles: '混合双打',
    },
  },

  admin: {
    logs: {
      matchesCreated: '比赛（最近7天）',
      games: '比赛',
      entries: '条目',
      justNow: '刚刚',
      minutesAgo: ' 分钟前',
      hoursAgo: ' 小时前',
      daysAgo: ' 天前',
    },
    devTools: {
      tennisStats: '📊 网球统计',
      matchesPlayed: '已比赛场次',
      wins: '胜场',
      losses: '负场',
      winRate: '胜率',
      skillRating: '技能评分',
      totalPlayers: '总球员数',
      activePlayers: '活跃球员',
      newPlayers: '新球员',
      totalClubs: '总俱乐部数',
      activeClubs: '活跃俱乐部',
      totalEvents: '总活动数',
      upcomingEvents: '即将开始的活动',
    },
  },

  eventCard: {
    status: {
      approved: '已批准',
      rejected: '已拒绝',
    },
    partnerStatus: {
      partnerDeclined: '搭档已拒绝',
    },
    matchType: {
      mensSingles: '男子单打',
      womensSingles: '女子单打',
      mensDoubles: '男子双打',
      womensDoubles: '女子双打',
      mixedDoubles: '混合双打',
    },
    matchTypeSelector: {
      singles: '单打',
      doubles: '双打',
    },
  },

  matches: {
    header: {
      currentNotificationDistance: '当前通知距离：{{distance}}英里',
    },
    tabs: {
      personal: '个人比赛',
      club: '俱乐部活动',
    },
    card: {
      recurring: '重复活动',
      participants: '参与者：{{count}}/{{max}}',
      organizer: '组织者：{{name}}',
      pending: '（待处理）',
      moreParticipants: '还有{{count}}位',
      joinButton: '加入',
      manageButton: '管理',
      viewButton: '查看',
      editButton: '编辑',
      cancelButton: '取消',
      shareButton: '分享',
    },
  },

  clubLeaguesTournaments: {
    buttons: {
      rejected: '已拒绝',
      sendingInvitation: '发送邀请中...',
      accept: '接受',
      reject: '拒绝',
    },
    labels: {
      participants: '参与者',
      format: '赛制',
      singleElimination: '单淘汰',
      newTeamInvitations: '🏛️ 新团队邀请',
      sentInvitation: '向您发送了团队邀请',
      expiresIn: '{{hours}}小时后过期',
    },
  },

  clubTournamentManagement: {
    tabs: {
      overview: '概览',
      participants: '参与者',
      schedule: '赛程',
      results: '结果',
      settings: '设置',
    },
    actions: {
      addRound: '添加轮次',
      generateMatches: '生成比赛',
      publishResults: '发布结果',
      notifyParticipants: '通知参与者',
      exportBracket: '导出对阵图',
      printSchedule: '打印赛程',
    },
    status: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },
  },

  club: {
    sections: {
      description: '描述',
      location: '地点',
      facilities: '设施',
      schedule: '时间表',
      pricing: '价格',
      contact: '联系方式',
      gallery: '画廊',
      reviews: '评价',
    },
    facilities: {
      courts: '场地',
      lighting: '照明',
      parking: '停车场',
      restrooms: '洗手间',
      showers: '淋浴',
      lockers: '储物柜',
      proShop: '专业商店',
      cafe: '咖啡厅',
      wifi: 'WiFi',
      airConditioning: '空调',
    },
  },

  createClub: {
    sections: {
      basic: '基本信息',
      location: '地点',
      facilities: '设施',
      membership: '会员制度',
      contact: '联系方式',
      media: '媒体',
      settings: '设置',
    },
    membershipTypes: {
      open: '开放',
      inviteOnly: '仅限邀请',
      approvalRequired: '需要审批',
      paid: '付费会员',
      free: '免费会员',
    },
  },

  types: {
    durations: {
      '30min': '30分钟',
      '1hour': '1小时',
      '1.5hours': '1.5小时',
      '2hours': '2小时',
      '2.5hours': '2.5小时',
      '3hours': '3小时',
      '4hours': '4小时',
      allDay: '全天',
    },
    recurrence: {
      none: '不重复',
      daily: '每天',
      weekly: '每周',
      biweekly: '双周',
      monthly: '每月',
      custom: '自定义',
    },
  },

  profile: {
    sections: {
      about: '关于',
      stats: '统计',
      activity: '活动',
      achievements: '成就',
      friends: '好友',
      settings: '设置',
    },
    playingStyle: {
      aggressive: '进攻型',
      defensive: '防守型',
      allCourt: '全场型',
      baseline: '底线型',
      netPlayer: '网前型',
      balanced: '均衡型',
    },
  },

  createClubTournament: {
    sections: {
      basic: '基本信息',
      format: '赛制',
      schedule: '赛程',
      registration: '报名',
      prizes: '奖品',
      rules: '规则',
      settings: '设置',
    },
    prizeTypes: {
      trophy: '奖杯',
      medal: '奖牌',
      cash: '现金',
      gift: '礼品',
      certificate: '证书',
      none: '无',
    },
  },

  duesManagement: {
    filters: {
      all: '全部',
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
      exempt: '免除',
    },
    actions: {
      bulkActions: '批量操作',
      selectAll: '全选',
      deselectAll: '取消全选',
      markAllPaid: '全部标记为已付',
      sendBulkReminders: '批量发送提醒',
      exportSelected: '导出已选',
      deleteSelected: '删除已选',
    },
  },

  discover: {
    title: '发现',
    tabs: {
      nearby: '附近',
      popular: '热门',
      recommended: '推荐',
      new: '最新',
      trending: '趋势',
    },
    filters: {
      all: '全部',
      players: '球员',
      clubs: '俱乐部',
      events: '活动',
      tournaments: '锦标赛',
    },
    search: {
      placeholder: '搜索...',
      noResults: '未找到结果',
      suggestions: '建议',
      recent: '最近搜索',
    },
  },

  hostedEventCard: {
    actions: {
      edit: '编辑',
      cancel: '取消',
      duplicate: '复制',
      share: '分享',
      viewParticipants: '查看参与者',
      sendMessage: '发送消息',
      exportData: '导出数据',
    },
    status: {
      draft: '草稿',
      published: '已发布',
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },
    stats: {
      views: '浏览量',
      registrations: '报名数',
      attendance: '出席率',
      capacity: '容量',
      waitlist: '候补名单',
    },
  },

  profileSettings: {
    title: '设置',
    sections: {
      profile: '个人资料',
      privacy: '隐私',
      notifications: '通知',
      preferences: '偏好',
      account: '账户',
      security: '安全',
    },
    privacy: {
      visibility: '可见性',
      showEmail: '显示邮箱',
      showPhone: '显示电话',
      showLocation: '显示地点',
      showStats: '显示统计',
      allowMessages: '允许消息',
      allowFriendRequests: '允许好友请求',
    },
    notifications: {
      email: '邮件通知',
      push: '推送通知',
      sms: '短信通知',
      matchReminders: '比赛提醒',
      friendRequests: '好友请求',
      eventUpdates: '活动更新',
      clubNews: '俱乐部新闻',
    },
  },

  createMeetup: {
    title: '创建聚会',
    fields: {
      title: '标题',
      titlePlaceholder: '输入聚会标题',
      description: '描述',
      descriptionPlaceholder: '描述您的聚会...',
      date: '日期',
      time: '时间',
      location: '地点',
      maxParticipants: '最大参与人数',
      skillLevel: '技能等级',
      casual: '休闲',
      competitive: '竞技',
      practice: '练习',
      social: '社交',
    },
    actions: {
      create: '创建聚会',
      cancel: '取消',
      save: '保存',
      preview: '预览',
    },
  },

  clubDuesManagement: {
    title: '俱乐部会费管理',
    overview: {
      totalMembers: '总会员数',
      activeMembers: '活跃会员',
      collectionRate: '收缴率',
      totalRevenue: '总收入',
      monthlyRevenue: '月收入',
      annualRevenue: '年收入',
    },
    settings: {
      dueStructure: '会费结构',
      paymentMethods: '付款方式',
      reminderSchedule: '提醒计划',
      lateFees: '滞纳金',
      exemptions: '免除规则',
      autoRenew: '自动续费',
    },
  },
};

// Read existing translations
const zhPath = path.join(__dirname, '../src/locales/zh.json');
const existingZh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

// Merge translations
const updatedZh = deepMerge(existingZh, zhTranslations);

// Write back to file
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Successfully translated Batch 2!');
console.log('\n📊 Sections updated:');
console.log('  - createEvent: gameTypes, placeholders');
console.log('  - admin: logs, devTools');
console.log('  - eventCard: status, matchType');
console.log('  - matches: header, tabs, card');
console.log('  - clubLeaguesTournaments: buttons, labels');
console.log('  - clubTournamentManagement: tabs, actions, status');
console.log('  - club: sections, facilities');
console.log('  - createClub: sections, membershipTypes');
console.log('  - types: durations, recurrence');
console.log('  - profile: sections, playingStyle');
console.log('  - createClubTournament: sections, prizeTypes');
console.log('  - duesManagement: filters, actions');
console.log('  - discover: tabs, filters, search');
console.log('  - hostedEventCard: actions, status, stats');
console.log('  - profileSettings: sections, privacy, notifications');
console.log('  - createMeetup: fields, actions');
console.log('  - clubDuesManagement: overview, settings');
console.log('\n📈 Estimated total: ~250+ keys');
