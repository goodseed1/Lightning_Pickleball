/**
 * ⚡ LPR (Lightning Pickleball Rating) Level System
 *
 * 10 unique levels from 1 to 10 with multilingual descriptions
 * Supports: ko, en, es, fr, de, ja, zh, pt, it, ru
 *
 * 🎯 LPR 시스템 정책
 * - 이것은 번개 피클볼 커뮤니티의 독자적인 레이팅 시스템입니다
 * - ELO 알고리즘 기반으로 계산되며, 공용 번개 매치 결과에 적용됩니다
 * - USTA의 NTRP와는 다른, 번개 피클볼 고유의 시스템입니다
 *
 * 📝 Code/DB 네이밍 규칙
 * - 새 코드에서는 "ltr" 사용 (변수명, 함수명, 새 Firestore 필드)
 * - 기존 코드의 "ntrp" 필드는 마이그레이션 후 점진적으로 교체
 *
 * @author Kim (LPR System Transition)
 * @date 2025-12-28
 */

// Supported language codes
export type SupportedLanguage = 'ko' | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'it' | 'ru';

// Multilingual text type
export type MultilingualText = {
  [key in SupportedLanguage]: string;
};

/**
 * 🏆 LPR Tier System - Lightning Pickleball Tier Names
 *
 * Bronze (LPR 1-2): Spark - < 1100
 * Silver (LPR 3-4): Flash - 1100-1299
 * Gold (LPR 5-6): Bolt - 1300-1599
 * Platinum (LPR 7): Thunder - 1600-1799
 * Diamond (LPR 8): Storm - 1800-2099
 * Master (LPR 9): Ball Lightning - 2100-2399
 * Legend (LPR 10): Lightning God - ≥ 2400
 */
export type LtrTierName =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Legend';

export interface LtrTier {
  name: LtrTierName;
  theme: MultilingualText; // e.g., "Spark", "Flash", "Bolt"
  themeDescription: MultilingualText; // 부가 설명
  color: string; // Tier color
  eloMin: number;
  eloMax: number;
  levels: number[]; // LPR levels in this tier
}

export interface LtrLevel {
  value: number; // 1-10
  tier: LtrTierName; // 🆕 Tier name for this level
  label: MultilingualText;
  description: MultilingualText;
  skills: MultilingualText;
  tactics: MultilingualText;
  experience: MultilingualText;
  initialElo: number;
  eloMin: number; // Minimum ELO for this level
  eloMax: number; // Maximum ELO for this level (exclusive, except for level 10)
}

/**
 * 🏆 LPR Tier Definitions - Lightning Pickleball Tier System
 *
 * 티어별 테마와 ELO 범위 (사용자 요청 기반)
 */
export const LPR_TIERS: LtrTier[] = [
  {
    name: 'Bronze',
    theme: {
      ko: '불꽃 (Spark)',
      en: 'Spark',
      es: 'Chispa',
      fr: 'Étincelle',
      de: 'Funke',
      ja: 'スパーク',
      zh: '火花',
      pt: 'Faísca',
      it: 'Scintilla',
      ru: 'Искра',
    },
    themeDescription: {
      ko: '모든 전설은 첫 번째 랠리에서 시작됩니다.',
      en: 'Every legend begins with the first rally.',
      es: 'Toda leyenda comienza con el primer peloteo.',
      fr: 'Chaque légende commence par le premier échange.',
      de: 'Jede Legende beginnt mit dem ersten Ballwechsel.',
      ja: 'すべての伝説は最初のラリーから始まります。',
      zh: '每个传奇都从第一次对打开始。',
      pt: 'Toda lenda começa com o primeiro rally.',
      it: 'Ogni leggenda inizia con il primo scambio.',
      ru: 'Каждая легенда начинается с первого розыгрыша.',
    },
    color: '#CD7F32', // Bronze color
    eloMin: 0,
    eloMax: 1100,
    levels: [1, 2],
  },
  {
    name: 'Silver',
    theme: {
      ko: '섬광 (Flash)',
      en: 'Flash',
      es: 'Destello',
      fr: 'Éclair',
      de: 'Blitz',
      ja: 'フラッシュ',
      zh: '闪光',
      pt: 'Flash',
      it: 'Lampo',
      ru: 'Вспышка',
    },
    themeDescription: {
      ko: '이제 코트 위에서 당신만의 빛을 내기 시작합니다.',
      en: 'Now you begin to shine your own light on the court.',
      es: 'Ahora comienzas a brillar con luz propia en la cancha.',
      fr: 'Maintenant vous commencez à briller de votre propre lumière sur le court.',
      de: 'Jetzt beginnst du, dein eigenes Licht auf dem Platz zu zeigen.',
      ja: '今、コート上であなた自身の輝きを放ち始めます。',
      zh: '现在你开始在球场上闪耀自己的光芒。',
      pt: 'Agora você começa a brilhar com sua própria luz na quadra.',
      it: 'Ora inizi a brillare di luce propria sul campo.',
      ru: 'Теперь вы начинаете сиять своим светом на корте.',
    },
    color: '#C0C0C0', // Silver color
    eloMin: 1100,
    eloMax: 1300,
    levels: [3, 4],
  },
  {
    name: 'Gold',
    theme: {
      ko: '번개 (Bolt)',
      en: 'Bolt',
      es: 'Rayo',
      fr: 'Foudre',
      de: 'Blitz',
      ja: 'ボルト',
      zh: '闪电',
      pt: 'Raio',
      it: 'Fulmine',
      ru: 'Молния',
    },
    themeDescription: {
      ko: '안정적인 플레이로 경기를 지배하는 코트의 지휘관.',
      en: 'A court commander who dominates the game with steady play.',
      es: 'Un comandante de la cancha que domina el juego con juego estable.',
      fr: 'Un commandant du court qui domine le jeu avec un jeu régulier.',
      de: 'Ein Platzkommandant, der das Spiel mit stetigem Spiel dominiert.',
      ja: '安定したプレーで試合を支配するコートの司令官。',
      zh: '以稳定的发挥主宰比赛的球场指挥官。',
      pt: 'Um comandante da quadra que domina o jogo com jogo estável.',
      it: 'Un comandante del campo che domina il gioco con un gioco stabile.',
      ru: 'Командир корта, который доминирует в игре стабильной игрой.',
    },
    color: '#FFD700', // Gold color
    eloMin: 1300,
    eloMax: 1600,
    levels: [5, 6],
  },
  {
    name: 'Platinum',
    theme: {
      ko: '천둥 (Thunder)',
      en: 'Thunder',
      es: 'Trueno',
      fr: 'Tonnerre',
      de: 'Donner',
      ja: 'サンダー',
      zh: '雷霆',
      pt: 'Trovão',
      it: 'Tuono',
      ru: 'Гром',
    },
    themeDescription: {
      ko: '당신의 스트로크 하나하나가 천둥처럼 울려 퍼집니다.',
      en: 'Each of your strokes echoes like thunder.',
      es: 'Cada uno de tus golpes resuena como un trueno.',
      fr: 'Chacun de vos coups résonne comme le tonnerre.',
      de: 'Jeder Ihrer Schläge hallt wie Donner.',
      ja: 'あなたのストローク一つ一つが雷のように響きます。',
      zh: '你的每一次击球都如雷鸣般回响。',
      pt: 'Cada um dos seus golpes ecoa como um trovão.',
      it: 'Ogni tuo colpo risuona come un tuono.',
      ru: 'Каждый ваш удар звучит как гром.',
    },
    color: '#E5E4E2', // Platinum color
    eloMin: 1600,
    eloMax: 1800,
    levels: [7],
  },
  {
    name: 'Diamond',
    theme: {
      ko: '폭풍 (Storm)',
      en: 'Storm',
      es: 'Tormenta',
      fr: 'Tempête',
      de: 'Sturm',
      ja: 'ストーム',
      zh: '风暴',
      pt: 'Tempestade',
      it: 'Tempesta',
      ru: 'Шторм',
    },
    themeDescription: {
      ko: '코트를 휩쓰는 폭풍, 상대는 당신을 예측할 수 없습니다.',
      en: 'A storm sweeping across the court—opponents cannot predict you.',
      es: 'Una tormenta que barre la cancha—los oponentes no pueden predecirte.',
      fr: 'Une tempête balayant le court—les adversaires ne peuvent pas vous prédire.',
      de: 'Ein Sturm, der über den Platz fegt—Gegner können Sie nicht vorhersagen.',
      ja: 'コートを吹き荒れる嵐—相手はあなたを予測できません。',
      zh: '席卷球场的风暴——对手无法预测你。',
      pt: 'Uma tempestade varrendo a quadra—oponentes não podem prever você.',
      it: 'Una tempesta che spazza il campo—gli avversari non possono prevedere te.',
      ru: 'Шторм, проносящийся по корту—соперники не могут вас предсказать.',
    },
    color: '#B9F2FF', // Diamond color (light blue)
    eloMin: 1800,
    eloMax: 2100,
    levels: [8],
  },
  {
    name: 'Master',
    theme: {
      ko: '구상번개 (Ball Lightning)',
      en: 'Ball Lightning',
      es: 'Rayo Globular',
      fr: 'Foudre en Boule',
      de: 'Kugelblitz',
      ja: '球電',
      zh: '球状闪电',
      pt: 'Raio Globular',
      it: 'Fulmine Globulare',
      ru: 'Шаровая Молния',
    },
    themeDescription: {
      ko: '모든 기술을 통달한 코트 위의 마스터.',
      en: 'A master on the court who has mastered all skills.',
      es: 'Un maestro en la cancha que ha dominado todas las habilidades.',
      fr: 'Un maître sur le court qui a maîtrisé toutes les compétences.',
      de: 'Ein Meister auf dem Platz, der alle Fähigkeiten beherrscht.',
      ja: 'すべての技術を極めたコート上のマスター。',
      zh: '精通所有技术的球场大师。',
      pt: 'Um mestre na quadra que dominou todas as habilidades.',
      it: 'Un maestro sul campo che ha padroneggiato tutte le abilità.',
      ru: 'Мастер на корте, овладевший всеми навыками.',
    },
    color: '#1A1A2E', // Obsidian/Dark color
    eloMin: 2100,
    eloMax: 2400,
    levels: [9],
  },
  {
    name: 'Legend',
    theme: {
      ko: '번개신 (Lightning God)',
      en: 'Lightning God',
      es: 'Dios del Rayo',
      fr: 'Dieu de la Foudre',
      de: 'Blitzgott',
      ja: '雷神',
      zh: '雷神',
      pt: 'Deus do Raio',
      it: 'Dio del Fulmine',
      ru: 'Бог Молнии',
    },
    themeDescription: {
      ko: '당신은 이제 번개 피클볼의 살아있는 전설입니다.',
      en: 'You are now a living legend of Lightning Pickleball.',
      es: 'Ahora eres una leyenda viviente de Lightning Pickleball.',
      fr: 'Vous êtes maintenant une légende vivante de Lightning Pickleball.',
      de: 'Sie sind jetzt eine lebende Legende von Lightning Pickleball.',
      ja: 'あなたは今やライトニングテニスの生きた伝説です。',
      zh: '你现在是闪电网球的活传奇。',
      pt: 'Você agora é uma lenda viva do Lightning Pickleball.',
      it: 'Ora sei una leggenda vivente di Lightning Pickleball.',
      ru: 'Вы теперь живая легенда Lightning Pickleball.',
    },
    color: '#FFD700', // Legendary Gold
    eloMin: 2400,
    eloMax: 9999,
    levels: [10],
  },
];

