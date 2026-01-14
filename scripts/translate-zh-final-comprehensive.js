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
    eventType: {
      lightningMatch: '闪电比赛',
      lightningMeetup: '闪电聚会',
      meetup: '聚会',
      doublesMatch: '双打比赛',
      singlesMatch: '单打比赛',
    },
    fields: {
      people: '人',
      autoConfigured: '✅ 自动配置',
      availableLanguages: '可用语言',
      autoApproval: '先到先得自动批准',
      participationFee: '参与费用（可选）',
    },
  },

  admin: {
    logs: {
      title: '系统日志',
      critical: '严重',
      warning: '警告',
      healthy: '正常',
      lastChecked: '最后检查',
      newMatches: '新比赛\n(24小时)',
      categories: '日志类别',
      functionLogs: 'Cloud Functions日志',
    },
  },

  types: {
    match: {
      matchTypes: {
        league: '联赛比赛',
        tournament: '锦标赛',
        lightning_match: '闪电比赛',
        practice: '练习赛',
      },
      matchStatus: {
        scheduled: '已安排',
        in_progress: '进行中',
        confirmed: '已确认',
        disputed: '有争议',
      },
      matchFormats: {
        singles: '单打',
        doubles: '双打',
      },
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
  },

  editProfile: {
    title: '编辑资料',
    name: '姓名',
    email: '电子邮件',
    phone: '电话',
    bio: '个人简介',
    save: '保存',
    cancel: '取消',
  },

  aiMatching: {
    title: 'AI智能匹配',
    findMatch: '寻找对手',
    searching: '搜索中...',
    found: '找到匹配',
    noMatchesFound: '未找到匹配',
  },

  eventCard: {
    date: '日期',
    time: '时间',
    location: '地点',
    participants: '参与者',
    join: '加入',
    leave: '离开',
  },

  matches: {
    title: '比赛',
    upcoming: '即将进行',
    completed: '已完成',
    cancelled: '已取消',
  },

  clubLeaguesTournaments: {
    title: '联赛和锦标赛',
    leagues: '联赛',
    tournaments: '锦标赛',
    create: '创建',
  },

  performanceDashboard: {
    title: '表现面板',
    stats: '统计',
    trends: '趋势',
    analysis: '分析',
  },

  clubDuesManagement: {
    title: '会费管理',
    dueAmount: '应付金额',
    dueDate: '到期日期',
    status: '状态',
  },

  club: {
    title: '俱乐部',
    members: '成员',
    events: '活动',
    about: '关于',
  },

  profile: {
    title: '个人资料',
    edit: '编辑',
    stats: '统计',
    achievements: '成就',
  },

  createClubTournament: {
    title: '创建俱乐部锦标赛',
    tournamentName: '锦标赛名称',
    startDate: '开始日期',
    endDate: '结束日期',
    create: '创建',
  },

  hostedEventCard: {
    title: '主办活动卡片',
    host: '主办方',
    participants: '参与者',
    date: '日期',
    location: '地点',
  },

  discover: {
    title: '发现',
    search: '搜索',
    filter: '筛选',
    nearby: '附近',
    popular: '热门',
    recommended: '推荐',
  },
};

const updatedZhData = deepMerge(zhData, zhTranslations);
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZhData, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(enData, updatedZhData);
const translated = countUntranslated(enData, zhData) - afterCount;

console.log('✅ Final comprehensive translation complete!');
console.log(`📊 Translated ${translated} keys in this round`);
console.log(`📋 Remaining untranslated: ${afterCount} keys`);
console.log('\n=== ROUND 2 TOTAL SUMMARY ===');
console.log(`Started with: 1806 untranslated keys`);
console.log(`Now have: ${afterCount} untranslated keys`);
console.log(`Total translated in Round 2: ${1806 - afterCount} keys`);
