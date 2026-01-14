const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Season Trophy translations for all languages
const seasonTrophyTranslations = {
  en: {
    seasonChampion: 'Season Champion',
    seasonChampionDesc: 'Achieved 1st place in your LPR grade group',
    seasonRunnerUp: 'Season Runner-up',
    seasonRunnerUpDesc: 'Achieved 2nd place in your LPR grade group',
    season3rdPlace: 'Season 3rd Place',
    season3rdPlaceDesc: 'Achieved 3rd place in your LPR grade group',
    rankUp: 'Rank Up',
    rankUpDesc: 'Improved your LPR grade during the season',
    ironMan: 'Iron Man',
    ironManDesc: 'Top 10% in matches played this season',
    ace: 'Ace',
    aceDesc: 'Top 5% win rate with 10+ matches',
  },
  ko: {
    seasonChampion: '시즌 챔피언',
    seasonChampionDesc: 'LPR 등급 그룹 내 1위 달성',
    seasonRunnerUp: '시즌 준우승',
    seasonRunnerUpDesc: 'LPR 등급 그룹 내 2위 달성',
    season3rdPlace: '시즌 3위',
    season3rdPlaceDesc: 'LPR 등급 그룹 내 3위 달성',
    rankUp: '랭크업',
    rankUpDesc: '시즌 중 LPR 등급 상승',
    ironMan: '아이언맨',
    ironManDesc: '시즌 최다 경기 상위 10%',
    ace: '에이스',
    aceDesc: '10경기 이상 + 최고 승률 상위 5%',
  },
  es: {
    seasonChampion: 'Campeón de Temporada',
    seasonChampionDesc: 'Logró el 1er lugar en su grupo de grado LPR',
    seasonRunnerUp: 'Subcampeón de Temporada',
    seasonRunnerUpDesc: 'Logró el 2do lugar en su grupo de grado LPR',
    season3rdPlace: '3er Lugar de Temporada',
    season3rdPlaceDesc: 'Logró el 3er lugar en su grupo de grado LPR',
    rankUp: 'Subir de Rango',
    rankUpDesc: 'Mejoró su grado LPR durante la temporada',
    ironMan: 'Hombre de Hierro',
    ironManDesc: 'Top 10% en partidos jugados esta temporada',
    ace: 'As',
    aceDesc: 'Top 5% en tasa de victorias con 10+ partidos',
  },
  zh: {
    seasonChampion: '赛季冠军',
    seasonChampionDesc: '在您的LPR等级组中获得第1名',
    seasonRunnerUp: '赛季亚军',
    seasonRunnerUpDesc: '在您的LPR等级组中获得第2名',
    season3rdPlace: '赛季季军',
    season3rdPlaceDesc: '在您的LPR等级组中获得第3名',
    rankUp: '升级',
    rankUpDesc: '在赛季中提升了您的LPR等级',
    ironMan: '铁人',
    ironManDesc: '本赛季比赛场次前10%',
    ace: '王牌',
    aceDesc: '10+场比赛中胜率前5%',
  },
  ja: {
    seasonChampion: 'シーズンチャンピオン',
    seasonChampionDesc: 'LPRグレードグループで1位を達成',
    seasonRunnerUp: 'シーズン準優勝',
    seasonRunnerUpDesc: 'LPRグレードグループで2位を達成',
    season3rdPlace: 'シーズン3位',
    season3rdPlaceDesc: 'LPRグレードグループで3位を達成',
    rankUp: 'ランクアップ',
    rankUpDesc: 'シーズン中にLPRグレードが向上',
    ironMan: 'アイアンマン',
    ironManDesc: '今シーズンの試合数上位10%',
    ace: 'エース',
    aceDesc: '10試合以上で勝率上位5%',
  },
  vi: {
    seasonChampion: 'Nhà vô địch mùa giải',
    seasonChampionDesc: 'Đạt hạng 1 trong nhóm cấp LPR của bạn',
    seasonRunnerUp: 'Á quân mùa giải',
    seasonRunnerUpDesc: 'Đạt hạng 2 trong nhóm cấp LPR của bạn',
    season3rdPlace: 'Hạng 3 mùa giải',
    season3rdPlaceDesc: 'Đạt hạng 3 trong nhóm cấp LPR của bạn',
    rankUp: 'Thăng hạng',
    rankUpDesc: 'Cải thiện cấp LPR trong mùa giải',
    ironMan: 'Người sắt',
    ironManDesc: 'Top 10% số trận đấu trong mùa này',
    ace: 'Át chủ bài',
    aceDesc: 'Top 5% tỷ lệ thắng với 10+ trận',
  },
  fr: {
    seasonChampion: 'Champion de Saison',
    seasonChampionDesc: 'A obtenu la 1ère place dans votre groupe de niveau LPR',
    seasonRunnerUp: 'Vice-champion de Saison',
    seasonRunnerUpDesc: 'A obtenu la 2ème place dans votre groupe de niveau LPR',
    season3rdPlace: '3ème Place de Saison',
    season3rdPlaceDesc: 'A obtenu la 3ème place dans votre groupe de niveau LPR',
    rankUp: 'Montée en Grade',
    rankUpDesc: 'A amélioré votre niveau LPR pendant la saison',
    ironMan: 'Homme de Fer',
    ironManDesc: 'Top 10% des matchs joués cette saison',
    ace: 'As',
    aceDesc: 'Top 5% de taux de victoire avec 10+ matchs',
  },
  de: {
    seasonChampion: 'Saison-Champion',
    seasonChampionDesc: 'Platz 1 in Ihrer LPR-Gradgruppe erreicht',
    seasonRunnerUp: 'Saison-Zweiter',
    seasonRunnerUpDesc: 'Platz 2 in Ihrer LPR-Gradgruppe erreicht',
    season3rdPlace: 'Saison-Dritter',
    season3rdPlaceDesc: 'Platz 3 in Ihrer LPR-Gradgruppe erreicht',
    rankUp: 'Rangaufstieg',
    rankUpDesc: 'LPR-Grad während der Saison verbessert',
    ironMan: 'Eiserner Mann',
    ironManDesc: 'Top 10% der gespielten Spiele in dieser Saison',
    ace: 'Ass',
    aceDesc: 'Top 5% Gewinnrate mit 10+ Spielen',
  },
  it: {
    seasonChampion: 'Campione di Stagione',
    seasonChampionDesc: 'Ha raggiunto il 1° posto nel tuo gruppo di grado LPR',
    seasonRunnerUp: 'Vice Campione di Stagione',
    seasonRunnerUpDesc: 'Ha raggiunto il 2° posto nel tuo gruppo di grado LPR',
    season3rdPlace: '3° Posto di Stagione',
    season3rdPlaceDesc: 'Ha raggiunto il 3° posto nel tuo gruppo di grado LPR',
    rankUp: 'Promozione',
    rankUpDesc: 'Ha migliorato il tuo grado LPR durante la stagione',
    ironMan: 'Uomo di Ferro',
    ironManDesc: 'Top 10% nelle partite giocate questa stagione',
    ace: 'Asso',
    aceDesc: 'Top 5% tasso di vittoria con 10+ partite',
  },
  pt: {
    seasonChampion: 'Campeão da Temporada',
    seasonChampionDesc: 'Alcançou o 1º lugar no seu grupo de nível LPR',
    seasonRunnerUp: 'Vice-campeão da Temporada',
    seasonRunnerUpDesc: 'Alcançou o 2º lugar no seu grupo de nível LPR',
    season3rdPlace: '3º Lugar da Temporada',
    season3rdPlaceDesc: 'Alcançou o 3º lugar no seu grupo de nível LPR',
    rankUp: 'Subir de Rank',
    rankUpDesc: 'Melhorou seu nível LPR durante a temporada',
    ironMan: 'Homem de Ferro',
    ironManDesc: 'Top 10% em partidas jogadas nesta temporada',
    ace: 'Ás',
    aceDesc: 'Top 5% taxa de vitória com 10+ partidas',
  },
};