/**
 * 🏆 LPR 10 Levels - Lightning Pickleball Rating System
 *
 * ELO 범위 (2025-12-28 업데이트):
 * - LPR 1 (Bronze - Spark): < 1000
 * - LPR 2 (Bronze - Spark): 1000-1099
 * - LPR 3 (Silver - Flash): 1100-1199
 * - LPR 4 (Silver - Flash): 1200-1299
 * - LPR 5 (Gold - Bolt): 1300-1449
 * - LPR 6 (Gold - Bolt): 1450-1599
 * - LPR 7 (Platinum - Thunder): 1600-1799
 * - LPR 8 (Diamond - Storm): 1800-2099
 * - LPR 9 (Master - Ball Lightning): 2100-2399
 * - LPR 10 (Legend - Lightning God): >= 2400
 */
export const LPR_LEVELS: LtrLevel[] = [
  // ============================================================================
  // LPR 1 - Bronze Spark (첫 발걸음)
  // ============================================================================
  {
    value: 1,
    tier: 'Bronze',
    label: {
      ko: 'Bronze I - 첫 발걸음',
      en: 'Bronze I - First Step',
      es: 'Bronce I - Primer Paso',
      fr: 'Bronze I - Premier Pas',
      de: 'Bronze I - Erster Schritt',
      ja: 'ブロンズ I - 最初の一歩',
      zh: '青铜 I - 第一步',
      pt: 'Bronze I - Primeiro Passo',
      it: 'Bronzo I - Primo Passo',
      ru: 'Бронза I - Первый Шаг',
    },
    description: {
      ko: '모든 전설은 첫 랠리에서 시작됩니다. 코트에 오신 것을 환영합니다!',
      en: 'Every legend begins with their first rally. Welcome to the court!',
      es: '¡Toda leyenda comienza con su primer peloteo. Bienvenido a la cancha!',
      fr: 'Chaque légende commence par son premier échange. Bienvenue sur le court!',
      de: 'Jede Legende beginnt mit ihrem ersten Ballwechsel. Willkommen auf dem Platz!',
      ja: 'すべての伝説は最初のラリーから始まります。コートへようこそ！',
      zh: '每个传奇都从第一次对打开始。欢迎来到球场！',
      pt: 'Toda lenda começa com seu primeiro rally. Bem-vindo à quadra!',
      it: 'Ogni leggenda inizia con il primo scambio. Benvenuto in campo!',
      ru: 'Каждая легенда начинается с первого розыгрыша. Добро пожаловать на корт!',
    },
    skills: {
      ko: '• 패들 그립과 기본 자세를 배우는 중\n• 공을 네트 너머로 넘기는 연습\n• 피클볼의 기본 규칙을 익히는 단계\n• 모든 것이 새롭고 신선한 경험',
      en: '• Learning paddle grip and basic stance\n• Practicing getting the ball over the net\n• Learning basic pickleball rules\n• Everything is a new and fresh experience',
      es: '• Aprendiendo agarre y postura básica\n• Practicando pasar la pelota sobre la red\n• Aprendiendo reglas básicas del tenis\n• Todo es una experiencia nueva y fresca',
      fr: '• Apprend la prise de raquette et la posture de base\n• Pratique pour passer la balle par-dessus le filet\n• Apprend les règles de base du pickleball\n• Tout est une expérience nouvelle et fraîche',
      de: '• Lernt Schlägerhaltung und Grundstellung\n• Übt den Ball über das Netz zu spielen\n• Lernt die Grundregeln des Pickleball\n• Alles ist eine neue und frische Erfahrung',
      ja: '• ラケットグリップと基本姿勢を学習中\n• ボールをネットの向こうへ打つ練習\n• テニスの基本ルールを学ぶ段階\n• すべてが新鮮で新しい経験',
      zh: '• 学习球拍握法和基本站姿\n• 练习将球打过网\n• 学习网球基本规则\n• 一切都是全新的体验',
      pt: '• Aprendendo empunhadura e postura básica\n• Praticando passar a bola sobre a rede\n• Aprendendo regras básicas do tênis\n• Tudo é uma experiência nova e fresca',
      it: "• Impara l'impugnatura e la postura base\n• Pratica per passare la palla oltre la rete\n• Impara le regole base del pickleball\n• Tutto è un'esperienza nuova e fresca",
      ru: '• Изучает хват ракетки и базовую стойку\n• Практикует перебрасывание мяча через сетку\n• Изучает базовые правила тенниса\n• Все новое и свежее',
    },
    tactics: {
      ko: '• 지금은 전술보다 즐거움이 우선!\n• 공을 치는 것 자체에 집중\n• 게임의 기본 흐름 이해 시작',
      en: '• Fun comes before tactics for now!\n• Focus on hitting the ball itself\n• Starting to understand basic game flow',
      es: '• ¡La diversión viene antes que la táctica por ahora!\n• Enfoque en golpear la pelota\n• Comenzando a entender el flujo del juego',
      fr: "• Le plaisir avant la tactique pour l'instant!\n• Se concentre sur frapper la balle\n• Commence à comprendre le flux du jeu",
      de: '• Spaß geht vor Taktik!\n• Konzentration auf das Schlagen des Balls\n• Beginnt den Spielablauf zu verstehen',
      ja: '• 今は戦術より楽しさが優先！\n• ボールを打つこと自体に集中\n• ゲームの基本的な流れを理解開始',
      zh: '• 现在乐趣比战术更重要！\n• 专注于击球本身\n• 开始理解比赛基本流程',
      pt: '• Diversão vem antes da tática por agora!\n• Foco em acertar a bola\n• Começando a entender o fluxo do jogo',
      it: '• Il divertimento viene prima della tattica per ora!\n• Focus sul colpire la palla\n• Inizia a capire il flusso del gioco',
      ru: '• Удовольствие важнее тактики!\n• Фокус на ударе по мячу\n• Начинает понимать ход игры',
    },
    experience: {
      ko: '• 피클볼 경험: 막 시작 ~ 3개월\n• 첫 패들을 잡는 설렘\n• 운동 파트너를 찾고 있는 단계',
      en: '• Pickleball experience: Just starting ~ 3 months\n• Excitement of holding first paddle\n• Looking for practice partners',
      es: '• Experiencia en tenis: Recién comenzando ~ 3 meses\n• Emoción de sostener la primera raqueta\n• Buscando compañeros de práctica',
      fr: "• Expérience pickleball: Début ~ 3 mois\n• Excitation de tenir sa première raquette\n• Cherche des partenaires d'entraînement",
      de: '• Pickleball-Erfahrung: Gerade angefangen ~ 3 Monate\n• Aufregung beim ersten Schläger\n• Sucht nach Trainingspartnern',
      ja: '• テニス経験: 始めたばかり～3ヶ月\n• 初めてのラケットを握るワクワク感\n• 練習パートナーを探している段階',
      zh: '• 网球经验: 刚开始~3个月\n• 握住第一支球拍的兴奋\n• 正在寻找练习伙伴',
      pt: '• Experiência em tênis: Começando ~ 3 meses\n• Emoção de segurar a primeira raquete\n• Procurando parceiros de prática',
      it: '• Esperienza pickleball: Appena iniziato ~ 3 mesi\n• Emozione di tenere la prima racchetta\n• Cercando partner di pratica',
      ru: '• Опыт тенниса: Начало ~ 3 месяца\n• Волнение от первой ракетки\n• Ищет партнеров для практики',
    },
    initialElo: 950,
    eloMin: 0,
    eloMax: 1000,
  },

  // ============================================================================
  // LPR 2 - Bronze II (시작의 불꽃)
  // ============================================================================
  {
    value: 2,
    tier: 'Bronze',
    label: {
      ko: 'Bronze II - 시작의 불꽃',
      en: 'Bronze II - Spark',
      es: 'Bronce II - Chispa',
      fr: 'Bronze II - Étincelle',
      de: 'Bronze II - Funke',
      ja: 'ブロンズ II - スパーク',
      zh: '青铜 II - 火花',
      pt: 'Bronze II - Faísca',
      it: 'Bronzo II - Scintilla',
      ru: 'Бронза II - Искра',
    },
    description: {
      ko: '작은 불꽃이 피어오릅니다! 피클볼의 기초가 자리 잡기 시작했어요.',
      en: 'A small spark ignites! The foundations of pickleball are taking root.',
      es: '¡Una pequeña chispa se enciende! Los fundamentos del tenis están echando raíces.',
      fr: "Une petite étincelle s'allume! Les bases du pickleball prennent racine.",
      de: 'Ein kleiner Funke entzündet sich! Die Pickleball-Grundlagen wurzeln.',
      ja: '小さな火花が灯ります！テニスの基礎が根付き始めました。',
      zh: '小小的火花点燃！网球基础正在生根。',
      pt: 'Uma pequena faísca acende! Os fundamentos do tênis estão criando raízes.',
      it: 'Una piccola scintilla si accende! Le basi del pickleball stanno mettendo radici.',
      ru: 'Маленькая искра загорается! Основы тенниса укореняются.',
    },
    skills: {
      ko: '• 포핸드: 짧은 거리에서 랠리 가능\n• 백핸드: 아직 불안정, 연습 중\n• 서브: 언더핸드 또는 느린 오버핸드\n• 발리: 네트 근처에서 간단한 시도',
      en: '• Forehand: Can rally at short distance\n• Backhand: Still unstable, practicing\n• Serve: Underhand or slow overhand\n• Volley: Simple attempts near net',
      es: '• Derecha: Puede pelotear a corta distancia\n• Revés: Aún inestable, practicando\n• Saque: Por debajo o lento por encima\n• Volea: Intentos simples cerca de la red',
      fr: '• Coup droit: Peut échanger à courte distance\n• Revers: Encore instable, en pratique\n• Service: Par en dessous ou lent\n• Volée: Essais simples près du filet',
      de: '• Vorhand: Kann kurz rallyen\n• Rückhand: Noch instabil, übt\n• Aufschlag: Unterhand oder langsam\n• Volley: Einfache Versuche am Netz',
      ja: '• フォアハンド: 短い距離でラリー可能\n• バックハンド: まだ不安定、練習中\n• サーブ: アンダーハンドまたは遅いオーバーハンド\n• ボレー: ネット近くで簡単な試み',
      zh: '• 正手: 可以短距离对打\n• 反手: 仍不稳定，练习中\n• 发球: 下手或慢速上手发球\n• 截击: 网前简单尝试',
      pt: '• Forehand: Pode trocar bolas em curta distância\n• Backhand: Ainda instável, praticando\n• Saque: Por baixo ou lento\n• Voleio: Tentativas simples perto da rede',
      it: '• Dritto: Può palleggiare a breve distanza\n• Rovescio: Ancora instabile, praticando\n• Servizio: Sottomano o lento\n• Volée: Tentativi semplici vicino alla rete',
      ru: '• Форхенд: Может играть на короткой дистанции\n• Бэкхенд: Еще нестабильный, практикует\n• Подача: Снизу или медленная сверху\n• Воллей: Простые попытки у сетки',
    },
    tactics: {
      ko: '• 공을 코트 안에 넣는 것에 집중\n• 베이스라인 근처에서 주로 플레이\n• 랠리를 유지하는 법을 배우는 중',
      en: '• Focus on keeping ball in court\n• Mainly play near baseline\n• Learning to maintain rallies',
      es: '• Enfocado en mantener la pelota en la cancha\n• Juega principalmente cerca de la línea de fondo\n• Aprendiendo a mantener peloteos',
      fr: '• Se concentre sur garder la balle en jeu\n• Joue principalement près de la ligne de fond\n• Apprend à maintenir les échanges',
      de: '• Fokus auf Ball im Feld halten\n• Spielt hauptsächlich an der Grundlinie\n• Lernt Ballwechsel aufrechtzuerhalten',
      ja: '• ボールをコート内に保つことに集中\n• 主にベースライン近くでプレー\n• ラリーを維持する方法を学習中',
      zh: '• 专注于将球保持在场内\n• 主要在底线附近打球\n• 学习保持对打',
      pt: '• Foco em manter a bola na quadra\n• Joga principalmente perto da linha de fundo\n• Aprendendo a manter os ralis',
      it: '• Focus sul tenere la palla in campo\n• Gioca principalmente vicino alla linea di fondo\n• Impara a mantenere gli scambi',
      ru: '• Фокус на удержании мяча в корте\n• В основном играет у задней линии\n• Учится поддерживать розыгрыши',
    },
    experience: {
      ko: '• 피클볼 경험: 3-6개월\n• 클럽 내 연습 경기 경험\n• 피클볼에 대한 열정이 자라나는 중',
      en: '• Pickleball experience: 3-6 months\n• Club practice match experience\n• Passion for pickleball is growing',
      es: '• Experiencia en tenis: 3-6 meses\n• Experiencia en partidos de práctica del club\n• La pasión por el tenis está creciendo',
      fr: "• Expérience pickleball: 3-6 mois\n• Expérience de matchs d'entraînement en club\n• La passion pour le pickleball grandit",
      de: '• Pickleball-Erfahrung: 3-6 Monate\n• Club-Trainingsmatch-Erfahrung\n• Die Leidenschaft für Pickleball wächst',
      ja: '• テニス経験: 3-6ヶ月\n• クラブ内練習試合の経験\n• テニスへの情熱が育っている',
      zh: '• 网球经验: 3-6个月\n• 俱乐部练习赛经验\n• 对网球的热情正在增长',
      pt: '• Experiência em tênis: 3-6 meses\n• Experiência em jogos de prática do clube\n• Paixão pelo tênis está crescendo',
      it: '• Esperienza pickleball: 3-6 mesi\n• Esperienza partite di pratica al club\n• La passione per il pickleball sta crescendo',
      ru: '• Опыт тенниса: 3-6 месяцев\n• Опыт тренировочных матчей в клубе\n• Страсть к теннису растет',
    },
    initialElo: 1050,
    eloMin: 1000,
    eloMax: 1100,
  },

  // ============================================================================
  // LPR 3 - Silver I (섬광)
  // ============================================================================
  {
    value: 3,
    tier: 'Silver',
    label: {
      ko: 'Silver I - 섬광',
      en: 'Silver I - Flash',
      es: 'Plata I - Destello',
      fr: 'Argent I - Éclair',
      de: 'Silber I - Blitz',
      ja: 'シルバー I - フラッシュ',
      zh: '白银 I - 闪光',
      pt: 'Prata I - Flash',
      it: 'Argento I - Lampo',
      ru: 'Серебро I - Вспышка',
    },
    description: {
      ko: '이제 코트 위에서 당신만의 빛을 내기 시작합니다!',
      en: 'Now you begin to shine your own light on the court!',
      es: '¡Ahora comienzas a brillar con luz propia en la cancha!',
      fr: 'Maintenant vous commencez à briller de votre propre lumière sur le court!',
      de: 'Jetzt beginnst du, dein eigenes Licht auf dem Platz zu zeigen!',
      ja: '今、コート上であなた自身の輝きを放ち始めます！',
      zh: '现在你开始在球场上闪耀自己的光芒！',
      pt: 'Agora você começa a brilhar com sua própria luz na quadra!',
      it: 'Ora inizi a brillare di luce propria sul campo!',
      ru: 'Теперь вы начинаете сиять своим светом на корте!',
    },
    skills: {
      ko: '• 포핸드: 중간 속도로 일관성 있는 스트로크\n• 백핸드: 안정적이지만 아직 약점\n• 서브: 중간 속도 서브, 가끔 더블폴트\n• 발리: 중간 속도 공을 발리 가능',
      en: '• Forehand: Consistent medium-pace strokes\n• Backhand: Steady but still a weakness\n• Serve: Medium-pace serve, occasional double faults\n• Volley: Can volley medium-pace balls',
      es: '• Derecha: Golpes consistentes a ritmo medio\n• Revés: Estable pero aún una debilidad\n• Saque: Ritmo medio, dobles faltas ocasionales\n• Volea: Puede volear pelotas a ritmo medio',
      fr: '• Coup droit: Coups réguliers à rythme moyen\n• Revers: Stable mais encore un point faible\n• Service: Rythme moyen, doubles fautes occasionnelles\n• Volée: Peut volleyer des balles à rythme moyen',
      de: '• Vorhand: Konstante mittelschnelle Schläge\n• Rückhand: Stabil aber noch eine Schwäche\n• Aufschlag: Mitteltempo, gelegentlich Doppelfehler\n• Volley: Kann mittelschnelle Bälle volleyen',
      ja: '• フォアハンド: 中程度の速度で一貫したストローク\n• バックハンド: 安定しているがまだ弱点\n• サーブ: 中程度の速度、時々ダブルフォルト\n• ボレー: 中程度の速度のボールをボレー可能',
      zh: '• 正手: 中速稳定击球\n• 反手: 稳定但仍是弱点\n• 发球: 中速发球，偶尔双误\n• 截击: 可以截击中速球',
      pt: '• Forehand: Golpes consistentes em ritmo médio\n• Backhand: Estável mas ainda uma fraqueza\n• Saque: Ritmo médio, duplas faltas ocasionais\n• Voleio: Pode volear bolas em ritmo médio',
      it: '• Dritto: Colpi costanti a ritmo medio\n• Rovescio: Stabile ma ancora un punto debole\n• Servizio: Ritmo medio, doppi falli occasionali\n• Volée: Può fare volée a ritmo medio',
      ru: '• Форхенд: Стабильные удары в среднем темпе\n• Бэкхенд: Стабильный но еще слабость\n• Подача: Средний темп, иногда двойные\n• Воллей: Может играть средний темп',
    },
    tactics: {
      ko: '• 코트 커버리지 이해 시작\n• 상대 약점을 가끔 공략\n• 베이스라인에서 주로 플레이',
      en: '• Beginning court coverage understanding\n• Occasionally targets opponent weakness\n• Mainly plays from baseline',
      es: '• Comienza a entender la cobertura de cancha\n• Ocasionalmente ataca debilidades del oponente\n• Juega principalmente desde la línea de fondo',
      fr: '• Commence à comprendre la couverture du court\n• Cible parfois les faiblesses adverses\n• Joue principalement du fond du court',
      de: '• Beginnt Platzabdeckung zu verstehen\n• Nutzt manchmal Schwächen des Gegners\n• Spielt hauptsächlich von der Grundlinie',
      ja: '• コートカバレッジの理解が始まる\n• 時々相手の弱点を狙う\n• 主にベースラインからプレー',
      zh: '• 开始理解场地覆盖\n• 偶尔针对对手弱点\n• 主要在底线打球',
      pt: '• Começando a entender cobertura de quadra\n• Ocasionalmente ataca fraquezas do oponente\n• Joga principalmente do fundo da quadra',
      it: '• Inizia a capire la copertura del campo\n• Occasionalmente mira alle debolezze avversarie\n• Gioca principalmente dal fondo campo',
      ru: '• Начинает понимать покрытие корта\n• Иногда атакует слабости соперника\n• В основном играет с задней линии',
    },
    experience: {
      ko: '• 피클볼 경험: 6개월-1년\n• 클럽 토너먼트 참가 경험\n• 일관된 플레이가 가능해짐',
      en: '• Pickleball experience: 6 months-1 year\n• Club tournament participation\n• Consistent play becomes possible',
      es: '• Experiencia en tenis: 6 meses-1 año\n• Participación en torneos de club\n• El juego consistente se vuelve posible',
      fr: '• Expérience pickleball: 6 mois-1 an\n• Participation à des tournois de club\n• Le jeu régulier devient possible',
      de: '• Pickleball-Erfahrung: 6 Monate-1 Jahr\n• Clubturnier-Teilnahme\n• Konstantes Spiel wird möglich',
      ja: '• テニス経験: 6ヶ月-1年\n• クラブトーナメント参加経験\n• 一貫したプレーが可能に',
      zh: '• 网球经验: 6个月-1年\n• 俱乐部锦标赛参赛经验\n• 稳定发挥成为可能',
      pt: '• Experiência em tênis: 6 meses-1 ano\n• Participação em torneios de clube\n• Jogo consistente se torna possível',
      it: '• Esperienza pickleball: 6 mesi-1 anno\n• Partecipazione a tornei di club\n• Il gioco costante diventa possibile',
      ru: '• Опыт тенниса: 6 месяцев-1 год\n• Участие в клубных турнирах\n• Стабильная игра становится возможной',
    },
    initialElo: 1150,
    eloMin: 1100,
    eloMax: 1200,
  },

  // ============================================================================
  // LPR 4 - Silver II (번개의 기운)
  // ============================================================================
  {
    value: 4,
    tier: 'Silver',
    label: {
      ko: 'Silver II - 번개의 기운',
      en: 'Silver II - Lightning Spirit',
      es: 'Plata II - Espíritu del Rayo',
      fr: "Argent II - Esprit de l'Éclair",
      de: 'Silber II - Blitzgeist',
      ja: 'シルバー II - 稲妻の気',
      zh: '白银 II - 闪电之魂',
      pt: 'Prata II - Espírito do Raio',
      it: 'Argento II - Spirito del Fulmine',
      ru: 'Серебро II - Дух Молнии',
    },
    description: {
      ko: '번개 피클볼의 진정한 멤버! 안정적인 플레이로 경기를 즐길 수 있습니다.',
      en: 'A true Lightning Pickleball member! You can enjoy matches with steady play.',
      es: '¡Un verdadero miembro de Lightning Pickleball! Puedes disfrutar partidos con juego estable.',
      fr: 'Un vrai membre de Lightning Pickleball! Vous pouvez profiter des matchs avec un jeu stable.',
      de: 'Ein echtes Lightning Pickleball Mitglied! Sie können Matches mit stetigem Spiel genießen.',
      ja: '真のライトニングテニスメンバー！安定したプレーで試合を楽しめます。',
      zh: '真正的闪电网球成员！稳定的打法让你享受比赛。',
      pt: 'Um verdadeiro membro do Lightning Pickleball! Você pode aproveitar jogos com jogo estável.',
      it: 'Un vero membro di Lightning Pickleball! Puoi goderti le partite con un gioco stabile.',
      ru: 'Настоящий член Lightning Pickleball! Вы можете наслаждаться матчами со стабильной игрой.',
    },
    skills: {
      ko: '• 포핸드: 방향 조절 가능, 스핀 시도\n• 백핸드: 안정적이고 가끔 공격적\n• 서브: 일관된 퍼스트 서브, 스핀 서브 연습\n• 발리: 네트 플레이 능숙해짐',
      en: '• Forehand: Directional control, attempting spin\n• Backhand: Steady and occasionally aggressive\n• Serve: Consistent first serve, practicing spin serves\n• Volley: Becoming proficient at net play',
      es: '• Derecha: Control direccional, intentando spin\n• Revés: Estable y ocasionalmente agresivo\n• Saque: Primer saque consistente, practicando spin\n• Volea: Volviéndose competente en el juego de red',
      fr: '• Coup droit: Contrôle directionnel, essayant le spin\n• Revers: Stable et parfois agressif\n• Service: Premier service régulier, pratique le spin\n• Volée: Devient compétent au filet',
      de: '• Vorhand: Richtungskontrolle, versucht Spin\n• Rückhand: Stabil und gelegentlich aggressiv\n• Aufschlag: Konstanter erster Aufschlag, übt Spin\n• Volley: Wird am Netz versierter',
      ja: '• フォアハンド: 方向調節可能、スピン試行\n• バックハンド: 安定し時々攻撃的\n• サーブ: 一貫したファーストサーブ、スピンサーブ練習\n• ボレー: ネットプレーが上達',
      zh: '• 正手: 方向控制，尝试旋转\n• 反手: 稳定且偶尔有攻击性\n• 发球: 稳定的一发，练习旋转发球\n• 截击: 网前技术日益熟练',
      pt: '• Forehand: Controle direcional, tentando spin\n• Backhand: Estável e ocasionalmente agressivo\n• Saque: Primeiro saque consistente, praticando spin\n• Voleio: Tornando-se proficiente no jogo de rede',
      it: '• Dritto: Controllo direzionale, provando spin\n• Rovescio: Stabile e occasionalmente aggressivo\n• Servizio: Primo servizio costante, praticando spin\n• Volée: Diventando abile nel gioco a rete',
      ru: '• Форхенд: Контроль направления, пробует вращение\n• Бэкхенд: Стабильный и иногда агрессивный\n• Подача: Стабильная первая, практикует вращение\n• Воллей: Становится умелым у сетки',
    },
    tactics: {
      ko: '• 포인트 구성 능력 발전\n• 상대 약점 지속적 공략\n• 네트 플레이와 베이스라인 병행 시작',
      en: '• Point construction ability developing\n• Consistently targets opponent weakness\n• Starting to mix net play and baseline',
      es: '• Desarrollando capacidad de construir puntos\n• Ataca debilidades consistentemente\n• Comenzando a mezclar red y fondo',
      fr: '• Capacité de construction de point en développement\n• Cible les faiblesses régulièrement\n• Commence à mélanger filet et fond de court',
      de: '• Punktaufbau-Fähigkeit entwickelt sich\n• Nutzt Schwächen konsequent\n• Beginnt Netz- und Grundlinienspiel zu mischen',
      ja: '• ポイント構成能力が発展\n• 相手の弱点を継続的に狙う\n• ネットプレーとベースラインの併用開始',
      zh: '• 得分构建能力发展中\n• 持续针对对手弱点\n• 开始结合网前和底线打法',
      pt: '• Capacidade de construir pontos desenvolvendo\n• Ataca fraquezas consistentemente\n• Começando a misturar jogo de rede e fundo',
      it: '• Capacità di costruire punti in sviluppo\n• Mira alle debolezze costantemente\n• Inizia a mescolare gioco a rete e fondo',
      ru: '• Способность строить очки развивается\n• Постоянно атакует слабости\n• Начинает сочетать игру у сетки и на задней',
    },
    experience: {
      ko: '• 피클볼 경험: 1-2년\n• 지역 토너먼트 참가\n• 전략적 플레이 가능',
      en: '• Pickleball experience: 1-2 years\n• Local tournament participation\n• Strategic play possible',
      es: '• Experiencia en tenis: 1-2 años\n• Participación en torneos locales\n• Juego estratégico posible',
      fr: '• Expérience pickleball: 1-2 ans\n• Participation à des tournois locaux\n• Jeu stratégique possible',
      de: '• Pickleball-Erfahrung: 1-2 Jahre\n• Lokale Turnierteilnahme\n• Strategisches Spiel möglich',
      ja: '• テニス経験: 1-2年\n• 地域トーナメント参加\n• 戦略的プレーが可能',
      zh: '• 网球经验: 1-2年\n• 地区锦标赛参赛\n• 战略性打法成为可能',
      pt: '• Experiência em tênis: 1-2 anos\n• Participação em torneios locais\n• Jogo estratégico possível',
      it: '• Esperienza pickleball: 1-2 anni\n• Partecipazione a tornei locali\n• Gioco strategico possibile',
      ru: '• Опыт тенниса: 1-2 года\n• Участие в местных турнирах\n• Стратегическая игра возможна',
    },
    initialElo: 1250,
    eloMin: 1200,
    eloMax: 1300,
  },

  // ============================================================================
  // LPR 5 - Gold I (번개) - 온보딩 캡
  // ============================================================================
  {
    value: 5,
    tier: 'Gold',
    label: {
      ko: 'Gold I - 번개',
      en: 'Gold I - Bolt',
      es: 'Oro I - Rayo',
      fr: 'Or I - Foudre',
      de: 'Gold I - Blitz',
      ja: 'ゴールド I - ボルト',
      zh: '黄金 I - 闪电',
      pt: 'Ouro I - Raio',
      it: 'Oro I - Fulmine',
      ru: 'Золото I - Молния',
    },
    description: {
      ko: '안정적인 플레이로 경기를 지배하는 코트의 지휘관.',
      en: 'A court commander who dominates the game with steady play.',
      es: '¡Un comandante de la cancha que domina el juego con juego estable!',
      fr: 'Un commandant du court qui domine le jeu avec un jeu régulier!',
      de: 'Ein Platzkommandant, der das Spiel mit stetigem Spiel dominiert!',
      ja: '安定したプレーで試合を支配するコートの司令官！',
      zh: '以稳定的发挥主宰比赛的球场指挥官！',
      pt: 'Um comandante da quadra que domina o jogo com jogo estável!',
      it: 'Un comandante del campo che domina il gioco con un gioco stabile!',
      ru: 'Командир корта, который доминирует в игре стабильной игрой!',
    },
    skills: {
      ko: '• 포핸드: 강력하고 다양한 스핀\n• 백핸드: 공격 무기로 활용 가능\n• 서브: 강력한 퍼스트 서브, 킥/슬라이스 서브\n• 발리: 다양한 각도와 속도 조절',
      en: '• Forehand: Powerful with variety of spins\n• Backhand: Can use as attacking weapon\n• Serve: Strong first serve, kick/slice serves\n• Volley: Variety of angles and pace control',
      es: '• Derecha: Potente con variedad de spins\n• Revés: Puede usar como arma de ataque\n• Saque: Primer saque fuerte, kick/slice\n• Volea: Variedad de ángulos y control de ritmo',
      fr: "• Coup droit: Puissant avec variété de spins\n• Revers: Peut utiliser comme arme d'attaque\n• Service: Premier service fort, kick/slice\n• Volée: Variété d'angles et contrôle du rythme",
      de: '• Vorhand: Kraftvoll mit verschiedenen Spins\n• Rückhand: Kann als Angriffswaffe nutzen\n• Aufschlag: Starker erster Aufschlag, Kick/Slice\n• Volley: Verschiedene Winkel und Tempokontrolle',
      ja: '• フォアハンド: 強力で多様なスピン\n• バックハンド: 攻撃武器として活用可能\n• サーブ: 強力なファーストサーブ、キック/スライス\n• ボレー: 様々な角度と速度調整',
      zh: '• 正手: 强力多样旋转\n• 反手: 可作为进攻武器\n• 发球: 强力一发，上旋/切削发球\n• 截击: 多角度和速度控制',
      pt: '• Forehand: Potente com variedade de spins\n• Backhand: Pode usar como arma de ataque\n• Saque: Primeiro saque forte, kick/slice\n• Voleio: Variedade de ângulos e controle de ritmo',
      it: "• Dritto: Potente con varietà di spin\n• Rovescio: Può usare come arma d'attacco\n• Servizio: Primo servizio forte, kick/slice\n• Volée: Varietà di angoli e controllo del ritmo",
      ru: '• Форхенд: Мощный с разным вращением\n• Бэкхенд: Может использовать как оружие\n• Подача: Сильная первая, кик/слайс\n• Воллей: Разные углы и контроль темпа',
    },
    tactics: {
      ko: '• 포인트 패턴 구사\n• 상황에 따른 전술 변경\n• 공격/수비 전환 능숙',
      en: '• Executes point patterns\n• Tactical changes based on situation\n• Proficient offense/defense transition',
      es: '• Ejecuta patrones de punto\n• Cambios tácticos según situación\n• Transición ataque/defensa competente',
      fr: '• Exécute des schémas de point\n• Changements tactiques selon situation\n• Transition attaque/défense compétente',
      de: '• Führt Punktmuster aus\n• Taktische Anpassung je nach Situation\n• Geübter Angriff/Verteidigungs-Wechsel',
      ja: '• ポイントパターンを実行\n• 状況に応じた戦術変更\n• 攻撃/守備の切り替えが熟練',
      zh: '• 执行得分模式\n• 根据情况改变战术\n• 熟练攻防转换',
      pt: '• Executa padrões de ponto\n• Mudanças táticas conforme situação\n• Transição ataque/defesa competente',
      it: '• Esegue schemi di punto\n• Cambi tattici in base alla situazione\n• Transizione attacco/difesa competente',
      ru: '• Выполняет точечные паттерны\n• Тактические изменения по ситуации\n• Умелый переход атака/защита',
    },
    experience: {
      ko: '• 피클볼 경험: 2-4년\n• 지역 토너먼트 우승 경력\n• 압박 상황 대처 가능',
      en: '• Pickleball experience: 2-4 years\n• Local tournament wins\n• Handles pressure situations',
      es: '• Experiencia en tenis: 2-4 años\n• Victorias en torneos locales\n• Maneja situaciones de presión',
      fr: '• Expérience pickleball: 2-4 ans\n• Victoires en tournois locaux\n• Gère les situations de pression',
      de: '• Pickleball-Erfahrung: 2-4 Jahre\n• Lokale Turniersiege\n• Meistert Drucksituationen',
      ja: '• テニス経験: 2-4年\n• 地域トーナメント優勝経験\n• プレッシャー状況に対処可能',
      zh: '• 网球经验: 2-4年\n• 地区锦标赛冠军\n• 能应对压力情况',
      pt: '• Experiência em tênis: 2-4 anos\n• Vitórias em torneios locais\n• Lida com situações de pressão',
      it: '• Esperienza pickleball: 2-4 anni\n• Vittorie in tornei locali\n• Gestisce situazioni di pressione',
      ru: '• Опыт тенниса: 2-4 года\n• Победы на местных турнирах\n• Справляется с давлением',
    },
    initialElo: 1375,
    eloMin: 1300,
    eloMax: 1450,
  },

  // ============================================================================
  // LPR 6 - Gold II (천둥의 울림)
  // ============================================================================
  {
    value: 6,
    tier: 'Gold',
    label: {
      ko: 'Gold II - 천둥의 울림',
      en: 'Gold II - Thunder Roll',
      es: 'Oro II - Retumbar del Trueno',
      fr: 'Or II - Grondement du Tonnerre',
      de: 'Gold II - Donnergrollen',
      ja: 'ゴールド II - 雷鳴',
      zh: '黄金 II - 雷声滚滚',
      pt: 'Ouro II - Estrondo do Trovão',
      it: 'Oro II - Rombo del Tuono',
      ru: 'Золото II - Раскат Грома',
    },
    description: {
      ko: '천둥처럼 강력한 존재감! 경기장에 당신의 울림이 퍼집니다.',
      en: 'Presence as powerful as thunder! Your impact resonates across the court.',
      es: '¡Presencia tan poderosa como el trueno! Tu impacto resuena en toda la cancha.',
      fr: 'Présence aussi puissante que le tonnerre! Votre impact résonne sur le court.',
      de: 'Präsenz so kraftvoll wie Donner! Ihre Wirkung hallt über den Platz.',
      ja: '雷のように強力な存在感！あなたの影響力がコート全体に響きます。',
      zh: '如雷霆般强大的存在感！你的影响力在球场上回响。',
      pt: 'Presença tão poderosa quanto o trovão! Seu impacto ressoa por toda a quadra.',
      it: 'Presenza potente come il tuono! Il tuo impatto risuona in tutto il campo.',
      ru: 'Присутствие мощное как гром! Ваше влияние резонирует по всему корту.',
    },
    skills: {
      ko: '• 포핸드: 모든 종류의 스핀, 속도, 각도 구사\n• 백핸드: 주요 공격 무기\n• 서브: 에이스 가능, 다양한 서브 구사\n• 발리: 반사 신경 빠르고 정확한 배치',
      en: '• Forehand: All types of spin, pace, angles\n• Backhand: Primary attacking weapon\n• Serve: Aces possible, variety of serves\n• Volley: Quick reflexes and precise placement',
      es: '• Derecha: Todo tipo de spin, ritmo, ángulos\n• Revés: Arma de ataque principal\n• Saque: Aces posibles, variedad de saques\n• Volea: Reflejos rápidos y colocación precisa',
      fr: "• Coup droit: Tous types de spin, rythme, angles\n• Revers: Arme d'attaque principale\n• Service: Aces possibles, variété de services\n• Volée: Réflexes rapides et placement précis",
      de: '• Vorhand: Alle Spins, Tempi, Winkel\n• Rückhand: Hauptangriffswaffe\n• Aufschlag: Asse möglich, verschiedene Aufschläge\n• Volley: Schnelle Reflexe und präzise Platzierung',
      ja: '• フォアハンド: あらゆるスピン、速度、角度を駆使\n• バックハンド: 主要な攻撃武器\n• サーブ: エース可能、多様なサーブ\n• ボレー: 素早い反射神経と正確な配置',
      zh: '• 正手: 所有类型的旋转、速度、角度\n• 反手: 主要进攻武器\n• 发球: 可以发ACE，多样发球\n• 截击: 快速反应和精准落点',
      pt: '• Forehand: Todos tipos de spin, ritmo, ângulos\n• Backhand: Arma de ataque principal\n• Saque: Aces possíveis, variedade de saques\n• Voleio: Reflexos rápidos e colocação precisa',
      it: "• Dritto: Tutti tipi di spin, ritmo, angoli\n• Rovescio: Arma d'attacco principale\n• Servizio: Ace possibili, varietà di servizi\n• Volée: Riflessi rapidi e piazzamento preciso",
      ru: '• Форхенд: Все виды вращения, темпа, углов\n• Бэкхенд: Главное атакующее оружие\n• Подача: Эйсы возможны, разнообразие подач\n• Воллей: Быстрые рефлексы и точное размещение',
    },
    tactics: {
      ko: '• 게임 전략 수립 및 실행\n• 상대 패턴 분석 및 대응\n• 멘탈 게임 능숙',
      en: '• Develops and executes game plan\n• Analyzes opponent patterns and adapts\n• Proficient mental game',
      es: '• Desarrolla y ejecuta plan de juego\n• Analiza patrones del oponente y se adapta\n• Juego mental competente',
      fr: "• Développe et exécute un plan de jeu\n• Analyse les schémas adverses et s'adapte\n• Jeu mental compétent",
      de: '• Entwickelt und führt Spielplan aus\n• Analysiert Gegner-Muster und passt an\n• Versiertes mentales Spiel',
      ja: '• ゲームプランを立案・実行\n• 相手のパターンを分析し対応\n• メンタルゲームに熟練',
      zh: '• 制定和执行比赛计划\n• 分析对手模式并适应\n• 熟练的心理战',
      pt: '• Desenvolve e executa plano de jogo\n• Analisa padrões do oponente e adapta\n• Jogo mental competente',
      it: '• Sviluppa ed esegue piano di gioco\n• Analizza schemi avversari e si adatta\n• Gioco mentale competente',
      ru: '• Разрабатывает и выполняет план игры\n• Анализирует паттерны соперника\n• Умелая психологическая игра',
    },
    experience: {
      ko: '• 피클볼 경험: 4년 이상 + 전문 코칭\n• 시/도 토너먼트 우승\n• 고급 선수와 경쟁 가능',
      en: '• Pickleball experience: 4+ years + professional coaching\n• City/state tournament wins\n• Can compete with advanced players',
      es: '• Experiencia en tenis: 4+ años + coaching profesional\n• Victorias en torneos regionales\n• Puede competir con jugadores avanzados',
      fr: '• Expérience pickleball: 4+ ans + coaching pro\n• Victoires en tournois régionaux\n• Peut rivaliser avec joueurs avancés',
      de: '• Pickleball-Erfahrung: 4+ Jahre + Profi-Coaching\n• Regionale Turniersiege\n• Kann mit Fortgeschrittenen mithalten',
      ja: '• テニス経験: 4年以上 + プロコーチング\n• 市/県トーナメント優勝\n• 上級者と競争可能',
      zh: '• 网球经验: 4+年 + 专业教练\n• 市/省锦标赛冠军\n• 可与高级选手竞争',
      pt: '• Experiência em tênis: 4+ anos + coaching profissional\n• Vitórias em torneios regionais\n• Pode competir com jogadores avançados',
      it: '• Esperienza pickleball: 4+ anni + coaching professionale\n• Vittorie in tornei regionali\n• Può competere con giocatori avanzati',
      ru: '• Опыт тенниса: 4+ года + профессиональный коучинг\n• Победы на региональных турнирах\n• Может конкурировать с продвинутыми',
    },
    initialElo: 1525,
    eloMin: 1450,
    eloMax: 1600,
  },

  // ============================================================================
  // LPR 7 - Platinum (천둥)
  // ============================================================================
  {
    value: 7,
    tier: 'Platinum',
    label: {
      ko: 'Platinum - 천둥',
      en: 'Platinum - Thunder',
      es: 'Platino - Trueno',
      fr: 'Platine - Tonnerre',
      de: 'Platin - Donner',
      ja: 'プラチナ - サンダー',
      zh: '白金 - 雷霆',
      pt: 'Platina - Trovão',
      it: 'Platino - Tuono',
      ru: 'Платина - Гром',
    },
    description: {
      ko: '당신의 스트로크 하나하나가 천둥처럼 울려 퍼집니다.',
      en: 'Each of your strokes echoes like thunder.',
      es: 'Cada uno de tus golpes resuena como un trueno.',
      fr: 'Chacun de vos coups résonne comme le tonnerre.',
      de: 'Jeder Ihrer Schläge hallt wie Donner.',
      ja: 'あなたのストローク一つ一つが雷のように響きます。',
      zh: '你的每一次击球都如雷鸣般回响。',
      pt: 'Cada um dos seus golpes ecoa como um trovão.',
      it: 'Ogni tuo colpo risuona come un tuono.',
      ru: 'Каждый ваш удар звучит как гром.',
    },
    skills: {
      ko: '• 모든 샷: 완벽한 기술과 일관성\n• 포핸드/백핸드: 강력한 무기\n• 서브: 다양하고 강력, 전략적 배치\n• 발리: 뛰어난 손 기술과 예측력',
      en: '• All shots: Perfect technique and consistency\n• Forehand/Backhand: Powerful weapons\n• Serve: Varied, powerful, strategic placement\n• Volley: Exceptional touch and anticipation',
      es: '• Todos los golpes: Técnica perfecta y consistencia\n• Derecha/Revés: Armas poderosas\n• Saque: Variado, potente, colocación estratégica\n• Volea: Toque excepcional y anticipación',
      fr: '• Tous les coups: Technique parfaite et régularité\n• Coup droit/Revers: Armes puissantes\n• Service: Varié, puissant, placement stratégique\n• Volée: Toucher exceptionnel et anticipation',
      de: '• Alle Schläge: Perfekte Technik und Konstanz\n• Vorhand/Rückhand: Kraftvolle Waffen\n• Aufschlag: Vielseitig, kraftvoll, strategisch\n• Volley: Außergewöhnliches Gefühl und Antizipation',
      ja: '• 全てのショット: 完璧な技術と一貫性\n• フォアハンド/バックハンド: 強力な武器\n• サーブ: 多様で強力、戦略的配置\n• ボレー: 卓越したタッチと予測力',
      zh: '• 所有击球: 完美技术和稳定性\n• 正手/反手: 强大武器\n• 发球: 多样、强力、战略性落点\n• 截击: 出色的手感和预判',
      pt: '• Todos os golpes: Técnica perfeita e consistência\n• Forehand/Backhand: Armas poderosas\n• Saque: Variado, potente, colocação estratégica\n• Voleio: Toque excepcional e antecipação',
      it: '• Tutti i colpi: Tecnica perfetta e costanza\n• Dritto/Rovescio: Armi potenti\n• Servizio: Vario, potente, piazzamento strategico\n• Volée: Tocco eccezionale e anticipazione',
      ru: '• Все удары: Идеальная техника и стабильность\n• Форхенд/Бэкхенд: Мощное оружие\n• Подача: Разнообразная, мощная, стратегическая\n• Воллей: Исключительное касание и предвидение',
    },
    tactics: {
      ko: '• 매 포인트 전략적 플레이\n• 상대 약점 즉시 파악 및 공략\n• 경기 흐름 완벽 제어',
      en: '• Strategic play on every point\n• Instantly identifies and exploits weakness\n• Perfect match flow control',
      es: '• Juego estratégico en cada punto\n• Identifica y explota debilidades instantáneamente\n• Control perfecto del flujo del partido',
      fr: '• Jeu stratégique à chaque point\n• Identifie et exploite les faiblesses instantanément\n• Contrôle parfait du flux du match',
      de: '• Strategisches Spiel bei jedem Punkt\n• Erkennt und nutzt Schwächen sofort\n• Perfekte Spielfluss-Kontrolle',
      ja: '• 毎ポイント戦略的プレー\n• 相手の弱点を即座に把握・攻略\n• 試合の流れを完璧にコントロール',
      zh: '• 每分都是战略性打法\n• 立即识别并利用弱点\n• 完美控制比赛节奏',
      pt: '• Jogo estratégico em cada ponto\n• Identifica e explora fraquezas instantaneamente\n• Controle perfeito do fluxo do jogo',
      it: '• Gioco strategico su ogni punto\n• Identifica e sfrutta debolezze istantaneamente\n• Controllo perfetto del flusso della partita',
      ru: '• Стратегическая игра на каждом очке\n• Мгновенно выявляет и использует слабости\n• Идеальный контроль хода матча',
    },
    experience: {
      ko: '• 피클볼 경험: 수년간 전문 훈련\n• 전국 토너먼트 우승\n• 프로급 플레이 가능',
      en: '• Pickleball experience: Years of professional training\n• National tournament wins\n• Professional-level play',
      es: '• Experiencia en tenis: Años de entrenamiento profesional\n• Victorias en torneos nacionales\n• Juego a nivel profesional',
      fr: "• Expérience pickleball: Années d'entraînement pro\n• Victoires en tournois nationaux\n• Jeu de niveau professionnel",
      de: '• Pickleball-Erfahrung: Jahre professionellen Trainings\n• Nationale Turniersiege\n• Professionelles Spielniveau',
      ja: '• テニス経験: 数年間のプロトレーニング\n• 全国トーナメント優勝\n• プロ級プレーが可能',
      zh: '• 网球经验: 多年专业训练\n• 全国锦标赛冠军\n• 专业级别打法',
      pt: '• Experiência em tênis: Anos de treinamento profissional\n• Vitórias em torneios nacionais\n• Jogo de nível profissional',
      it: '• Esperienza pickleball: Anni di allenamento professionale\n• Vittorie in tornei nazionali\n• Gioco a livello professionale',
      ru: '• Опыт тенниса: Годы профессиональных тренировок\n• Победы на национальных турнирах\n• Профессиональный уровень игры',
    },
    initialElo: 1700,
    eloMin: 1600,
    eloMax: 1800,
  },

  // ============================================================================
  // LPR 8 - Diamond (폭풍)
  // ============================================================================
  {
    value: 8,
    tier: 'Diamond',
    label: {
      ko: 'Diamond - 폭풍',
      en: 'Diamond - Storm',
      es: 'Diamante - Tormenta',
      fr: 'Diamant - Tempête',
      de: 'Diamant - Sturm',
      ja: 'ダイアモンド - ストーム',
      zh: '钻石 - 风暴',
      pt: 'Diamante - Tempestade',
      it: 'Diamante - Tempesta',
      ru: 'Бриллиант - Шторм',
    },
    description: {
      ko: '코트를 휩쓰는 폭풍, 상대는 당신을 예측할 수 없습니다.',
      en: 'A storm sweeping across the court—opponents cannot predict you.',
      es: 'Una tormenta que barre la cancha—los oponentes no pueden predecirte.',
      fr: 'Une tempête balayant le court—les adversaires ne peuvent pas vous prédire.',
      de: 'Ein Sturm, der über den Platz fegt—Gegner können Sie nicht vorhersagen.',
      ja: 'コートを吹き荒れる嵐—相手はあなたを予測できません。',
      zh: '席卷球场的风暴——对手无法预测你。',
      pt: 'Uma tempestade varrendo a quadra—oponentes não podem prever você.',
      it: 'Una tempesta che spazza il campo—gli avversari non possono prevedere te.',
      ru: 'Шторм, проносящийся по корту—соперники не могут вас предсказать.',
    },
    skills: {
      ko: '• 모든 샷: 프로 수준의 파워와 정확도\n• 특별한 샷: 독창적이고 창의적\n• 서브: 무기급 퍼스트 서브\n• 발리: 반사 신경과 기술 최고 수준',
      en: '• All shots: Professional power and precision\n• Special shots: Creative and innovative\n• Serve: Weapon-grade first serve\n• Volley: Reflexes and touch at highest level',
      es: '• Todos los golpes: Potencia y precisión profesional\n• Golpes especiales: Creativos e innovadores\n• Saque: Primer saque de nivel arma\n• Volea: Reflejos y toque al más alto nivel',
      fr: '• Tous les coups: Puissance et précision pro\n• Coups spéciaux: Créatifs et innovants\n• Service: Premier service de niveau arme\n• Volée: Réflexes et toucher au plus haut niveau',
      de: '• Alle Schläge: Profi-Power und Präzision\n• Spezialschläge: Kreativ und innovativ\n• Aufschlag: Waffen-Niveau erster Aufschlag\n• Volley: Reflexe und Gefühl auf höchstem Niveau',
      ja: '• 全てのショット: プロレベルのパワーと正確性\n• 特殊ショット: 独創的で創造的\n• サーブ: 武器級ファーストサーブ\n• ボレー: 最高レベルの反射神経と技術',
      zh: '• 所有击球: 职业级力量和精准度\n• 特殊击球: 创新独特\n• 发球: 武器级一发\n• 截击: 最高水平的反应和手感',
      pt: '• Todos os golpes: Potência e precisão profissional\n• Golpes especiais: Criativos e inovadores\n• Saque: Primeiro saque nível arma\n• Voleio: Reflexos e toque no mais alto nível',
      it: '• Tutti i colpi: Potenza e precisione professionale\n• Colpi speciali: Creativi e innovativi\n• Servizio: Primo servizio livello arma\n• Volée: Riflessi e tocco al massimo livello',
      ru: '• Все удары: Профессиональная сила и точность\n• Специальные удары: Креативные и инновационные\n• Подача: Первая подача уровня оружия\n• Воллей: Рефлексы и касание высшего уровня',
    },
    tactics: {
      ko: '• 완벽한 게임 제어 능력\n• 상대 심리 파악 및 압박\n• 모든 상황 대응 능력',
      en: '• Perfect game control ability\n• Psychological insight and pressure\n• Handles all situations',
      es: '• Capacidad perfecta de control del juego\n• Perspicacia psicológica y presión\n• Maneja todas las situaciones',
      fr: '• Capacité parfaite de contrôle du jeu\n• Perspicacité psychologique et pression\n• Gère toutes les situations',
      de: '• Perfekte Spielkontrolle\n• Psychologische Einsicht und Druck\n• Meistert alle Situationen',
      ja: '• 完璧なゲームコントロール能力\n• 相手の心理把握とプレッシャー\n• あらゆる状況への対応能力',
      zh: '• 完美的比赛控制能力\n• 心理洞察和施压\n• 应对所有情况',
      pt: '• Capacidade perfeita de controle do jogo\n• Perspicácia psicológica e pressão\n• Lida com todas as situações',
      it: '• Capacità perfetta di controllo del gioco\n• Intuizione psicologica e pressione\n• Gestisce tutte le situazioni',
      ru: '• Идеальный контроль игры\n• Психологическое понимание и давление\n• Справляется со всеми ситуациями',
    },
    experience: {
      ko: '• 피클볼 경험: 프로 선수 수준\n• 국제 토너먼트 참가/우승\n• 세계 랭킹 목표 수준',
      en: '• Pickleball experience: Professional player level\n• International tournament participation/wins\n• World ranking goal level',
      es: '• Experiencia en tenis: Nivel de jugador profesional\n• Participación/victorias en torneos internacionales\n• Nivel de objetivo de ranking mundial',
      fr: '• Expérience pickleball: Niveau joueur professionnel\n• Participation/victoires en tournois internationaux\n• Niveau objectif classement mondial',
      de: '• Pickleball-Erfahrung: Profi-Spieler-Niveau\n• Internationale Turnierteilnahme/-siege\n• Weltranglisten-Zielniveau',
      ja: '• テニス経験: プロ選手レベル\n• 国際トーナメント参加/優勝\n• 世界ランキング目標レベル',
      zh: '• 网球经验: 职业选手水平\n• 国际锦标赛参赛/冠军\n• 世界排名目标水平',
      pt: '• Experiência em tênis: Nível de jogador profissional\n• Participação/vitórias em torneios internacionais\n• Nível de meta de ranking mundial',
      it: '• Esperienza pickleball: Livello giocatore professionista\n• Partecipazione/vittorie in tornei internazionali\n• Livello obiettivo ranking mondiale',
      ru: '• Опыт тенниса: Уровень профессионального игрока\n• Участие/победы на международных турнирах\n• Уровень цели мирового рейтинга',
    },
    initialElo: 1950,
    eloMin: 1800,
    eloMax: 2100,
  },

  // ============================================================================
  // LPR 9 - Master (구상번개)
  // ============================================================================
  {
    value: 9,
    tier: 'Master',
    label: {
      ko: 'Master - 구상번개',
      en: 'Master - Ball Lightning',
      es: 'Maestro - Rayo Globular',
      fr: 'Maître - Foudre en Boule',
      de: 'Meister - Kugelblitz',
      ja: 'マスター - 球電',
      zh: '大师 - 球状闪电',
      pt: 'Mestre - Raio Globular',
      it: 'Maestro - Fulmine Globulare',
      ru: 'Мастер - Шаровая Молния',
    },
    description: {
      ko: '모든 기술을 통달한 코트 위의 마스터.',
      en: 'A master on the court who has mastered all skills.',
      es: 'Un maestro en la cancha que ha dominado todas las habilidades.',
      fr: 'Un maître sur le court qui a maîtrisé toutes les compétences.',
      de: 'Ein Meister auf dem Platz, der alle Fähigkeiten beherrscht.',
      ja: 'すべての技術を極めたコート上のマスター。',
      zh: '精通所有技术的球场大师。',
      pt: 'Um mestre na quadra que dominou todas as habilidades.',
      it: 'Un maestro sul campo che ha padroneggiato tutte le abilità.',
      ru: 'Мастер на корте, овладевший всеми навыками.',
    },
    skills: {
      ko: '• 모든 기술: 세계 수준의 완성도\n• 샷 선택: 직관적이고 즉각적\n• 서브: 파괴적인 무기\n• 풋워크: 완벽한 코트 커버리지',
      en: '• All skills: World-class completion\n• Shot selection: Intuitive and instant\n• Serve: Devastating weapon\n• Footwork: Perfect court coverage',
      es: '• Todas las habilidades: Finalización de clase mundial\n• Selección de golpes: Intuitiva e instantánea\n• Saque: Arma devastadora\n• Juego de pies: Cobertura perfecta de cancha',
      fr: '• Toutes les compétences: Achèvement de niveau mondial\n• Sélection de coups: Intuitive et instantanée\n• Service: Arme dévastatrice\n• Jeu de jambes: Couverture parfaite du court',
      de: '• Alle Fähigkeiten: Weltklasse-Vollendung\n• Schlagauswahl: Intuitiv und sofort\n• Aufschlag: Verheerende Waffe\n• Beinarbeit: Perfekte Platzabdeckung',
      ja: '• 全ての技術: 世界レベルの完成度\n• ショット選択: 直感的で即座\n• サーブ: 破壊的な武器\n• フットワーク: 完璧なコートカバレッジ',
      zh: '• 所有技术: 世界级完成度\n• 击球选择: 直觉且即时\n• 发球: 毁灭性武器\n• 步法: 完美的场地覆盖',
      pt: '• Todas as habilidades: Conclusão de classe mundial\n• Seleção de golpes: Intuitiva e instantânea\n• Saque: Arma devastadora\n• Jogo de pés: Cobertura perfeita da quadra',
      it: '• Tutte le abilità: Completezza di livello mondiale\n• Selezione colpi: Intuitiva e istantanea\n• Servizio: Arma devastante\n• Gioco di gambe: Copertura perfetta del campo',
      ru: '• Все навыки: Мировой уровень завершенности\n• Выбор ударов: Интуитивный и мгновенный\n• Подача: Разрушительное оружие\n• Работа ног: Идеальное покрытие корта',
    },
    tactics: {
      ko: '• 경기 전체를 읽는 능력\n• 상대를 심리적으로 완전 장악\n• 모든 스타일에 적응 가능',
      en: '• Ability to read entire match\n• Complete psychological dominance over opponent\n• Adaptable to all styles',
      es: '• Capacidad de leer todo el partido\n• Dominio psicológico completo sobre el oponente\n• Adaptable a todos los estilos',
      fr: "• Capacité à lire tout le match\n• Domination psychologique complète sur l'adversaire\n• Adaptable à tous les styles",
      de: '• Fähigkeit das gesamte Spiel zu lesen\n• Vollständige psychologische Dominanz über Gegner\n• Anpassbar an alle Stile',
      ja: '• 試合全体を読む能力\n• 相手を心理的に完全に支配\n• あらゆるスタイルに適応可能',
      zh: '• 阅读整场比赛的能力\n• 对对手的完全心理支配\n• 适应所有风格',
      pt: '• Capacidade de ler todo o jogo\n• Domínio psicológico completo sobre o oponente\n• Adaptável a todos os estilos',
      it: "• Capacità di leggere l'intera partita\n• Dominanza psicologica completa sull'avversario\n• Adattabile a tutti gli stili",
      ru: '• Способность читать весь матч\n• Полное психологическое доминирование над соперником\n• Адаптируется ко всем стилям',
    },
    experience: {
      ko: '• 피클볼 경험: 프로 투어 레벨\n• 국제 대회 상위권 성적\n• 세계적으로 인정받는 실력',
      en: '• Pickleball experience: Pro tour level\n• Top finishes at international events\n• Globally recognized skill',
      es: '• Experiencia en tenis: Nivel tour profesional\n• Finales superiores en eventos internacionales\n• Habilidad reconocida globalmente',
      fr: '• Expérience pickleball: Niveau tour pro\n• Finales supérieures aux événements internationaux\n• Compétence reconnue mondialement',
      de: '• Pickleball-Erfahrung: Pro Tour Niveau\n• Top-Platzierungen bei internationalen Events\n• Global anerkannte Fähigkeiten',
      ja: '• テニス経験: プロツアーレベル\n• 国際大会で上位成績\n• 世界的に認められた実力',
      zh: '• 网球经验: 职业巡回赛水平\n• 国际赛事顶级成绩\n• 全球认可的技术',
      pt: '• Experiência em tênis: Nível de tour profissional\n• Finais superiores em eventos internacionais\n• Habilidade reconhecida globalmente',
      it: '• Esperienza pickleball: Livello tour professionistico\n• Finali superiori in eventi internazionali\n• Abilità riconosciuta globalmente',
      ru: '• Опыт тенниса: Уровень про-тура\n• Высокие результаты на международных турнирах\n• Глобально признанное мастерство',
    },
    initialElo: 2250,
    eloMin: 2100,
    eloMax: 2400,
  },

  // ============================================================================
  // LPR 10 - Legend (번개신)
  // ============================================================================
  {
    value: 10,
    tier: 'Legend',
    label: {
      ko: 'Legend - 번개신',
      en: 'Legend - Lightning God',
      es: 'Leyenda - Dios del Rayo',
      fr: 'Légende - Dieu de la Foudre',
      de: 'Legende - Blitzgott',
      ja: 'レジェンド - 雷神',
      zh: '传奇 - 雷神',
      pt: 'Lenda - Deus do Raio',
      it: 'Leggenda - Dio del Fulmine',
      ru: 'Легенда - Бог Молнии',
    },
    description: {
      ko: '당신은 이제 번개 피클볼의 살아있는 전설입니다.',
      en: 'You are now a living legend of Lightning Pickleball.',
      es: 'Ahora eres una leyenda viviente de Lightning Pickleball.',
      fr: 'Vous êtes maintenant une légende vivante de Lightning Pickleball.',
      de: 'Sie sind jetzt eine lebende Legende von Lightning Pickleball.',
      ja: 'あなたは今やライトニングテニスの生きた伝説です。',
      zh: '你现在是闪电网球的活传奇。',
      pt: 'Você agora é uma lenda viva do Lightning Pickleball.',
      it: 'Ora sei una leggenda vivente di Lightning Pickleball.',
      ru: 'Вы теперь живая легенда Lightning Pickleball.',
    },
    skills: {
      ko: '• 모든 기술: 전설적 수준\n• 샷 메이킹: 역사에 남을 플레이\n• 서브: 언스토퍼블\n• 전체 게임: 완벽한 조화',
      en: '• All skills: Legendary level\n• Shot making: Plays for the history books\n• Serve: Unstoppable\n• Overall game: Perfect harmony',
      es: '• Todas las habilidades: Nivel legendario\n• Ejecución de golpes: Jugadas para los libros de historia\n• Saque: Imparable\n• Juego general: Armonía perfecta',
      fr: "• Toutes les compétences: Niveau légendaire\n• Exécution des coups: Jeux pour les livres d'histoire\n• Service: Inarrêtable\n• Jeu global: Harmonie parfaite",
      de: '• Alle Fähigkeiten: Legendäres Niveau\n• Schlagausführung: Spielzüge für die Geschichtsbücher\n• Aufschlag: Unaufhaltbar\n• Gesamtspiel: Perfekte Harmonie',
      ja: '• 全ての技術: 伝説レベル\n• ショットメイキング: 歴史に残るプレー\n• サーブ: 止められない\n• 全体のゲーム: 完璧なハーモニー',
      zh: '• 所有技术: 传奇级别\n• 击球创造: 载入史册的打法\n• 发球: 不可阻挡\n• 整体比赛: 完美和谐',
      pt: '• Todas as habilidades: Nível lendário\n• Execução de golpes: Jogadas para os livros de história\n• Saque: Imparável\n• Jogo geral: Harmonia perfeita',
      it: '• Tutte le abilità: Livello leggendario\n• Esecuzione colpi: Giocate per i libri di storia\n• Servizio: Inarrestabile\n• Gioco complessivo: Armonia perfetta',
      ru: '• Все навыки: Легендарный уровень\n• Исполнение ударов: Игра для книг истории\n• Подача: Неостановимая\n• Общая игра: Идеальная гармония',
    },
    tactics: {
      ko: '• 경기를 초월한 이해력\n• 상대를 완벽히 무력화\n• 피클볼의 예술적 경지',
      en: '• Transcendent match understanding\n• Completely neutralizes opponents\n• Artistic mastery of pickleball',
      es: '• Comprensión trascendente del partido\n• Neutraliza completamente a los oponentes\n• Dominio artístico del tenis',
      fr: '• Compréhension transcendante du match\n• Neutralise complètement les adversaires\n• Maîtrise artistique du pickleball',
      de: '• Transzendentes Spielverständnis\n• Neutralisiert Gegner vollständig\n• Künstlerische Meisterschaft im Pickleball',
      ja: '• 試合を超越した理解力\n• 相手を完全に無力化\n• テニスの芸術的境地',
      zh: '• 超越比赛的理解力\n• 完全无效化对手\n• 网球的艺术境界',
      pt: '• Compreensão transcendente do jogo\n• Neutraliza completamente os oponentes\n• Domínio artístico do tênis',
      it: '• Comprensione trascendente della partita\n• Neutralizza completamente gli avversari\n• Maestria artistica del pickleball',
      ru: '• Трансцендентное понимание матча\n• Полностью нейтрализует соперников\n• Художественное мастерство тенниса',
    },
    experience: {
      ko: '• 피클볼 경험: 세계 최정상\n• 그랜드슬램 우승자급\n• 피클볼 역사에 이름을 남긴 수준',
      en: "• Pickleball experience: World's elite\n• Grand Slam champion caliber\n• Name written in pickleball history",
      es: '• Experiencia en tenis: Élite mundial\n• Calibre de campeón de Grand Slam\n• Nombre escrito en la historia del tenis',
      fr: "• Expérience pickleball: Élite mondiale\n• Calibre de champion de Grand Slam\n• Nom inscrit dans l'histoire du pickleball",
      de: '• Pickleball-Erfahrung: Welt-Elite\n• Grand Slam Champion Kaliber\n• Name in der Pickleball-Geschichte geschrieben',
      ja: '• テニス経験: 世界最高峰\n• グランドスラム優勝者級\n• テニス史に名を残すレベル',
      zh: '• 网球经验: 世界顶尖\n• 大满贯冠军级别\n• 名字载入网球史册',
      pt: '• Experiência em tênis: Elite mundial\n• Calibre de campeão de Grand Slam\n• Nome escrito na história do tênis',
      it: '• Esperienza pickleball: Elite mondiale\n• Calibro di campione di Grand Slam\n• Nome scritto nella storia del pickleball',
      ru: '• Опыт тенниса: Мировая элита\n• Калибр чемпиона Большого шлема\n• Имя записано в истории тенниса',
    },
    initialElo: 2400,
    eloMin: 2400,
    eloMax: 9999, // No upper limit for legends
  },
];

