/**
 * Script to add multi-language support to ltrQuestions.ts
 * Adds translations for: es, de, fr, it, pt, ja, zh, ru
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/constants/ltrQuestions.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Translations for questions and options
const translations = {
  // Q1: Forehand
  q1_forehand: {
    question: {
      es: '¿Cómo describirías tu golpe de derecha?',
      de: 'Wie würden Sie Ihren Vorhand-Schlag beschreiben?',
      fr: 'Comment décririez-vous votre coup droit?',
      it: 'Come descriveresti il tuo dritto?',
      pt: 'Como você descreveria seu forehand?',
      ja: 'フォアハンドストロークの能力はどの程度ですか？',
      zh: '您的正手击球能力如何？',
      ru: 'Как бы вы описали свой удар справа?',
    },
    options: {
      q1_opt1: {
        es: 'Solo puede pasar la pelota a corta distancia',
        de: 'Kann den Ball nur auf kurze Distanz übers Netz spielen',
        fr: 'Peut seulement renvoyer la balle à courte distance',
        it: 'Riesce a passare la palla solo a breve distanza',
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
    },
  },
  // Q2: Backhand
  q2_backhand: {
    question: {
      es: '¿Cómo describirías tu golpe de revés?',
      de: 'Wie würden Sie Ihren Rückhand-Schlag beschreiben?',
      fr: 'Comment décririez-vous votre revers?',
      it: 'Come descriveresti il tuo rovescio?',
      pt: 'Como você descreveria seu backhand?',
      ja: 'バックハンドストロークの能力はどの程度ですか？',
      zh: '您的反手击球能力如何？',
      ru: 'Как бы вы описали свой удар слева?',
    },
    options: {
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
    },
  },
  // Q3: Serve
  q3_serve: {
    question: {
      es: '¿Cómo describirías tu saque?',
      de: 'Wie würden Sie Ihren Aufschlag beschreiben?',
      fr: 'Comment décririez-vous votre service?',
      it: 'Come descriveresti il tuo servizio?',
      pt: 'Como você descreveria seu saque?',
      ja: 'サーブの能力はどの程度ですか？',
      zh: '您的发球能力如何？',
      ru: 'Как бы вы описали свою подачу?',
    },
    options: {
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
        es: 'Puede sacar pero con potencia limitada',
        de: 'Kann aufschlagen, aber mit begrenzter Power',
        fr: 'Peut servir mais avec une puissance limitée',
        it: 'Può servire ma con potenza limitata',
        pt: 'Consegue sacar mas com força limitada',
        ja: 'サーブはできるがパワーは限定的',
        zh: '能发球但力量有限',
        ru: 'Может подавать, но с ограниченной силой',
      },
      q3_opt3: {
        es: 'Saque consistente con efectos',
        de: 'Konstanter Aufschlag mit Spin',
        fr: 'Service régulier avec des effets',
        it: 'Servizio consistente con effetti',
        pt: 'Saque consistente com efeitos',
        ja: 'スピンを使った安定したサーブ',
        zh: '稳定的带旋转发球',
        ru: 'Стабильная подача с вращением',
      },
      q3_opt4: {
        es: 'Saque potente con ubicación precisa',
        de: 'Kraftvoller Aufschlag mit präziser Platzierung',
        fr: 'Service puissant avec placement précis',
        it: 'Servizio potente con posizionamento preciso',
        pt: 'Saque potente com colocação precisa',
        ja: '強力で正確な配球',
        zh: '强力且精准的发球',
        ru: 'Мощная подача с точным размещением',
      },
    },
  },
  // Q4: Return
  q4_return: {
    question: {
      es: '¿Cómo describirías tu devolución de saque?',
      de: 'Wie würden Sie Ihren Return beschreiben?',
      fr: 'Comment décririez-vous votre retour de service?',
      it: 'Come descriveresti la tua risposta al servizio?',
      pt: 'Como você descreveria sua devolução de saque?',
      ja: 'リターンの能力はどの程度ですか？',
      zh: '您的接发球能力如何？',
      ru: 'Как бы вы описали свой прием подачи?',
    },
    options: {
      q4_opt1: {
        es: 'Tiene dificultad para devolver saques',
        de: 'Hat Schwierigkeiten, Aufschläge zu returnen',
        fr: 'A du mal à retourner les services',
        it: 'Ha difficoltà a rispondere ai servizi',
        pt: 'Tem dificuldade em devolver saques',
        ja: 'サーブを返すのが難しい',
        zh: '接发球有困难',
        ru: 'Трудно принимать подачу',
      },
      q4_opt2: {
        es: 'Puede devolver saques lentos',
        de: 'Kann langsame Aufschläge returnen',
        fr: 'Peut retourner les services lents',
        it: 'Può rispondere ai servizi lenti',
        pt: 'Consegue devolver saques lentos',
        ja: '遅いサーブは返せる',
        zh: '能接慢速发球',
        ru: 'Может принимать медленные подачи',
      },
      q4_opt3: {
        es: 'Devuelve de forma consistente',
        de: 'Returnt konstant',
        fr: 'Retourne de manière constante',
        it: 'Risponde in modo consistente',
        pt: 'Devolve de forma consistente',
        ja: '安定してリターンできる',
        zh: '能稳定接发',
        ru: 'Стабильно принимает',
      },
      q4_opt4: {
        es: 'Devuelve agresivamente como arma',
        de: 'Returnt aggressiv als Waffe',
        fr: 'Retourne agressivement comme arme',
        it: 'Risponde aggressivamente come arma',
        pt: 'Devolve agressivamente como arma',
        ja: '攻撃的にリターンできる',
        zh: '进攻性接发球',
        ru: 'Агрессивный прием как оружие',
      },
    },
  },
  // Q5: Volley
  q5_volley: {
    question: {
      es: '¿Cómo describirías tu volea?',
      de: 'Wie würden Sie Ihren Volley beschreiben?',
      fr: 'Comment décririez-vous votre volée?',
      it: 'Come descriveresti la tua volée?',
      pt: 'Como você descreveria sua voleio?',
      ja: 'ボレーの能力はどの程度ですか？',
      zh: '您的网前截击能力如何？',
      ru: 'Как бы вы описали свой удар с лёта?',
    },
    options: {
      q5_opt1: {
        es: 'Intenta pero falla frecuentemente',
        de: 'Versucht es, scheitert aber häufig',
        fr: 'Essaie mais échoue fréquemment',
        it: 'Prova ma fallisce frequentemente',
        pt: 'Tenta mas falha frequentemente',
        ja: '試みるが頻繁に失敗',
        zh: '尝试但经常失败',
        ru: 'Пытается, но часто ошибается',
      },
      q5_opt2: {
        es: 'Puede ejecutar voleas simples cerca de la red',
        de: 'Kann einfache Volleys am Netz ausführen',
        fr: 'Peut exécuter des volées simples près du filet',
        it: 'Può eseguire volée semplici vicino alla rete',
        pt: 'Consegue executar voleios simples perto da rede',
        ja: 'ネット近くで簡単なボレーができる',
        zh: '能在网前完成简单截击',
        ru: 'Может выполнять простые удары у сетки',
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
    },
  },
  // Q6: Footwork
  q6_footwork: {
    question: {
      es: '¿Cómo describirías tu juego de pies?',
      de: 'Wie würden Sie Ihre Beinarbeit beschreiben?',
      fr: 'Comment décririez-vous votre jeu de jambes?',
      it: 'Come descriveresti il tuo gioco di gambe?',
      pt: 'Como você descreveria seu trabalho de pés?',
      ja: 'フットワークはどの程度ですか？',
      zh: '您的脚步移动能力如何？',
      ru: 'Как бы вы описали свою работу ног?',
    },
    options: {
      q6_opt1: {
        es: 'Movimiento limitado y posicionamiento deficiente',
        de: 'Eingeschränkte Bewegung und schlechte Positionierung',
        fr: 'Mouvement limité et mauvais positionnement',
        it: 'Movimento limitato e posizionamento scarso',
        pt: 'Movimento limitado e posicionamento ruim',
        ja: '動きが限られ、ポジショニングが悪い',
        zh: '移动有限，站位不佳',
        ru: 'Ограниченное движение и плохое позиционирование',
      },
      q6_opt2: {
        es: 'Movimiento básico, bolas fáciles',
        de: 'Grundlegende Bewegung, einfache Bälle',
        fr: 'Mouvement de base, balles faciles',
        it: 'Movimento di base, palle facili',
        pt: 'Movimento básico, bolas fáceis',
        ja: '基本的な動きで簡単なボールに対応',
        zh: '基本移动，能处理简单球',
        ru: 'Базовое движение, простые мячи',
      },
      q6_opt3: {
        es: 'Buen movimiento, puede perseguir bolas',
        de: 'Gute Bewegung, kann Bälle verfolgen',
        fr: 'Bon mouvement, peut poursuivre les balles',
        it: 'Buon movimento, può inseguire le palle',
        pt: 'Bom movimento, consegue perseguir bolas',
        ja: '良い動きでボールを追える',
        zh: '移动良好，能追到球',
        ru: 'Хорошее движение, может догонять мячи',
      },
      q6_opt4: {
        es: 'Excelente movimiento, cubre toda la cancha',
        de: 'Ausgezeichnete Bewegung, deckt das ganze Spielfeld ab',
        fr: 'Excellent mouvement, couvre tout le terrain',
        it: 'Eccellente movimento, copre tutto il campo',
        pt: 'Excelente movimento, cobre toda a quadra',
        ja: '優れた動きでコート全体をカバー',
        zh: '出色移动，覆盖全场',
        ru: 'Отличное движение, покрывает весь корт',
      },
    },
  },
  // Q7: Rally consistency
  q7_rally: {
    question: {
      es: '¿Cómo describirías tu consistencia en los peloteos?',
      de: 'Wie würden Sie Ihre Ballwechsel-Konsistenz beschreiben?',
      fr: 'Comment décririez-vous votre régularité en échange?',
      it: 'Come descriveresti la tua consistenza negli scambi?',
      pt: 'Como você descreveria sua consistência nas trocas de bola?',
      ja: 'ラリーの安定性はどの程度ですか？',
      zh: '您的对打稳定性如何？',
      ru: 'Как бы вы описали свою стабильность в розыгрышах?',
    },
    options: {
      q7_opt1: {
        es: 'Pierde puntos rápidamente',
        de: 'Verliert Punkte schnell',
        fr: 'Perd des points rapidement',
        it: 'Perde punti velocemente',
        pt: 'Perde pontos rapidamente',
        ja: 'すぐにポイントを失う',
        zh: '很快丢分',
        ru: 'Быстро теряет очки',
      },
      q7_opt2: {
        es: 'Puede mantener peloteos cortos',
        de: 'Kann kurze Ballwechsel halten',
        fr: 'Peut maintenir des échanges courts',
        it: 'Può mantenere scambi brevi',
        pt: 'Consegue manter trocas curtas',
        ja: '短いラリーを続けられる',
        zh: '能保持短时对打',
        ru: 'Может держать короткие розыгрыши',
      },
      q7_opt3: {
        es: 'Consistente en peloteos largos',
        de: 'Konstant in langen Ballwechseln',
        fr: 'Constant dans les longs échanges',
        it: 'Consistente negli scambi lunghi',
        pt: 'Consistente em trocas longas',
        ja: '長いラリーで安定',
        zh: '长时对打稳定',
        ru: 'Стабилен в длинных розыгрышах',
      },
      q7_opt4: {
        es: 'Domina los peloteos con control',
        de: 'Dominiert Ballwechsel mit Kontrolle',
        fr: 'Domine les échanges avec contrôle',
        it: 'Domina gli scambi con controllo',
        pt: 'Domina as trocas com controle',
        ja: 'コントロールでラリーを支配',
        zh: '控制对打节奏',
        ru: 'Доминирует в розыгрышах с контролем',
      },
    },
  },
  // Q8: Opponent weakness
  q8_opponent: {
    question: {
      es: '¿Cómo identificas y explotas las debilidades del oponente?',
      de: 'Wie identifizieren und nutzen Sie die Schwächen des Gegners?',
      fr: "Comment identifiez-vous et exploitez-vous les faiblesses de l'adversaire?",
      it: "Come identifichi e sfrutti le debolezze dell'avversario?",
      pt: 'Como você identifica e explora as fraquezas do oponente?',
      ja: '相手の弱点をどのように見つけて攻略しますか？',
      zh: '您如何识别并利用对手的弱点？',
      ru: 'Как вы определяете и используете слабости соперника?',
    },
    options: {
      q8_opt1: {
        es: 'No analizo al oponente',
        de: 'Analysiere den Gegner nicht',
        fr: "N'analyse pas l'adversaire",
        it: "Non analizzo l'avversario",
        pt: 'Não analiso o oponente',
        ja: '相手を分析しない',
        zh: '不分析对手',
        ru: 'Не анализирую соперника',
      },
      q8_opt2: {
        es: 'Noto debilidades obvias',
        de: 'Bemerke offensichtliche Schwächen',
        fr: 'Remarque les faiblesses évidentes',
        it: 'Noto debolezze ovvie',
        pt: 'Noto fraquezas óbvias',
        ja: '明らかな弱点に気づく',
        zh: '注意到明显弱点',
        ru: 'Замечаю очевидные слабости',
      },
      q8_opt3: {
        es: 'Analizo y adapto estrategia',
        de: 'Analysiere und passe Strategie an',
        fr: 'Analyse et adapte la stratégie',
        it: 'Analizzo e adatto la strategia',
        pt: 'Analiso e adapto estratégia',
        ja: '分析して戦略を適応',
        zh: '分析并调整策略',
        ru: 'Анализирую и адаптирую стратегию',
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
    },
  },
  // Q9: Pressure
  q9_pressure: {
    question: {
      es: '¿Cómo manejas las situaciones de presión?',
      de: 'Wie gehen Sie mit Drucksituationen um?',
      fr: 'Comment gérez-vous les situations de pression?',
      it: 'Come gestisci le situazioni di pressione?',
      pt: 'Como você lida com situações de pressão?',
      ja: 'プレッシャー下でどのように対処しますか？',
      zh: '您如何应对压力情况？',
      ru: 'Как вы справляетесь с давлением?',
    },
    options: {
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
    },
  },
  // Q10: Experience
  q10_lessons: {
    question: {
      es: '¿Cuánto tiempo llevas jugando tenis?',
      de: 'Wie lange spielen Sie schon Pickleball?',
      fr: 'Depuis combien de temps jouez-vous au pickleball?',
      it: 'Da quanto tempo giochi a pickleball?',
      pt: 'Há quanto tempo você joga tênis?',
      ja: 'テニス歴はどのくらいですか？',
      zh: '您打网球多长时间了？',
      ru: 'Как долго вы играете в теннис?',
    },
    options: {
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
        es: 'Más de 4 años',
        de: 'Mehr als 4 Jahre',
        fr: 'Plus de 4 ans',
        it: 'Più di 4 anni',
        pt: 'Mais de 4 anos',
        ja: '4年以上',
        zh: '4年以上',
        ru: 'Более 4 лет',
      },
    },
  },
  // Q11: Match experience
  q11_match: {
    question: {
      es: '¿Cuánta experiencia en partidos competitivos tienes?',
      de: 'Wie viel Wettkampferfahrung haben Sie?',
      fr: 'Quelle est votre expérience en matchs compétitifs?',
      it: 'Quanta esperienza in partite competitive hai?',
      pt: 'Quanta experiência em jogos competitivos você tem?',
      ja: '試合経験はどのくらいありますか？',
      zh: '您有多少比赛经验？',
      ru: 'Какой у вас опыт соревновательных матчей?',
    },
    options: {
      q11_opt1: {
        es: 'Sin experiencia en partidos',
        de: 'Keine Match-Erfahrung',
        fr: "Pas d'expérience de match",
        it: 'Nessuna esperienza di partita',
        pt: 'Sem experiência em jogos',
        ja: '試合経験なし',
        zh: '没有比赛经验',
        ru: 'Нет опыта матчей',
      },
      q11_opt2: {
        es: 'Unos pocos partidos amistosos',
        de: 'Einige freundschaftliche Spiele',
        fr: 'Quelques matchs amicaux',
        it: 'Alcune partite amichevoli',
        pt: 'Alguns jogos amistosos',
        ja: '数回の練習試合',
        zh: '几场友谊赛',
        ru: 'Несколько дружеских матчей',
      },
      q11_opt3: {
        es: 'Partidos regulares de liga/club',
        de: 'Regelmäßige Liga-/Clubspiele',
        fr: 'Matchs réguliers de ligue/club',
        it: 'Partite regolari di lega/club',
        pt: 'Jogos regulares de liga/clube',
        ja: '定期的なリーグ/クラブ戦',
        zh: '定期联赛/俱乐部比赛',
        ru: 'Регулярные матчи лиги/клуба',
      },
      q11_opt4: {
        es: 'Torneos y competiciones',
        de: 'Turniere und Wettbewerbe',
        fr: 'Tournois et compétitions',
        it: 'Tornei e competizioni',
        pt: 'Torneios e competições',
        ja: 'トーナメントと大会',
        zh: '锦标赛和比赛',
        ru: 'Турниры и соревнования',
      },
    },
  },
  // Q12: Lessons
  q12_coaching: {
    question: {
      es: '¿Has recibido entrenamiento formal?',
      de: 'Haben Sie formelles Training erhalten?',
      fr: 'Avez-vous reçu un entraînement formel?',
      it: 'Hai ricevuto un allenamento formale?',
      pt: 'Você recebeu treinamento formal?',
      ja: '正式なコーチングを受けたことがありますか？',
      zh: '您是否接受过正规培训？',
      ru: 'Вы проходили формальное обучение?',
    },
    options: {
      q12_opt1: {
        es: 'Autodidacta',
        de: 'Selbst beigebracht',
        fr: 'Autodidacte',
        it: 'Autodidatta',
        pt: 'Autodidata',
        ja: '独学',
        zh: '自学',
        ru: 'Самоучка',
      },
      q12_opt2: {
        es: 'Algunas lecciones grupales',
        de: 'Einige Gruppenunterricht',
        fr: 'Quelques cours en groupe',
        it: 'Alcune lezioni di gruppo',
        pt: 'Algumas aulas em grupo',
        ja: '何度かのグループレッスン',
        zh: '一些团体课程',
        ru: 'Несколько групповых уроков',
      },
      q12_opt3: {
        es: 'Lecciones privadas regulares',
        de: 'Regelmäßiger Privatunterricht',
        fr: 'Leçons privées régulières',
        it: 'Lezioni private regolari',
        pt: 'Aulas particulares regulares',
        ja: '定期的なプライベートレッスン',
        zh: '定期私教课程',
        ru: 'Регулярные частные уроки',
      },
      q12_opt4: {
        es: 'Entrenamiento intensivo/academia',
        de: 'Intensives Training/Akademie',
        fr: 'Entraînement intensif/académie',
        it: 'Allenamento intensivo/accademia',
        pt: 'Treinamento intensivo/academia',
        ja: '集中トレーニング/アカデミー',
        zh: '强化训练/网球学院',
        ru: 'Интенсивная подготовка/академия',
      },
    },
  },
  // Q13: Self assessment
  q13_selfassess: {
    question: {
      es: '¿Cómo evaluarías tu nivel general?',
      de: 'Wie würden Sie Ihr Gesamtniveau einschätzen?',
      fr: 'Comment évalueriez-vous votre niveau général?',
      it: 'Come valuteresti il tuo livello generale?',
      pt: 'Como você avaliaria seu nível geral?',
      ja: '自分の総合レベルをどう評価しますか？',
      zh: '您如何评价自己的整体水平？',
      ru: 'Как бы вы оценили свой общий уровень?',
    },
    options: {
      q13_opt1: {
        es: 'Principiante - aprendiendo lo básico',
        de: 'Anfänger - lerne die Grundlagen',
        fr: 'Débutant - apprends les bases',
        it: 'Principiante - imparo le basi',
        pt: 'Iniciante - aprendendo o básico',
        ja: '初心者 - 基本を学んでいる',
        zh: '初学者 - 学习基础',
        ru: 'Начинающий - изучаю основы',
      },
      q13_opt2: {
        es: 'Intermedio - puedo jugar partidos',
        de: 'Mittelstufe - kann Spiele spielen',
        fr: 'Intermédiaire - peux jouer des matchs',
        it: 'Intermedio - posso giocare partite',
        pt: 'Intermediário - posso jogar partidas',
        ja: '中級者 - 試合ができる',
        zh: '中级 - 能打比赛',
        ru: 'Средний - могу играть матчи',
      },
      q13_opt3: {
        es: 'Avanzado - sólido en todos los aspectos',
        de: 'Fortgeschritten - solide in allen Bereichen',
        fr: 'Avancé - solide dans tous les domaines',
        it: 'Avanzato - solido in tutti gli aspetti',
        pt: 'Avançado - sólido em todos os aspectos',
        ja: '上級者 - 全ての面で堅実',
        zh: '高级 - 各方面都扎实',
        ru: 'Продвинутый - уверен во всех аспектах',
      },
      q13_opt4: {
        es: 'Experto - compito a alto nivel',
        de: 'Experte - spiele auf hohem Niveau',
        fr: 'Expert - joue à haut niveau',
        it: 'Esperto - gioco ad alto livello',
        pt: 'Expert - compito em alto nível',
        ja: 'エキスパート - 高いレベルで競争',
        zh: '专家 - 高水平竞技',
        ru: 'Эксперт - соревнуюсь на высоком уровне',
      },
    },
  },
  // Q14: Comparison
  q14_comparison: {
    question: {
      es: '¿Cómo te comparas con otros jugadores en tu área?',
      de: 'Wie vergleichen Sie sich mit anderen Spielern in Ihrer Umgebung?',
      fr: 'Comment vous comparez-vous aux autres joueurs de votre région?',
      it: 'Come ti confronti con altri giocatori nella tua zona?',
      pt: 'Como você se compara com outros jogadores na sua região?',
      ja: '地域の他のプレーヤーと比べてどうですか？',
      zh: '与您所在地区的其他球员相比如何？',
      ru: 'Как вы сравниваете себя с другими игроками в вашем районе?',
    },
    options: {
      q14_opt1: {
        es: 'Menos experimentado que la mayoría',
        de: 'Weniger erfahren als die meisten',
        fr: 'Moins expérimenté que la plupart',
        it: 'Meno esperto della maggior parte',
        pt: 'Menos experiente que a maioria',
        ja: 'ほとんどの人より経験が少ない',
        zh: '比大多数人经验少',
        ru: 'Менее опытен, чем большинство',
      },
      q14_opt2: {
        es: 'Promedio entre los jugadores recreativos',
        de: 'Durchschnitt unter den Freizeitspielern',
        fr: 'Moyen parmi les joueurs récréatifs',
        it: 'Nella media tra i giocatori ricreativi',
        pt: 'Média entre jogadores recreativos',
        ja: 'レクリエーションプレーヤーの中で平均的',
        zh: '休闲球员中的平均水平',
        ru: 'Средний среди любителей',
      },
      q14_opt3: {
        es: 'Por encima del promedio en mi club/área',
        de: 'Überdurchschnittlich in meinem Club/Bereich',
        fr: 'Au-dessus de la moyenne dans mon club/région',
        it: 'Sopra la media nel mio club/zona',
        pt: 'Acima da média no meu clube/região',
        ja: 'クラブ/地域で平均以上',
        zh: '在俱乐部/地区高于平均水平',
        ru: 'Выше среднего в своём клубе/районе',
      },
      q14_opt4: {
        es: 'Entre los mejores de mi área',
        de: 'Unter den Besten in meiner Gegend',
        fr: 'Parmi les meilleurs de ma région',
        it: 'Tra i migliori nella mia zona',
        pt: 'Entre os melhores da minha região',
        ja: '地域でトップクラス',
        zh: '所在地区最好的之一',
        ru: 'Один из лучших в своём районе',
      },
    },
  },
};

// Page titles translations
const pageTranslations = {
  skills: {
    es: 'Técnica',
    de: 'Technik',
    fr: 'Technique',
    it: 'Tecnica',
    pt: 'Técnica',
    ja: '技術',
    zh: '技术',
    ru: 'Техника',
  },
  tactics: {
    es: 'Táctica',
    de: 'Taktik',
    fr: 'Tactique',
    it: 'Tattica',
    pt: 'Tática',
    ja: '戦術',
    zh: '战术',
    ru: 'Тактика',
  },
  experience: {
    es: 'Experiencia',
    de: 'Erfahrung',
    fr: 'Expérience',
    it: 'Esperienza',
    pt: 'Experiência',
    ja: '経験',
    zh: '经验',
    ru: 'Опыт',
  },
  selfAssessment: {
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

// Update interface to support all languages
const newInterface = `export interface LtrQuestion {
  id: string;
  category: 'skills' | 'tactics' | 'experience' | 'selfAssessment';
  page: 1 | 2 | 3 | 4;
  question: {
    ko: string;
    en: string;
    es: string;
    de: string;
    fr: string;
    it: string;
    pt: string;
    ja: string;
    zh: string;
    ru: string;
  };
  options: Array<{
    id: string;
    text: {
      ko: string;
      en: string;
      es: string;
      de: string;
      fr: string;
      it: string;
      pt: string;
      ja: string;
      zh: string;
      ru: string;
    };
    indicatedNtrpRange: [number, number];
    score: number;
  }>;
}`;

// Replace old interface
content = content.replace(/export interface NtrpQuestion \{[\s\S]*?\};/m, newInterface);

// Rename NtrpQuestion to LtrQuestion in the rest of the file
content = content.replace(/NtrpQuestion/g, 'LtrQuestion');
content = content.replace(/NTRP_QUESTIONS/g, 'LPR_QUESTIONS');

// Add translations to each question
for (const [qId, trans] of Object.entries(translations)) {
  // Add question translations
  for (const [lang, text] of Object.entries(trans.question)) {
    const regex = new RegExp(`(id: '${qId}',[\\s\\S]*?question: \\{[\\s\\S]*?en: '[^']*',)`, 'g');
    content = content.replace(regex, match => {
      if (!match.includes(`${lang}:`)) {
        return match.replace(
          /en: '[^']*',/,
          enMatch => `${enMatch}\n      ${lang}: '${text.replace(/'/g, "\\'")}',`
        );
      }
      return match;
    });
  }

  // Add option translations
  for (const [optId, optTrans] of Object.entries(trans.options)) {
    for (const [lang, text] of Object.entries(optTrans)) {
      const regex = new RegExp(`(id: '${optId}',[\\s\\S]*?text: \\{[\\s\\S]*?en: '[^']*',)`, 'g');
      content = content.replace(regex, match => {
        if (!match.includes(`${lang}:`)) {
          return match.replace(
            /en: '[^']*',/,
            enMatch => `${enMatch}\n          ${lang}: '${text.replace(/'/g, "\\'")}',`
          );
        }
        return match;
      });
    }
  }
}

// Add page translations to QUESTION_PAGES
for (const [page, trans] of Object.entries(pageTranslations)) {
  for (const [lang, text] of Object.entries(trans)) {
    const regex = new RegExp(`(id: '${page}',[\\s\\S]*?title: \\{[\\s\\S]*?en: '[^']*',)`, 'g');
    content = content.replace(regex, match => {
      if (!match.includes(`${lang}:`)) {
        return match.replace(/en: '[^']*',/, enMatch => `${enMatch}\n    ${lang}: '${text}',`);
      }
      return match;
    });
  }
}

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated ltrQuestions.ts with multi-language support');
console.log('Languages added: es, de, fr, it, pt, ja, zh, ru');
