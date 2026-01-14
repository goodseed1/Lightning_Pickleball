const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

const chineseTranslations = {
  // badgeGallery (34 keys)
  badgeGallery: {
    title: '徽章画廊',
    myBadges: '我的徽章',
    allBadges: '所有徽章',
    locked: '未解锁',
    unlocked: '已解锁',
    earnedOn: '获得于',
    progress: '进度',
    rarity: {
      common: '普通',
      uncommon: '罕见',
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇',
    },
    categories: {
      matches: '比赛',
      achievements: '成就',
      social: '社交',
      clubs: '俱乐部',
      events: '活动',
      special: '特殊',
    },
    stats: {
      total: '总计',
      earned: '已获得',
      remaining: '剩余',
      completion: '完成度',
    },
    actions: {
      viewAll: '查看全部',
      share: '分享',
      equip: '装备',
      unequip: '卸下',
    },
    details: {
      name: '名称',
      description: '描述',
      requirement: '要求',
      reward: '奖励',
      rarity: '稀有度',
      progress: '进度',
    },
    filters: {
      all: '全部',
      earned: '已获得',
      locked: '未解锁',
      category: '类别',
      rarity: '稀有度',
    },
  },

  // leagues (33 keys)
  leagues: {
    title: '联赛',
    myLeagues: '我的联赛',
    allLeagues: '所有联赛',
    standings: '排名',
    schedule: '赛程',
    joinLeague: '加入联赛',
    leaveLeague: '离开联赛',
    info: {
      format: '格式',
      duration: '时长',
      participants: '参与者',
      startDate: '开始日期',
      endDate: '结束日期',
      registration: '报名',
      fee: '费用',
      prizes: '奖品',
    },
    standings: {
      rank: '排名',
      player: '选手',
      wins: '胜',
      losses: '负',
      points: '积分',
      sets: '盘数',
      games: '局数',
    },
    status: {
      upcoming: '即将开始',
      active: '进行中',
      completed: '已结束',
      registration: '报名中',
    },
    actions: {
      register: '注册',
      withdraw: '退出',
      viewDetails: '查看详情',
      viewSchedule: '查看赛程',
      viewStandings: '查看排名',
    },
  },

  // auth (31 keys)
  auth: {
    signIn: '登录',
    signUp: '注册',
    signOut: '登出',
    email: '电子邮件',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码',
    resetPassword: '重置密码',
    createAccount: '创建账户',
    haveAccount: '已有账户？',
    noAccount: '还没有账户？',
    signInWithGoogle: '使用Google登录',
    signInWithApple: '使用Apple登录',
    signInWithFacebook: '使用Facebook登录',
    or: '或',
    termsAndConditions: '条款和条件',
    privacyPolicy: '隐私政策',
    agreeToTerms: '我同意',
    validation: {
      emailRequired: '请输入电子邮件',
      emailInvalid: '电子邮件格式无效',
      passwordRequired: '请输入密码',
      passwordTooShort: '密码过短',
      passwordsNoMatch: '密码不匹配',
    },
    errors: {
      invalidCredentials: '电子邮件或密码无效',
      emailExists: '此电子邮件已被使用',
      weakPassword: '密码过于简单',
      tooManyRequests: '请求过多，请稍后再试',
      networkError: '网络错误',
    },
    success: {
      signedIn: '登录成功',
      signedUp: '注册成功',
      passwordReset: '密码已重置',
    },
  },

  // scoreConfirmation (29 keys)
  scoreConfirmation: {
    title: '确认比分',
    matchDetails: '比赛详情',
    score: '比分',
    winner: '获胜者',
    loser: '失败者',
    sets: '盘',
    games: '局',
    tiebreak: '抢七',
    enterScore: '输入比分',
    confirmScore: '确认比分',
    disputeScore: '质疑比分',
    waitingForConfirmation: '等待确认',
    confirmed: '已确认',
    disputed: '有争议',
    set1: '第一盘',
    set2: '第二盘',
    set3: '第三盘',
    actions: {
      confirm: '确认',
      dispute: '质疑',
      edit: '编辑',
      cancel: '取消',
      submit: '提交',
    },
    validation: {
      invalidScore: '比分无效',
      incompleteScore: '比分不完整',
      selectWinner: '请选择获胜者',
    },
    success: {
      scoreConfirmed: '比分已确认',
      scoreSubmitted: '比分已提交',
    },
    error: {
      confirmFailed: '确认失败',
      disputeFailed: '质疑失败',
    },
    dispute: {
      reason: '原因',
      description: '描述',
      submit: '提交质疑',
    },
  },

  // meetupDetail (28 keys)
  meetupDetail: {
    title: '聚会详情',
    overview: '概览',
    participants: '参与者',
    location: '位置',
    discussion: '讨论',
    details: {
      date: '日期',
      time: '时间',
      duration: '时长',
      organizer: '组织者',
      skillLevel: '技能等级',
      maxParticipants: '最大参与人数',
      fee: '费用',
      status: '状态',
    },
    participants: {
      going: '参加',
      interested: '感兴趣',
      invited: '已邀请',
      maybe: '可能',
    },
    actions: {
      join: '加入',
      leave: '离开',
      invite: '邀请',
      share: '分享',
      directions: '路线',
      cancel: '取消',
      edit: '编辑',
      message: '发送消息',
    },
    status: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已结束',
      cancelled: '已取消',
    },
  },

  // clubPoliciesScreen (28 keys)
  clubPoliciesScreen: {
    title: '俱乐部政策',
    rules: '规则',
    codeOfConduct: '行为准则',
    membershipPolicy: '会员政策',
    courtPolicy: '球场政策',
    cancellationPolicy: '取消政策',
    refundPolicy: '退款政策',
    guestPolicy: '访客政策',
    childrenPolicy: '儿童政策',
    dresscode: '着装要求',
    safetyRules: '安全规则',
    weatherPolicy: '天气政策',
    disputeResolution: '争议解决',
    sections: {
      general: '总则',
      membership: '会员资格',
      facilities: '设施',
      events: '活动',
      conduct: '行为',
      safety: '安全',
    },
    actions: {
      view: '查看',
      download: '下载',
      print: '打印',
      agree: '同意',
      disagree: '不同意',
    },
    lastUpdated: '最后更新',
    version: '版本',
    effectiveDate: '生效日期',
    contact: '如有疑问，请联系',
    acknowledgement: '我已阅读并理解这些政策',
  },

  // schedules (27 keys)
  schedules: {
    title: '时间表',
    mySchedule: '我的时间表',
    clubSchedule: '俱乐部时间表',
    upcoming: '即将进行',
    today: '今天',
    thisWeek: '本周',
    thisMonth: '本月',
    filters: {
      all: '全部',
      matches: '比赛',
      events: '活动',
      practices: '训练',
      meetings: '会议',
    },
    view: {
      day: '日',
      week: '周',
      month: '月',
      list: '列表',
    },
    actions: {
      add: '添加',
      edit: '编辑',
      delete: '删除',
      export: '导出',
      sync: '同步',
      refresh: '刷新',
    },
    empty: {
      noEvents: '暂无活动',
      selectDate: '选择日期查看活动',
    },
    sync: {
      google: 'Google日历',
      apple: 'Apple日历',
      outlook: 'Outlook',
    },
  },

  // findClubScreen (26 keys)
  findClubScreen: {
    title: '查找俱乐部',
    search: '搜索俱乐部',
    nearby: '附近',
    recommended: '推荐',
    all: '全部',
    filters: {
      distance: '距离',
      memberCount: '成员数',
      courtType: '球场类型',
      amenities: '设施',
      membership: '会员类型',
      apply: '应用',
      clear: '清除',
    },
    sort: {
      distance: '距离',
      rating: '评分',
      members: '成员数',
      newest: '最新',
    },
    clubCard: {
      members: '成员',
      courts: '球场',
      distance: '距离',
      rating: '评分',
      view: '查看',
      join: '加入',
    },
    empty: {
      noClubs: '未找到俱乐部',
      tryAdjusting: '尝试调整筛选条件',
      expandSearch: '扩大搜索范围',
    },
  },

  // matchRequest (25 keys)
  matchRequest: {
    title: '比赛邀请',
    from: '来自',
    to: '发送至',
    matchDetails: '比赛详情',
    date: '日期',
    time: '时间',
    location: '位置',
    matchType: '比赛类型',
    message: '消息',
    status: {
      pending: '待定',
      accepted: '已接受',
      declined: '已拒绝',
      expired: '已过期',
      cancelled: '已取消',
    },
    actions: {
      accept: '接受',
      decline: '拒绝',
      propose: '提议',
      cancel: '取消',
      send: '发送',
    },
    validation: {
      selectOpponent: '请选择对手',
      selectDate: '请选择日期',
      selectTime: '请选择时间',
      selectLocation: '请选择位置',
    },
    success: {
      sent: '邀请已发送',
      accepted: '邀请已接受',
      declined: '邀请已拒绝',
    },
  },

  // clubList (23 keys)
  clubList: {
    title: '俱乐部',
    myClubs: '我的俱乐部',
    allClubs: '所有俱乐部',
    nearby: '附近',
    search: '搜索',
    filters: '筛选',
    sort: '排序',
    clubCard: {
      members: '成员',
      courts: '球场',
      events: '活动',
      view: '查看',
      join: '加入',
      leave: '离开',
    },
    empty: {
      noClubs: '未找到俱乐部',
      createFirst: '创建第一个俱乐部',
      joinClub: '加入俱乐部',
    },
    actions: {
      create: '创建',
      search: '搜索',
      filter: '筛选',
      refresh: '刷新',
    },
  },

  // policyEditScreen (23 keys)
  policyEditScreen: {
    title: '编辑政策',
    policyName: '政策名称',
    content: '内容',
    effectiveDate: '生效日期',
    version: '版本',
    category: '类别',
    status: '状态',
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
    actions: {
      save: '保存',
      publish: '发布',
      archive: '归档',
      delete: '删除',
      cancel: '取消',
      preview: '预览',
    },
    validation: {
      nameRequired: '请输入政策名称',
      contentRequired: '请输入内容',
      dateRequired: '请选择生效日期',
    },
    success: {
      saved: '政策已保存',
      published: '政策已发布',
      deleted: '政策已删除',
    },
  },

  // feedCard (21 keys)
  feedCard: {
    likeCount: '赞',
    commentCount: '评论',
    shareCount: '分享',
    like: '赞',
    unlike: '取消赞',
    comment: '评论',
    share: '分享',
    report: '报告',
    delete: '删除',
    edit: '编辑',
    viewComments: '查看评论',
    hideComments: '隐藏评论',
    viewPost: '查看帖子',
    timeAgo: {
      justNow: '刚刚',
      minutesAgo: '{minutes}分钟前',
      hoursAgo: '{hours}小时前',
      daysAgo: '{days}天前',
      weeksAgo: '{weeks}周前',
      monthsAgo: '{months}月前',
      yearsAgo: '{years}年前',
    },
  },

  // clubCommunication (19 keys)
  clubCommunication: {
    title: '俱乐部沟通',
    announcements: '公告',
    messages: '消息',
    chat: '聊天',
    newAnnouncement: '新公告',
    newMessage: '新消息',
    sendMessage: '发送消息',
    recipients: '收件人',
    subject: '主题',
    message: '消息',
    attachments: '附件',
    send: '发送',
    cancel: '取消',
    draft: '草稿',
    sent: '已发送',
    received: '已接收',
    actions: {
      compose: '撰写',
      reply: '回复',
      forward: '转发',
      delete: '删除',
    },
  },

  // eventParticipation (18 keys)
  eventParticipation: {
    title: '活动参与',
    participants: '参与者',
    going: '参加',
    interested: '感兴趣',
    maybe: '可能',
    notGoing: '不参加',
    invited: '已邀请',
    waitlist: '候补',
    status: '状态',
    rsvp: 'RSVP',
    actions: {
      join: '加入',
      leave: '离开',
      invite: '邀请',
      checkIn: '签到',
      viewAll: '查看全部',
    },
    empty: {
      noParticipants: '暂无参与者',
      beFirst: '成为第一个',
    },
  },

  // contexts (16 keys)
  contexts: {
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    noData: '暂无数据',
    unauthorized: '未授权',
    forbidden: '禁止',
    notFound: '未找到',
    serverError: '服务器错误',
    networkError: '网络错误',
    unknownError: '未知错误',
    success: '成功',
    failed: '失败',
    cancelled: '已取消',
    timeout: '超时',
    offline: '离线',
    online: '在线',
  },

  // aiChat (15 keys)
  aiChat: {
    title: 'AI助手',
    placeholder: '输入消息...',
    send: '发送',
    clear: '清除',
    newChat: '新聊天',
    suggestions: '建议',
    typing: '正在输入...',
    error: '发生错误',
    retry: '重试',
    copy: '复制',
    copySuccess: '已复制',
    empty: {
      title: '与AI助手聊天',
      subtitle: '询问有关网球、比赛或俱乐部的任何问题',
    },
  },

  // developerTools (13 keys)
  developerTools: {
    title: '开发者工具',
    clearCache: '清除缓存',
    resetData: '重置数据',
    testNotifications: '测试通知',
    viewLogs: '查看日志',
    exportData: '导出数据',
    importData: '导入数据',
    debugMode: '调试模式',
    version: '版本',
    buildNumber: '版本号',
    environment: '环境',
    apiEndpoint: 'API端点',
    deviceInfo: '设备信息',
  },

  // recordScore (13 keys)
  recordScore: {
    title: '记录比分',
    winner: '获胜者',
    loser: '失败者',
    score: '比分',
    sets: '盘',
    games: '局',
    tiebreak: '抢七',
    matchType: '比赛类型',
    submit: '提交',
    cancel: '取消',
    validation: {
      invalidScore: '比分无效',
      selectWinner: '请选择获胜者',
    },
  },

  // clubDetailScreen (13 keys)
  clubDetailScreen: {
    title: '俱乐部详情',
    overview: '概览',
    members: '成员',
    events: '活动',
    facilities: '设施',
    policies: '政策',
    join: '加入',
    leave: '离开',
    message: '发送消息',
    share: '分享',
    report: '报告',
    loading: '加载中...',
    error: '加载失败',
  },

  // terms (12 keys)
  terms: {
    title: '条款和条件',
    accept: '接受',
    decline: '拒绝',
    lastUpdated: '最后更新',
    effectiveDate: '生效日期',
    sections: {
      introduction: '介绍',
      userAgreement: '用户协议',
      privacyPolicy: '隐私政策',
      dataUsage: '数据使用',
      liability: '责任',
      termination: '终止',
    },
  },

  // league (12 keys)
  league: {
    title: '联赛',
    join: '加入',
    leave: '离开',
    standings: '排名',
    schedule: '赛程',
    myMatches: '我的比赛',
    info: '信息',
    participants: '参与者',
    rules: '规则',
    prizes: '奖品',
    status: '状态',
    loading: '加载中...',
  },

  // mapAppSelector (10 keys)
  mapAppSelector: {
    title: '选择地图应用',
    appleMaps: 'Apple地图',
    googleMaps: 'Google地图',
    waze: 'Waze',
    other: '其他',
    setDefault: '设为默认',
    cancel: '取消',
    notInstalled: '未安装',
    openIn: '打开于',
    getDirections: '获取路线',
  },

  // ntrpSelector (10 keys)
  ntrpSelector: {
    title: '选择LPR等级',
    beginner: '初学者',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家',
    professional: '职业',
    select: '选择',
    cancel: '取消',
    description: '描述',
    recommended: '推荐',
  },

  // tournamentDetail (5 keys)
  tournamentDetail: {
    overview: '概览',
    bpaddle: '对阵图',
    participants: '参与者',
    schedule: '赛程',
    rules: '规则',
  },

  // participantSelector (5 keys)
  participantSelector: {
    title: '选择参与者',
    search: '搜索',
    selected: '已选择',
    confirm: '确认',
    cancel: '取消',
  },

  // tournament (5 keys)
  tournament: {
    title: '锦标赛',
    register: '注册',
    withdraw: '退出',
    viewBpaddle: '查看对阵图',
    viewDetails: '查看详情',
  },

  // createModal (2 keys)
  createModal: {
    title: '创建',
    cancel: '取消',
  },

  // clubHallOfFame (2 keys)
  clubHallOfFame: {
    title: '名人堂',
    inductees: '入选者',
  },

  // myProfile (1 key)
  myProfile: {
    title: '我的个人资料',
  },

  // matchDetail (1 key)
  matchDetail: {
    title: '比赛详情',
  },
};

const zhPath = path.join(__dirname, '..', 'src', 'locales', 'zh.json');
const existingZh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
const updatedZh = deepMerge(existingZh, chineseTranslations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Final Chinese translations completed!');
console.log('📊 All remaining sections translated');
console.log('🎉 Translation complete!');
