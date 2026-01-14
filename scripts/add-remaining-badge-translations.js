const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Remaining badge translations
const badgeTranslations = {
  en: {
    perfectionist: { name: 'Perfectionist', desc: 'Win matches without losing a set' },
    early_adopter: { name: 'Early Adopter', desc: 'Join Lightning Tennis in its early days' },
  },
  ko: {
    perfectionist: { name: '완벽주의자', desc: '세트를 잃지 않고 경기에서 승리하세요' },
    early_adopter: { name: '얼리 어답터', desc: '번개 테니스 초기에 가입하세요' },
  },
  es: {
    perfectionist: { name: 'Perfeccionista', desc: 'Gana partidos sin perder un set' },
    early_adopter: { name: 'Pionero', desc: 'Únete a Lightning Tennis en sus primeros días' },
  },
  zh: {
    perfectionist: { name: '完美主义者', desc: '赢得比赛不失一盘' },
    early_adopter: { name: '早期采用者', desc: '在闪电网球早期加入' },
  },
  ja: {
    perfectionist: { name: '完璧主義者', desc: 'セットを落とさずに試合に勝つ' },
    early_adopter: { name: 'アーリーアダプター', desc: 'ライトニングテニスの初期に参加' },
  },
  vi: {
    perfectionist: { name: 'Người cầu toàn', desc: 'Thắng trận không thua set' },
    early_adopter: { name: 'Người dùng sớm', desc: 'Tham gia Lightning Tennis từ những ngày đầu' },
  },
  fr: {
    perfectionist: { name: 'Perfectionniste', desc: 'Gagnez des matchs sans perdre un set' },
    early_adopter: { name: 'Pionnier', desc: 'Rejoignez Lightning Tennis à ses débuts' },
  },
  de: {
    perfectionist: {
      name: 'Perfektionist',
      desc: 'Gewinnen Sie Spiele ohne einen Satz zu verlieren',
    },
    early_adopter: {
      name: 'Early Adopter',
      desc: 'Treten Sie Lightning Tennis in seinen Anfängen bei',
    },
  },
  it: {
    perfectionist: { name: 'Perfezionista', desc: 'Vinci partite senza perdere un set' },
    early_adopter: {
      name: 'Early Adopter',
      desc: 'Unisciti a Lightning Tennis nei suoi primi giorni',
    },
  },
  pt: {
    perfectionist: { name: 'Perfeccionista', desc: 'Vença partidas sem perder um set' },
    early_adopter: {
      name: 'Pioneiro',
      desc: 'Junte-se ao Lightning Tennis em seus primeiros dias',
    },
  },
};

