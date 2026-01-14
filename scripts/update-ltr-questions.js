#!/usr/bin/env node
/**
 * Script to update ltrQuestions.ts with multi-language support
 * Adds translations for: es, de, fr, it, pt, ja, zh, ru
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/constants/ltrQuestions.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Rename NTRP_QUESTIONS to LTR_QUESTIONS
content = content.replace(/NTRP_QUESTIONS/g, 'LTR_QUESTIONS');
content = content.replace(/NtrpQuestion/g, 'LtrQuestion');

// Question translations - keyed by question id
const questionTranslations = {
  q1_forehand: {
    es: '¿Cómo describirías tu golpe de derecha?',
    de: 'Wie würden Sie Ihren Vorhand-Schlag beschreiben?',
    fr: 'Comment décririez-vous votre coup droit?',
    it: 'Come descriveresti il tuo dritto?',
    pt: 'Como você descreveria seu forehand?',
    ja: 'フォアハンドストロークの能力はどの程度ですか？',
    zh: '您的正手击球能力如何？',
    ru: 'Как бы вы описали свой удар справа?',
  },
  q2_backhand: {
    es: '¿Cómo describirías tu golpe de revés?',
    de: 'Wie würden Sie Ihren Rückhand-Schlag beschreiben?',
    fr: 'Comment décririez-vous votre revers?',
    it: 'Come descriveresti il tuo rovescio?',
    pt: 'Como você descreveria seu backhand?',
    ja: 'バックハンドストロークの能力はどの程度ですか？',
    zh: '您的反手击球能力如何？',
    ru: 'Как бы вы описали свой удар слева?',
  },
  q3_serve: {
    es: '¿Cómo describirías tu saque?',
    de: 'Wie würden Sie Ihren Aufschlag beschreiben?',
    fr: 'Comment décririez-vous votre service?',
    it: 'Come descriveresti il tuo servizio?',
    pt: 'Como você descreveria seu saque?',
    ja: 'サーブの能力はどの程度ですか？',
    zh: '您的发球能力如何？',
    ru: 'Как бы вы описали свою подачу?',
  },
  q4_spin: {
    es: '¿Cómo describirías tu control del efecto?',
    de: 'Wie würden Sie Ihre Spin-Kontrolle beschreiben?',
    fr: 'Comment décririez-vous votre contrôle des effets?',
    it: 'Come descriveresti il tuo controllo degli effetti?',
    pt: 'Como você descreveria seu controle de efeito?',
    ja: 'スピンコントロールの能力はどの程度ですか？',
    zh: '您的旋转控制能力如何？',
    ru: 'Как бы вы описали свой контроль вращения?',
  },
  q5_volley: {
    es: '¿Cómo describirías tu volea?',
    de: 'Wie würden Sie Ihren Volley beschreiben?',
    fr: 'Comment décririez-vous votre volée?',
    it: 'Come descriveresti la tua volée?',
    pt: 'Como você descreveria seu voleio?',
    ja: 'ボレーの能力はどの程度ですか？',
    zh: '您的网前截击能力如何？',
    ru: 'Как бы вы описали свой удар с лёта?',
  },
  q6_point_construction: {
    es: '¿Cómo describirías tu capacidad de construcción de puntos?',
    de: 'Wie würden Sie Ihre Punktaufbau-Fähigkeiten beschreiben?',
    fr: 'Comment décririez-vous votre capacité à construire les points?',
    it: 'Come descriveresti la tua capacità di costruzione del punto?',
    pt: 'Como você descreveria sua capacidade de construção de pontos?',
    ja: 'ポイント構成能力はどの程度ですか？',
    zh: '您的得分构建能力如何？',
    ru: 'Как бы вы описали свою способность строить розыгрыш?',
  },
  q7_positioning: {
    es: '¿Cómo describirías tu posicionamiento en la cancha?',
    de: 'Wie würden Sie Ihre Positionierung beschreiben?',
    fr: 'Comment décririez-vous votre positionnement sur le court?',
    it: 'Come descriveresti il tuo posizionamento in campo?',
    pt: 'Como você descreveria seu posicionamento na quadra?',
    ja: 'コートポジショニングはどの程度ですか？',
    zh: '您的场上位置选择能力如何？',
    ru: 'Как бы вы описали свою позицию на корте?',
  },
  q8_weakness: {
    es: '¿Cómo identificas y explotas las debilidades del oponente?',
    de: 'Wie identifizieren und nutzen Sie gegnerische Schwächen?',
    fr: 'Comment identifiez-vous et exploitez-vous les faiblesses adverses?',
    it: "Come identifichi e sfrutti le debolezze dell'avversario?",
    pt: 'Como você identifica e explora as fraquezas do oponente?',
    ja: '相手の弱点をどのように見つけて攻略しますか？',
    zh: '您如何识别并利用对手的弱点？',
    ru: 'Как вы определяете и используете слабости соперника?',
  },
  q9_pressure: {
    es: '¿Cómo manejas las situaciones de presión?',
    de: 'Wie gehen Sie mit Drucksituationen um?',
    fr: 'Comment gérez-vous les situations de pression?',
    it: 'Come gestisci le situazioni di pressione?',
    pt: 'Como você lida com situações de pressão?',
    ja: 'プレッシャー下でどのように対処しますか？',
    zh: '您如何应对压力情况？',
    ru: 'Как вы справляетесь с давлением?',
  },
  q10_lessons: {
    es: '¿Cuánto tiempo llevas jugando tenis?',
    de: 'Wie lange spielen Sie schon Tennis?',
    fr: 'Depuis combien de temps jouez-vous au tennis?',
    it: 'Da quanto tempo giochi a tennis?',
    pt: 'Há quanto tempo você joga tênis?',
    ja: 'テニス歴はどのくらいですか？',
    zh: '您打网球多长时间了？',
    ru: 'Как долго вы играете в теннис?',
  },
  q11_tournaments: {
    es: '¿Cuál es tu experiencia en torneos?',
    de: 'Was ist Ihre Turniererfahrung?',
    fr: 'Quelle est votre expérience en tournois?',
    it: 'Qual è la tua esperienza nei tornei?',
    pt: 'Qual é a sua experiência em torneios?',
    ja: 'トーナメント経験はどのくらいありますか？',
    zh: '您有多少比赛经验？',
    ru: 'Какой у вас турнирный опыт?',
  },
  q12_frequency: {
    es: '¿Con qué frecuencia juegas?',
    de: 'Wie oft spielen Sie?',
    fr: 'À quelle fréquence jouez-vous?',
    it: 'Con che frequenza giochi?',
    pt: 'Com que frequência você joga?',
    ja: 'どのくらいの頻度でプレイしますか？',
    zh: '您打球的频率是？',
    ru: 'Как часто вы играете?',
  },
  q13_improvement: {
    es: '¿Cómo calificarías tu velocidad de mejora?',
    de: 'Wie würden Sie Ihre Verbesserungsrate bewerten?',
    fr: 'Comment évalueriez-vous votre rythme de progression?',
    it: 'Come valuteresti la tua velocità di miglioramento?',
    pt: 'Como você avaliaria sua velocidade de melhoria?',
    ja: '上達速度をどう評価しますか？',
    zh: '您如何评价自己的进步速度？',
    ru: 'Как бы вы оценили скорость своего прогресса?',
  },
  q14_results: {
    es: '¿Cuáles son tus resultados típicos en partidos?',
    de: 'Was sind Ihre typischen Matchergebnisse?',
    fr: 'Quels sont vos résultats typiques en match?',
    it: 'Quali sono i tuoi risultati tipici nelle partite?',
    pt: 'Quais são seus resultados típicos em partidas?',
    ja: '試合の結果は主にどうですか？',
    zh: '您的比赛结果通常如何？',
    ru: 'Каковы ваши типичные результаты матчей?',
  },
};

// Option translations - keyed by option id
const optionTranslations = {
  // Q1 Forehand
  q1_opt1: {
    es: 'Solo puede pasar la pelota en distancias cortas',
    de: 'Kann den Ball nur auf kurze Distanz übers Netz spielen',
    fr: "Ne peut renvoyer la balle qu'à courte distance",
    it: 'Può passare la palla solo a breve distanza',
    pt: 'Só consegue passar a bola em curta distância',
    ja: '短い距離でのみボールを打ち返せる',
    zh: '只能在短距离内把球打过网',
    ru: 'Может перебить мяч только на короткое расстояние',
  },
  q1_opt2: {
    es: 'Puede golpear de forma consistente a velocidad media',
    de: 'Kann konstant mit mittlerem Tempo spielen',
    fr: 'Peut frapper de manière constante à vitesse moyenne',
    it: 'Può colpire in modo costante a velocità media',
    pt: 'Consegue bater consistentemente em velocidade média',
    ja: '中程度のペースで安定して打てる',
    zh: '能够以中等速度稳定击球',
    ru: 'Может стабильно бить на средней скорости',
  },
  q1_opt3: {
    es: 'Puede controlar la dirección y usar efectos',
    de: 'Kann Richtung kontrollieren und Spin einsetzen',
    fr: 'Peut contrôler la direction et utiliser des effets',
    it: 'Può controllare la direzione e usare gli effetti',
    pt: 'Consegue controlar direção e usar efeitos',
    ja: '方向とスピンをコントロールできる',
    zh: '能控制方向并使用旋转',
    ru: 'Может контролировать направление и использовать вращение',
  },
  q1_opt4: {
    es: 'Potente con variaciones versátiles de efectos',
    de: 'Kraftvoll mit vielseitigen Spin-Variationen',
    fr: "Puissant avec des variations d'effets polyvalentes",
    it: 'Potente con variazioni di effetti versatili',
    pt: 'Poderoso com variações versáteis de efeitos',
    ja: '強力で多彩なスピンバリエーション',
    zh: '强力且能使用多种旋转变化',
    ru: 'Мощный удар с разнообразными вращениями',
  },
  // Q2 Backhand
  q2_opt1: {
    es: 'Inestable y comete errores frecuentemente',
    de: 'Instabil und macht häufig Fehler',
    fr: 'Instable et fait fréquemment des erreurs',
    it: 'Instabile e commette errori frequentemente',
    pt: 'Instável e comete erros frequentemente',
    ja: '不安定でミスが多い',
    zh: '不稳定，经常失误',
    ru: 'Нестабильный и часто ошибается',
  },
  q2_opt2: {
    es: 'Ocasionalmente exitoso',
    de: 'Gelegentlich erfolgreich',
    fr: 'Occasionnellement réussi',
    it: 'Occasionalmente di successo',
    pt: 'Ocasionalmente bem-sucedido',
    ja: '時々成功する',
    zh: '偶尔成功',
    ru: 'Иногда успешный',
  },
  q2_opt3: {
    es: 'Estable y puede usar ofensivamente',
    de: 'Stabil und kann offensiv eingesetzt werden',
    fr: 'Stable et peut être utilisé offensivement',
    it: 'Stabile e può essere usato offensivamente',
    pt: 'Estável e pode usar ofensivamente',
    ja: '安定していて攻撃的に使える',
    zh: '稳定且可用于进攻',
    ru: 'Стабильный и может использоваться для атаки',
  },
  q2_opt4: {
    es: 'Arma ofensiva principal',
    de: 'Hauptangriffswaffe',
    fr: 'Arme offensive principale',
    it: 'Arma offensiva principale',
    pt: 'Arma ofensiva principal',
    ja: '主要な攻撃武器として使用',
    zh: '主要进攻武器',
    ru: 'Основное атакующее оружие',
  },
  // Q3 Serve
  q3_opt1: {
    es: 'Saque por debajo o muy lento',
    de: 'Unterhand oder sehr langsamer Aufschlag',
    fr: 'Service à la cuillère ou très lent',
    it: 'Servizio dal basso o molto lento',
    pt: 'Saque por baixo ou muito lento',
    ja: 'アンダーハンドまたは非常に遅いサーブ',
    zh: '下手发球或非常慢的发球',
    ru: 'Подача снизу или очень медленная',
  },
  q3_opt2: {
    es: 'Velocidad media pero con dobles faltas ocasionales',
    de: 'Mittleres Tempo mit gelegentlichen Doppelfehlern',
    fr: 'Vitesse moyenne mais doubles fautes occasionnelles',
    it: 'Velocità media ma con doppi falli occasionali',
    pt: 'Velocidade média mas com duplas faltas ocasionais',
    ja: '中程度のペースだが時々ダブルフォルト',
    zh: '中等速度但偶尔双发失误',
    ru: 'Средняя скорость, но с редкими двойными ошибками',
  },
  q3_opt3: {
    es: 'Primer saque consistente e intentando saques con efecto',
    de: 'Konstanter erster Aufschlag und versucht Spin-Aufschläge',
    fr: 'Premier service régulier et essaie les services liftés',
    it: 'Primo servizio consistente e prova servizi con effetti',
    pt: 'Primeiro saque consistente e tentando saques com efeito',
    ja: '安定したファーストサーブとスピンサーブに挑戦',
    zh: '稳定的一发并尝试旋转发球',
    ru: 'Стабильная первая подача и попытки подавать с вращением',
  },
  q3_opt4: {
    es: 'Primer saque potente con tipos de saque variados',
    de: 'Kraftvoller erster Aufschlag mit verschiedenen Arten',
    fr: 'Premier service puissant avec variations',
    it: 'Primo servizio potente con tipi di servizio vari',
    pt: 'Primeiro saque potente com tipos de saque variados',
    ja: '強力なファーストサーブと多様なサーブタイプ',
    zh: '强力一发和多种发球类型',
    ru: 'Мощная первая подача с разнообразными типами',
  },
  // Q4 Spin
  q4_opt1: {
    es: 'Rara vez uso efectos',
    de: 'Benutze selten Spin',
    fr: 'Utilise rarement les effets',
    it: 'Uso raramente gli effetti',
    pt: 'Raramente uso efeitos',
    ja: 'スピンをほとんど使わない',
    zh: '很少使用旋转',
    ru: 'Редко использую вращение',
  },
  q4_opt2: {
    es: 'Ocasionalmente intento usar efectos',
    de: 'Versuche gelegentlich Spin',
    fr: 'Essaie occasionnellement les effets',
    it: 'Occasionalmente provo a usare gli effetti',
    pt: 'Ocasionalmente tento usar efeitos',
    ja: '時々スピンを試みる',
    zh: '偶尔尝试使用旋转',
    ru: 'Иногда пытаюсь использовать вращение',
  },
  q4_opt3: {
    es: 'Uso efectos de forma consistente',
    de: 'Benutze Spin konstant',
    fr: 'Utilise les effets de manière constante',
    it: 'Uso gli effetti in modo costante',
    pt: 'Uso efeitos de forma consistente',
    ja: '一貫してスピンを使う',
    zh: '稳定使用旋转',
    ru: 'Стабильно использую вращение',
  },
  q4_opt4: {
    es: 'Domino todos los tipos de efectos libremente',
    de: 'Beherrsche alle Spin-Arten frei',
    fr: "Maîtrise tous les types d'effets librement",
    it: 'Padroneggio tutti i tipi di effetti liberamente',
    pt: 'Domino todos os tipos de efeitos livremente',
    ja: 'すべてのスピンを自由自在に操れる',
    zh: '自由掌握所有类型的旋转',
    ru: 'Свободно владею всеми типами вращения',
  },
  // Q5 Volley
  q5_opt1: {
    es: 'Intento pero fallo frecuentemente',
    de: 'Versuche es, scheitere aber häufig',
    fr: 'Essaie mais échoue fréquemment',
    it: 'Provo ma fallisco frequentemente',
    pt: 'Tento mas falho frequentemente',
    ja: '試みるが頻繁に失敗',
    zh: '尝试但经常失败',
    ru: 'Пытаюсь, но часто ошибаюсь',
  },
  q5_opt2: {
    es: 'Puedo ejecutar voleas simples cerca de la red',
    de: 'Kann einfache Volleys am Netz ausführen',
    fr: 'Peut exécuter des volées simples près du filet',
    it: 'Posso eseguire volée semplici vicino alla rete',
    pt: 'Posso executar voleios simples perto da rede',
    ja: 'ネット近くで簡単なボレーができる',
    zh: '能在网前完成简单截击',
    ru: 'Могу выполнять простые удары у сетки',
  },
  q5_opt3: {
    es: 'Competente con voleas a velocidad media',
    de: 'Kompetent bei Volleys mit mittlerem Tempo',
    fr: 'Compétent avec les volées à vitesse moyenne',
    it: 'Competente con volée a velocità media',
    pt: 'Competente com voleios em velocidade média',
    ja: '中程度の速度のボレーが得意',
    zh: '能熟练处理中速截击',
    ru: 'Уверенный удар с лёта на средней скорости',
  },
  q5_opt4: {
    es: 'Reflejos rápidos con colocación precisa',
    de: 'Schnelle Reflexe mit präziser Platzierung',
    fr: 'Réflexes rapides avec placement précis',
    it: 'Riflessi rapidi con posizionamento preciso',
    pt: 'Reflexos rápidos com colocação precisa',
    ja: '素早い反射と正確な配球',
    zh: '快速反应和精准落点',
    ru: 'Быстрые рефлексы с точным размещением',
  },
  // Q6 Point construction
  q6_opt1: {
    es: 'Me concentro solo en pasar la pelota',
    de: 'Konzentriere mich nur darauf, den Ball über das Netz zu spielen',
    fr: 'Me concentre seulement sur le renvoi de la balle',
    it: 'Mi concentro solo sul passare la palla',
    pt: 'Concentro-me apenas em passar a bola',
    ja: 'ボールを打ち返すことだけに集中',
    zh: '只专注于把球打过去',
    ru: 'Сосредотачиваюсь только на перебивании мяча',
  },
  q6_opt2: {
    es: 'Me concentro en mantener la pelota en la cancha',
    de: 'Konzentriere mich darauf, den Ball im Spielfeld zu halten',
    fr: 'Me concentre sur le maintien de la balle dans le court',
    it: 'Mi concentro sul tenere la palla in campo',
    pt: 'Concentro-me em manter a bola na quadra',
    ja: 'コート内にボールを入れることに集中',
    zh: '专注于让球落在场内',
    ru: 'Сосредотачиваюсь на удержании мяча в корте',
  },
  q6_opt3: {
    es: 'Tengo la capacidad de construir puntos',
    de: 'Habe die Fähigkeit, Punkte aufzubauen',
    fr: 'Ai la capacité de construire les points',
    it: 'Ho la capacità di costruire punti',
    pt: 'Tenho capacidade de construir pontos',
    ja: 'ポイントを構成する能力がある',
    zh: '有构建得分的能力',
    ru: 'Умею строить розыгрыши',
  },
  q6_opt4: {
    es: 'Juego cada punto estratégicamente',
    de: 'Spiele jeden Punkt strategisch',
    fr: 'Joue chaque point stratégiquement',
    it: 'Gioco ogni punto strategicamente',
    pt: 'Jogo cada ponto estrategicamente',
    ja: '毎ポイントを戦略的にプレー',
    zh: '每一分都有策略地打',
    ru: 'Играю каждое очко стратегически',
  },
  // Q7 Positioning
  q7_opt1: {
    es: 'Sin concepto de posicionamiento',
    de: 'Kein Konzept von Positionierung',
    fr: 'Pas de concept de positionnement',
    it: 'Nessun concetto di posizionamento',
    pt: 'Sem conceito de posicionamento',
    ja: 'ポジショニングの概念がない',
    zh: '没有位置概念',
    ru: 'Нет понятия о позиционировании',
  },
  q7_opt2: {
    es: 'Juego solo desde la línea de fondo',
    de: 'Spiele nur von der Grundlinie',
    fr: 'Joue uniquement depuis la ligne de fond',
    it: 'Gioco solo dalla linea di fondo',
    pt: 'Jogo apenas da linha de base',
    ja: 'ベースラインからのみプレー',
    zh: '只在底线打球',
    ru: 'Играю только с задней линии',
  },
  q7_opt3: {
    es: 'Combino juego de red y línea de fondo',
    de: 'Kombiniere Netz- und Grundlinienspiel',
    fr: 'Combine jeu au filet et en fond de court',
    it: 'Combino gioco a rete e fondo campo',
    pt: 'Combino jogo de rede e linha de base',
    ja: 'ネットとベースラインを併用',
    zh: '结合网前和底线打法',
    ru: 'Сочетаю игру у сетки и на задней линии',
  },
  q7_opt4: {
    es: 'Elijo la posición óptima para cada situación',
    de: 'Wähle für jede Situation die optimale Position',
    fr: 'Choisis la position optimale pour chaque situation',
    it: 'Scelgo la posizione ottimale per ogni situazione',
    pt: 'Escolho a posição ideal para cada situação',
    ja: '状況に応じて最適なポジションを選択',
    zh: '根据情况选择最佳位置',
    ru: 'Выбираю оптимальную позицию для каждой ситуации',
  },
  // Q8 Weakness
  q8_opt1: {
    es: 'No puedo explotar las debilidades del oponente',
    de: 'Kann gegnerische Schwächen nicht ausnutzen',
    fr: 'Ne peux pas exploiter les faiblesses adverses',
    it: "Non riesco a sfruttare le debolezze dell'avversario",
    pt: 'Não consigo explorar as fraquezas do oponente',
    ja: '相手の弱点を攻略できない',
    zh: '无法利用对手的弱点',
    ru: 'Не могу использовать слабости соперника',
  },
  q8_opt2: {
    es: 'Ocasionalmente exploto las debilidades',
    de: 'Nutze gelegentlich Schwächen aus',
    fr: 'Exploite occasionnellement les faiblesses',
    it: 'Occasionalmente sfrutto le debolezze',
    pt: 'Ocasionalmente exploro as fraquezas',
    ja: '時々弱点を攻略する',
    zh: '偶尔利用弱点',
    ru: 'Иногда использую слабости',
  },
  q8_opt3: {
    es: 'Exploto las debilidades de forma consistente',
    de: 'Nutze Schwächen konstant aus',
    fr: 'Exploite les faiblesses de manière constante',
    it: 'Sfrutto le debolezze in modo costante',
    pt: 'Exploro as fraquezas de forma consistente',
    ja: '一貫して弱点を攻略する',
    zh: '稳定利用弱点',
    ru: 'Стабильно использую слабости',
  },
  q8_opt4: {
    es: 'Identifico rápidamente y exploto efectivamente',
    de: 'Identifiziere schnell und nutze effektiv',
    fr: 'Identifie rapidement et exploite efficacement',
    it: 'Identifico rapidamente e sfrutto efficacemente',
    pt: 'Identifico rapidamente e exploro efetivamente',
    ja: '素早く把握し効果的に攻略',
    zh: '快速识别并有效利用',
    ru: 'Быстро определяю и эффективно использую',
  },
  // Q9 Pressure
  q9_opt1: {
    es: 'Cometo errores frecuentemente bajo presión',
    de: 'Mache unter Druck häufig Fehler',
    fr: 'Fais fréquemment des erreurs sous pression',
    it: 'Commetto errori frequentemente sotto pressione',
    pt: 'Cometo erros frequentemente sob pressão',
    ja: 'プレッシャー下でよくミスする',
    zh: '压力下经常失误',
    ru: 'Часто ошибаюсь под давлением',
  },
  q9_opt2: {
    es: 'Me vuelvo inestable bajo presión',
    de: 'Werde unter Druck instabil',
    fr: 'Deviens instable sous pression',
    it: 'Divento instabile sotto pressione',
    pt: 'Fico instável sob pressão',
    ja: 'プレッシャー下で不安定になる',
    zh: '压力下变得不稳定',
    ru: 'Становлюсь нестабильным под давлением',
  },
  q9_opt3: {
    es: 'Puedo manejar situaciones de presión',
    de: 'Kann Drucksituationen bewältigen',
    fr: 'Peux gérer les situations de pression',
    it: 'Posso gestire le situazioni di pressione',
    pt: 'Consigo lidar com situações de pressão',
    ja: 'プレッシャー状況に対処できる',
    zh: '能应对压力情况',
    ru: 'Могу справляться с давлением',
  },
  q9_opt4: {
    es: 'Mantengo control perfecto bajo presión',
    de: 'Behalte unter Druck perfekte Kontrolle',
    fr: 'Maintiens un contrôle parfait sous pression',
    it: 'Mantengo controllo perfetto sotto pressione',
    pt: 'Mantenho controle perfeito sob pressão',
    ja: 'プレッシャー下でも完璧にコントロール',
    zh: '压力下保持完美控制',
    ru: 'Сохраняю идеальный контроль под давлением',
  },
  // Q10 Lessons/Experience
  q10_opt1: {
    es: '0-6 meses',
    de: '0-6 Monate',
    fr: '0-6 mois',
    it: '0-6 mesi',
    pt: '0-6 meses',
    ja: '0-6ヶ月',
    zh: '0-6个月',
    ru: '0-6 месяцев',
  },
  q10_opt2: {
    es: '6 meses - 1 año',
    de: '6 Monate - 1 Jahr',
    fr: '6 mois - 1 an',
    it: '6 mesi - 1 anno',
    pt: '6 meses - 1 ano',
    ja: '6ヶ月-1年',
    zh: '6个月-1年',
    ru: '6 месяцев - 1 год',
  },
  q10_opt3: {
    es: '1-4 años',
    de: '1-4 Jahre',
    fr: '1-4 ans',
    it: '1-4 anni',
    pt: '1-4 anos',
    ja: '1-4年',
    zh: '1-4年',
    ru: '1-4 года',
  },
  q10_opt4: {
    es: '4-10 años',
    de: '4-10 Jahre',
    fr: '4-10 ans',
    it: '4-10 anni',
    pt: '4-10 anos',
    ja: '4-10年',
    zh: '4-10年',
    ru: '4-10 лет',
  },
  q10_opt5: {
    es: 'Más de 10 años',
    de: 'Mehr als 10 Jahre',
    fr: 'Plus de 10 ans',
    it: 'Più di 10 anni',
    pt: 'Mais de 10 anos',
    ja: '10年以上',
    zh: '10年以上',
    ru: 'Более 10 лет',
  },
  // Q11 Tournaments
  q11_opt1: {
    es: 'Ninguna o solo partidos de práctica',
    de: 'Keine oder nur Trainingsspiele',
    fr: "Aucune ou matchs d'entraînement seulement",
    it: 'Nessuna o solo partite di allenamento',
    pt: 'Nenhuma ou apenas jogos de treino',
    ja: 'なし、または練習試合のみ',
    zh: '没有或只有练习赛',
    ru: 'Нет или только тренировочные матчи',
  },
  q11_opt2: {
    es: 'Torneos a nivel de club',
    de: 'Club-Turniere',
    fr: 'Tournois au niveau du club',
    it: 'Tornei a livello di club',
    pt: 'Torneios no nível do clube',
    ja: 'クラブ内トーナメント',
    zh: '俱乐部级别比赛',
    ru: 'Турниры клубного уровня',
  },
  q11_opt3: {
    es: 'Participación en torneos regionales',
    de: 'Regionale Turniere',
    fr: 'Participation à des tournois régionaux',
    it: 'Partecipazione a tornei regionali',
    pt: 'Participação em torneios regionais',
    ja: '地域トーナメントに参加',
    zh: '参加地区级比赛',
    ru: 'Участие в региональных турнирах',
  },
  q11_opt4: {
    es: 'Victorias en torneos a nivel ciudad/provincial',
    de: 'Siege bei Stadt-/Landesturnieren',
    fr: 'Victoires en tournois ville/province',
    it: 'Vittorie in tornei a livello città/provincia',
    pt: 'Vitórias em torneios de nível cidade/estadual',
    ja: '市/都道府県レベルのトーナメントで優勝',
    zh: '市/省级比赛获胜',
    ru: 'Победы на городских/областных турнирах',
  },
  // Q12 Frequency
  q12_opt1: {
    es: '1-2 veces al mes',
    de: '1-2 Mal pro Monat',
    fr: '1-2 fois par mois',
    it: '1-2 volte al mese',
    pt: '1-2 vezes por mês',
    ja: '月に1-2回',
    zh: '每月1-2次',
    ru: '1-2 раза в месяц',
  },
  q12_opt2: {
    es: 'Una vez por semana',
    de: 'Einmal pro Woche',
    fr: 'Une fois par semaine',
    it: 'Una volta a settimana',
    pt: 'Uma vez por semana',
    ja: '週に1回',
    zh: '每周1次',
    ru: 'Один раз в неделю',
  },
  q12_opt3: {
    es: '2-3 veces por semana',
    de: '2-3 Mal pro Woche',
    fr: '2-3 fois par semaine',
    it: '2-3 volte a settimana',
    pt: '2-3 vezes por semana',
    ja: '週に2-3回',
    zh: '每周2-3次',
    ru: '2-3 раза в неделю',
  },
  q12_opt4: {
    es: '4+ veces por semana',
    de: '4+ Mal pro Woche',
    fr: '4+ fois par semaine',
    it: '4+ volte a settimana',
    pt: '4+ vezes por semana',
    ja: '週に4回以上',
    zh: '每周4次以上',
    ru: '4+ раза в неделю',
  },
  // Q13 Improvement
  q13_opt1: {
    es: 'Mejorando lentamente',
    de: 'Langsame Verbesserung',
    fr: 'Amélioration lente',
    it: 'Miglioramento lento',
    pt: 'Melhorando lentamente',
    ja: 'ゆっくり上達している',
    zh: '缓慢进步',
    ru: 'Медленный прогресс',
  },
  q13_opt2: {
    es: 'Mejorando constantemente',
    de: 'Stetige Verbesserung',
    fr: 'Amélioration constante',
    it: 'Miglioramento costante',
    pt: 'Melhorando constantemente',
    ja: '着実に上達している',
    zh: '稳定进步',
    ru: 'Стабильный прогресс',
  },
  q13_opt3: {
    es: 'Mejorando rápidamente',
    de: 'Schnelle Verbesserung',
    fr: 'Amélioration rapide',
    it: 'Miglioramento rapido',
    pt: 'Melhorando rapidamente',
    ja: '急速に上達している',
    zh: '快速进步',
    ru: 'Быстрый прогресс',
  },
  q13_opt4: {
    es: 'Mejorando muy rápidamente',
    de: 'Sehr schnelle Verbesserung',
    fr: 'Amélioration très rapide',
    it: 'Miglioramento molto rapido',
    pt: 'Melhorando muito rapidamente',
    ja: '非常に急速に上達している',
    zh: '非常快速地进步',
    ru: 'Очень быстрый прогресс',
  },
  // Q14 Results
  q14_opt1: {
    es: 'Pierdo la mayoría de los partidos',
    de: 'Verliere die meisten Spiele',
    fr: 'Perds la plupart des matchs',
    it: 'Perdo la maggior parte delle partite',
    pt: 'Perco a maioria das partidas',
    ja: 'ほとんどの試合で負ける',
    zh: '大多数比赛都输',
    ru: 'Проигрываю большинство матчей',
  },
  q14_opt2: {
    es: 'Parejo con jugadores de nivel similar',
    de: 'Ausgeglichen mit ähnlichen Spielern',
    fr: 'Équilibré avec des joueurs similaires',
    it: 'Pari con giocatori di livello simile',
    pt: 'Equilibrado com jogadores de nível similar',
    ja: '同レベルの選手と互角',
    zh: '与同水平选手势均力敌',
    ru: 'Равный с игроками похожего уровня',
  },
  q14_opt3: {
    es: 'Gano la mayoría a nivel similar',
    de: 'Gewinne die meisten auf ähnlichem Niveau',
    fr: 'Gagne la plupart au même niveau',
    it: 'Vinco la maggior parte a livello simile',
    pt: 'Ganho a maioria no nível similar',
    ja: '同レベルの大部分に勝つ',
    zh: '在同水平中赢得大多数',
    ru: 'Выигрываю большинство на своём уровне',
  },
  q14_opt4: {
    es: 'Parejo con jugadores un nivel más alto',
    de: 'Ausgeglichen mit einem Niveau höher',
    fr: 'Équilibré avec un niveau au-dessus',
    it: 'Pari con giocatori un livello superiore',
    pt: 'Equilibrado com jogadores um nível acima',
    ja: '一段上のレベルと互角',
    zh: '与高一级选手势均力敌',
    ru: 'Равный с игроками на уровень выше',
  },
};

// Page translations
const pageTranslations = {
  Skills: {
    es: 'Técnica',
    de: 'Technik',
    fr: 'Technique',
    it: 'Tecnica',
    pt: 'Técnica',
    ja: '技術',
    zh: '技术',
    ru: 'Техника',
  },
  Tactics: {
    es: 'Táctica',
    de: 'Taktik',
    fr: 'Tactique',
    it: 'Tattica',
    pt: 'Tática',
    ja: '戦術',
    zh: '战术',
    ru: 'Тактика',
  },
  Experience: {
    es: 'Experiencia',
    de: 'Erfahrung',
    fr: 'Expérience',
    it: 'Esperienza',
    pt: 'Experiência',
    ja: '経験',
    zh: '经验',
    ru: 'Опыт',
  },
  'Self-Assessment': {
    es: 'Autoevaluación',
    de: 'Selbsteinschätzung',
    fr: 'Auto-évaluation',
    it: 'Autovalutazione',
    pt: 'Autoavaliação',
    ja: '自己評価',
    zh: '自我评估',
    ru: 'Самооценка',
  },
};

// Update question translations - add 8 languages after 'en'
for (const [qId, trans] of Object.entries(questionTranslations)) {
  const questionRegex = new RegExp(
    `(id: '${qId}',[\\s\\S]*?question: \\{[\\s\\S]*?en: '[^']*',)`,
    'g'
  );

  content = content.replace(questionRegex, match => {
    let addedLangs = '';
    for (const [lang, text] of Object.entries(trans)) {
      // Escape single quotes in the text
      const escapedText = text.replace(/'/g, "\\'");
      addedLangs += `\n      ${lang}: '${escapedText}',`;
    }
    return match + addedLangs;
  });
}

// Update option translations - add 8 languages after 'en'
for (const [optId, trans] of Object.entries(optionTranslations)) {
  const optionRegex = new RegExp(`(id: '${optId}',[\\s\\S]*?text: \\{[\\s\\S]*?en: '[^']*',)`, 'g');

  content = content.replace(optionRegex, match => {
    let addedLangs = '';
    for (const [lang, text] of Object.entries(trans)) {
      const escapedText = text.replace(/'/g, "\\'");
      addedLangs += `\n          ${lang}: '${escapedText}',`;
    }
    return match + addedLangs;
  });
}

// Update page title translations
for (const [enTitle, trans] of Object.entries(pageTranslations)) {
  const titleRegex = new RegExp(`(title: \\{ ko: '[^']*', en: '${enTitle}')( \\})`, 'g');

  content = content.replace(titleRegex, (match, prefix, suffix) => {
    let addedLangs = '';
    for (const [lang, text] of Object.entries(trans)) {
      addedLangs += `, ${lang}: '${text}'`;
    }
    return prefix + addedLangs + suffix;
  });
}

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated ltrQuestions.ts with multi-language support');
console.log('📝 Changes made:');
console.log('   - Renamed NTRP_QUESTIONS → LTR_QUESTIONS');
console.log('   - Renamed NtrpQuestion → LtrQuestion');
console.log('   - Added 8 language translations to all 14 questions');
console.log('   - Added 8 language translations to all options');
console.log('   - Added 8 language translations to page titles');
console.log('🌐 Languages: es, de, fr, it, pt, ja, zh, ru');
