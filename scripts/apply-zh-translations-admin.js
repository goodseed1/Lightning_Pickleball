const fs = require('fs');

// Load files
const zh = JSON.parse(fs.readFileSync('src/locales/zh.json', 'utf8'));

// Translation map for admin section (33 keys)
const translations = {
  'admin.devTools.currentStreak': '当前连续天数',
  'admin.devTools.eloRating': 'ELO评分',
  'admin.devTools.badges': '🏆 已获得徽章',
  'admin.devTools.requestPermissions': '请求通知权限',
  'admin.devTools.permissionGrantedMessage': '您现在可以接收推送通知。',
  'admin.devTools.permissionRequiredMessage': '请在设置中允许通知。',
  'admin.devTools.matchNotifications': '个人比赛通知',
  'admin.devTools.matchNotificationsDesc': '接收新闪电比赛的通知',
  'admin.devTools.clubEventNotifications': '俱乐部活动通知',
  'admin.devTools.clubEventNotificationsDesc': '接收俱乐部聚会的通知',
  'admin.devTools.notificationDistance': '通知距离范围',
  'admin.devTools.milesAway': '英里外',
  'admin.devTools.mile': '英里',
  'admin.devTools.miles': '英里',
  'admin.devTools.quietHours': '免打扰时间',
  'admin.devTools.korean': '韩语',
  'admin.devTools.privacy': '隐私',
  'admin.devTools.help': '帮助',
  'admin.devTools.appInfo': '应用信息',
  'admin.devTools.developerTools': '🔧 开发者工具',
  'admin.devTools.resetting': '重置中...',
  'admin.devTools.warningDevOnly': '⚠️ 仅供开发者使用 - 仅运行一次！',
  'admin.devTools.resetCompleteMessage': '已重置 {{count}} 个会员统计数据。',
  'admin.devTools.resetFailedMessage': '重置联赛统计数据时发生错误。\n\n{{error}}',
  'admin.matchManagement.title': '比赛管理',
  'admin.matchManagement.events': '活动',
  'admin.matchManagement.tournaments': '锦标赛',
  'admin.matchManagement.leagues': '联赛',
  'admin.matchManagement.total': '总计',
  'admin.matchManagement.inProgress': '进行中',
  'admin.matchManagement.scheduled': '已安排',
  'admin.matchManagement.today': '今天',
  'admin.matchManagement.daysAgo': ' 天前',
};

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

// Apply translations
let count = 0;
for (const [key, value] of Object.entries(translations)) {
  setNestedValue(zh, key, value);
  count++;
}

// Save updated zh.json
fs.writeFileSync('src/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');

console.log('✅ Applied ' + count + ' admin translations to zh.json');
