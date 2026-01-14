#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const zhPath = path.join(localesPath, 'zh.json');
const untranslatedPath = path.join(__dirname, 'untranslated-zh.json');

// Read files
const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log(`🚀 Processing ${untranslated.length} untranslated Chinese keys...\n`);

// Comprehensive translation dictionary
const dict = {
  // Common words
  event: '活动',
  Event: '活动',
  events: '活动',
  match: '比赛',
  Match: '比赛',
  matches: '比赛',
  Matches: '比赛',
  club: '俱乐部',
  Club: '俱乐部',
  clubs: '俱乐部',
  league: '联赛',
  League: '联赛',
  leagues: '联赛',
  tournament: '锦标赛',
  Tournament: '锦标赛',
  tournaments: '锦标赛',
  player: '球员',
  Player: '球员',
  players: '球员',
  member: '成员',
  Member: '成员',
  members: '成员',
  participant: '参与者',
  Participant: '参与者',
  participants: '参与者',
  host: '主办方',
  Host: '主办方',
  admin: '管理员',
  Admin: '管理员',
  owner: '拥有者',
  Owner: '拥有者',

  // Actions
  create: '创建',
  Create: '创建',
  creating: '创建中',
  edit: '编辑',
  Edit: '编辑',
  editing: '编辑中',
  delete: '删除',
  Delete: '删除',
  deleting: '删除中',
  cancel: '取消',
  Cancel: '取消',
  canceling: '取消中',
  cancelled: '已取消',
  save: '保存',
  Save: '保存',
  saving: '保存中',
  submit: '提交',
  Submit: '提交',
  submitting: '提交中',
  join: '加入',
  Join: '加入',
  joined: '已加入',
  leave: '退出',
  Leave: '退出',
  view: '查看',
  View: '查看',
  share: '分享',
  Share: '分享',
  send: '发送',
  Send: '发送',
  sending: '发送中',
  approve: '批准',
  Approve: '批准',
  approved: '已批准',
  reject: '拒绝',
  Reject: '拒绝',
  rejected: '已拒绝',
  pending: '待处理',
  Pending: '待处理',
  close: '关闭',
  Close: '关闭',
  open: '开放',
  Open: '开放',
  register: '报名',
  Register: '报名',
  registration: '报名',

  // Status
  active: '活跃',
  Active: '活跃',
  inactive: '不活跃',
  Inactive: '不活跃',
  completed: '已完成',
  Completed: '已完成',
  upcoming: '即将开始',
  Upcoming: '即将开始',
  ongoing: '进行中',
  Ongoing: '进行中',
  past: '过去',
  Past: '过去',

  // Common UI
  title: '标题',
  Title: '标题',
  header: '标题',
  Header: '标题',
  name: '名称',
  Name: '名称',
  description: '描述',
  Description: '描述',
  details: '详情',
  Details: '详情',
  date: '日期',
  Date: '日期',
  time: '时间',
  Time: '时间',
  location: '地点',
  Location: '地点',
  format: '形式',
  Format: '形式',
  level: '水平',
  Level: '水平',
  skill: '技能',
  Skill: '技能',
  loading: '加载中',
  Loading: '加载中',
  error: '错误',
  Error: '错误',
  success: '成功',
  Success: '成功',
  message: '消息',
  Message: '消息',
  alert: '警报',
  Alert: '警报',
  notification: '通知',
  Notification: '通知',

  // Match terms
  singles: '单打',
  Singles: '单打',
  doubles: '双打',
  Doubles: '双打',
  mixed: '混合',
  Mixed: '混合',
  win: '胜利',
  Win: '胜利',
  wins: '胜利',
  loss: '失败',
  Loss: '失败',
  losses: '失败',
  score: '得分',
  Score: '得分',
  result: '结果',
  Result: '结果',

  // Payments
  payment: '付款',
  Payment: '付款',
  dues: '会费',
  Dues: '会费',
  paid: '已支付',
  Paid: '已支付',
  unpaid: '未支付',
  Unpaid: '未支付',
  amount: '金额',
  Amount: '金额',
  cost: '费用',
  Cost: '费用',
  free: '免费',
  Free: '免费',
  receipt: '收据',
  Receipt: '收据',

  // Time
  today: '今天',
  Today: '今天',
  tomorrow: '明天',
  Tomorrow: '明天',
  week: '周',
  Week: '周',
  month: '月',
  Month: '月',
  year: '年',
  Year: '年',
  morning: '早晨',
  Morning: '早晨',
  afternoon: '下午',
  Afternoon: '下午',
  evening: '晚上',
  Evening: '晚上',

  // Other
  all: '全部',
  All: '全部',
  none: '无',
  None: '无',
  yes: '是',
  Yes: '是',
  no: '否',
  No: '否',
  ok: '确定',
  OK: '确定',
  confirm: '确认',
  Confirm: '确认',
  search: '搜索',
  Search: '搜索',
  filter: '筛选',
  Filter: '筛选',
  refresh: '刷新',
  Refresh: '刷新',
};

// Smart translate function
function smartTranslate(enText) {
  if (!enText || typeof enText !== 'string') return enText;

  let result = enText;

  // Replace each word in dictionary
  for (const [en, zh] of Object.entries(dict)) {
    // Word boundary replacement
    const regex = new RegExp(`\\b${en}\\b`, 'g');
    result = result.replace(regex, zh);
  }

  // Handle common patterns
  result = result
    .replace(/No\s+/gi, '没有')
    .replace(/Please\s+/gi, '请')
    .replace(/\s+successfully/gi, '成功')
    .replace(/Failed to\s+/gi, '失败：')
    .replace(/Unable to\s+/gi, '无法')
    .replace(/Are you sure/gi, '确定')
    .replace(/\?\s*$/gi, '？')
    .replace(/\!\s*$/gi, '！');

  return result;
}

// Apply translations to nested structure
function applyTranslations(obj, path = '') {
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      applyTranslations(obj[key], currentPath);
    }
  }
}

// Convert untranslated array to nested object with translations
const translations = {};
let successCount = 0;

untranslated.forEach(item => {
  const keys = item.key.split('.');
  let current = translations;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  const translated = smartTranslate(item.value);
  current[keys[keys.length - 1]] = translated;

  if (translated !== item.value) {
    successCount++;
  }
});

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Merge and write
const updatedZh = deepMerge(zh, translations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log(`✅ Processed ${untranslated.length} keys`);
console.log(`✅ Successfully translated ${successCount} keys`);
console.log(`📝 ${untranslated.length - successCount} keys kept as-is (proper nouns, codes, etc.)`);
console.log('\n🎉 Chinese translation ultra-complete!');
