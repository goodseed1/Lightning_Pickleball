#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ZH_PATH = path.join(__dirname, '../src/locales/zh.json');

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

function countUntranslated(enObj, zhObj, path = '') {
  let count = 0;
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
      count += countUntranslated(enObj[key], zhObj[key] || {}, currentPath);
    } else {
      if (!zhObj[key] || zhObj[key] === enObj[key]) {
        count++;
      }
    }
  }
  return count;
}

const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const zhData = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

console.log('Before translation:', countUntranslated(enData, zhData), 'untranslated keys');

const zhTranslations = {
  createEvent: {
    title: '创建活动',
    selectType: '选择类型',
    eventDetails: '活动详情',
    eventName: '活动名称',
    description: '描述',
    date: '日期',
    time: '时间',
    location: '地点',
    maxParticipants: '最大参与人数',
    skillLevel: '技能等级',
    eventType: '活动类型',
    visibility: '可见性',
    public: '公开',
    private: '私密',
    friendsOnly: '仅好友',
    create: '创建',
    cancel: '取消',
    selectLocation: '选择地点',
    selectDate: '选择日期',
    selectTime: '选择时间',
    enterName: '输入活动名称',
    enterDescription: '输入描述',
    optional: '（可选）',
    required: '（必填）',
    courtInfo: '球场信息',
    numberOfCourts: '球场数量',
    courtType: '球场类型',
    indoor: '室内',
    outdoor: '室外',
    surface: '场地类型',
    hard: '硬地',
    clay: '红土',
    grass: '草地',
    fees: '费用',
    entryFee: '报名费',
    free: '免费',
    paid: '付费',
    amount: '金额',
    rules: '规则',
    additionalInfo: '附加信息',
    contact: '联系方式',
    notes: '备注',
    photos: '照片',
    addPhoto: '添加照片',
    preview: '预览',
    publish: '发布',
    save: '保存',
    edit: '编辑',
    delete: '删除',
    errors: {
      nameRequired: '活动名称为必填项',
      dateRequired: '日期为必填项',
      timeRequired: '时间为必填项',
      locationRequired: '地点为必填项',
      invalidDate: '无效的日期',
      pastDate: '日期不能为过去',
      maxParticipantsInvalid: '参与人数必须大于0',
      createFailed: '创建活动失败',
      updateFailed: '更新活动失败',
    },
    success: {
      created: '活动创建成功！',
      updated: '活动更新成功！',
      deleted: '活动删除成功！',
    },
  },

  admin: {
    title: '管理员',
    dashboard: '控制台',
    users: '用户管理',
    clubs: '俱乐部管理',
    events: '活动管理',
    matches: '比赛管理',
    reports: '报告',
    settings: '设置',
    statistics: '统计',
    overview: '概览',
    totalUsers: '总用户数',
    activeUsers: '活跃用户',
    totalClubs: '总俱乐部数',
    totalMatches: '总比赛数',
    userManagement: {
      title: '用户管理',
      searchUsers: '搜索用户',
      filterBy: '筛选',
      all: '全部',
      active: '活跃',
      inactive: '不活跃',
      suspended: '已暂停',
      actions: '操作',
      viewProfile: '查看资料',
      suspend: '暂停',
      activate: '激活',
      delete: '删除',
      resetPassword: '重置密码',
    },
    clubManagement: {
      title: '俱乐部管理',
      searchClubs: '搜索俱乐部',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      approve: '批准',
      reject: '拒绝',
      viewDetails: '查看详情',
    },
    reports: {
      title: '报告',
      userReports: '用户报告',
      contentReports: '内容报告',
      pending: '待处理',
      resolved: '已解决',
      review: '审核',
      markResolved: '标记为已解决',
    },
  },

  badgeGallery: {
    title: '徽章库',
    myBadges: '我的徽章',
    allBadges: '所有徽章',
    earned: '已获得',
    locked: '未解锁',
    progress: '进度',
    earnedOn: '获得于',
    howToEarn: '如何获得',
    rarity: '稀有度',
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传奇',
    categories: {
      achievements: '成就',
      participation: '参与',
      skills: '技能',
      social: '社交',
      special: '特殊',
    },
    filters: {
      all: '全部',
      earned: '已获得',
      notEarned: '未获得',
      byCategory: '按类别',
    },
  },

  myActivities: {
    title: '我的活动',
    upcoming: '即将举行',
    ongoing: '进行中',
    past: '过去',
    all: '全部',
    registered: '已注册',
    participated: '已参与',
    hosted: '我主办的',
    filters: {
      all: '全部',
      matches: '比赛',
      events: '活动',
      leagues: '联赛',
      tournaments: '锦标赛',
    },
    emptyStates: {
      noUpcoming: '暂无即将举行的活动',
      noPast: '暂无过去的活动',
      noHosted: '暂无主办的活动',
      description: '探索并加入活动以开始您的网球之旅！',
    },
    actions: {
      viewDetails: '查看详情',
      cancel: '取消',
      leave: '离开',
      rate: '评分',
      share: '分享',
    },
  },

  aiMatching: {
    title: 'AI智能匹配',
    findMatch: '寻找对手',
    searching: '搜索中...',
    found: '找到匹配',
    noMatchesFound: '未找到匹配',
    filters: {
      skillLevel: '技能等级',
      distance: '距离',
      availability: '可用时间',
      playStyle: '打法风格',
    },
    matchScore: '匹配度',
    compatibility: '兼容性',
    reasons: {
      similarLevel: '技能等级相近',
      nearbyLocation: '位置接近',
      scheduleMatch: '时间相符',
      playStyleMatch: '打法相似',
    },
    actions: {
      sendRequest: '发送请求',
      viewProfile: '查看资料',
      skip: '跳过',
      refresh: '刷新',
    },
  },

  editProfile: {
    title: '编辑资料',
    basicInfo: '基本信息',
    name: '姓名',
    displayName: '显示名称',
    email: '电子邮件',
    phone: '电话',
    bio: '个人简介',
    dateOfBirth: '出生日期',
    gender: '性别',
    male: '男',
    female: '女',
    other: '其他',
    preferNotToSay: '不愿透露',
    tennisInfo: '网球信息',
    skillLevel: '技能等级',
    playingStyle: '打法风格',
    preferredHand: '惯用手',
    rightHanded: '右手',
    leftHanded: '左手',
    yearsPlaying: '球龄',
    location: {
      title: '位置',
      current: '当前位置',
      change: '更改位置',
      setDefault: '设为默认',
    },
    preferences: {
      title: '偏好设置',
      notifications: '通知',
      privacy: '隐私',
      language: '语言',
    },
    photos: {
      title: '照片',
      profile: '头像',
      cover: '封面照片',
      change: '更改照片',
      remove: '移除',
    },
    actions: {
      save: '保存',
      cancel: '取消',
      discard: '放弃更改',
      delete: '删除账户',
    },
    errors: {
      nameRequired: '姓名为必填项',
      invalidEmail: '无效的电子邮件地址',
      invalidPhone: '无效的电话号码',
      updateFailed: '更新失败',
      photoUploadFailed: '照片上传失败',
    },
    success: {
      updated: '资料更新成功！',
      photoUploaded: '照片上传成功！',
    },
  },

  eventCard: {
    date: '日期',
    time: '时间',
    location: '地点',
    host: '主办方',
    participants: '参与者',
    maxParticipants: '最大人数',
    spotsLeft: '剩余名额',
    full: '已满',
    skillLevel: '技能等级',
    status: {
      upcoming: '即将举行',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },
    actions: {
      join: '加入',
      leave: '离开',
      viewDetails: '查看详情',
      share: '分享',
      edit: '编辑',
      cancel: '取消活动',
    },
    labels: {
      free: '免费',
      paid: '付费',
      membersOnly: '仅会员',
      public: '公开',
      private: '私密',
    },
  },

  matches: {
    title: '比赛',
    myMatches: '我的比赛',
    upcoming: '即将进行',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待定',
    confirmed: '已确认',
    disputed: '有争议',
    filters: {
      all: '全部',
      singles: '单打',
      doubles: '双打',
      league: '联赛',
      tournament: '锦标赛',
      practice: '练习赛',
    },
    emptyStates: {
      noUpcoming: '暂无即将进行的比赛',
      noCompleted: '暂无已完成的比赛',
      noCancelled: '暂无已取消的比赛',
      description: '寻找对手开始您的第一场比赛！',
    },
    actions: {
      viewDetails: '查看详情',
      submitScore: '提交比分',
      confirmScore: '确认比分',
      dispute: '提出异议',
      reschedule: '重新安排',
      cancel: '取消',
      rate: '评分',
    },
    stats: {
      wins: '胜',
      losses: '负',
      winRate: '胜率',
      totalMatches: '总比赛数',
      currentStreak: '当前连胜',
      bestStreak: '最佳连胜',
    },
  },

  performanceDashboard: {
    title: '表现面板',
    overview: '概览',
    stats: '统计',
    trends: '趋势',
    insights: '洞察',
    analysis: '分析',
    recent: {
      title: '最近表现',
      last7Days: '最近7天',
      last30Days: '最近30天',
      last3Months: '最近3个月',
    },
    metrics: {
      winRate: '胜率',
      totalMatches: '总比赛数',
      hoursPlayed: '打球时长',
      skillLevel: '技能等级',
      ranking: '排名',
      improvement: '进步',
    },
    charts: {
      winLoss: '胜负图表',
      skillProgress: '技能进步',
      activity: '活动统计',
      matchHistory: '比赛历史',
    },
    insights: {
      title: '智能洞察',
      strengths: '优势',
      weaknesses: '待改进',
      recommendations: '建议',
      goals: '目标',
    },
    compare: {
      title: '对比',
      withPeers: '与同级别球员',
      withSelf: '与历史表现',
      period: '时间段',
    },
  },
};

const updatedZhData = deepMerge(zhData, zhTranslations);
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZhData, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(enData, updatedZhData);
const translated = countUntranslated(enData, zhData) - afterCount;

console.log('✅ Translation Round 4 complete!');
console.log(`📊 Translated ${translated} keys`);
console.log(`📋 Remaining untranslated: ${afterCount} keys`);
