/**
 * Add missing special cases translations to recordScore section in all locale files
 *
 * Keys to add based on screenshot:
 * - recordScore.specialCases
 * - recordScore.specialCasesDescription
 * - recordScore.retired
 * - recordScore.retiredAtLabel
 * - recordScore.walkover
 * - recordScore.selectWinnerRequired
 * - recordScore.selectPlayerWhoDidNotRetire
 * - recordScore.selectPlayerWhoShowedUp
 * - recordScore.submitNoteLightning
 * - recordScore.submitNoteTournament
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Translations for each language
const translations = {
  en: {
    specialCases: 'Special Cases',
    specialCasesDescription: 'Select if there was a retirement or walkover.',
    retired: 'Retired',
    retiredAtLabel: 'Which set did the retirement occur?',
    walkover: 'Walkover',
    selectWinnerRequired: 'Select Winner (Required)',
    selectPlayerWhoDidNotRetire: 'Select the player who did NOT retire',
    selectPlayerWhoShowedUp: 'Select the player who showed up',
    submitNoteLightning: 'After submission, the match record will be saved.',
    submitNoteTournament: 'After submission, the tournament results will be updated.',
  },
  ko: {
    specialCases: '특수 상황',
    specialCasesDescription: '기권 또는 부전승이 있었다면 선택하세요.',
    retired: '기권',
    retiredAtLabel: '몇 세트에서 기권했나요?',
    walkover: '부전승',
    selectWinnerRequired: '승자 선택 (필수)',
    selectPlayerWhoDidNotRetire: '기권하지 않은 선수를 선택하세요',
    selectPlayerWhoShowedUp: '출석한 선수를 선택하세요',
    submitNoteLightning: '제출 후 매치 기록이 저장됩니다.',
    submitNoteTournament: '제출 후 토너먼트 결과가 업데이트됩니다.',
  },
  ru: {
    specialCases: 'Особые случаи',
    specialCasesDescription: 'Выберите, если был отказ от игры или неявка.',
    retired: 'Снялся',
    retiredAtLabel: 'В каком сете произошёл отказ?',
    walkover: 'Неявка',
    selectWinnerRequired: 'Выберите победителя (обязательно)',
    selectPlayerWhoDidNotRetire: 'Выберите игрока, который не снялся',
    selectPlayerWhoShowedUp: 'Выберите игрока, который пришёл',
    submitNoteLightning: 'После отправки результаты матча будут сохранены.',
    submitNoteTournament: 'После отправки результаты турнира будут обновлены.',
  },
  ja: {
    specialCases: '特殊ケース',
    specialCasesDescription: '棄権または不戦勝があった場合は選択してください。',
    retired: '棄権',
    retiredAtLabel: '何セット目で棄権しましたか？',
    walkover: '不戦勝',
    selectWinnerRequired: '勝者を選択（必須）',
    selectPlayerWhoDidNotRetire: '棄権しなかった選手を選択してください',
    selectPlayerWhoShowedUp: '出場した選手を選択してください',
    submitNoteLightning: '送信後、試合記録が保存されます。',
    submitNoteTournament: '送信後、トーナメント結果が更新されます。',
  },
  zh: {
    specialCases: '特殊情况',
    specialCasesDescription: '如有退赛或弃权，请选择。',
    retired: '退赛',
    retiredAtLabel: '在第几盘退赛？',
    walkover: '弃权胜',
    selectWinnerRequired: '选择获胜者（必填）',
    selectPlayerWhoDidNotRetire: '选择未退赛的选手',
    selectPlayerWhoShowedUp: '选择到场的选手',
    submitNoteLightning: '提交后，比赛记录将被保存。',
    submitNoteTournament: '提交后，锦标赛结果将被更新。',
  },
  de: {
    specialCases: 'Sonderfälle',
    specialCasesDescription: 'Wählen Sie, wenn es eine Aufgabe oder einen Walkover gab.',
    retired: 'Aufgegeben',
    retiredAtLabel: 'In welchem Satz erfolgte die Aufgabe?',
    walkover: 'Walkover',
    selectWinnerRequired: 'Gewinner auswählen (erforderlich)',
    selectPlayerWhoDidNotRetire: 'Wählen Sie den Spieler, der NICHT aufgegeben hat',
    selectPlayerWhoShowedUp: 'Wählen Sie den Spieler, der erschienen ist',
    submitNoteLightning: 'Nach dem Absenden wird das Spielergebnis gespeichert.',
    submitNoteTournament: 'Nach dem Absenden werden die Turnierergebnisse aktualisiert.',
  },
  fr: {
    specialCases: 'Cas spéciaux',
    specialCasesDescription: "Sélectionnez s'il y a eu un abandon ou un forfait.",
    retired: 'Abandon',
    retiredAtLabel: "Dans quel set l'abandon a-t-il eu lieu ?",
    walkover: 'Forfait',
    selectWinnerRequired: 'Sélectionner le gagnant (obligatoire)',
    selectPlayerWhoDidNotRetire: "Sélectionnez le joueur qui n'a PAS abandonné",
    selectPlayerWhoShowedUp: "Sélectionnez le joueur qui s'est présenté",
    submitNoteLightning: 'Après soumission, le résultat du match sera enregistré.',
    submitNoteTournament: 'Après soumission, les résultats du tournoi seront mis à jour.',
  },
  es: {
    specialCases: 'Casos especiales',
    specialCasesDescription: 'Seleccione si hubo un retiro o walkover.',
    retired: 'Retirado',
    retiredAtLabel: '¿En qué set ocurrió el retiro?',
    walkover: 'Walkover',
    selectWinnerRequired: 'Seleccionar ganador (obligatorio)',
    selectPlayerWhoDidNotRetire: 'Seleccione el jugador que NO se retiró',
    selectPlayerWhoShowedUp: 'Seleccione el jugador que se presentó',
    submitNoteLightning: 'Después de enviar, el registro del partido se guardará.',
    submitNoteTournament: 'Después de enviar, los resultados del torneo se actualizarán.',
  },
  it: {
    specialCases: 'Casi speciali',
    specialCasesDescription: 'Seleziona se ci sono stati ritiro o walkover.',
    retired: 'Ritirato',
    retiredAtLabel: 'In quale set è avvenuto il ritiro?',
    walkover: 'Walkover',
    selectWinnerRequired: 'Seleziona vincitore (obbligatorio)',
    selectPlayerWhoDidNotRetire: 'Seleziona il giocatore che NON si è ritirato',
    selectPlayerWhoShowedUp: 'Seleziona il giocatore che si è presentato',
    submitNoteLightning: "Dopo l'invio, il risultato della partita sarà salvato.",
    submitNoteTournament: "Dopo l'invio, i risultati del torneo saranno aggiornati.",
  },
  pt: {
    specialCases: 'Casos especiais',
    specialCasesDescription: 'Selecione se houve desistência ou W.O.',
    retired: 'Desistência',
    retiredAtLabel: 'Em qual set ocorreu a desistência?',
    walkover: 'W.O.',
    selectWinnerRequired: 'Selecionar vencedor (obrigatório)',
    selectPlayerWhoDidNotRetire: 'Selecione o jogador que NÃO desistiu',
    selectPlayerWhoShowedUp: 'Selecione o jogador que compareceu',
    submitNoteLightning: 'Após o envio, o registro da partida será salvo.',
    submitNoteTournament: 'Após o envio, os resultados do torneio serão atualizados.',
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

    // Find recordScore and add keys
    if (json.recordScore) {
      const newKeys = translations[lang];
      let keysAdded = 0;

      // Add each key if it doesn't exist
      Object.keys(newKeys).forEach(key => {
        if (!json.recordScore[key]) {
          json.recordScore[key] = newKeys[key];
          keysAdded++;
        }
      });

      if (keysAdded > 0) {
        // Write back to file with pretty formatting
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
        console.log(`✅ ${lang}.json: Added ${keysAdded} keys to recordScore`);
      } else {
        console.log(`⚠️  ${lang}.json: All keys already exist in recordScore`);
      }
    } else {
      console.error(`❌ ${lang}.json: recordScore section not found`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 All locale files have been updated!');
