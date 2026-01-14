#!/usr/bin/env node

/**
 * Complete remaining Chinese translations - Part 2
 * Focus on the largest untranslated sections
 */

const fs = require('fs');
const path = require('path');

const ZH_PATH = path.join(__dirname, '../src/locales/zh.json');

// Deep merge utility
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
  // NTRP ASSESSMENT (complete)
  ntrpAssessment: {
    confidence: '信心',
    confidenceHigh: '高',
    confidenceMedium: '中',
    confidenceLow: '低',
    scoreBreakdown: '分数明细',
    skills: '技能',
    tactics: '战术',
    experience: '经验',
    selfAssessment: '自我评估',
    adjustLevel: '调整等级 (±1)',
  },

  // TERMS (complete)
  terms: {
    details: {
      locationServices: {
        title: '基于位置的服务条款',
      },
      liabilityDisclaimer: {
        title: '责任免责声明',
      },
      marketingCommunications: {
        title: '营销通讯同意书',
      },
      inclusivityPolicy: {
        title: '多样性与包容性政策',
      },
    },
  },

  // CLUB MEMBERS (complete)
  club: {
    clubMembers: {
      actions: {
        manage: '管理',
      },
      alerts: {
        roleChange: {
          title: '更改角色',
          confirm: '更改',
        },
        approveRequest: {
          title: '批准请求',
          message: '批准 {{userName}} 的加入请求?',
          success: '{{userName}} 的请求已被批准。',
        },
      },
    },
  },

  // DUES MANAGEMENT (71 keys - complete all)
  duesManagement: {
    title: '会费管理',
    subtitle: '管理会员会费',
    overview: '概览',
    members: '会员',
    payments: '付款记录',
    settings: '设置',

    tabs: {
      overview: '概览',
      members: '会员',
      payments: '付款',
      settings: '设置',
    },

    status: {
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
      exempt: '免除',
      pending: '待付',
    },

    filters: {
      all: '全部',
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
      exempt: '免除',
    },

    collection: {
      title: '收款统计',
      collected: '已收取',
      pending: '待收取',
      overdue: '逾期',
      rate: '收款率',
      total: '总计',
      thisMonth: '本月',
      lastMonth: '上月',
    },

    member: {
      name: '姓名',
      status: '状态',
      amount: '金额',
      dueDate: '到期日',
      paidDate: '付款日',
      lastPayment: '最后付款',
      actions: '操作',
      email: '邮箱',
      phone: '电话',
    },

    actions: {
      markPaid: '标记为已付',
      markUnpaid: '标记为未付',
      sendReminder: '发送提醒',
      sendBulkReminder: '批量发送提醒',
      exempt: '免除',
      unexempt: '取消免除',
      edit: '编辑',
      delete: '删除',
      export: '导出',
      import: '导入',
      viewHistory: '查看历史',
    },

    configure: {
      title: '配置会费',
      amount: '金额',
      currency: '货币',
      frequency: '频率',
      dueDay: '到期日',
      reminderDays: '提醒天数',
      lateFee: '滞纳金',
      gracePeriod: '宽限期',
      save: '保存',
      cancel: '取消',
    },

    frequency: {
      monthly: '月付',
      quarterly: '季付',
      semiannual: '半年付',
      annual: '年付',
      onetime: '一次性',
    },

    payment: {
      method: '付款方式',
      reference: '参考号',
      notes: '备注',
      receipt: '收据',
    },

    reminders: {
      title: '提醒设置',
      beforeDue: '到期前提醒',
      afterDue: '逾期后提醒',
      frequency: '提醒频率',
      template: '提醒模板',
    },

    reports: {
      title: '报告',
      summary: '汇总',
      details: '详情',
      export: '导出',
      period: '期间',
    },

    messages: {
      marked: '已标记',
      reminderSent: '提醒已发送',
      updated: '已更新',
      deleted: '已删除',
      exempted: '已免除',
      error: '操作失败',
    },
  },

  // TYPES (69 keys - complete all)
  types: {
    user: {
      player: '球员',
      coach: '教练',
      admin: '管理员',
      moderator: '版主',
      guest: '访客',
    },

    match: {
      singles: '单打',
      doubles: '双打',
      mixed: '混合双打',
      practice: '练习',
      tournament: '锦标赛',
      friendly: '友谊赛',
      competitive: '竞技赛',
    },

    court: {
      hard: '硬地',
      clay: '红土',
      grass: '草地',
      carpet: '地毯',
      indoor: '室内',
      outdoor: '室外',
    },

    event: {
      match: '比赛',
      practice: '练习',
      tournament: '锦标赛',
      social: '社交活动',
      meeting: '会议',
      training: '训练',
    },

    notification: {
      matchRequest: '比赛邀请',
      friendRequest: '好友请求',
      message: '消息',
      achievement: '成就',
      reminder: '提醒',
      announcement: '公告',
    },

    skill: {
      beginner: '初学者',
      intermediate: '中级',
      advanced: '高级',
      professional: '专业',
    },

    status: {
      active: '活跃',
      inactive: '不活跃',
      pending: '待定',
      approved: '已批准',
      rejected: '已拒绝',
      banned: '已禁止',
    },

    gender: {
      male: '男',
      female: '女',
      other: '其他',
      preferNotToSay: '不愿透露',
    },

    visibility: {
      public: '公开',
      private: '私密',
      friends: '仅好友',
      club: '仅俱乐部',
    },

    duration: {
      minutes: '分钟',
      hours: '小时',
      days: '天',
      weeks: '周',
      months: '月',
      years: '年',
    },
  },

  // EDIT PROFILE (41 keys - complete all)
  editProfile: {
    title: '编辑资料',
    subtitle: '更新您的个人信息',
    save: '保存',
    cancel: '取消',
    saved: '已保存',
    error: '保存失败',

    sections: {
      basic: '基本信息',
      contact: '联系方式',
      pickleball: '网球信息',
      preferences: '偏好设置',
      privacy: '隐私设置',
    },

    fields: {
      photo: '头像',
      displayName: '显示名称',
      firstName: '名',
      lastName: '姓',
      bio: '个人简介',
      location: '位置',
      email: '邮箱',
      phone: '电话',
      birthDate: '生日',
      gender: '性别',

      skillLevel: '技术等级',
      playingStyle: '打球风格',
      dominantHand: '惯用手',
      favoriteShot: '最擅长的击球',
      yearsPlaying: '球龄',

      language: '语言',
      timezone: '时区',
      units: '单位',
      notifications: '通知',

      profileVisibility: '资料可见性',
      showEmail: '显示邮箱',
      showPhone: '显示电话',
      showLocation: '显示位置',
      allowMessages: '允许消息',
    },

    placeholders: {
      displayName: '输入显示名称',
      bio: '介绍一下自己...',
      location: '城市, 国家',
      phone: '+1 234 567 8900',
    },

    options: {
      left: '左手',
      right: '右手',
      ambidextrous: '双手',

      forehand: '正手',
      backhand: '反手',
      serve: '发球',
      volley: '截击',
    },

    validation: {
      required: '必填项',
      invalidEmail: '邮箱格式无效',
      invalidPhone: '电话号码格式无效',
    },
  },

  // PERFORMANCE DASHBOARD (37 keys - complete all)
  performanceDashboard: {
    title: '表现分析',
    subtitle: '追踪您的网球表现',
    overview: '概览',
    stats: '统计',
    trends: '趋势',
    insights: '洞察',
    history: '历史',

    overview: {
      winRate: '胜率',
      totalMatches: '总比赛数',
      currentStreak: '当前连胜',
      longestStreak: '最长连胜',
      ranking: '排名',
      points: '积分',
      level: '等级',
    },

    stats: {
      wins: '胜场',
      losses: '负场',
      draws: '平局',
      points: '积分',
      averageScore: '平均得分',
      totalGames: '总局数',
      totalSets: '总盘数',
    },

    trends: {
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
      allTime: '全部时间',
      last7Days: '最近7天',
      last30Days: '最近30天',
      last90Days: '最近90天',
    },

    charts: {
      winRate: '胜率趋势',
      matchActivity: '比赛活跃度',
      skillProgress: '技能进步',
      performance: '表现对比',
      ranking: '排名变化',
    },

    insights: {
      strengths: '优势',
      weaknesses: '劣势',
      recommendations: '建议',
      achievements: '成就',
      improvement: '进步空间',
    },

    actions: {
      exportData: '导出数据',
      viewDetails: '查看详情',
      shareStats: '分享统计',
      printReport: '打印报告',
    },
  },

  // CLUB TOURNAMENT MANAGEMENT (35 keys)
  clubTournamentManagement: {
    title: '锦标赛管理',
    subtitle: '管理俱乐部锦标赛',
    create: '创建锦标赛',
    edit: '编辑锦标赛',
    list: '锦标赛列表',

    details: {
      name: '名称',
      description: '描述',
      format: '赛制',
      type: '类型',
      startDate: '开始日期',
      endDate: '结束日期',
      registrationDeadline: '报名截止',
      maxParticipants: '最多参与者',
      entryFee: '报名费',
      prize: '奖金',
    },

    formats: {
      singleElimination: '单淘汰',
      doubleElimination: '双淘汰',
      roundRobin: '循环赛',
      swiss: '瑞士制',
    },

    types: {
      singles: '单打',
      doubles: '双打',
      mixed: '混合双打',
      team: '团体',
    },

    status: {
      upcoming: '即将开始',
      registration: '报名中',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },

    actions: {
      register: '报名',
      withdraw: '退出',
      viewBpaddle: '查看对阵表',
      manageBpaddle: '管理对阵表',
      recordScore: '记录比分',
      cancel: '取消',
    },

    messages: {
      created: '锦标赛已创建',
      updated: '锦标赛已更新',
      deleted: '锦标赛已删除',
      registered: '报名成功',
      withdrawn: '已退出',
    },
  },

  // CLUB DUES MANAGEMENT (35 keys)
  clubDuesManagement: {
    title: '会费管理',
    subtitle: '管理俱乐部会费',
    configure: '配置会费',
    members: '会员',
    payments: '付款',

    configuration: {
      amount: '金额',
      frequency: '频率',
      dueDate: '到期日',
      lateFee: '滞纳金',
      gracePeriod: '宽限期',
      reminderDays: '提醒天数',
    },

    frequency: {
      monthly: '月付',
      quarterly: '季付',
      annual: '年付',
      custom: '自定义',
    },

    memberStatus: {
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
      exempt: '免除',
    },

    actions: {
      markPaid: '标记为已付',
      sendReminder: '发送提醒',
      exempt: '免除',
      viewHistory: '查看历史',
      export: '导出',
    },

    payment: {
      amount: '金额',
      date: '日期',
      method: '方式',
      reference: '参考号',
      status: '状态',
    },

    summary: {
      totalCollected: '总收取',
      totalPending: '总待收',
      collectionRate: '收款率',
      overdueAmount: '逾期金额',
    },

    messages: {
      marked: '已标记',
      reminderSent: '提醒已发送',
      exempted: '已免除',
      updated: '已更新',
    },
  },

  // CREATE EVENT (34 keys)
  createEvent: {
    title: '创建活动',
    subtitle: '组织一个新活动',
    save: '保存',
    publish: '发布',
    cancel: '取消',

    sections: {
      basic: '基本信息',
      details: '详细信息',
      participants: '参与者',
      location: '位置',
      advanced: '高级设置',
    },

    fields: {
      title: '标题',
      description: '描述',
      type: '类型',
      date: '日期',
      time: '时间',
      duration: '时长',
      location: '地点',
      court: '球场',
      maxParticipants: '最多参与者',
      skillLevel: '技术等级',
      cost: '费用',

      visibility: '可见性',
      registration: '报名方式',
      deadline: '报名截止',
      cancellationPolicy: '取消政策',
    },

    types: {
      match: '比赛',
      practice: '练习',
      tournament: '锦标赛',
      social: '社交',
      training: '训练',
    },

    visibility: {
      public: '公开',
      private: '私密',
      club: '仅俱乐部',
      friends: '仅好友',
    },

    messages: {
      created: '活动已创建',
      updated: '活动已更新',
      published: '活动已发布',
      error: '创建失败',
    },
  },

  // EVENT CARD (30 keys)
  eventCard: {
    hostedBy: '主办方',
    participants: '参与者',
    maxParticipants: '最多参与者',
    joined: '已加入',
    available: '可用名额',
    date: '日期',
    time: '时间',
    location: '地点',
    court: '球场',
    skillLevel: '技术等级',
    cost: '费用',
    free: '免费',

    status: {
      upcoming: '即将举行',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      full: '已满',
    },

    actions: {
      join: '加入',
      leave: '退出',
      edit: '编辑',
      cancel: '取消',
      delete: '删除',
      share: '分享',
      viewDetails: '查看详情',
    },

    messages: {
      joined: '已加入活动',
      left: '已退出活动',
      full: '活动已满',
      cancelled: '活动已取消',
    },
  },

  // HOSTED EVENT CARD (35 keys - update from 29)
  hostedEventCard: {
    hostedBy: '主办方',
    organizer: '组织者',
    participants: '参与者',
    maxParticipants: '最多参与者',
    attending: '参加',
    available: '可用',
    waitlist: '候补',
    date: '日期',
    time: '时间',
    endTime: '结束时间',
    location: '地点',
    venue: '场地',
    address: '地址',
    status: '状态',

    statuses: {
      upcoming: '即将举行',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已推迟',
    },

    actions: {
      join: '加入',
      leave: '退出',
      edit: '编辑',
      cancel: '取消',
      viewDetails: '查看详情',
      share: '分享',
      invite: '邀请',
      manage: '管理',
    },

    details: {
      description: '描述',
      requirements: '要求',
      skillLevel: '技术等级',
      courtType: '球场类型',
      format: '比赛形式',
      rules: '规则',
    },

    notifications: {
      joined: '成功加入活动',
      left: '已退出活动',
      full: '活动已满',
      cancelled: '活动已取消',
      updated: '活动已更新',
    },

    confirmation: {
      cancel: '确定要取消此活动吗?',
      leave: '确定要退出此活动吗?',
      delete: '确定要删除此活动吗?',
    },
  },

  // MATCHES (29 keys)
  matches: {
    title: '比赛',
    upcoming: '即将进行',
    completed: '已完成',
    invitations: '邀请',
    history: '历史',

    create: '创建比赛',
    findMatch: '查找对手',
    invitePlayer: '邀请球员',

    details: {
      opponent: '对手',
      date: '日期',
      time: '时间',
      location: '地点',
      court: '球场',
      format: '比赛形式',
      score: '比分',
      result: '结果',
    },

    formats: {
      singles: '单打',
      doubles: '双打',
      mixed: '混合双打',
    },

    status: {
      pending: '待定',
      confirmed: '已确认',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },

    actions: {
      accept: '接受',
      decline: '拒绝',
      confirm: '确认',
      cancel: '取消',
      recordScore: '记录比分',
      viewDetails: '查看详情',
    },

    messages: {
      invited: '已发送邀请',
      accepted: '已接受邀请',
      declined: '已拒绝邀请',
      cancelled: '已取消比赛',
    },
  },
};

// Apply translations
const updatedZh = deepMerge(zhData, translations);

// Save
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZh, null, 2), 'utf8');

console.log('✅ Successfully applied Part 2 Chinese translations!');
console.log(`📝 Updated file: ${ZH_PATH}`);