/**
 * Get localized text with fallback to English
 * @param text Multilingual text object
 * @param language Current language code
 * @returns Localized string or English fallback
 */
export function getLocalizedText(text: MultilingualText, language: string): string {
  return text[language as SupportedLanguage] || text.en;
}

/**
 * Get LPR level object by numeric value (1-10)
 */
export function getLtrLevelByValue(value: number): LtrLevel | undefined {
  return LPR_LEVELS.find(level => level.value === value);
}

/**
 * Convert ELO to LPR level (1-10)
 * @param elo ELO rating
 * @returns LPR level (1-10)
 */
export function convertEloToLtr(elo: number): number {
  for (const level of LPR_LEVELS) {
    if (elo >= level.eloMin && elo < level.eloMax) {
      return level.value;
    }
  }
  // If elo >= 2400, return LPR 10
  if (elo >= 2400) return 10;
  // If elo < 1000, return LPR 1
  return 1;
}

/**
 * Get initial ELO from LPR level
 * @param ltr LPR level (1-10)
 * @returns Initial ELO for that level
 */
export function getInitialEloFromLtr(ltr: number): number {
  const level = LPR_LEVELS.find(l => l.value === ltr);
  return level?.initialElo || 1150; // Default to LPR 3 if not found
}

/**
 * NTRP to LPR migration mapping
 * Used for migrating existing users from NTRP to LPR
 */
