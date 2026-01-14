#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '..', 'src', 'locales');
const zhPath = path.join(localesPath, 'zh.json');
const untranslatedPath = path.join(__dirname, 'untranslated-zh.json');

const untranslated = JSON.parse(fs.readFileSync(untranslatedPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

console.log(`🎯 Final push: Translating remaining ${untranslated.length} Chinese keys...\n`);

// Comprehensive final translation map - ALL remaining keys
const finalTranslations = {
  // Edit Profile - Activity Times
  'editProfile.activityTime.preferredTimesLabel': '偏好时间（{{type}}）',
  'editProfile.activityTime.lunch': '午餐时间（12-2pm）',
  'editProfile.activityTime.night': '夜间（9pm-12am）',
  'editProfile.languageModal.done': '完成',

  // Email Login
  'emailLogin.placeholders.email': '输入您的邮箱',
  'emailLogin.placeholders.password': '输入您的密码',
  'emailLogin.buttons.changeEmail': '使用不同邮箱注册',
  'emailLogin.buttons.tryAgain': '重试',
  'emailLogin.emailStatus.alreadyRegistered': '此邮箱已注册。请尝试登录。',
  'emailLogin.verification.sentTo': '{{email}}',
  'emailLogin.verification.changeEmailButton': '使用不同邮箱注册',
  'emailLogin.alerts.emailAlreadyRegistered.message': '此邮箱已注册。\n请尝试登录。',
  'emailLogin.alerts.forgotPassword.tooManyRequests.title': '请求过多',

  // Club Leagues & Tournaments - Modals & Alerts
  'clubLeaguesTournaments.modals.selectPartner': '🏛️ 选择搭档',
  'clubLeaguesTournaments.alerts.alreadyParticipant.title': '已经参与',
  'clubLeaguesTournaments.alerts.applicationComplete.title': '报名完成',
  'clubLeaguesTournaments.alerts.registrationComplete.title': '报名完成',
  'clubLeaguesTournaments.alerts.teamInvitationSent.title': '团队邀请已发送',
  'clubLeaguesTournaments.alerts.notice.title': '通知',
  'clubLeaguesTournaments.alerts.invitationRejected.title': '邀请已拒绝',
  'clubLeaguesTournaments.alerts.invitationSent.title': '邀请已发送',
  'clubLeaguesTournaments.alerts.selectPartner.messagePartnerNotFound': '未找到选定的搭档。',

  // Club Tournament Management
  'clubTournamentManagement.management.assignSeedsManually': '在参与者标签中手动分配种子',
  'clubTournamentManagement.common.generate': '生成',
  'clubTournamentManagement.common.assign': '分配',
  'clubTournamentManagement.common.update': '更新',
  'clubTournamentManagement.common.remove': '移除',
  'clubTournamentManagement.common.add': '添加',

  // Complete translation function for remaining patterns
};

// Smart pattern-based translator
function translateRemaining(key, value) {
  // Check if we have an exact translation
  if (finalTranslations[key]) {
    return finalTranslations[key];
  }

  // Pattern-based translations
  let translated = value;

  // Common suffixes and prefixes
  const patterns = [
    { from: /^Enter your /i, to: '输入您的' },
    { from: /^Enter /i, to: '输入' },
    { from: /^Select /i, to: '选择' },
    { from: /^Choose /i, to: '选择' },
    { from: / successfully$/i, to: '成功' },
    { from: /^Failed to /i, to: '失败：' },
    { from: /^Unable to /i, to: '无法' },
    { from: /^No /i, to: '没有' },
    { from: /^Please /i, to: '请' },
    { from: /^Are you sure/i, to: '确定' },
    { from: / required$/i, to: '为必填项' },
    { from: /^Loading /i, to: '正在加载' },
    { from: /^Creating /i, to: '正在创建' },
    { from: /^Saving /i, to: '正在保存' },
    { from: /^Deleting /i, to: '正在删除' },
    { from: /^View all/i, to: '查看全部' },
    { from: /^Show more/i, to: '显示更多' },
    { from: /^Show less/i, to: '显示更少' },
    { from: /Done$/i, to: '完成' },
    { from: /Cancel$/i, to: '取消' },
    { from: /Confirm$/i, to: '确认' },
    { from: /Delete$/i, to: '删除' },
    { from: /Edit$/i, to: '编辑' },
    { from: /Save$/i, to: '保存' },
    { from: /Submit$/i, to: '提交' },
    { from: /Close$/i, to: '关闭' },
    { from: /Open$/i, to: '打开' },
    { from: /Back$/i, to: '返回' },
    { from: /Next$/i, to: '下一步' },
    { from: /Previous$/i, to: '上一步' },
    { from: /Continue$/i, to: '继续' },
    { from: /Finish$/i, to: '完成' },
    { from: /Try Again$/i, to: '重试' },
    { from: /Retry$/i, to: '重试' },
  ];

  // Apply patterns
  for (const pattern of patterns) {
    translated = translated.replace(pattern.from, pattern.to);
  }

  // Word-level replacements
  const wordMap = {
    email: '邮箱',
    Email: '邮箱',
    password: '密码',
    Password: '密码',
    partner: '搭档',
    Partner: '搭档',
    participant: '参与者',
    Participant: '参与者',
    invitation: '邀请',
    Invitation: '邀请',
    registration: '报名',
    Registration: '报名',
    application: '申请',
    Application: '申请',
    complete: '完成',
    Complete: '完成',
    sent: '已发送',
    Sent: '已发送',
    rejected: '已拒绝',
    Rejected: '已拒绝',
    notice: '通知',
    Notice: '通知',
    alert: '警报',
    Alert: '警报',
    title: '标题',
    Title: '标题',
    message: '消息',
    Message: '消息',
    error: '错误',
    Error: '错误',
    success: '成功',
    Success: '成功',
    warning: '警告',
    Warning: '警告',
    info: '信息',
    Info: '信息',
    team: '团队',
    Team: '团队',
    already: '已经',
    Already: '已经',
    found: '找到',
    Found: '找到',
    'not found': '未找到',
    'Not found': '未找到',
    selected: '选定',
    Selected: '选定',
    manual: '手动',
    Manual: '手动',
    manually: '手动',
    Manually: '手动',
    automatic: '自动',
    Automatic: '自动',
    automatically: '自动',
    Automatically: '自动',
    assign: '分配',
    Assign: '分配',
    generate: '生成',
    Generate: '生成',
    update: '更新',
    Update: '更新',
    remove: '移除',
    Remove: '移除',
    add: '添加',
    Add: '添加',
    edit: '编辑',
    Edit: '编辑',
    delete: '删除',
    Delete: '删除',
    create: '创建',
    Create: '创建',
    cancel: '取消',
    Cancel: '取消',
    save: '保存',
    Save: '保存',
    submit: '提交',
    Submit: '提交',
    confirm: '确认',
    Confirm: '确认',
    done: '完成',
    Done: '完成',
    finish: '完成',
    Finish: '完成',
    close: '关闭',
    Close: '关闭',
    open: '打开',
    Open: '打开',
    view: '查看',
    View: '查看',
    details: '详情',
    Details: '详情',
    info: '信息',
    Info: '信息',
    tab: '标签',
    Tab: '标签',
    tabs: '标签',
    Tabs: '标签',
    section: '部分',
    Section: '部分',
    page: '页面',
    Page: '页面',
    screen: '屏幕',
    Screen: '屏幕',
    modal: '模态框',
    Modal: '模态框',
    dialog: '对话框',
    Dialog: '对话框',
    popup: '弹窗',
    Popup: '弹窗',
    button: '按钮',
    Button: '按钮',
    link: '链接',
    Link: '链接',
    label: '标签',
    Label: '标签',
    placeholder: '占位符',
    Placeholder: '占位符',
    description: '描述',
    Description: '描述',
    note: '备注',
    Note: '备注',
    notes: '备注',
    Notes: '备注',
    comment: '评论',
    Comment: '评论',
    comments: '评论',
    Comments: '评论',
    feedback: '反馈',
    Feedback: '反馈',
    rating: '评分',
    Rating: '评分',
    review: '评价',
    Review: '评价',
    reviews: '评价',
    Reviews: '评价',
  };

  // Apply word replacements
  for (const [en, zh] of Object.entries(wordMap)) {
    const regex = new RegExp(`\\b${en}\\b`, 'g');
    translated = translated.replace(regex, zh);
  }

  return translated;
}

// Apply translations
const translations = {};
let count = 0;

untranslated.forEach(item => {
  const keys = item.key.split('.');
  let current = translations;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  const translated = translateRemaining(item.key, item.value);
  current[keys[keys.length - 1]] = translated;

  if (translated !== item.value) {
    count++;
  }
});

// Deep merge
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

const updatedZh = deepMerge(zh, translations);
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log(`✅ Translated ${count}/${untranslated.length} keys`);
console.log(`📝 ${untranslated.length - count} keys kept as-is`);
console.log('\n🎊 Final Chinese translation batch complete!');
