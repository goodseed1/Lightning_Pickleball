#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(localesPath, 'en.json');
const zhPath = path.join(localesPath, 'zh.json');

// Read files
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log('🚀 Creating comprehensive Chinese translations for ALL remaining keys...\n');

// Translation mapping for ALL keys
const translationMap = {
  // Common patterns
  title: '标题',
  header: '标题',
  submit: '提交',
  cancel: '取消',
  save: '保存',
  delete: '删除',
  edit: '编辑',
  view: '查看',
  close: '关闭',
  loading: '加载中...',
  error: '错误',
  success: '成功',

  // Event-related
  Event: '活动',
  event: '活动',
  'Create Event': '创建活动',
  'event details': '活动详情',
  'Event Name': '活动名称',
  Description: '描述',
  Date: '日期',
  Time: '时间',
  Location: '地点',
  'Skill Level': '技术水平',
  Format: '形式',
  'Max Participants': '最大参与者数',
  Cost: '费用',
  Free: '免费',
  participants: '参与者',
  Join: '加入',
  Leave: '退出',
  'View Details': '查看详情',
  Full: '已满',
  Cancelled: '已取消',
  Completed: '已完成',
  'In Progress': '进行中',
  Upcoming: '即将开始',

  // Match-related
  Match: '比赛',
  match: '比赛',
  Matches: '比赛',
  matches: '比赛',
  Singles: '单打',
  Doubles: '双打',
  'Mixed Doubles': '混合双打',
  Win: '胜利',
  Loss: '失败',
  Score: '得分',
  'Record Score': '记录得分',
  Confirm: '确认',

  // Club-related
  Club: '俱乐部',
  club: '俱乐部',
  Members: '成员',
  members: '成员',
  Admin: '管理员',
  Owner: '拥有者',
  'Join Club': '加入俱乐部',
  'Leave Club': '退出俱乐部',

  // League/Tournament
  League: '联赛',
  league: '联赛',
  Tournament: '锦标赛',
  tournament: '锦标赛',
  Season: '赛季',
  Standings: '排名',
  Schedule: '赛程',
  Register: '报名',
  Bracket: '对阵表',

  // User/Profile
  Profile: '个人资料',
  profile: '个人资料',
  Settings: '设置',
  Name: '姓名',
  Email: '邮箱',
  Password: '密码',
  Bio: '个人简介',

  // Status
  Active: '活跃',
  Inactive: '不活跃',
  Pending: '待处理',
  Approved: '已批准',
  Rejected: '已拒绝',

  // Actions
  Create: '创建',
  Update: '更新',
  Remove: '移除',
  Approve: '批准',
  Reject: '拒绝',
  Send: '发送',
  Share: '分享',
  Download: '下载',
  Upload: '上传',
  Search: '搜索',
  Filter: '筛选',
  Sort: '排序',
  Refresh: '刷新',

  // Time-related
  Today: '今天',
  Tomorrow: '明天',
  Week: '周',
  Month: '月',
  Year: '年',
  Morning: '早晨',
  Afternoon: '下午',
  Evening: '晚上',

  // Numbers/Counting
  All: '全部',
  None: '无',
  Total: '总计',
  Count: '数量',
  Amount: '金额',
};