export const NTRP_TO_LPR_MAP: Record<number, number> = {
  2.0: 1,
  2.5: 2,
  3.0: 3,
  3.5: 4,
  4.0: 5,
  4.5: 7,
  5.0: 8,
  5.5: 9,
};

/**
 * Convert legacy NTRP to LPR
 * @param ntrp NTRP value (2.0-5.5)
 * @returns LPR level (1-10)
 */
export function convertNtrpToLtr(ntrp: number): number {
  return NTRP_TO_LPR_MAP[ntrp] || 3; // Default to LPR 3 if not found
}

/**
 * Onboarding cap - maximum LPR level selectable during onboarding
 * Users can only select up to LPR 5 during onboarding
 * Higher levels must be achieved through matches
 */
export const ONBOARDING_LPR_CAP = 5;

/**
 * Get LPR levels available for onboarding selection
 */
export function getOnboardingLtrLevels(): LtrLevel[] {
  return LPR_LEVELS.filter(level => level.value <= ONBOARDING_LPR_CAP);
}

/**
 * Get tier by LPR level
 * @param ltrLevel LPR level (1-10)
 * @returns LtrTier object or undefined
 */
export function getTierByLevel(ltrLevel: number): LtrTier | undefined {
  return LPR_TIERS.find(tier => tier.levels.includes(ltrLevel));
}

