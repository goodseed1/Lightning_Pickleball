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

// Read both files
const enPath = path.join(__dirname, '..', 'src', 'locales', 'en.json');
const zhPath = path.join(__dirname, '..', 'src', 'locales', 'zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

// Simple translation map for common English terms to Chinese
const commonTranslations = {
  // Actions
  Save: '保存',
  Cancel: '取消',
  Confirm: '确认',
  Delete: '删除',
  Edit: '编辑',
  Open: '打开',
  Close: '关闭',
  Submit: '提交',
  Send: '发送',
  Add: '添加',
  Remove: '删除',
  Create: '创建',
  Update: '更新',
  View: '查看',
  Search: '搜索',
  Filter: '筛选',
  Sort: '排序',
  Share: '分享',
  Copy: '复制',
  Download: '下载',
  Upload: '上传',
  Export: '导出',
  Import: '导入',
  Print: '打印',
  Refresh: '刷新',
  Back: '返回',
  Next: '下一步',
  Previous: '上一步',
  Skip: '跳过',
  Finish: '完成',
  Continue: '继续',
  Apply: '应用',
  Clear: '清除',
  Reset: '重置',
  Undo: '撤销',
  Redo: '重做',

  // Status
  'Loading...': '加载中...',
  Error: '错误',
  Success: '成功',
  Failed: '失败',
  Pending: '待处理',
  Completed: '已完成',
  Cancelled: '已取消',
  Active: '活跃',
  Inactive: '不活跃',
  Enabled: '已启用',
  Disabled: '已禁用',

  // Common
  Yes: '是',
  No: '否',
  OK: 'OK',
  or: '或',
  and: '和',
  to: '至',
  from: '从',
  Required: '必填',
  Optional: '可选',
  All: '全部',
  None: '无',
  Other: '其他',
  Unknown: '未知',
  Name: '名称',
  Title: '标题',
  Description: '描述',
  Date: '日期',
  Time: '时间',
  Location: '位置',
  Address: '地址',
  Email: '电子邮件',
  Phone: '电话',
  Website: '网站',
  Message: '消息',
  Note: '备注',
  Notes: '备注',
  Status: '状态',
  Type: '类型',
  Category: '类别',
  Tags: '标签',
  Settings: '设置',
  Profile: '个人资料',
  Account: '账户',
  Password: '密码',
  Login: '登录',
  Logout: '登出',
  'Sign Up': '注册',
  'Sign In': '登录',
  Register: '注册',
  'Forgot Password?': '忘记密码？',
  'Reset Password': '重置密码',
  'Change Password': '更改密码',
  'Terms of Service': '服务条款',
  'Privacy Policy': '隐私政策',
  'Terms and Conditions': '条款和条件',
};

// Auto-translate function (uses common translations or keeps English if no match)
function autoTranslate(text) {
  if (!text || typeof text !== 'string') return text;
  if (commonTranslations[text]) return commonTranslations[text];

  // If it's a sentence/phrase, try word-by-word translation
  if (text.includes(' ')) {
    const words = text.split(' ');
    const translated = words.map(word => commonTranslations[word] || word);
    return translated.join(' ');
  }

  return text; // Keep original if no translation found
}

// Recursively translate all untranslated keys
function translateMissing(enObj, zhObj) {
  if (!isObject(enObj)) return enObj;

  const result = { ...zhObj };

  for (const key in enObj) {
    const enVal = enObj[key];
    const zhVal = zhObj ? zhObj[key] : undefined;

    if (isObject(enVal)) {
      // Recurse into nested objects
      result[key] = translateMissing(enVal, zhVal || {});
    } else if (typeof enVal === 'string') {
      // Only translate if missing or same as English
      if (!zhVal || zhVal === enVal) {
        result[key] = autoTranslate(enVal);
      } else {
        result[key] = zhVal; // Keep existing translation
      }
    } else {
      result[key] = zhVal !== undefined ? zhVal : enVal;
    }
  }

  return result;
}

// Apply translation
console.log('🔄 Auto-translating all missing keys...');
const updatedZh = translateMissing(en, zh);

// Write result
fs.writeFileSync(zhPath, JSON.stringify(updatedZh, null, 2) + '\n', 'utf8');

console.log('✅ Auto-translation complete!');
console.log('');
console.log('⚠️  Note: Auto-translation uses common term mapping.');
console.log('   Review and refine translations as needed.');
console.log('');

// Count what was translated
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (isObject(obj[key])) {
      count += countKeys(obj[key]);
    } else if (typeof obj[key] === 'string') {
      count++;
    }
  }
  return count;
}

console.log(`📊 Total keys in file: ${countKeys(updatedZh)}`);