// Helper function to translate a single English value
function translateValue(enValue) {
  if (typeof enValue !== 'string') return enValue;

  // Check if already in translationMap
  for (const [key, value] of Object.entries(translationMap)) {
    if (enValue.includes(key)) {
      return enValue.replace(new RegExp(key, 'gi'), value);
    }
  }

  // Fallback comprehensive translation
  const translations = {
    // Full sentence translations
    'Are you sure you want to cancel this event?': '确定要取消此活动吗？',
    'Event created successfully': '活动创建成功',
    'Failed to create event': '创建活动失败',
    'Enter event name': '输入活动名称',
    'Select date': '选择日期',
    'Select time': '选择时间',
    'Enter location': '输入地点',
    'Select skill level': '选择技术水平',
    'Select format': '选择形式',
    'Creating...': '创建中...',
    'Loading...': '加载中...',
    'Submitting...': '提交中...',
    'Saving...': '保存中...',

    // Badge/Honor tags
    '#SharpEyed': '#火眼金睛',
    '#FairPlay': '#公平竞争',
    '#Respectful': '#彼此尊重',
    '#Punctual': '#守时达人',
    '#Communicative': '#沟通高手',
    '#Positive': '#积极向上',
    '#TeamPlayer': '#团队精神',
    '#Reliable': '#可靠伙伴',
    '#Skillful': '#技术精湛',
    '#Encouraging': '#鼓励他人',
    '#FullOfEnergy': '#活力四射',
    '#MrManner': '#礼仪先生',
    '#PunctualPro': '#守时专家',
    '#MentalFortress': '#心理强大',
    '#CourtJester': '#场上乐天派',

    // Common UI elements
    'spots left': '剩余名额',
    'spots available': '可用名额',
    participants: '参与者',
    'No matches': '没有比赛',
    'No events': '没有活动',
    'No data': '暂无数据',
    'Coming soon': '即将推出',
    'View all': '查看全部',
    'See more': '查看更多',
    'Show less': '收起',
    Expand: '展开',
    Collapse: '折叠',

    // Payment/Dues
    Payment: '付款',
    Dues: '会费',
    Receipt: '收据',
    Invoice: '发票',
    Paid: '已支付',
    Unpaid: '未支付',
    Overdue: '逾期',
    Refund: '退款',

    // Notifications
    Notification: '通知',
    Reminder: '提醒',
    Alert: '警报',
    Message: '消息',
    Chat: '聊天',

    // Stats/Performance
    Statistics: '统计',
    Performance: '表现',
    Analytics: '分析',
    Dashboard: '仪表板',
    'Win Rate': '胜率',
    Rank: '排名',
    Rating: '评分',
    Level: '等级',

    // Skill levels
    Beginner: '初学者',
    Intermediate: '中级',
    Advanced: '高级',
    Expert: '专家',
    Professional: '职业',

    // Time periods
    'This Week': '本周',
    'This Month': '本月',
    'This Year': '今年',
    'All Time': '全部时间',
    Recent: '最近',
    Past: '过去',
    Future: '未来',

    // Court/Surface types
    'Hard Court': '硬地',
    'Clay Court': '红土',
    'Grass Court': '草地',
    Indoor: '室内',
    Outdoor: '室外',

    // Common errors/validations
    Required: '必填项',
    Invalid: '无效',
    'Required field': '必填字段',
    'Invalid email': '邮箱无效',
    'Invalid password': '密码无效',
    'Too long': '过长',
    'Too short': '过短',
    'Please select': '请选择',
    'Please enter': '请输入',

    // Permissions/Access
    'Permission denied': '权限被拒绝',
    'Access denied': '访问被拒绝',
    Unauthorized: '未授权',
    Forbidden: '禁止',

    // Common actions
    Continue: '继续',
    Back: '返回',
    Next: '下一步',
    Previous: '上一步',
    Finish: '完成',
    Done: '完成',
    OK: '确定',
    Yes: '是',
    No: '否',
    Maybe: '也许',

    // Social
    Friend: '好友',
    Friends: '好友',
    Follow: '关注',
    Following: '正在关注',
    Followers: '关注者',
    'Add Friend': '添加好友',
    'Remove Friend': '移除好友',
    Block: '屏蔽',
    Unblock: '取消屏蔽',
    Mute: '静音',
    Unmute: '取消静音',
  };

  return translations[enValue] || enValue;
}

// Recursively find and translate all keys where zh === en
function translateMissingKeys(enObj, zhObj, path = '') {
  let changesMade = 0;

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
      // Nested object - recurse
      if (!zhObj[key] || typeof zhObj[key] !== 'object') {
        zhObj[key] = {};
      }
      changesMade += translateMissingKeys(enObj[key], zhObj[key], currentPath);
    } else {
      // Leaf value - check if translation needed
      const enValue = enObj[key];
      const zhValue = zhObj[key];

      if (zhValue === enValue || zhValue === 'en' || !zhValue) {
        const translated = translateValue(enValue);
        if (translated !== enValue) {
          zhObj[key] = translated;
          changesMade++;
          console.log(`✓ ${currentPath}: "${enValue}" → "${translated}"`);
        }
      }
    }
  }

  return changesMade;
}

// Apply translations
const changesMade = translateMissingKeys(en, zh);

// Write back to file
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2) + '\n', 'utf8');

console.log(`\n✅ Applied ${changesMade} automatic translations!`);
console.log('📝 Note: Some keys may still need manual review for context-specific accuracy.');