// Badge Achievement translations
const badgeTranslations = {
  en: {
    firstVictory: 'First Victory',
    firstVictoryDesc: 'Win your first match',
  },
  ko: {
    firstVictory: '첫 승리',
    firstVictoryDesc: '첫 경기에서 승리하세요',
  },
  es: {
    firstVictory: 'Primera Victoria',
    firstVictoryDesc: 'Gana tu primer partido',
  },
  zh: {
    firstVictory: '首胜',
    firstVictoryDesc: '赢得你的第一场比赛',
  },
  ja: {
    firstVictory: '初勝利',
    firstVictoryDesc: '最初の試合に勝つ',
  },
  vi: {
    firstVictory: 'Chiến thắng đầu tiên',
    firstVictoryDesc: 'Thắng trận đấu đầu tiên',
  },
  fr: {
    firstVictory: 'Première Victoire',
    firstVictoryDesc: 'Gagnez votre premier match',
  },
  de: {
    firstVictory: 'Erster Sieg',
    firstVictoryDesc: 'Gewinnen Sie Ihr erstes Spiel',
  },
  it: {
    firstVictory: 'Prima Vittoria',
    firstVictoryDesc: 'Vinci la tua prima partita',
  },
  pt: {
    firstVictory: 'Primeira Vitória',
    firstVictoryDesc: 'Vença sua primeira partida',
  },
};

const languages = ['en', 'ko', 'es', 'zh', 'ja', 'vi', 'fr', 'de', 'it', 'pt'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Add season trophies translations under achievementsGuide.seasonTrophyItems
    if (!content.achievementsGuide) {
      content.achievementsGuide = {};
    }

    content.achievementsGuide.seasonTrophyItems = seasonTrophyTranslations[lang];
    content.achievementsGuide.badgeItems = badgeTranslations[lang];

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${lang}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Season trophy translations added to all languages!');
