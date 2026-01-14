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
  // profile (47 keys)
  profile: {
    title: '个人资料',
    edit: '编辑个人资料',
    view: '查看个人资料',
    myProfile: '我的个人资料',
    overview: '概览',
    stats: '统计',
    matches: '比赛',
    achievements: '成就',
    activity: '活动',
    friends: '好友',
    clubs: '俱乐部',
    info: {
      name: '姓名',
      username: '用户名',
      email: '电子邮件',
      phone: '电话',
      location: '位置',
      joined: '加入于',
      memberSince: '会员始于',
      bio: '简介',
      website: '网站',
      socialMedia: '社交媒体',
    },
    tennisInfo: {
      skillLevel: '技能等级',
      ltrRating: 'LTR评级',
      playingSince: '打球年限',
      playingStyle: '打球风格',
      favoriteShot: '最喜欢的击球',
      handedness: '惯用手',
      availability: '空闲时间',
      lookingFor: '寻找',
      goals: '目标',
    },
    stats: {
      matchesPlayed: '已进行比赛',
      matchesWon: '已获胜',
      winRate: '胜率',
      currentStreak: '当前连胜',
      longestStreak: '最长连胜',
      totalHours: '总时长',
      clubsJoined: '已加入俱乐部',
      friendsCount: '好友数',
      achievementsEarned: '已获得成就',
    },
    actions: {
      message: '发送消息',
      challenge: '发起挑战',
      addFriend: '添加好友',
      removeFriend: '删除好友',
      block: '屏蔽',
      unblock: '取消屏蔽',
      report: '报告',
      share: '分享',
      follow: '关注',
      unfollow: '取消关注',
    },
    privacy: {
      public: '公开',
      friends: '好友',
      private: '私密',
    },
  },

  // eventCard (47 keys)
  eventCard: {
    viewDetails: '查看详情',
    register: '注册',
    cancel: '取消',
    share: '分享',
    date: '日期',
    time: '时间',
    location: '位置',
    organizer: '组织者',
    participants: '参与者',
    spotsLeft: '剩余名额',
    full: '已满',
    waitlist: '候补',
    free: '免费',
    fee: '费用',
    skillLevel: '技能等级',
    type: '类型',
    status: '状态',
    types: {
      match: '比赛',
      practice: '训练',
      clinic: '培训班',
      social: '社交',
      tournament: '锦标赛',
      league: '联赛',
      meetup: '聚会',
      other: '其他',
    },
    status: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已结束',
      cancelled: '已取消',
      postponed: '已延期',
      full: '已满',
      registration: '报名中',
    },
    labels: {
      hot: '热门',
      new: '新',
      featured: '精选',
      recommended: '推荐',
      nearby: '附近',
      lastChance: '最后机会',
      almostFull: '即将满员',
    },
    actions: {
      join: '加入',
      leave: '离开',
      interested: '感兴趣',
      going: '参加',
      maybe: '可能',
      invite: '邀请',
      reminder: '设置提醒',
    },
    participants: {
      going: '参加',
      interested: '感兴趣',
      invited: '已邀请',
      waiting: '候补',
    },
  },

  // createMeetup (47 keys)
  createMeetup: {
    title: '创建聚会',
    edit: '编辑聚会',
    basicInfo: '基本信息',
    details: '详情',
    settings: '设置',
    form: {
      title: '标题',
      description: '描述',
      date: '日期',
      time: '时间',
      duration: '时长',
      location: '位置',
      venue: '场地',
      address: '地址',
      skillLevel: '技能等级',
      maxParticipants: '最大参与人数',
      fee: '费用',
      visibility: '可见性',
      tags: '标签',
      notes: '备注',
    },
    location: {
      searchVenue: '搜索场地',
      useCurrentLocation: '使用当前位置',
      selectOnMap: '在地图上选择',
      addCustomLocation: '添加自定义位置',
    },
    visibility: {
      public: '公开',
      private: '私密',
      friendsOnly: '仅好友',
      clubMembers: '俱乐部成员',
      inviteOnly: '仅邀请',
    },
    invites: {
      title: '邀请',
      selectFriends: '选择好友',
      selectClubs: '选择俱乐部',
      inviteAll: '邀请全部',
      sendInvites: '发送邀请',
      inviteLater: '稍后邀请',
    },
    recurrence: {
      once: '一次',
      weekly: '每周',
      biweekly: '每两周',
      monthly: '每月',
      custom: '自定义',
    },
    actions: {
      create: '创建',
      save: '保存',
      publish: '发布',
      saveDraft: '保存草稿',
      cancel: '取消',
      delete: '删除',
      preview: '预览',
    },
    validation: {
      titleRequired: '请输入标题',
      descriptionRequired: '请输入描述',
      dateRequired: '请选择日期',
      timeRequired: '请选择时间',
      locationRequired: '请选择位置',
      invalidDate: '日期无效',
      pastDate: '日期不能在过去',
    },
    success: {
      created: '聚会已创建',
      updated: '聚会已更新',
      deleted: '聚会已删除',
      published: '聚会已发布',
      invitesSent: '邀请已发送',
    },
  },

  // aiMatching (46 keys)
  aiMatching: {
    title: 'AI配对',
    findMatch: '寻找对手',
    preferences: '偏好',
    matching: '配对中',
    results: '结果',
    preferences: {
      matchType: '比赛类型',
      skillLevel: '技能等级',
      location: '位置',
      distance: '距离',
      availability: '空闲时间',
      playStyle: '打球风格',
      competitiveness: '竞技性',
      duration: '时长',
      venue: '场地',
    },
    matchType: {
      singles: '单打',
      doubles: '双打',
      mixed: '混合双打',
      practice: '练习',
      anyType: '任何类型',
    },
    skillLevel: {
      similar: '相似',
      higher: '更高',
      lower: '更低',
      any: '任何等级',
    },
    competitiveness: {
      casual: '休闲',
      moderate: '中等',
      competitive: '竞技',
      veryCompetitive: '非常竞技',
    },
    availability: {
      now: '现在',
      today: '今天',
      thisWeek: '本周',
      flexible: '灵活',
      custom: '自定义',
    },
    matching: {
      searching: '正在搜索对手...',
      analyzing: '正在分析兼容性...',
      foundMatches: '找到{count}个匹配',
      noMatches: '未找到匹配',
      tryAdjusting: '尝试调整您的偏好',
    },
    matchCard: {
      compatibility: '兼容性',
      distance: '距离',
      skillLevel: '技能等级',
      playStyle: '打球风格',
      availability: '空闲时间',
      matchScore: '匹配分数',
      viewProfile: '查看资料',
      challenge: '发起挑战',
      save: '保存',
    },
    actions: {
      startMatching: '开始配对',
      refine: '优化',
      viewAll: '查看全部',
      save: '保存',
      challenge: '挑战',
      message: '发送消息',
    },
  },

  // scheduleMeetup (35 keys)
  scheduleMeetup: {
    title: '安排聚会',
    selectDate: '选择日期',
    selectTime: '选择时间',
    selectLocation: '选择位置',
    inviteParticipants: '邀请参与者',
    date: '日期',
    time: '时间',
    duration: '时长',
    location: '位置',
    participants: '参与者',
    notes: '备注',
    timeSlots: {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上',
      custom: '自定义',
    },
    duration: {
      oneHour: '1小时',
      oneAndHalf: '1.5小时',
      twoHours: '2小时',
      threeHours: '3小时',
      custom: '自定义',
    },
    invites: {
      selectAll: '选择全部',
      deselectAll: '取消全部',
      friends: '好友',
      clubMembers: '俱乐部成员',
      recent: '最近',
      suggested: '建议',
    },
    actions: {
      schedule: '安排',
      cancel: '取消',
      sendInvites: '发送邀请',
      saveDraft: '保存草稿',
    },
    validation: {
      selectDate: '请选择日期',
      selectTime: '请选择时间',
      selectLocation: '请选择位置',
      selectParticipants: '请选择参与者',
      pastDateTime: '日期时间不能在过去',
    },
    success: {
      scheduled: '聚会已安排',
      invitesSent: '邀请已发送',
      updated: '聚会已更新',
    },
    error: {
      scheduleFailed: '安排聚会失败',
      inviteFailed: '发送邀请失败',
    },
  },

  // clubOverviewScreen (35 keys)
  clubOverviewScreen: {
    title: '俱乐部概览',
    about: '关于',
    members: '成员',
    events: '活动',
    facilities: '设施',
    contact: '联系',
    info: {
      description: '描述',
      founded: '成立于',
      memberCount: '成员数',
      courtCount: '球场数',
      location: '位置',
      hours: '营业时间',
      fees: '费用',
      website: '网站',
      email: '电子邮件',
      phone: '电话',
    },
    facilities: {
      courts: '球场',
      indoor: '室内',
      outdoor: '室外',
      lighting: '照明',
      parking: '停车',
      locker: '更衣室',
      shower: '淋浴',
      proShop: '专业商店',
      restaurant: '餐厅',
      lounge: '休息室',
    },
    actions: {
      join: '加入',
      leave: '离开',
      message: '发送消息',
      share: '分享',
      directions: '路线',
      bookCourt: '预订球场',
      viewEvents: '查看活动',
      viewMembers: '查看成员',
    },
    stats: {
      totalMembers: '总成员数',
      activeMembers: '活跃成员',
      upcomingEvents: '即将进行的活动',
      totalEvents: '总活动数',
    },
  },
};

const zhPath = path.join(__dirname, '..', 'src', 'locales', 'zh.json');
const existingZh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
const updatedZh = deepMerge(existingZh, chineseTranslations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Chinese translations Part 3 updated!');
console.log('📊 Sections:');
console.log('  - profile (47)');
console.log('  - eventCard (47)');
console.log('  - createMeetup (47)');
console.log('  - aiMatching (46)');
console.log('  - scheduleMeetup (35)');
console.log('  - clubOverviewScreen (35)');
