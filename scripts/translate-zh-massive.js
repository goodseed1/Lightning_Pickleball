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
  services: {
    clubComms: {
      permissionDenied: '权限被拒绝',
      commentNotFound: '未找到评论',
    },
    matching: {
      perfectMatchTitle: '找到完美匹配！🎾',
      newRequestTitle: '新的比赛请求📨',
      perfectMatchBody: '您与{{name}}的匹配度为{{score}}%。',
      newRequestBody: '{{senderName}}向您发起了网球比赛请求。',
    },
    event: {
      untitled: '无标题',
      eventsFound: '找到{{count}}场比赛！',
      searchError: '搜索时发生错误。',
      host: '主办方',
      matchesFoundMessage: '🎾 找到{{count}}场比赛！',
      playerCount: '   👥 {{current}}/{{max}}名球员',
    },
    match: {
      participantNotFound: '未找到参赛者信息。',
      invalidEventType: '活动类型{{eventType}}必须使用{{expectedFormat}}格式。',
      matchNotFound: '未找到比赛。',
      onlyParticipantCanSubmit: '只有比赛参赛者可以提交比分。',
      notDisputed: '此比赛不处于争议状态。',
    },
    activity: {
      loginRequired: '您必须登录',
      onlyOwnApplication: '您只能接受自己的申请',
      applicationNotFound: '未找到申请',
      invalidApplication: '无效的申请',
      teamMergeFailed: '队伍合并失败。请重试。',
      onlyInvitedUser: '只有受邀用户可以回应',
      eventNotFound: '未找到活动',
      alreadyProcessed: '邀请已被处理',
      notifications: {
        applicationSubmittedTitle: '新的参与请求',
        applicationApprovedTitle: '参与已批准！',
        applicationDeclinedTitle: '参与请求被拒绝',
        playoffsQualifiedTitle: '🏆 晋级季后赛！',
        defaultTitle: '通知',
        applicationApprovedMessage: '您参与"{{eventTitle}}"的申请已获批准！',
        applicationDeclinedMessage: '您参与"{{eventTitle}}"的请求已被拒绝。',
        playoffsQualifiedMessage: '恭喜！您已晋级"{{leagueName}}"季后赛！',
        defaultMessage: '您有一条新的活动更新。',
        defaultLeagueName: '联赛',
      },
      tennisUserFallback: '网球用户{{id}}',
    },
    camera: {
      permissionError: '请求权限时发生错误。',
      photoError: '拍照时发生错误。',
      simulatorError: '在iOS模拟器上访问相册时出现问题。请在真实设备上测试。',
      selectPhoto: '选择照片',
      camera: '相机',
      gallery: '相册',
      notice: '通知',
      gallerySaveNotice: 'App Store版本提供相册保存功能。',
      fileSizeError: '文件大小超出',
      fileSizeMessage: '请选择小于5MB的图片。',
    },
    location: {
      later: '稍后',
      backgroundPermissionMessage: '后台位置权限用于比赛通知等功能。',
    },
    feed: {
      feedNotFound: '未找到动态项',
      reportTitle: '[动态举报] {{contentSummary}}',
    },
    notification: {
      matchReminder: '🎾 比赛提醒',
      partnerInvite: '🎾 搭档邀请',
      newClubEvent: '🏟️ 新俱乐部活动：{{title}}',
      newLightningMatch: '⚡ 新闪电比赛：{{title}}',
      matchDetails: '📍 {{location}}\n🕒 {{dateTime}}\n📏 {{distance}}英里',
      matchReminderBody: '"{{title}}"比赛将在{{minutes}}分钟后开始！',
      partnerInviteBody: '{{inviterName}}邀请您作为搭档参加"{{eventTitle}}"双打比赛！',
    },
    tournament: {
      participantNotFound: '未找到参赛者。',
      notFound: '未找到锦标赛。',
      minParticipantsRequired: '未达到最少参赛人数。（当前：{{current}}，需要：{{required}}）',
      partnerConfirmationRequired: '{{count}}支队伍需要搭档确认。',
      validationError: '验证时发生错误。',
    },
    performanceAnalytics: {
      insights: {
        highWinRate: {
          title: '保持高胜率',
          description: '您目前保持着优秀的{{winRate}}%胜率。',
          recommendations: {
            maintain: '保持当前的比赛风格',
            challenge: '尝试与更高水平的对手比赛',
          },
        },
        lowFrequency: {
          description: '平均每周打球{{frequency}}次，增加打球频率可以帮助提升技能。',
          recommendations: {
            schedule: '设定固定的练习时间表',
            setGoal: '设定每周打球目标',
          },
        },
        bestTimeSlot: {
          description: '您在{{timeSlot}}时段的表现最佳。',
          recommendations: {
            increase: '在此时段安排更多比赛',
            analyze: '分析此时段效果好的原因',
          },
        },
      },
      monthlyReport: {
        highlights: {
          winRateAchieved: '胜率达成',
          bestStreak: '最佳连胜',
        },
        improvements: {
          serveSpeed: '发球速度',
          backhandStability: '反手稳定性',
          netPlay: '网前打法',
        },
        nextMonthGoals: {
          winRateTarget: '目标胜率',
          practiceFrequency: '练习频率目标',
          newPartner: '与新搭档比赛',
        },
      },
    },
    leaderboard: {
      challenges: {
        weeklyMatches: {
          title: '每周比赛挑战',
          description: '本周完成5场比赛',
          reward: '100积分 + "每周战士"徽章',
        },
        winStreak: {
          title: '连胜挑战',
          description: '达成3连胜',
          reward: '200积分 + "连胜者"徽章',
        },
        monthlyImprovement: {
          title: '月度进步',
          description: '技能水平提升5点',
          reward: '500积分 + "进步之王"徽章',
        },
        socialPlayer: {
          title: '社交球员',
          description: '与10位新对手比赛',
          reward: '300积分 + "社交达人"徽章',
        },
      },
      achievements: {
        firstWin: {
          name: '首胜',
          description: '赢得首场比赛',
        },
        winStreak3: {
          name: '3连胜',
          description: '连续赢得3场比赛',
        },
        winStreak5: {
          name: '5连胜',
          description: '连续赢得5场比赛',
        },
        totalWins10: {
          name: '胜利收集者',
          description: '累计赢得10场比赛',
        },
        totalWins50: {
          name: '胜利大师',
          description: '累计赢得50场比赛',
        },
        matchesPlayed10: {
          name: '积累经验',
          description: '完成10场比赛',
        },
        matchesPlayed100: {
          name: '老将球员',
          description: '完成100场比赛',
        },
        skillLevel70: {
          name: '技术型球员',
          description: '达到技能等级70',
        },
        skillLevel85: {
          name: '专家',
          description: '达到技能等级85',
        },
        socialPlayer: {
          name: '社交球员',
          description: '与20位不同球员比赛',
        },
        earlyBird: {
          name: '早起鸟',
          description: '在上午10点前完成10场比赛',
        },
        nightOwl: {
          name: '夜猫子',
          description: '在晚上8点后完成10场比赛',
        },
      },
      categories: {
        overall: {
          name: '总排名',
          description: '基于综合表现的排名',
        },
        skillLevel: {
          name: '技能等级排名',
          description: '基于技能等级的排名',
        },
        winRate: {
          name: '胜率排名',
          description: '基于胜率的排名',
        },
        monthlyActive: {
          description: '基于月度比赛活跃度的排名',
        },
        improvement: {
          name: '进步排名',
          description: '基于技能提升速度的排名',
        },
      },
    },
    league: {
      matchNotFound: '未找到比赛',
    },
    team: {
      inviteAlreadyPending: '与此搭档的组队邀请已在等待中。',
      teamAlreadyConfirmed: '您已与此搭档确认组队。',
      playerHasTeam: '该球员已为此锦标赛确认组队。',
      inviterAlreadyHasTeam: '您已为此锦标赛确认组队。',
    },
    ranking: {
      userNotFound: '未找到用户。',
      invalidRankingData: '无效的排名更新数据。',
    },
    map: {
      cannotOpenApp: '无法打开{{appName}}。',
      appNotInstalled: '未安装{{appName}}',
      install: '安装',
    },
  },

  duesManagement: {
    alerts: {
      ok: '确定',
      saved: '已保存',
      reminderSent: '提醒已发送',
      enableAutoInvoice: '启用自动发票',
      approved: '已批准',
      rejected: '已拒绝',
      deleted: '已删除',
      added: '已添加',
      done: '完成',
      notice: '通知',
    },
    messages: {
      missingSettings:
        '要启用自动发票，请配置以下内容：\n\n• {{items}}\n\n请在上方"会费设置"部分进行设置。',
      settingsSaved: '会费设置已成功更新。',
      memberNotFound: '未找到会员。',
      paymentMarkedPaid: '已成功标记为已付。',
      paymentApproved: '付款已批准。',
      paymentRejected: '付款已拒绝。',
      lateFeeAdded: '滞纳金已添加。',
      lateFeeDeleted: '滞纳金已删除。',
      joinFeeDeleted: '入会费已删除。',
      exemptionRemoved: '豁免已移除。',
      exemptionSet: '会员已设为豁免。',
      recordCreated: '记录已创建。',
      imageUploaded: '二维码上传成功。',
    },
    settings: {
      title: '会费设置',
      paymentMethods: '付款方式',
      autoInvoice: '自动发票',
      autoInvoiceDesc: '自动发送月度发票',
      daysLabel: '天',
      dayOfMonth: '每月日期',
      addPaymentMethod: '添加付款方式',
      qrCode: '二维码',
      bank: '银行',
      venmo: 'Venmo',
      none: '无',
    },
    modals: {
      manageDues: '管理会费',
      approvePayment: '批准付款',
      approvePaymentConfirm: '批准此付款？',
      rejectPayment: '拒绝付款',
      rejectPaymentConfirm: '拒绝此付款？',
      manageLateFeesTitle: '管理滞纳金',
      manageLateFeesMessage: '总滞纳金：${{amount}}',
      manageJoinFee: '管理入会费',
      exemptionTitle: '设置豁免',
      exemptionConfirm: '将此会员设为会费豁免？',
      qrCodeDialog: '二维码',
      processPaymentDialog: '处理付款',
      paymentDetails: '付款请求详情',
      paymentReminder: '付款提醒',
    },
    overview: {
      title: '概览',
      totalMembers: '总会员数',
      totalOwed: '总欠款',
      totalPaid: '总已付',
      collectionRate: '收款率',
      pendingApproval: '待批准',
      memberDuesStatus: '会员会费状态',
      autoInvoiceLabel: '自动发票',
      noRecordsYet: '暂无会费记录',
      clickAutoInvoice: '点击上方"自动发票"可自动向所有会员发送月度发票。',
    },
    memberCard: {
      exempt: '豁免',
      duesExempt: '会费豁免',
      owed: '欠款',
      joinFeeLabel: '入会费',
      joinFeePaid: '入会费已付',
      joinFeeUnpaid: '入会费未付',
      joinFeeExempt: '入会费豁免',
      lateFeeLabel: '滞纳金',
      lateFeeItems: '项',
      unpaidLabel: '未付',
      unpaidCount: '{{count}}笔未付',
      paidStatus: '已付',
    },
    actions: {
      enable: '启用',
      activate: '启用',
      change: '更改',
      processPayment: '处理付款',
      markAsPaid: '标记为已付',
    },
  },
};

const updatedZhData = deepMerge(zhData, zhTranslations);
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZhData, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(enData, updatedZhData);
const translated = countUntranslated(enData, zhData) - afterCount;

console.log('✅ Translation complete!');
console.log(`📊 Translated ${translated} keys`);
console.log(`📋 Remaining untranslated: ${afterCount} keys`);
