#!/usr/bin/env node

/**
 * Complete ALL remaining Chinese (Simplified) translations
 * Finds all keys where zh.json === en.json and provides Chinese translations
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
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

// Find untranslated keys
function findUntranslated(en, zh, path = '') {
  const untranslated = [];

  for (const key in en) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = en[key];
    const zhValue = zh[key];

    if (typeof enValue === 'object' && !Array.isArray(enValue)) {
      untranslated.push(...findUntranslated(enValue, zhValue || {}, currentPath));
    } else if (zhValue === enValue || zhValue === undefined) {
      untranslated.push({ path: currentPath, en: enValue });
    }
  }

  return untranslated;
}

// Main execution
const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const zhData = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

const untranslated = findUntranslated(enData, zhData);

console.log(`Found ${untranslated.length} untranslated keys`);
console.log('\nTop-level sections with most untranslated keys:');

// Group by top-level section
const sections = {};
untranslated.forEach(item => {
  const section = item.path.split('.')[0];
  sections[section] = (sections[section] || 0) + 1;
});

const sortedSections = Object.entries(sections)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedSections.forEach(([section, count]) => {
  console.log(`- ${section}: ${count} keys`);
});

console.log('\n--- Sample untranslated keys ---');
untranslated.slice(0, 20).forEach(item => {
  console.log(`${item.path}: "${item.en}"`);
});

// Now generate comprehensive translations
const translations = {
  // DUES MANAGEMENT (30 keys)
  duesManagement: {
    title: '会费管理',
    overview: '概览',
    members: '会员',
    payments: '付款',
    settings: '设置',

    status: {
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
      exempt: '免除',
    },

    filters: {
      all: '全部',
      paid: '已付',
      unpaid: '未付',
      overdue: '逾期',
    },

    collection: {
      title: '收款统计',
      collected: '已收取',
      pending: '待收取',
      rate: '收款率',
    },

    member: {
      name: '姓名',
      status: '状态',
      amount: '金额',
      dueDate: '到期日',
      paidDate: '付款日',
      actions: '操作',
    },

    actions: {
      markPaid: '标记为已付',
      markUnpaid: '标记为未付',
      sendReminder: '发送提醒',
      exempt: '免除',
      edit: '编辑',
    },

    configure: {
      title: '配置会费',
      amount: '金额',
      frequency: '频率',
      dueDay: '到期日',
      reminderDays: '提醒天数',
      save: '保存',
    },

    frequency: {
      monthly: '月付',
      quarterly: '季付',
      annual: '年付',
    },
  },

  // HOSTED EVENT CARD (29 keys)
  hostedEventCard: {
    hostedBy: '主办方',
    participants: '参与者',
    maxParticipants: '最多参与者',
    date: '日期',
    time: '时间',
    location: '地点',
    status: '状态',

    statuses: {
      upcoming: '即将举行',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },

    actions: {
      join: '加入',
      leave: '退出',
      edit: '编辑',
      cancel: '取消',
      viewDetails: '查看详情',
      share: '分享',
    },

    details: {
      description: '描述',
      requirements: '要求',
      skillLevel: '技术等级',
      courtType: '球场类型',
      format: '比赛形式',
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
    },
  },

  // BADGE GALLERY (28 keys)
  badgeGallery: {
    title: '徽章库',
    myBadges: '我的徽章',
    allBadges: '所有徽章',
    locked: '未解锁',
    unlocked: '已解锁',

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
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇',
    },

    details: {
      title: '徽章详情',
      description: '描述',
      requirement: '获得条件',
      progress: '进度',
      earnedDate: '获得日期',
      rarity: '稀有度',
    },

    progress: {
      notStarted: '未开始',
      inProgress: '进行中',
      completed: '已完成',
    },

    actions: {
      equip: '装备',
      unequip: '卸下',
      share: '分享',
      viewAll: '查看全部',
    },

    messages: {
      equipped: '已装备徽章',
      unequipped: '已卸下徽章',
      earned: '获得新徽章!',
    },
  },

  // PROFILE SETTINGS (27 keys)
  profileSettings: {
    title: '个人设置',
    editProfile: '编辑资料',
    account: '账户',
    privacy: '隐私',
    notifications: '通知',
    preferences: '偏好设置',

    profile: {
      photo: '头像',
      name: '姓名',
      bio: '个人简介',
      location: '位置',
      skillLevel: '技术等级',
      playingStyle: '打球风格',
    },

    account: {
      email: '邮箱',
      phone: '电话',
      password: '密码',
      changePassword: '更改密码',
      deleteAccount: '删除账户',
    },

    privacy: {
      profileVisibility: '资料可见性',
      showEmail: '显示邮箱',
      showPhone: '显示电话',
      showLocation: '显示位置',
      allowMessages: '允许消息',
    },

    notifications: {
      matchRequests: '比赛邀请',
      messages: '消息',
      events: '活动',
      achievements: '成就',
      email: '邮件通知',
      push: '推送通知',
    },

    preferences: {
      language: '语言',
      theme: '主题',
      units: '单位',
      timezone: '时区',
    },
  },

  // PERFORMANCE DASHBOARD (27 keys)
  performanceDashboard: {
    title: '表现分析',
    overview: '概览',
    stats: '统计',
    trends: '趋势',
    insights: '洞察',

    overview: {
      winRate: '胜率',
      totalMatches: '总比赛数',
      currentStreak: '当前连胜',
      ranking: '排名',
    },

    stats: {
      wins: '胜场',
      losses: '负场',
      draws: '平局',
      points: '积分',
      averageScore: '平均得分',
    },

    trends: {
      weekly: '本周',
      monthly: '本月',
      yearly: '本年',
      allTime: '全部时间',
    },

    charts: {
      winRate: '胜率趋势',
      matchActivity: '比赛活跃度',
      skillProgress: '技能进步',
      performance: '表现对比',
    },

    insights: {
      strengths: '优势',
      weaknesses: '劣势',
      recommendations: '建议',
      achievements: '成就',
    },

    actions: {
      exportData: '导出数据',
      viewDetails: '查看详情',
      shareStats: '分享统计',
    },
  },

  // LEAGUE MANAGEMENT (26 keys)
  leagueManagement: {
    title: '联赛管理',
    create: '创建联赛',
    myLeagues: '我的联赛',
    standings: '积分榜',
    schedule: '赛程',

    details: {
      name: '联赛名称',
      description: '描述',
      format: '赛制',
      startDate: '开始日期',
      endDate: '结束日期',
      maxTeams: '最多队伍',
    },

    formats: {
      roundRobin: '循环赛',
      knockout: '淘汰赛',
      swiss: '瑞士制',
      hybrid: '混合制',
    },

    standings: {
      position: '排名',
      team: '队伍',
      played: '已赛',
      won: '胜',
      lost: '负',
      points: '积分',
    },

    actions: {
      register: '注册',
      withdraw: '退出',
      editSchedule: '编辑赛程',
      recordResult: '记录结果',
    },

    status: {
      registration: '报名中',
      active: '进行中',
      completed: '已完成',
    },
  },

  // TOURNAMENT SYSTEM (25 keys)
  tournamentSystem: {
    title: '锦标赛',
    browse: '浏览锦标赛',
    myTournaments: '我的锦标赛',
    create: '创建锦标赛',

    details: {
      name: '锦标赛名称',
      type: '类型',
      format: '赛制',
      entryFee: '报名费',
      prize: '奖金',
      deadline: '截止日期',
    },

    types: {
      singles: '单打',
      doubles: '双打',
      mixed: '混合双打',
      team: '团体',
    },

    bracket: {
      title: '对阵表',
      round: '轮次',
      match: '比赛',
      winner: '获胜者',
      upcoming: '即将开始',
    },

    actions: {
      register: '报名',
      withdraw: '退出',
      viewBracket: '查看对阵表',
      submitScore: '提交比分',
    },

    messages: {
      registered: '报名成功',
      withdrawn: '已退出',
      full: '报名已满',
      started: '锦标赛已开始',
    },
  },

  // COURT BOOKING (24 keys)
  courtBooking: {
    title: '球场预订',
    findCourts: '查找球场',
    myBookings: '我的预订',
    favorites: '收藏',

    search: {
      location: '位置',
      date: '日期',
      time: '时间',
      courtType: '球场类型',
      facilities: '设施',
    },

    courtTypes: {
      hard: '硬地',
      clay: '红土',
      grass: '草地',
      indoor: '室内',
      outdoor: '室外',
    },

    facilities: {
      lighting: '照明',
      parking: '停车',
      restroom: '洗手间',
      lockers: '更衣室',
      shop: '商店',
    },

    booking: {
      selectTime: '选择时间',
      duration: '时长',
      price: '价格',
      confirm: '确认预订',
      cancel: '取消预订',
    },

    status: {
      confirmed: '已确认',
      pending: '待确认',
      cancelled: '已取消',
    },
  },

  // COACHING SYSTEM (23 keys)
  coachingSystem: {
    title: '教练系统',
    findCoach: '查找教练',
    myCoaches: '我的教练',
    sessions: '课程',

    coach: {
      name: '姓名',
      rating: '评分',
      experience: '经验',
      specialty: '专长',
      rate: '费用',
      availability: '可用时间',
    },

    session: {
      book: '预订课程',
      type: '类型',
      duration: '时长',
      location: '地点',
      price: '价格',
    },

    sessionTypes: {
      individual: '一对一',
      group: '团体课',
      clinic: '训练营',
      online: '在线课程',
    },

    actions: {
      viewProfile: '查看资料',
      bookSession: '预订课程',
      message: '发送消息',
      review: '评价',
    },

    messages: {
      booked: '预订成功',
      cancelled: '已取消',
      completed: '已完成',
    },
  },

  // EQUIPMENT SHOP (22 keys)
  equipmentShop: {
    title: '装备商店',
    categories: '分类',
    brands: '品牌',
    cart: '购物车',

    categories: {
      rackets: '球拍',
      balls: '网球',
      shoes: '鞋',
      apparel: '服装',
      accessories: '配件',
    },

    product: {
      name: '名称',
      brand: '品牌',
      price: '价格',
      description: '描述',
      specifications: '规格',
      reviews: '评价',
    },

    filters: {
      priceRange: '价格范围',
      rating: '评分',
      availability: '库存',
      sortBy: '排序',
    },

    actions: {
      addToCart: '加入购物车',
      buyNow: '立即购买',
      saveForLater: '稍后购买',
      share: '分享',
    },

    cart: {
      total: '总计',
      checkout: '结账',
      continue: '继续购物',
    },
  },

  // INJURY TRACKER (21 keys)
  injuryTracker: {
    title: '伤病记录',
    log: '记录',
    history: '历史',
    prevention: '预防',

    log: {
      type: '类型',
      severity: '严重程度',
      date: '日期',
      description: '描述',
      treatment: '治疗方案',
      recovery: '恢复时间',
    },

    severity: {
      minor: '轻微',
      moderate: '中度',
      severe: '严重',
    },

    types: {
      muscle: '肌肉',
      joint: '关节',
      tendon: '肌腱',
      ligament: '韧带',
      other: '其他',
    },

    status: {
      active: '当前',
      recovering: '恢复中',
      healed: '已痊愈',
    },

    actions: {
      logInjury: '记录伤病',
      updateStatus: '更新状态',
      viewHistory: '查看历史',
    },
  },

  // TRAINING PLANS (20 keys)
  trainingPlans: {
    title: '训练计划',
    myPlans: '我的计划',
    templates: '模板',
    create: '创建计划',

    plan: {
      name: '名称',
      goal: '目标',
      duration: '时长',
      difficulty: '难度',
      schedule: '日程',
    },

    difficulty: {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      professional: '专业',
    },

    workout: {
      name: '训练名称',
      type: '类型',
      duration: '时长',
      intensity: '强度',
      notes: '备注',
    },

    actions: {
      start: '开始',
      pause: '暂停',
      complete: '完成',
      skip: '跳过',
    },
  },

  // NUTRITION TRACKING (19 keys)
  nutritionTracking: {
    title: '营养追踪',
    diary: '饮食日记',
    goals: '目标',
    insights: '洞察',

    meal: {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snacks: '零食',
    },

    nutrients: {
      calories: '卡路里',
      protein: '蛋白质',
      carbs: '碳水化合物',
      fats: '脂肪',
      water: '水分',
    },

    goals: {
      daily: '每日目标',
      weekly: '每周目标',
      custom: '自定义',
    },

    actions: {
      logMeal: '记录餐食',
      trackWater: '记录饮水',
      viewProgress: '查看进度',
    },
  },

  // VIDEO ANALYSIS (18 keys)
  videoAnalysis: {
    title: '视频分析',
    upload: '上传',
    myVideos: '我的视频',
    analyze: '分析',

    upload: {
      title: '上传视频',
      selectVideo: '选择视频',
      addNotes: '添加备注',
      tag: '标签',
    },

    analysis: {
      technique: '技术',
      form: '姿势',
      footwork: '步法',
      strategy: '策略',
    },

    tools: {
      slowMotion: '慢动作',
      drawingTools: '绘图工具',
      comparison: '对比',
      annotations: '标注',
    },

    actions: {
      analyze: '分析',
      share: '分享',
      download: '下载',
    },
  },

  // CLUB POLICIES (17 keys)
  clubPolicies: {
    title: '俱乐部政策',
    overview: '概览',
    rules: '规则',
    guidelines: '指南',

    sections: {
      membership: '会员制度',
      conduct: '行为准则',
      facilities: '设施使用',
      events: '活动规定',
      payments: '付款政策',
    },

    membership: {
      requirements: '要求',
      benefits: '权益',
      responsibilities: '责任',
    },

    conduct: {
      onCourt: '场上行为',
      offCourt: '场外行为',
      disputes: '争议处理',
    },

    actions: {
      viewFull: '查看完整版',
      download: '下载',
      accept: '接受',
    },
  },

  // MEMBER DIRECTORY (16 keys)
  memberDirectory: {
    title: '会员名录',
    search: '搜索',
    filters: '筛选',

    member: {
      name: '姓名',
      skillLevel: '技术等级',
      joinDate: '加入日期',
      status: '状态',
    },

    filters: {
      skillLevel: '技术等级',
      status: '状态',
      location: '位置',
      availability: '可用性',
    },

    actions: {
      viewProfile: '查看资料',
      message: '发送消息',
      inviteToMatch: '邀请比赛',
    },

    status: {
      active: '活跃',
      inactive: '不活跃',
    },
  },

  // WEATHER ALERTS (15 keys)
  weatherAlerts: {
    title: '天气预警',
    current: '当前',
    forecast: '预报',
    alerts: '预警',

    conditions: {
      sunny: '晴',
      cloudy: '多云',
      rainy: '雨',
      stormy: '暴风雨',
      hot: '高温',
      cold: '低温',
    },

    alerts: {
      rain: '降雨预警',
      heat: '高温预警',
      storm: '暴风雨预警',
    },

    actions: {
      viewForecast: '查看预报',
      setAlerts: '设置预警',
    },
  },

  // SOCIAL FEED (14 keys)
  socialFeed: {
    title: '动态',
    feed: '动态流',
    post: '发布',

    post: {
      create: '发布动态',
      photo: '照片',
      video: '视频',
      text: '文字',
      location: '位置',
    },

    actions: {
      like: '点赞',
      comment: '评论',
      share: '分享',
      report: '举报',
    },

    interactions: {
      likes: '点赞',
      comments: '评论',
      shares: '分享',
    },
  },

  // MATCH HISTORY (13 keys)
  matchHistory: {
    title: '比赛历史',
    recent: '最近',
    all: '全部',

    match: {
      opponent: '对手',
      score: '比分',
      date: '日期',
      location: '地点',
      result: '结果',
    },

    results: {
      won: '胜',
      lost: '负',
      draw: '平',
    },

    actions: {
      viewDetails: '查看详情',
      rematch: '再战',
    },
  },

  // PRACTICE SESSIONS (12 keys)
  practiceSessions: {
    title: '练习',
    upcoming: '即将进行',
    history: '历史记录',

    session: {
      type: '类型',
      duration: '时长',
      focus: '重点',
      notes: '备注',
    },

    types: {
      drills: '训练',
      sparring: '对练',
      solo: '单独',
    },

    actions: {
      schedule: '安排',
      complete: '完成',
    },
  },

  // REFERRAL SYSTEM (11 keys)
  referralSystem: {
    title: '推荐系统',
    myCode: '我的推荐码',
    referred: '已推荐',
    rewards: '奖励',

    code: {
      share: '分享推荐码',
      copy: '复制',
      sent: '已发送',
    },

    rewards: {
      earned: '已获得',
      pending: '待获得',
      total: '总计',
    },

    actions: {
      invite: '邀请',
      redeem: '兑换',
    },
  },
};

// Apply translations
const updatedZh = deepMerge(zhData, translations);

// Save
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZh, null, 2), 'utf8');

console.log('\n✅ Successfully applied comprehensive Chinese translations!');
console.log(`📝 Updated file: ${ZH_PATH}`);

// Re-check remaining untranslated
const remainingUntranslated = findUntranslated(enData, updatedZh);
console.log(`\n📊 Remaining untranslated keys: ${remainingUntranslated.length}`);

if (remainingUntranslated.length > 0) {
  console.log('\nTop remaining sections:');
  const remainingSections = {};
  remainingUntranslated.forEach(item => {
    const section = item.path.split('.')[0];
    remainingSections[section] = (remainingSections[section] || 0) + 1;
  });

  Object.entries(remainingSections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([section, count]) => {
      console.log(`- ${section}: ${count} keys`);
    });
}
