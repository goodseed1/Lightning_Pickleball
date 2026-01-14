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
  leagueDetail: {
    leagueDeleted: '联赛已删除',
    leagueDeletedByAdmin: '此联赛已被其他管理员删除。如需要，请创建新的联赛。',
    notification: '通知',
    selectParticipants: '请选择参赛者。',
    participantsAddedSuccess: '成功添加{{count}}位参赛者。',
    teamsAddedSuccess: '成功添加{{count}}支队伍。',
    selectPartner: '请选择搭档。',
    applicationComplete: '申请完成',
    applicationCompleteMessage: '您的联赛申请已提交。请等待批准。',
    invitationSent: '邀请已发送',
    adminCorrection: '管理员更正',
    adminScheduleChange: '管理员赛程变更',
    adminWalkover: '管理员判定弃权',
    champion: '冠军',
    runnerUp: '亚军',
    finalMatch: '决赛',
    semifinals: '半决赛',
    qualifiedTeams: '晋级队伍：',
    qualifiedPlayers: '晋级球员：',
    participantsTeams: '队伍',
    maxParticipants: '最大参赛人数',
    maxTeams: '最大队伍数',
    startAcceptingApplications: '开始接受申请',
    startApplicationsMessage: '在管理选项卡中点击"开始接受申请"',
    waitingForApplications: '申请将实时显示在此处',
    reasonLabel: '变更原因',
    walkoverReasonLabel: '弃权原因',
    league: '联赛',
    user: '用户',
    emptyStates: {
      noStandingsDescription: '比赛进行后将显示积分榜。',
      noParticipantsDescription: '申请将实时显示在此处',
    },
    loading: {
      league: '加载联赛信息中...',
      generatingBracket: '生成对阵表中...',
      generatingBracketSubtitle: '联赛即将开始',
    },
    errors: {
      leagueNotFound: '未找到联赛',
    },
    standings: {
      matches: '比赛',
      playoffTitle: '季后赛积分榜',
      thirdPlace: '第3名',
      fourthPlace: '第4名',
    },
    adminDashboard: {
      title: '管理员控制台',
      approved: '已批准',
      maxParticipants: '最大参赛人数',
      maxTeams: '最大队伍数',
      fillRate: '参与率',
      matchProgress: '比赛进度',
      participantListTitle: '参赛者列表',
      approvedTeam: '已批准队伍',
    },
    leagueManagement: {
      title: '联赛管理',
      generateBracketButton: '生成对阵表并开始联赛',
      dangerZoneTitle: '危险区域',
      minParticipantsDoubles: '双打联赛需要至少2支队伍（4名球员）。当前：{{count}}名球员',
    },
    playoffs: {
      inProgress: '季后赛进行中',
      format: '赛制：',
      winner: '冠军：',
      seasonComplete: '常规赛结束！',
      startButton: '开始季后赛',
      bracketToggle: '季后赛对阵表',
      standingsToggle: '积分榜',
    },
    matchApproval: {
      pendingDescription: '一次性批准所有提交的比赛结果。',
    },
    roundRobin: {
      inProgress: '循环赛进行中',
    },
    dialogs: {
      rescheduleTitle: '重新安排比赛',
      walkoverTitle: '处理弃权',
      walkoverQuestion: '应将哪位球员标记为弃权？',
      bulkApprovalTitle: '批量批准比赛结果',
      bulkApprovalMessage: '批准所有{{count}}场待定比赛结果？',
    },
    validation: {
      mensOnly: '仅限男子球员参加。',
      womensOnly: '仅限女子球员参加。',
      doublesNeedPartner: '双打需要搭档。',
      genderRestriction: '仅限{gender}球员参加。',
    },
    eventTypes: {
      mens_singles: '男子单打',
      womens_singles: '女子单打',
      mens_doubles: '男子双打',
      womens_doubles: '女子双打',
      mixed_doubles: '混合双打',
    },
    genderLabels: {
      male: '男子',
      female: '女子',
    },
  },

  clubTournamentManagement: {
    loading: '加载锦标赛中...',
    detailTabs: {
      matches: '比赛',
      participants: '参赛者',
      standings: '积分榜',
      management: '管理',
    },
    status: {
      bracketGeneration: '生成对阵表中',
    },
    participants: {
      label: '参赛者',
      overview: '参赛者概览',
      current: '当前参赛者',
      max: '最大参赛人数',
      list: '参赛者列表',
      count: '名参赛者',
      player1: '球员1',
      player2: '球员2',
    },
    buttons: {
      assignSeeds: '分配种子',
      completeAssignment: '完成分配',
      crownWinner: '加冕冠军',
      generateBracket: '生成对阵表中...',
    },
    stats: {
      champion: '冠军：',
      roundInProgress: '轮次进行中...',
      totalMatches: '总比赛数',
      currentRound: '当前轮次',
    },
    matchInfo: {
      skill: '技能',
      registered: '已注册',
      seed: '种子',
    },
    roundGeneration: {
      cannotGenerateTitle: '无法生成轮次',
      confirmMessage: '第{{current}}轮已完成。\n生成第{{next}}轮？',
      successMessage: '第{{round}}轮已成功生成！',
      currentRoundLabel: '当前轮次：第{{round}}轮',
      generating: '生成中...',
      generateNextRound: '生成第{{round}}轮',
    },
    tournamentStart: {
      participantErrorMessage: '当前参赛者数（{{current}}）与要求数量（{{required}}）不符。',
      manualSeedingMessage:
        '已启用手动种子分配。请在参赛者选项卡中分配种子，然后按"生成对阵表并开始"。',
      successTitle: '锦标赛已开始',
      successMessage: '锦标赛已成功开始！对阵表已生成。',
      bracketGeneratedMessage: '对阵表已生成。锦标赛已开始！',
      waitForParticipantAddition: '请等待参赛者添加完成。',
      addingParticipants: '添加参赛者中',
    },
    seedAssignment: {
      title: '分配种子',
      teamTitle: '分配队伍种子',
      prompt: '为{{name}}输入种子编号（1-{{max}}）：',
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
};

const updatedZhData = deepMerge(zhData, zhTranslations);
fs.writeFileSync(ZH_PATH, JSON.stringify(updatedZhData, null, 2) + '\n', 'utf8');

const afterCount = countUntranslated(enData, updatedZhData);
const translated = countUntranslated(enData, zhData) - afterCount;

console.log('✅ Translation complete!');
console.log(`📊 Translated ${translated} keys`);
console.log(`📋 Remaining untranslated: ${afterCount} keys`);
