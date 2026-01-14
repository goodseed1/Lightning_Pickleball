/**
 * Add matchScoreEntry translations to all locale files
 *
 * Keys to add based on screenshot:
 * - matchScoreEntry.setScores
 * - matchScoreEntry.set
 * - matchScoreEntry.player1Score
 * - matchScoreEntry.player2Score
 * - matchScoreEntry.addSet
 * - matchScoreEntry.selectWinner
 * - matchScoreEntry.submitScore
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for each language
const translations = {
  en: {
    setScores: 'Set Scores',
    set: 'Set {{number}}',
    player1Score: 'Player 1 Score',
    player2Score: 'Player 2 Score',
    addSet: 'Add Set',
    selectWinner: 'Select Winner',
    submitScore: 'Submit Score',
  },
  ko: {
    setScores: '세트 점수',
    set: '세트 {{number}}',
    player1Score: '선수 1 점수',
    player2Score: '선수 2 점수',
    addSet: '세트 추가',
    selectWinner: '승자 선택',
    submitScore: '점수 제출',
  },
  ru: {
    setScores: 'Счёт по сетам',
    set: 'Сет {{number}}',
    player1Score: 'Счёт игрока 1',
    player2Score: 'Счёт игрока 2',
    addSet: 'Добавить сет',
    selectWinner: 'Выбрать победителя',
    submitScore: 'Отправить счёт',
  },
  ja: {
    setScores: 'セットスコア',
    set: 'セット {{number}}',
    player1Score: 'プレイヤー1スコア',
    player2Score: 'プレイヤー2スコア',
    addSet: 'セット追加',
    selectWinner: '勝者を選択',
    submitScore: 'スコアを送信',
  },
  zh: {
    setScores: '局比分',
    set: '第 {{number}} 局',
    player1Score: '选手1比分',
    player2Score: '选手2比分',
    addSet: '添加局',
    selectWinner: '选择获胜者',
    submitScore: '提交比分',
  },
  de: {
    setScores: 'Satzstände',
    set: 'Satz {{number}}',
    player1Score: 'Spieler 1 Punktzahl',
    player2Score: 'Spieler 2 Punktzahl',
    addSet: 'Satz hinzufügen',
    selectWinner: 'Gewinner auswählen',
    submitScore: 'Ergebnis senden',
  },
  fr: {
    setScores: 'Scores des sets',
    set: 'Set {{number}}',
    player1Score: 'Score joueur 1',
    player2Score: 'Score joueur 2',
    addSet: 'Ajouter un set',
    selectWinner: 'Sélectionner le gagnant',
    submitScore: 'Soumettre le score',
  },
  es: {
    setScores: 'Puntuaciones de sets',
    set: 'Set {{number}}',
    player1Score: 'Puntuación jugador 1',
    player2Score: 'Puntuación jugador 2',
    addSet: 'Agregar set',
    selectWinner: 'Seleccionar ganador',
    submitScore: 'Enviar puntuación',
  },
  it: {
    setScores: 'Punteggi dei set',
    set: 'Set {{number}}',
    player1Score: 'Punteggio giocatore 1',
    player2Score: 'Punteggio giocatore 2',
    addSet: 'Aggiungi set',
    selectWinner: 'Seleziona vincitore',
    submitScore: 'Invia punteggio',
  },
  pt: {
    setScores: 'Pontuações dos sets',
    set: 'Set {{number}}',
    player1Score: 'Pontuação jogador 1',
    player2Score: 'Pontuação jogador 2',
    addSet: 'Adicionar set',
    selectWinner: 'Selecionar vencedor',
    submitScore: 'Enviar pontuação',
  },
};

// Languages to process
const languages = ['en', 'ko', 'ru', 'ja', 'zh', 'de', 'fr', 'es', 'it', 'pt'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);

  try {
    // Read the existing JSON file
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Check if matchScoreEntry already exists
    if (json.matchScoreEntry) {
      console.log(`⚠️  ${lang}.json already has matchScoreEntry, merging...`);
      // Merge with existing keys (don't overwrite)
      json.matchScoreEntry = { ...translations[lang], ...json.matchScoreEntry };
    } else {
      // Add new matchScoreEntry section
      json.matchScoreEntry = translations[lang];
    }

    // Write back to file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ ${lang}.json updated with matchScoreEntry translations`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 All locale files have been updated!');