/**
 * Get tier name by LPR level
 * @param ltrLevel LPR level (1-10)
 * @returns Tier name (e.g., 'Bronze', 'Silver', 'Gold')
 */
export function getTierNameByLevel(ltrLevel: number): LtrTierName {
  const level = LPR_LEVELS.find(l => l.value === ltrLevel);
  return level?.tier || 'Bronze';
}

/**
 * Get tier color by LPR level
 * @param ltrLevel LPR level (1-10)
 * @returns Hex color code
 */
export function getTierColorByLevel(ltrLevel: number): string {
  const tier = getTierByLevel(ltrLevel);
  return tier?.color || '#CD7F32'; // Default to Bronze
}

/**
 * Get tier theme (icon concept) by LPR level with localization
 * @param ltrLevel LPR level (1-10)
 * @param language Supported language code
 * @returns Localized theme name (e.g., 'Spark', 'Flash', 'Bolt')
 */
export function getTierThemeByLevel(ltrLevel: number, language: SupportedLanguage = 'en'): string {
  const tier = getTierByLevel(ltrLevel);
  return tier ? getLocalizedText(tier.theme, language) : 'Spark';
}

/**
 * Get tier description by LPR level with localization
 * @param ltrLevel LPR level (1-10)
 * @param language Supported language code
 * @returns Localized tier description
 */
export function getTierDescriptionByLevel(
  ltrLevel: number,
  language: SupportedLanguage = 'en'
): string {
  const tier = getTierByLevel(ltrLevel);
  return tier ? getLocalizedText(tier.themeDescription, language) : '';
}
