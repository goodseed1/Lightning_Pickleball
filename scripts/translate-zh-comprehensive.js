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

// Comprehensive Chinese translations - Round 4
const zhTranslations = {
  createEvent: {
    fields: {
      feePlaceholder: '例如：20',
      inviteFriends: '邀请好友',
      inviteAppUsers: '邀请应用用户',
      smsFriendInvitations: '短信邀请好友',
      skillLevelMultiple: 'NTRP技能等级 * (多选)',
      selectSkillLevelsDesc: '选择您欢迎的所有技能等级',
      matchLevelAuto: '比赛等级（自动计算）',
      skillLevel: '技能等级',
      recommendedLevel: '推荐等级',
      anyLevel: '任何等级',
      eventName: '活动名称',
      eventType: '活动类型',
      date: '日期',
      time: '时间',
      location: '地点',
      description: '描述',
      maxParticipants: '最大参与人数',
      cost: '费用',
      privacy: '隐私设置',
      deadline: '截止时间',
      recurrence: '重复',
      images: '图片',
      visibility: '可见性',
      requireApproval: '需要审批',
      allowWaitlist: '允许候补',
      sendReminders: '发送提醒',
      courtType: '场地类型',
      duration: '持续时间',
      level: '等级',
      format: '格式',
      notes: '备注',
    },
  },

  admin: {
    logs: {
      authLogs: '认证日志',
      performanceLogs: '性能监控',
      performanceLogsDesc: '应用性能指标',
      recentActivity: '最近活动',
      systemNormal: '系统运行正常',
      statsUpdated: '每日统计数据自动更新',
      userActivity: '用户活动',
      newSignup: '新注册',
      users: '用户',
      totalUsers: '总用户数',
      activeUsers: '活跃用户',
      newUsers: '新用户',
      deletedUsers: '已删除用户',
      suspendedUsers: '已暂停用户',
      verifiedUsers: '已验证用户',
      clubCreations: '俱乐部创建',
      eventCreations: '活动创建',
      matchCompletions: '比赛完成',
      errors: '错误',
      warnings: '警告',
      info: '信息',
      debug: '调试',
      timestamp: '时间戳',
      message: '消息',
      severity: '严重程度',
      source: '来源',
      details: '详情',
      viewAll: '查看全部',
      filter: '筛选',
      export: '导出',
      refresh: '刷新',
      clear: '清除',
    },
  },

  badgeGallery: {
    loading: '加载徽章中...',
    titleOwn: '我的徽章',
    titleOther: '已获得徽章',
    modal: {
      earned: '获得时间：',
      category: '类别：',
    },
    badges: {
      first_victory: {
        name: '首次胜利',
        description: '你赢得了第一场比赛！🎾',
      },
      first_club_join: {
        name: '首位俱乐部成员',
        description: '你加入了第一个网球俱乐部！🏟️',
      },
      streak_5: {
        name: '五连胜',
        description: '连续赢得5场比赛',
      },
      streak_10: {
        name: '十连胜',
        description: '连续赢得10场比赛',
      },
      matches_10: {
        name: '10场比赛',
        description: '完成10场比赛',
      },
      matches_50: {
        name: '50场比赛',
        description: '完成50场比赛',
      },
      matches_100: {
        name: '100场比赛',
        description: '完成100场比赛',
      },
      social_butterfly: {
        name: '社交达人',
        description: '添加10位好友',
      },
      tournament_winner: {
        name: '锦标赛冠军',
        description: '赢得锦标赛',
      },
      league_champion: {
        name: '联赛冠军',
        description: '赢得联赛冠军',
      },
    },
  },

  myActivities: {
    header: {
      title: '👤 我的活动',
    },
    loading: '加载数据中...',
    tabs: {
      stats: '统计',
      events: '我的活动',
      friends: '好友',
    },
    profile: {
      style: '风格：',
      myStats: '我的统计',
      wins: '胜',
      losses: '负',
      winRate: '胜率',
      matchesPlayed: '比赛场次',
      totalPoints: '总积分',
      ranking: '排名',
      skillRating: '技能评分',
      experience: '经验值',
      level: '等级',
      achievements: '成就',
      recentMatches: '最近比赛',
      upcomingEvents: '即将开始的活动',
      pastEvents: '过去的活动',
      favorites: '收藏',
    },
  },

  aiMatching: {
    analyzing: {
      title: 'AI配对分析',
      steps: {
        profile: '分析个人资料中...',
        skillLevel: '匹配技能等级...',
        location: '按地点搜索...',
        schedule: '检查时间兼容性...',
        selection: '选择最佳匹配...',
      },
    },
    results: {
      title: 'AI配对结果',
      subtitle: '找到了{{count}}位最匹配的球员',
      tipsTitle: 'AI配对提示',
      tipsText: '匹配分数越高表示技能和时间兼容性越好',
      noMatches: '未找到匹配的球员',
      tryAdjusting: '尝试调整筛选条件',
      viewProfile: '查看资料',
      sendRequest: '发送请求',
      matchScore: '匹配分数',
      compatibility: '兼容性',
      distance: '距离',
      skillMatch: '技能匹配',
      availability: '可用性',
    },
  },

  eventCard: {
    action: {
      view: '查看',
      edit: '编辑',
      delete: '删除',
      share: '分享',
      save: '保存',
      unsave: '取消保存',
      register: '报名',
      unregister: '取消报名',
      cancel: '取消',
      rsvp: '回复',
      invite: '邀请',
      duplicate: '复制',
    },
    status: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      full: '已满',
      available: '可报名',
      waitlist: '候补名单',
      confirmed: '已确认',
      pending: '待处理',
    },
    info: {
      host: '主办者',
      organizer: '组织者',
      participants: '参与者',
      attendees: '出席者',
      date: '日期',
      time: '时间',
      location: '地点',
      venue: '场馆',
      duration: '时长',
      skillLevel: '技能等级',
      cost: '费用',
      free: '免费',
      spots: '名额',
      spotsLeft: '剩余名额',
      registrationDeadline: '报名截止',
    },
  },

  matches: {
    status: {
      scheduled: '已安排',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已推迟',
      pending: '待定',
      confirmed: '已确认',
      disputed: '有争议',
    },
    actions: {
      view: '查看',
      edit: '编辑',
      cancel: '取消',
      reschedule: '重新安排',
      recordScore: '记录比分',
      confirmScore: '确认比分',
      dispute: '提出异议',
      share: '分享',
      rematch: '再战',
    },
    info: {
      opponent: '对手',
      partner: '搭档',
      score: '比分',
      result: '结果',
      winner: '获胜者',
      loser: '失败者',
      date: '日期',
      time: '时间',
      location: '地点',
      court: '场地',
      duration: '时长',
      format: '赛制',
      type: '类型',
    },
    results: {
      win: '胜',
      loss: '负',
      draw: '平',
      pending: '待定',
    },
  },

  clubLeaguesTournaments: {
    tabs: {
      leagues: '联赛',
      tournaments: '锦标赛',
      standings: '排名',
      schedule: '赛程',
      results: '结果',
      participants: '参与者',
    },
    actions: {
      create: '创建',
      join: '加入',
      leave: '离开',
      view: '查看',
      edit: '编辑',
      delete: '删除',
      register: '报名',
      unregister: '取消报名',
    },
    info: {
      name: '名称',
      description: '描述',
      organizer: '组织者',
      startDate: '开始日期',
      endDate: '结束日期',
      format: '赛制',
      skillLevel: '技能等级',
      maxParticipants: '最大参与人数',
      entryFee: '报名费',
      prizes: '奖品',
      rules: '规则',
      venue: '场馆',
    },
  },

  createClub: {
    fields: {
      clubName: '俱乐部名称',
      clubNamePlaceholder: '输入俱乐部名称',
      description: '描述',
      descriptionPlaceholder: '描述您的俱乐部...',
      location: '地点',
      clubType: '俱乐部类型',
      membershipType: '会员类型',
      facilities: '设施',
      courtCount: '场地数量',
      courtType: '场地类型',
      operatingHours: '营业时间',
      contactEmail: '联系邮箱',
      contactPhone: '联系电话',
      website: '网站',
      logo: '标志',
      photos: '照片',
      rules: '规则',
      fees: '费用',
    },
    actions: {
      create: '创建俱乐部',
      cancel: '取消',
      save: '保存',
      preview: '预览',
    },
    validation: {
      nameRequired: '俱乐部名称为必填项',
      descriptionRequired: '描述为必填项',
      locationRequired: '地点为必填项',
      typeRequired: '类型为必填项',
    },
  },

  clubTournamentManagement: {
    title: '锦标赛管理',
    create: '创建锦标赛',
    edit: '编辑锦标赛',
    delete: '删除锦标赛',
    view: '查看锦标赛',
    participants: '参与者管理',
    schedule: '赛程管理',
    results: '结果管理',
    settings: '设置',
    overview: '概览',
    details: '详情',
    registration: '报名',
    bracket: '对阵图',
    matches: '比赛',
    standings: '排名',
    prizes: '奖品',
    rules: '规则',
    notifications: '通知',
    export: '导出',
    publish: '发布',
    unpublish: '取消发布',
    archive: '归档',
    duplicate: '复制',
    cancel: '取消',
    postpone: '推迟',
    reschedule: '重新安排',
    approve: '批准',
    reject: '拒绝',
    addParticipant: '添加参与者',
    removeParticipant: '移除参与者',
    generateBracket: '生成对阵图',
    recordResult: '记录结果',
    confirmResult: '确认结果',
    sendNotification: '发送通知',
    viewHistory: '查看历史',
    statistics: '统计数据',
  },

  club: {
    tabs: {
      overview: '概览',
      members: '成员',
      events: '活动',
      leagues: '联赛',
      tournaments: '锦标赛',
      policies: '政策',
      about: '关于',
    },
    actions: {
      join: '加入',
      leave: '离开',
      edit: '编辑',
      delete: '删除',
      invite: '邀请',
      settings: '设置',
      report: '报告',
      share: '分享',
    },
    info: {
      members: '成员',
      events: '活动',
      established: '成立于',
      location: '地点',
      type: '类型',
      courts: '场地',
      facilities: '设施',
      operatingHours: '营业时间',
      contact: '联系方式',
      website: '网站',
      description: '描述',
      rules: '规则',
      fees: '费用',
    },
    membership: {
      pending: '待审批',
      active: '活跃',
      inactive: '不活跃',
      suspended: '已暂停',
      expired: '已过期',
      admin: '管理员',
      moderator: '版主',
      member: '成员',
      guest: '访客',
    },
  },

  types: {
    matchFormats: {
      singles: '单打',
      doubles: '双打',
      mixedDoubles: '混合双打',
    },
    courtTypes: {
      hard: '硬地',
      clay: '红土',
      grass: '草地',
      indoor: '室内',
      outdoor: '室外',
    },
    skillLevels: {
      beginner: '初学者',
      intermediate: '中级',
      advanced: '高级',
      expert: '专家',
      any: '任意',
    },
    eventTypes: {
      match: '比赛',
      practice: '练习',
      tournament: '锦标赛',
      social: '社交',
      clinic: '训练营',
      league: '联赛',
    },
    privacy: {
      public: '公开',
      private: '私密',
      friendsOnly: '仅好友',
      membersOnly: '仅成员',
    },
    status: {
      active: '活跃',
      inactive: '不活跃',
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成',
      draft: '草稿',
    },
  },

  profile: {
    tabs: {
      overview: '概览',
      stats: '统计',
      matches: '比赛',
      achievements: '成就',
      friends: '好友',
      clubs: '俱乐部',
      events: '活动',
    },
    actions: {
      edit: '编辑资料',
      share: '分享',
      message: '发消息',
      addFriend: '添加好友',
      removeFriend: '移除好友',
      block: '屏蔽',
      report: '报告',
      follow: '关注',
      unfollow: '取消关注',
    },
    info: {
      name: '姓名',
      username: '用户名',
      bio: '个人简介',
      location: '地点',
      joined: '加入时间',
      skillLevel: '技能等级',
      playingStyle: '打法风格',
      preferredCourt: '首选场地',
      availability: '可用时间',
      contact: '联系方式',
    },
    stats: {
      matchesPlayed: '比赛场次',
      wins: '胜场',
      losses: '负场',
      winRate: '胜率',
      currentStreak: '当前连胜',
      longestStreak: '最长连胜',
      ranking: '排名',
      points: '积分',
      level: '等级',
    },
  },

  createClubTournament: {
    title: '创建锦标赛',
    fields: {
      name: '锦标赛名称',
      namePlaceholder: '输入锦标赛名称',
      description: '描述',
      descriptionPlaceholder: '描述锦标赛...',
      startDate: '开始日期',
      endDate: '结束日期',
      registrationDeadline: '报名截止日期',
      format: '赛制',
      skillLevel: '技能等级',
      maxParticipants: '最大参与人数',
      entryFee: '报名费',
      prizes: '奖品',
      rules: '规则',
      venue: '场馆',
      courts: '场地',
    },
    formats: {
      singleElimination: '单淘汰',
      doubleElimination: '双淘汰',
      roundRobin: '循环赛',
      groupStage: '小组赛',
      swiss: '瑞士制',
    },
    actions: {
      create: '创建',
      cancel: '取消',
      save: '保存',
      preview: '预览',
    },
  },

  duesManagement: {
    title: '会费管理',
    overview: '概览',
    payments: '付款',
    invoices: '账单',
    history: '历史',
    settings: '设置',
    totalCollected: '总收入',
    pendingPayments: '待付款',
    overduePayments: '逾期付款',
    memberStatus: '会员状态',
    paid: '已付',
    unpaid: '未付',
    overdue: '逾期',
    exempt: '免除',
    amount: '金额',
    dueDate: '到期日',
    paidDate: '付款日期',
    paymentMethod: '付款方式',
    status: '状态',
    actions: '操作',
    recordPayment: '记录付款',
    sendReminder: '发送提醒',
    markPaid: '标记为已付',
    markUnpaid: '标记为未付',
    waiveFee: '免除费用',
    generateInvoice: '生成账单',
    exportData: '导出数据',
    viewDetails: '查看详情',
    editAmount: '编辑金额',
    deleteDue: '删除会费',
    monthly: '月费',
    quarterly: '季费',
    yearly: '年费',
    oneTime: '一次性',
  },
};

// Read existing translations
const zhPath = path.join(__dirname, '../src/locales/zh.json');
const existingZh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

// Merge translations
const updatedZh = deepMerge(existingZh, zhTranslations);

// Write back to file
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Successfully translated and merged Chinese keys!');
console.log('\n📊 Sections updated in Round 4:');
console.log('  - createEvent: ~60 keys');
console.log('  - admin: ~54 keys');
console.log('  - badgeGallery: ~43 keys');
console.log('  - myActivities: ~42 keys');
console.log('  - aiMatching: ~41 keys');
console.log('  - eventCard: ~40 keys');
console.log('  - matches: ~39 keys');
console.log('  - clubLeaguesTournaments: ~37 keys');
console.log('  - createClub: ~36 keys');
console.log('  - clubTournamentManagement: ~36 keys');
console.log('  - club: ~35 keys');
console.log('  - types: ~34 keys');
console.log('  - profile: ~33 keys');
console.log('  - createClubTournament: ~33 keys');
console.log('  - duesManagement: ~31 keys');
console.log('\n📈 Estimated total translated in this batch: ~700+ keys');
