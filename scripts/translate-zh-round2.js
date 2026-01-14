#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '../src/locales/en.json');
const ZH_PATH = path.join(__dirname, '../src/locales/zh.json');

// Deep merge function
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

// Count untranslated keys
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

// Load JSON files
const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const zhData = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

console.log('Before translation:', countUntranslated(enData, zhData), 'untranslated keys');

// Comprehensive translations for Round 2
const zhTranslations = {
  services: {
    playerStats: {
      title: '球员统计',
      noData: '暂无数据',
      loading: '加载中...',
      error: '加载统计数据时出错',
      wins: '胜场',
      losses: '负场',
      winRate: '胜率',
      totalMatches: '总比赛数',
      currentStreak: '当前连胜',
      longestStreak: '最长连胜',
      averageScore: '平均得分',
      recentMatches: '最近比赛',
      performance: '表现',
    },
    notifications: {
      title: '通知',
      markAllRead: '全部标记为已读',
      noNotifications: '暂无通知',
      types: {
        matchInvite: '比赛邀请',
        friendRequest: '好友请求',
        clubInvite: '俱乐部邀请',
        matchUpdate: '比赛更新',
        achievement: '成就解锁',
      },
    },
    chat: {
      sendMessage: '发送消息',
      typeMessage: '输入消息...',
      noMessages: '暂无消息',
      loading: '加载中...',
      error: '加载消息时出错',
    },
    matching: {
      findPartner: '寻找搭档',
      searching: '搜索中...',
      noPartnersFound: '未找到搭档',
      sendRequest: '发送请求',
      cancelRequest: '取消请求',
      acceptRequest: '接受请求',
      declineRequest: '拒绝请求',
    },
  },

  duesManagement: {
    title: '会费管理',
    overview: '概览',
    payments: '付款记录',
    settings: '设置',
    members: '会员',
    statistics: '统计',

    status: {
      paid: '已付',
      pending: '待付',
      overdue: '逾期',
      exempt: '豁免',
    },

    period: {
      monthly: '月付',
      quarterly: '季付',
      yearly: '年付',
      oneTime: '一次性',
    },

    actions: {
      recordPayment: '记录付款',
      sendReminder: '发送提醒',
      editDues: '编辑会费',
      viewHistory: '查看历史',
      exportData: '导出数据',
      markPaid: '标记为已付',
      markExempt: '标记为豁免',
    },

    forms: {
      amount: '金额',
      dueDate: '到期日期',
      paymentDate: '付款日期',
      paymentMethod: '付款方式',
      notes: '备注',
      period: '周期',
      startDate: '开始日期',
      endDate: '结束日期',
    },

    paymentMethods: {
      cash: '现金',
      card: '银行卡',
      transfer: '转账',
      check: '支票',
      online: '在线支付',
    },

    messages: {
      paymentRecorded: '付款已记录',
      reminderSent: '提醒已发送',
      duesUpdated: '会费已更新',
      error: '操作失败',
      confirmDelete: '确认删除此记录？',
    },

    stats: {
      totalCollected: '总收入',
      totalPending: '待收款',
      totalOverdue: '逾期款',
      collectionRate: '收款率',
      membersPaid: '已付会员',
      membersPending: '待付会员',
      membersOverdue: '逾期会员',
    },

    filters: {
      all: '全部',
      paid: '已付',
      pending: '待付',
      overdue: '逾期',
      thisMonth: '本月',
      lastMonth: '上月',
      thisYear: '今年',
    },

    notifications: {
      reminder: '会费提醒',
      overdueNotice: '逾期通知',
      receiptSent: '收据已发送',
    },
  },

  leagueDetail: {
    title: '联赛详情',
    overview: '概览',
    standings: '积分榜',
    schedule: '赛程',
    matches: '比赛',
    teams: '队伍',
    players: '球员',
    rules: '规则',
    prizes: '奖品',

    info: {
      startDate: '开始日期',
      endDate: '结束日期',
      format: '赛制',
      level: '级别',
      participants: '参赛者',
      status: '状态',
      location: '地点',
      organizer: '组织者',
    },

    status: {
      upcoming: '即将开始',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      registration: '报名中',
    },

    formats: {
      roundRobin: '循环赛',
      knockout: '淘汰赛',
      swiss: '瑞士制',
      hybrid: '混合制',
    },

    standings: {
      rank: '排名',
      team: '队伍',
      played: '已赛',
      won: '胜',
      lost: '负',
      points: '积分',
      gamesWon: '局胜',
      gamesLost: '局负',
      gameDiff: '局差',
      form: '近况',
    },

    actions: {
      register: '报名',
      withdraw: '退出',
      viewRules: '查看规则',
      viewSchedule: '查看赛程',
      submitScore: '提交比分',
      editMatch: '编辑比赛',
    },

    messages: {
      registrationSuccess: '报名成功',
      registrationClosed: '报名已截止',
      withdrawalSuccess: '退出成功',
      scoreSubmitted: '比分已提交',
      error: '操作失败',
    },

    rules: {
      matchFormat: '比赛形式',
      scoringSystem: '计分制度',
      tiebreakRules: '抢七规则',
      substitutionRules: '替补规则',
      defaultRules: '弃权规则',
    },
  },

  clubTournamentManagement: {
    title: '锦标赛管理',
    create: '创建锦标赛',
    edit: '编辑锦标赛',
    overview: '概览',
    participants: '参赛者',
    bpaddles: '对阵表',
    schedule: '赛程',
    results: '结果',

    form: {
      name: '锦标赛名称',
      description: '描述',
      startDate: '开始日期',
      endDate: '结束日期',
      registrationDeadline: '报名截止',
      format: '赛制',
      level: '级别',
      maxParticipants: '最大参赛人数',
      entryFee: '报名费',
      prizes: '奖品',
      rules: '规则',
    },

    formats: {
      singleElimination: '单败淘汰',
      doubleElimination: '双败淘汰',
      roundRobin: '循环赛',
      hybrid: '混合制',
    },

    status: {
      draft: '草稿',
      registrationOpen: '报名开放',
      registrationClosed: '报名关闭',
      inProgress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    },

    actions: {
      createTournament: '创建锦标赛',
      editTournament: '编辑锦标赛',
      deleteTournament: '删除锦标赛',
      generateBpaddles: '生成对阵表',
      publishResults: '公布结果',
      sendNotifications: '发送通知',
      exportData: '导出数据',
    },

    bpaddles: {
      round: '轮次',
      round1: '第一轮',
      round2: '第二轮',
      quarterfinals: '四分之一决赛',
      semifinals: '半决赛',
      finals: '决赛',
      winner: '冠军',
      runnerUp: '亚军',
      thirdPlace: '季军',
    },

    messages: {
      tournamentCreated: '锦标赛已创建',
      tournamentUpdated: '锦标赛已更新',
      tournamentDeleted: '锦标赛已删除',
      bpaddlesGenerated: '对阵表已生成',
      resultsPublished: '结果已公布',
      error: '操作失败',
      confirmDelete: '确认删除此锦标赛？',
    },
  },

  types: {
    match: {
      singles: '单打',
      doubles: '双打',
      mixed: '混双',
      team: '团体赛',
    },

    level: {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      pro: '职业',
    },

    surface: {
      hard: '硬地',
      clay: '红土',
      grass: '草地',
      carpet: '地毯',
    },

    status: {
      scheduled: '已安排',
      ongoing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已推迟',
    },

    userRole: {
      admin: '管理员',
      moderator: '版主',
      member: '会员',
      guest: '访客',
    },

    clubRole: {
      owner: '所有者',
      admin: '管理员',
      coach: '教练',
      member: '会员',
      pending: '待审核',
    },

    visibility: {
      public: '公开',
      private: '私密',
      friendsOnly: '仅好友',
      membersOnly: '仅会员',
    },

    gender: {
      male: '男',
      female: '女',
      other: '其他',
      preferNotToSay: '不愿透露',
    },

    ageGroup: {
      under18: '18岁以下',
      '18to25': '18-25岁',
      '26to35': '26-35岁',
      '36to45': '36-45岁',
      '46to55': '46-55岁',
      over55: '55岁以上',
    },
  },

  errors: {
    network: {
      title: '网络错误',
      offline: '您当前处于离线状态',
      timeout: '请求超时',
      serverError: '服务器错误',
      retry: '重试',
    },

    validation: {
      required: '此字段为必填项',
      invalidEmail: '无效的电子邮件地址',
      invalidPhone: '无效的电话号码',
      passwordTooShort: '密码至少需要8个字符',
      passwordMismatch: '密码不匹配',
      invalidDate: '无效的日期',
      invalidNumber: '无效的数字',
      minValue: '值必须大于或等于 {min}',
      maxValue: '值必须小于或等于 {max}',
      minLength: '至少需要 {min} 个字符',
      maxLength: '最多允许 {max} 个字符',
    },

    auth: {
      invalidCredentials: '无效的凭据',
      userNotFound: '未找到用户',
      emailInUse: '电子邮件已被使用',
      weakPassword: '密码强度不足',
      tooManyRequests: '请求过多，请稍后再试',
      sessionExpired: '会话已过期，请重新登录',
    },

    permissions: {
      denied: '权限被拒绝',
      insufficientPermissions: '权限不足',
      adminOnly: '仅限管理员',
    },
  },

  success: {
    saved: '保存成功',
    updated: '更新成功',
    deleted: '删除成功',
    created: '创建成功',
    sent: '发送成功',
    uploaded: '上传成功',
    copied: '复制成功',
  },

  confirmations: {
    delete: '确认删除？',
    cancel: '确认取消？',
    leave: '确认离开？',
    discard: '确认放弃更改？',
    logout: '确认退出登录？',
  },

  loading: {
    default: '加载中...',
    pleaseWait: '请稍候...',
    processing: '处理中...',
    saving: '保存中...',
    uploading: '上传中...',
    downloading: '下载中...',
  },

  empty: {
    noData: '暂无数据',
    noResults: '未找到结果',
    noMatches: '暂无比赛',
    noPlayers: '暂无球员',
    noClubs: '暂无俱乐部',
    noEvents: '暂无活动',
    noNotifications: '暂无通知',
    noMessages: '暂无消息',
  },
};

// Apply translations
const updatedZhData = deepMerge(zhData, zhTranslations);

// Write back to file
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZhData, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(enData, updatedZhData);
const translated = countUntranslated(enData, zhData) - afterCount;

console.log(`✅ Translation complete!`);
console.log(`📊 Translated ${translated} keys`);
console.log(`📋 Remaining untranslated: ${afterCount} keys`);