// New condition translations
const conditionTranslations = {
  en: {
    wins: 'Win {{count}} match(es)',
    upsetWins: 'Defeat {{count}} higher-ranked opponent(s)',
    bagelWins: 'Win {{count}} set(s) 6-0',
    perfectMatches: 'Win {{count}} match(es) without losing a set',
    friendsCount: 'Make {{count}} friend(s)',
    clubsJoined: 'Join {{count}} club(s)',
    clubEventsAttended: 'Attend {{count}} club event(s)',
    joinDate: 'Joined before the cutoff date',
  },
  ko: {
    wins: '{{count}}경기 승리',
    upsetWins: '상위 랭킹 상대 {{count}}명 격파',
    bagelWins: '6-0 세트 {{count}}회 승리',
    perfectMatches: '세트 무실점 {{count}}경기 승리',
    friendsCount: '친구 {{count}}명 만들기',
    clubsJoined: '클럽 {{count}}개 가입',
    clubEventsAttended: '클럽 이벤트 {{count}}회 참석',
    joinDate: '초기 가입자',
  },
  es: {
    wins: 'Gana {{count}} partido(s)',
    upsetWins: 'Derrota a {{count}} oponente(s) mejor clasificado(s)',
    bagelWins: 'Gana {{count}} set(s) 6-0',
    perfectMatches: 'Gana {{count}} partido(s) sin perder un set',
    friendsCount: 'Haz {{count}} amigo(s)',
    clubsJoined: 'Únete a {{count}} club(es)',
    clubEventsAttended: 'Asiste a {{count}} evento(s) del club',
    joinDate: 'Unido antes de la fecha límite',
  },
  zh: {
    wins: '赢得{{count}}场比赛',
    upsetWins: '击败{{count}}名排名更高的对手',
    bagelWins: '赢得{{count}}次6-0比分',
    perfectMatches: '不失一盘赢得{{count}}场比赛',
    friendsCount: '交{{count}}个朋友',
    clubsJoined: '加入{{count}}个俱乐部',
    clubEventsAttended: '参加{{count}}次俱乐部活动',
    joinDate: '在截止日期前加入',
  },
  ja: {
    wins: '{{count}}試合勝利',
    upsetWins: 'ランキング上位の{{count}}人に勝利',
    bagelWins: '{{count}}回の6-0勝利',
    perfectMatches: 'セットを落とさず{{count}}試合勝利',
    friendsCount: '{{count}}人の友達を作る',
    clubsJoined: '{{count}}クラブに参加',
    clubEventsAttended: '{{count}}回のクラブイベントに参加',
    joinDate: '締め切り前に参加',
  },
  vi: {
    wins: 'Thắng {{count}} trận',
    upsetWins: 'Đánh bại {{count}} đối thủ xếp hạng cao hơn',
    bagelWins: 'Thắng {{count}} set 6-0',
    perfectMatches: 'Thắng {{count}} trận không thua set',
    friendsCount: 'Kết bạn {{count}} người',
    clubsJoined: 'Tham gia {{count}} câu lạc bộ',
    clubEventsAttended: 'Tham dự {{count}} sự kiện câu lạc bộ',
    joinDate: 'Tham gia trước ngày giới hạn',
  },
  fr: {
    wins: 'Gagnez {{count}} match(s)',
    upsetWins: 'Battez {{count}} adversaire(s) mieux classé(s)',
    bagelWins: 'Gagnez {{count}} set(s) 6-0',
    perfectMatches: 'Gagnez {{count}} match(s) sans perdre un set',
    friendsCount: 'Faites {{count}} ami(s)',
    clubsJoined: 'Rejoignez {{count}} club(s)',
    clubEventsAttended: 'Participez à {{count}} événement(s) de club',
    joinDate: 'Inscrit avant la date limite',
  },
  de: {
    wins: 'Gewinnen Sie {{count}} Spiel(e)',
    upsetWins: 'Besiegen Sie {{count}} höher platzierte(n) Gegner',
    bagelWins: 'Gewinnen Sie {{count}} Satz/Sätze 6-0',
    perfectMatches: 'Gewinnen Sie {{count}} Spiel(e) ohne Satzverlust',
    friendsCount: 'Finden Sie {{count}} Freund(e)',
    clubsJoined: 'Treten Sie {{count}} Club(s) bei',
    clubEventsAttended: 'Nehmen Sie an {{count}} Clubveranstaltung(en) teil',
    joinDate: 'Vor dem Stichtag beigetreten',
  },
  it: {
    wins: 'Vinci {{count}} partita/e',
    upsetWins: 'Batti {{count}} avversario/i meglio classificato/i',
    bagelWins: 'Vinci {{count}} set 6-0',
    perfectMatches: 'Vinci {{count}} partita/e senza perdere un set',
    friendsCount: 'Fai {{count}} amico/i',
    clubsJoined: 'Unisciti a {{count}} club',
    clubEventsAttended: 'Partecipa a {{count}} evento/i del club',
    joinDate: 'Iscritto prima della data limite',
  },
  pt: {
    wins: 'Vença {{count}} partida(s)',
    upsetWins: 'Derrote {{count}} adversário(s) melhor classificado(s)',
    bagelWins: 'Vença {{count}} set(s) 6-0',
    perfectMatches: 'Vença {{count}} partida(s) sem perder um set',
    friendsCount: 'Faça {{count}} amigo(s)',
    clubsJoined: 'Entre em {{count}} clube(s)',
    clubEventsAttended: 'Participe de {{count}} evento(s) do clube',
    joinDate: 'Inscrito antes da data limite',
  },
};

const languages = ['en', 'ko', 'es', 'zh', 'ja', 'vi', 'fr', 'de', 'it', 'pt'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add badge translations
    if (content.achievementsGuide && content.achievementsGuide.badgeItems) {
      // Add perfectionist
      if (!content.achievementsGuide.badgeItems.perfectionist) {
        content.achievementsGuide.badgeItems.perfectionist = badgeTranslations[lang].perfectionist;
      }
      // Add early_adopter
      if (!content.achievementsGuide.badgeItems.early_adopter) {
        content.achievementsGuide.badgeItems.early_adopter = badgeTranslations[lang].early_adopter;
      }

      // Add new conditions
      if (!content.achievementsGuide.badgeItems.conditions) {
        content.achievementsGuide.badgeItems.conditions = {};
      }

      Object.entries(conditionTranslations[lang]).forEach(([key, value]) => {
        if (!content.achievementsGuide.badgeItems.conditions[key]) {
          content.achievementsGuide.badgeItems.conditions[key] = value;
        }
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json with remaining badges and conditions`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Remaining badge translations added!');
