/**
 * 🌉 [HEIMDALL] Tournament Notification Sender
 * Server-side push notification utilities for tournament events
 *
 * Phase 1: Server-Side Migration
 * Sends push notifications via Expo Push Notification Service
 *
 * 🌍 i18n Support: All notifications support 10 languages based on user's preferredLanguage
 * Supported: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * @author Kim
 * @date 2025-01-10 (Updated for 10-language support)
 */

import * as admin from 'firebase-admin';
import { TournamentStatus } from '../types/tournament';

const db = admin.firestore();

// ============================================================================
// 🌍 i18n Configuration - 10 Languages Support
// ============================================================================

type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

interface UserPushInfo {
  pushToken: string | null;
  language: SupportedLanguage;
}

/**
 * 🌍 i18n Push Notification Messages for Tournament Events
 */
const i18nPushMessages = {
  tournamentCreated: {
    title: {
      ko: '🎾 새 토너먼트가 생성되었습니다',
      en: '🎾 New Tournament Created',
      ja: '🎾 新しいトーナメントが作成されました',
      zh: '🎾 新比赛已创建',
      de: '🎾 Neues Turnier erstellt',
      fr: '🎾 Nouveau tournoi créé',
      es: '🎾 Nuevo torneo creado',
      it: '🎾 Nuovo torneo creato',
      pt: '🎾 Novo torneio criado',
      ru: '🎾 Создан новый турнир',
    },
    body: {
      ko: '{tournamentName} 토너먼트가 생성되었습니다. 참가 신청을 받고 있어요!',
      en: '{tournamentName} tournament is now accepting registrations!',
      ja: '「{tournamentName}」トーナメントが作成されました。参加登録受付中！',
      zh: '「{tournamentName}」比赛正在接受报名！',
      de: '{tournamentName} Turnier nimmt jetzt Anmeldungen an!',
      fr: 'Le tournoi {tournamentName} accepte les inscriptions!',
      es: '¡El torneo {tournamentName} está aceptando inscripciones!',
      it: 'Il torneo {tournamentName} accetta iscrizioni!',
      pt: 'O torneio {tournamentName} está aceitando inscrições!',
      ru: 'Турнир «{tournamentName}» принимает заявки!',
    },
    firestoreTitle: {
      ko: '🎾 새 토너먼트: {tournamentName}',
      en: '🎾 New Tournament: {tournamentName}',
      ja: '🎾 新トーナメント: {tournamentName}',
      zh: '🎾 新比赛: {tournamentName}',
      de: '🎾 Neues Turnier: {tournamentName}',
      fr: '🎾 Nouveau tournoi: {tournamentName}',
      es: '🎾 Nuevo torneo: {tournamentName}',
      it: '🎾 Nuovo torneo: {tournamentName}',
      pt: '🎾 Novo torneio: {tournamentName}',
      ru: '🎾 Новый турнир: {tournamentName}',
    },
    firestoreMessage: {
      ko: '{tournamentName} 토너먼트 참가 신청이 시작되었습니다!',
      en: '{tournamentName} tournament registration has started!',
      ja: '「{tournamentName}」トーナメント参加登録が開始されました！',
      zh: '「{tournamentName}」比赛报名已开始！',
      de: 'Anmeldung für das Turnier {tournamentName} hat begonnen!',
      fr: "L'inscription au tournoi {tournamentName} a commencé!",
      es: '¡La inscripción al torneo {tournamentName} ha comenzado!',
      it: "L'iscrizione al torneo {tournamentName} è iniziata!",
      pt: 'A inscrição para o torneio {tournamentName} começou!',
      ru: 'Регистрация на турнир «{tournamentName}» началась!',
    },
  },
  registrationConfirmed: {
    titleSingles: {
      ko: '🎾 토너먼트 등록 완료!',
      en: '🎾 Tournament Registration Complete!',
      ja: '🎾 トーナメント登録完了！',
      zh: '🎾 比赛报名完成！',
      de: '🎾 Turnier-Anmeldung abgeschlossen!',
      fr: '🎾 Inscription au tournoi terminée!',
      es: '🎾 ¡Inscripción al torneo completada!',
      it: '🎾 Iscrizione al torneo completata!',
      pt: '🎾 Inscrição no torneio concluída!',
      ru: '🎾 Регистрация на турнир завершена!',
    },
    titleDoubles: {
      ko: '🎾 복식 토너먼트 팀 등록 완료!',
      en: '🎾 Doubles Team Registration Complete!',
      ja: '🎾 ダブルスチーム登録完了！',
      zh: '🎾 双打团队报名完成！',
      de: '🎾 Doppel-Team-Anmeldung abgeschlossen!',
      fr: '🎾 Inscription équipe double terminée!',
      es: '🎾 ¡Inscripción del equipo de dobles completada!',
      it: '🎾 Iscrizione squadra doppio completata!',
      pt: '🎾 Inscrição da equipe de duplas concluída!',
      ru: '🎾 Регистрация пары для парного турнира завершена!',
    },
    bodySingles: {
      ko: '{tournamentName}에 등록되었습니다. 대진표 발표를 기다려주세요!',
      en: 'You are registered for {tournamentName}. Wait for the bracket!',
      ja: '「{tournamentName}」に登録されました。対戦表の発表をお待ちください！',
      zh: '您已报名「{tournamentName}」。请等待对阵表！',
      de: 'Sie sind für {tournamentName} registriert. Warten Sie auf die Auslosung!',
      fr: 'Vous êtes inscrit à {tournamentName}. Attendez le tableau!',
      es: '¡Estás inscrito en {tournamentName}. Espera el cuadro!',
      it: 'Sei iscritto a {tournamentName}. Attendi il tabellone!',
      pt: 'Você está inscrito em {tournamentName}. Aguarde a chave!',
      ru: 'Вы зарегистрированы на «{tournamentName}». Ждите сетку!',
    },
    bodyDoubles: {
      ko: '{tournamentName}에 팀으로 등록되었습니다. 대진표 발표를 기다려주세요!',
      en: 'Your team is registered for {tournamentName}. Wait for the bracket!',
      ja: '「{tournamentName}」にチームで登録されました。対戦表の発表をお待ちください！',
      zh: '您的团队已报名「{tournamentName}」。请等待对阵表！',
      de: 'Ihr Team ist für {tournamentName} registriert. Warten Sie auf die Auslosung!',
      fr: 'Votre équipe est inscrite à {tournamentName}. Attendez le tableau!',
      es: '¡Tu equipo está inscrito en {tournamentName}. Espera el cuadro!',
      it: 'La tua squadra è iscritta a {tournamentName}. Attendi il tabellone!',
      pt: 'Sua equipe está inscrita em {tournamentName}. Aguarde a chave!',
      ru: 'Ваша команда зарегистрирована на «{tournamentName}». Ждите сетку!',
    },
  },
  newParticipant: {
    title: {
      ko: '🎾 새로운 참가자!',
      en: '🎾 New Participant!',
      ja: '🎾 新しい参加者！',
      zh: '🎾 新参与者！',
      de: '🎾 Neuer Teilnehmer!',
      fr: '🎾 Nouveau participant!',
      es: '🎾 ¡Nuevo participante!',
      it: '🎾 Nuovo partecipante!',
      pt: '🎾 Novo participante!',
      ru: '🎾 Новый участник!',
    },
    body: {
      ko: '{participantName}님이 {tournamentName}에 등록했습니다 ({count}/{max})',
      en: '{participantName} registered for {tournamentName} ({count}/{max})',
      ja: '{participantName}さんが「{tournamentName}」に登録しました ({count}/{max})',
      zh: '{participantName} 已报名「{tournamentName}」({count}/{max})',
      de: '{participantName} hat sich für {tournamentName} angemeldet ({count}/{max})',
      fr: "{participantName} s'est inscrit à {tournamentName} ({count}/{max})",
      es: '{participantName} se inscribió en {tournamentName} ({count}/{max})',
      it: '{participantName} si è iscritto a {tournamentName} ({count}/{max})',
      pt: '{participantName} se inscreveu em {tournamentName} ({count}/{max})',
      ru: '{participantName} зарегистрировался на «{tournamentName}» ({count}/{max})',
    },
  },
  statusChange: {
    registration: {
      title: {
        ko: '🎾 토너먼트 등록 시작!',
        en: '🎾 Tournament Registration Open!',
        ja: '🎾 トーナメント登録開始！',
        zh: '🎾 比赛报名开始！',
        de: '🎾 Turnier-Anmeldung geöffnet!',
        fr: '🎾 Inscription au tournoi ouverte!',
        es: '🎾 ¡Inscripción al torneo abierta!',
        it: '🎾 Iscrizione al torneo aperta!',
        pt: '🎾 Inscrição no torneio aberta!',
        ru: '🎾 Регистрация на турнир открыта!',
      },
      body: {
        ko: '{tournamentName} 참가 신청이 시작되었습니다!',
        en: '{tournamentName} is now accepting registrations!',
        ja: '「{tournamentName}」の参加登録が開始されました！',
        zh: '「{tournamentName}」正在接受报名！',
        de: '{tournamentName} nimmt jetzt Anmeldungen an!',
        fr: '{tournamentName} accepte les inscriptions!',
        es: '¡{tournamentName} está aceptando inscripciones!',
        it: '{tournamentName} accetta iscrizioni!',
        pt: '{tournamentName} está aceitando inscrições!',
        ru: '«{tournamentName}» принимает заявки!',
      },
    },
    bracket_generation: {
      title: {
        ko: '🎾 대진표 생성 중',
        en: '🎾 Generating Bracket',
        ja: '🎾 対戦表作成中',
        zh: '🎾 生成对阵表中',
        de: '🎾 Auslosung wird erstellt',
        fr: '🎾 Création du tableau',
        es: '🎾 Generando cuadro',
        it: '🎾 Creazione tabellone',
        pt: '🎾 Gerando chave',
        ru: '🎾 Создание сетки',
      },
      body: {
        ko: '{tournamentName} 대진표가 곧 발표됩니다!',
        en: '{tournamentName} bracket coming soon!',
        ja: '「{tournamentName}」対戦表がまもなく発表されます！',
        zh: '「{tournamentName}」对阵表即将公布！',
        de: '{tournamentName} Auslosung kommt bald!',
        fr: 'Tableau de {tournamentName} bientôt!',
        es: '¡Cuadro de {tournamentName} próximamente!',
        it: 'Tabellone di {tournamentName} in arrivo!',
        pt: 'Chave de {tournamentName} em breve!',
        ru: 'Сетка «{tournamentName}» скоро!',
      },
    },
    in_progress: {
      title: {
        ko: '🎾 토너먼트 시작!',
        en: '🎾 Tournament Started!',
        ja: '🎾 トーナメント開始！',
        zh: '🎾 比赛开始！',
        de: '🎾 Turnier gestartet!',
        fr: '🎾 Tournoi commencé!',
        es: '🎾 ¡Torneo iniciado!',
        it: '🎾 Torneo iniziato!',
        pt: '🎾 Torneio iniciado!',
        ru: '🎾 Турнир начался!',
      },
      body: {
        ko: '{tournamentName}가 시작되었습니다. 대진표를 확인하세요!',
        en: '{tournamentName} has started. Check the bracket!',
        ja: '「{tournamentName}」が開始されました。対戦表を確認してください！',
        zh: '「{tournamentName}」已开始。请查看对阵表！',
        de: '{tournamentName} hat begonnen. Prüfen Sie die Auslosung!',
        fr: '{tournamentName} a commencé. Vérifiez le tableau!',
        es: '{tournamentName} ha comenzado. ¡Revisa el cuadro!',
        it: '{tournamentName} è iniziato. Controlla il tabellone!',
        pt: '{tournamentName} começou. Confira a chave!',
        ru: '«{tournamentName}» начался. Проверьте сетку!',
      },
    },
    completed: {
      title: {
        ko: '🏆 토너먼트 종료',
        en: '🏆 Tournament Completed',
        ja: '🏆 トーナメント終了',
        zh: '🏆 比赛结束',
        de: '🏆 Turnier beendet',
        fr: '🏆 Tournoi terminé',
        es: '🏆 Torneo completado',
        it: '🏆 Torneo completato',
        pt: '🏆 Torneio concluído',
        ru: '🏆 Турнир завершён',
      },
      body: {
        ko: '{tournamentName}가 종료되었습니다. 결과를 확인하세요!',
        en: '{tournamentName} has ended. Check the results!',
        ja: '「{tournamentName}」が終了しました。結果を確認してください！',
        zh: '「{tournamentName}」已结束。请查看结果！',
        de: '{tournamentName} ist beendet. Prüfen Sie die Ergebnisse!',
        fr: '{tournamentName} est terminé. Vérifiez les résultats!',
        es: '{tournamentName} ha terminado. ¡Revisa los resultados!',
        it: '{tournamentName} è terminato. Controlla i risultati!',
        pt: '{tournamentName} terminou. Confira os resultados!',
        ru: '«{tournamentName}» завершился. Проверьте результаты!',
      },
    },
    cancelled: {
      title: {
        ko: '❌ 토너먼트 취소',
        en: '❌ Tournament Cancelled',
        ja: '❌ トーナメント中止',
        zh: '❌ 比赛取消',
        de: '❌ Turnier abgesagt',
        fr: '❌ Tournoi annulé',
        es: '❌ Torneo cancelado',
        it: '❌ Torneo annullato',
        pt: '❌ Torneio cancelado',
        ru: '❌ Турнир отменён',
      },
      body: {
        ko: '{tournamentName}가 취소되었습니다.',
        en: '{tournamentName} has been cancelled.',
        ja: '「{tournamentName}」が中止されました。',
        zh: '「{tournamentName}」已取消。',
        de: '{tournamentName} wurde abgesagt.',
        fr: '{tournamentName} a été annulé.',
        es: '{tournamentName} ha sido cancelado.',
        it: '{tournamentName} è stato annullato.',
        pt: '{tournamentName} foi cancelado.',
        ru: '«{tournamentName}» отменён.',
      },
    },
    default: {
      title: {
        ko: '🎾 토너먼트 상태 변경',
        en: '🎾 Tournament Status Changed',
        ja: '🎾 トーナメント状態変更',
        zh: '🎾 比赛状态已更改',
        de: '🎾 Turnier-Status geändert',
        fr: '🎾 Statut du tournoi modifié',
        es: '🎾 Estado del torneo cambiado',
        it: '🎾 Stato torneo modificato',
        pt: '🎾 Status do torneio alterado',
        ru: '🎾 Статус турнира изменён',
      },
      body: {
        ko: '{tournamentName} 상태가 변경되었습니다.',
        en: '{tournamentName} status has changed.',
        ja: '「{tournamentName}」の状態が変更されました。',
        zh: '「{tournamentName}」状态已更改。',
        de: '{tournamentName} Status wurde geändert.',
        fr: 'Le statut de {tournamentName} a changé.',
        es: 'El estado de {tournamentName} ha cambiado.',
        it: 'Lo stato di {tournamentName} è cambiato.',
        pt: 'O status de {tournamentName} mudou.',
        ru: 'Статус «{tournamentName}» изменён.',
      },
    },
  },
  bracketPublished: {
    title: {
      ko: '🎾 대진표 발표!',
      en: '🎾 Bracket Published!',
      ja: '🎾 対戦表発表！',
      zh: '🎾 对阵表已公布！',
      de: '🎾 Auslosung veröffentlicht!',
      fr: '🎾 Tableau publié!',
      es: '🎾 ¡Cuadro publicado!',
      it: '🎾 Tabellone pubblicato!',
      pt: '🎾 Chave publicada!',
      ru: '🎾 Сетка опубликована!',
    },
    body: {
      ko: '{tournamentName} 대진표가 발표되었습니다. 상대를 확인하세요!',
      en: '{tournamentName} bracket is out. Check your opponent!',
      ja: '「{tournamentName}」対戦表が発表されました。対戦相手を確認してください！',
      zh: '「{tournamentName}」对阵表已公布。请查看对手！',
      de: '{tournamentName} Auslosung ist da. Prüfen Sie Ihren Gegner!',
      fr: 'Tableau de {tournamentName} publié. Vérifiez votre adversaire!',
      es: '¡Cuadro de {tournamentName} publicado. Revisa tu rival!',
      it: 'Tabellone di {tournamentName} pubblicato. Controlla il tuo avversario!',
      pt: 'Chave de {tournamentName} publicada. Confira seu adversário!',
      ru: 'Сетка «{tournamentName}» опубликована. Узнайте соперника!',
    },
  },
  matchStart: {
    title: {
      ko: '🎾 경기 시작!',
      en: '🎾 Match Starting!',
      ja: '🎾 試合開始！',
      zh: '🎾 比赛开始！',
      de: '🎾 Spiel beginnt!',
      fr: '🎾 Match commence!',
      es: '🎾 ¡Partido comenzando!',
      it: '🎾 Partita inizia!',
      pt: '🎾 Partida começando!',
      ru: '🎾 Матч начинается!',
    },
    body: {
      ko: '{tournamentName} {round} 경기가 시작되었습니다. 상대를 확인하세요!',
      en: '{tournamentName} {round} match has started. Check your opponent!',
      ja: '「{tournamentName}」{round}の試合が開始されました。対戦相手を確認してください！',
      zh: '「{tournamentName}」{round}比赛已开始。请查看对手！',
      de: '{tournamentName} {round} Spiel hat begonnen. Prüfen Sie Ihren Gegner!',
      fr: 'Match {round} de {tournamentName} commencé. Vérifiez votre adversaire!',
      es: '¡Partido {round} de {tournamentName} empezó. Revisa tu rival!',
      it: 'Partita {round} di {tournamentName} iniziata. Controlla il tuo avversario!',
      pt: 'Partida {round} de {tournamentName} começou. Confira seu adversário!',
      ru: 'Матч {round} «{tournamentName}» начался. Узнайте соперника!',
    },
  },
  matchResultWin: {
    title: {
      ko: '🏆 승리!',
      en: '🏆 Victory!',
      ja: '🏆 勝利！',
      zh: '🏆 胜利！',
      de: '🏆 Sieg!',
      fr: '🏆 Victoire!',
      es: '🏆 ¡Victoria!',
      it: '🏆 Vittoria!',
      pt: '🏆 Vitória!',
      ru: '🏆 Победа!',
    },
    body: {
      ko: '{tournamentName} 경기에서 승리했습니다! ({score})',
      en: 'You won your {tournamentName} match! ({score})',
      ja: '「{tournamentName}」の試合に勝利しました！({score})',
      zh: '您赢得了「{tournamentName}」的比赛！({score})',
      de: 'Sie haben Ihr {tournamentName} Spiel gewonnen! ({score})',
      fr: 'Vous avez gagné votre match {tournamentName}! ({score})',
      es: '¡Ganaste tu partido de {tournamentName}! ({score})',
      it: 'Hai vinto la tua partita di {tournamentName}! ({score})',
      pt: 'Você ganhou sua partida de {tournamentName}! ({score})',
      ru: 'Вы выиграли матч «{tournamentName}»! ({score})',
    },
  },
  matchResultLoss: {
    title: {
      ko: '🎾 경기 종료',
      en: '🎾 Match Ended',
      ja: '🎾 試合終了',
      zh: '🎾 比赛结束',
      de: '🎾 Spiel beendet',
      fr: '🎾 Match terminé',
      es: '🎾 Partido terminado',
      it: '🎾 Partita terminata',
      pt: '🎾 Partida encerrada',
      ru: '🎾 Матч завершён',
    },
    body: {
      ko: '{tournamentName} 경기가 종료되었습니다. 다음 기회에 도전하세요! ({score})',
      en: 'Your {tournamentName} match ended. Better luck next time! ({score})',
      ja: '「{tournamentName}」の試合が終了しました。次回頑張ってください！({score})',
      zh: '「{tournamentName}」比赛已结束。下次加油！({score})',
      de: 'Ihr {tournamentName} Spiel ist beendet. Viel Glück beim nächsten Mal! ({score})',
      fr: 'Votre match {tournamentName} est terminé. Bonne chance la prochaine fois! ({score})',
      es: 'Tu partido de {tournamentName} terminó. ¡Suerte la próxima! ({score})',
      it: 'La tua partita di {tournamentName} è terminata. Buona fortuna la prossima! ({score})',
      pt: 'Sua partida de {tournamentName} terminou. Boa sorte na próxima! ({score})',
      ru: 'Ваш матч «{tournamentName}» завершён. Удачи в следующий раз! ({score})',
    },
  },
  championAnnouncement: {
    titleChampion: {
      ko: '👑 축하합니다! 우승!',
      en: '👑 Congratulations! You are the Champion!',
      ja: '👑 おめでとうございます！優勝！',
      zh: '👑 恭喜！您是冠军！',
      de: '👑 Herzlichen Glückwunsch! Sie sind Champion!',
      fr: '👑 Félicitations! Vous êtes champion!',
      es: '👑 ¡Felicidades! ¡Eres campeón!',
      it: '👑 Congratulazioni! Sei campione!',
      pt: '👑 Parabéns! Você é campeão!',
      ru: '👑 Поздравляем! Вы чемпион!',
    },
    titleOthers: {
      ko: '🏆 토너먼트 종료',
      en: '🏆 Tournament Completed',
      ja: '🏆 トーナメント終了',
      zh: '🏆 比赛结束',
      de: '🏆 Turnier beendet',
      fr: '🏆 Tournoi terminé',
      es: '🏆 Torneo completado',
      it: '🏆 Torneo completato',
      pt: '🏆 Torneio concluído',
      ru: '🏆 Турнир завершён',
    },
    bodyChampion: {
      ko: '{tournamentName}에서 우승하셨습니다! 축하드립니다!',
      en: 'You are the champion of {tournamentName}! Congratulations!',
      ja: '「{tournamentName}」で優勝しました！おめでとうございます！',
      zh: '您是「{tournamentName}」的冠军！恭喜！',
      de: 'Sie sind Champion von {tournamentName}! Herzlichen Glückwunsch!',
      fr: 'Vous êtes champion de {tournamentName}! Félicitations!',
      es: '¡Eres campeón de {tournamentName}! ¡Felicidades!',
      it: 'Sei campione di {tournamentName}! Congratulazioni!',
      pt: 'Você é campeão de {tournamentName}! Parabéns!',
      ru: 'Вы чемпион «{tournamentName}»! Поздравляем!',
    },
    bodyOthers: {
      ko: '{tournamentName} 우승자는 {championName}님입니다!',
      en: 'The champion of {tournamentName} is {championName}!',
      ja: '「{tournamentName}」の優勝者は{championName}さんです！',
      zh: '「{tournamentName}」的冠军是{championName}！',
      de: 'Der Champion von {tournamentName} ist {championName}!',
      fr: 'Le champion de {tournamentName} est {championName}!',
      es: '¡El campeón de {tournamentName} es {championName}!',
      it: 'Il campione di {tournamentName} è {championName}!',
      pt: 'O campeão de {tournamentName} é {championName}!',
      ru: 'Чемпион «{tournamentName}» — {championName}!',
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Replace placeholders in message template
 */
function replacePlaceholders(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get user's push token and language
 * @param userId - User ID
 * @returns Push token and language
 */
async function getUserPushInfo(userId: string): Promise<UserPushInfo> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();

    if (!userDoc.exists) {
      console.warn(`⚠️ [NOTIFICATION] User not found: ${userId}`);
      return { pushToken: null, language: 'en' };
    }

    const userData = userDoc.data();
    const pushToken = userData?.pushToken || null;

    // Get user's preferred language (default to 'en')
    // Check multiple possible field paths for language preference
    const lang =
      userData?.preferredLanguage || userData?.language || userData?.preferences?.language || 'en';
    const supportedLanguages: SupportedLanguage[] = [
      'ko',
      'en',
      'ja',
      'zh',
      'de',
      'fr',
      'es',
      'it',
      'pt',
      'ru',
    ];
    const language: SupportedLanguage = supportedLanguages.includes(lang as SupportedLanguage)
      ? (lang as SupportedLanguage)
      : 'en';

    if (!pushToken) {
      console.log(`⚠️ [NOTIFICATION] User ${userId} does not have a push token`);
    }

    return { pushToken, language };
  } catch (error) {
    console.error(`❌ [NOTIFICATION] Error getting push info for user ${userId}:`, error);
    return { pushToken: null, language: 'en' };
  }
}

/**
 * Send push notification via Expo Push Notification Service
 */
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  sound: string = 'default',
  priority: 'default' | 'normal' | 'high' = 'high',
  channelId: string = 'tournaments'
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = {
      to: pushToken,
      sound,
      title,
      body,
      data,
      priority,
      channelId,
    };

    console.log('📤 [NOTIFICATION] Sending push notification:', {
      title,
      channelId,
    });

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ [NOTIFICATION] Push notification errors:', result.errors);
      return {
        success: false,
        error: result.errors[0]?.message || 'Push notification failed',
      };
    }

    console.log('✅ [NOTIFICATION] Push notification sent successfully!', {
      ticketId: result.data?.id,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log push notification to Firestore
 */
async function logPushNotification(
  userId: string,
  type: string,
  data: Record<string, unknown>,
  status: 'sent' | 'failed'
): Promise<void> {
  try {
    await db.collection('push_notification_logs').add({
      userId,
      type,
      ...data,
      status,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ [NOTIFICATION] Failed to log push notification:', error);
  }
}

// ============================================================================
// Tournament Event Notifications
// ============================================================================

/**
 * Send tournament creation notification to club members
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendTournamentCreatedNotification(
  clubId: string,
  tournamentId: string,
  tournamentName: string,
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `🎾 [NOTIFICATION] Sending tournament creation notification to club ${clubId} members`
  );

  try {
    const membershipsSnapshot = await db
      .collection('clubMembers')
      .where('clubId', '==', clubId)
      .where('status', '==', 'active')
      .get();

    if (membershipsSnapshot.empty) {
      console.log(`⚠️ [NOTIFICATION] No club members found for club ${clubId}`);
      return { success: false, error: 'No club members found' };
    }

    const pushNotifications: Promise<{ success: boolean; error?: string }>[] = [];
    const firestoreNotifications: Promise<void>[] = [];

    for (const membershipDoc of membershipsSnapshot.docs) {
      const userId = membershipDoc.data().userId;

      if (!userId || userId === createdBy) {
        continue;
      }

      const { pushToken, language } = await getUserPushInfo(userId);

      // 🔔 Create Firestore notification document for Club Home display
      const firestoreTitleTemplate = i18nPushMessages.tournamentCreated.firestoreTitle[language];
      const firestoreMessageTemplate =
        i18nPushMessages.tournamentCreated.firestoreMessage[language];

      const firestoreNotification = db
        .collection('notifications')
        .add({
          type: 'tournament_registration_open',
          clubId,
          recipientId: userId,
          title: replacePlaceholders(firestoreTitleTemplate, { tournamentName }),
          message: replacePlaceholders(firestoreMessageTemplate, { tournamentName }),
          data: {
            tournamentId,
            tournamentName,
            actionType: 'tournament_registration',
          },
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          console.log(`✅ [NOTIFICATION] Firestore notification created for user ${userId}`);
        });

      firestoreNotifications.push(firestoreNotification);

      // Send push notification (if user has push token)
      if (pushToken) {
        const title = i18nPushMessages.tournamentCreated.title[language];
        const bodyTemplate = i18nPushMessages.tournamentCreated.body[language];
        const body = replacePlaceholders(bodyTemplate, { tournamentName });

        console.log(`🌍 [NOTIFICATION] Sending to user ${userId} in language: ${language}`);

        const pushPromise = sendExpoPushNotification(pushToken, title, body, {
          type: 'tournament_created',
          notificationType: 'tournament_created',
          tournamentId,
          tournamentName,
          clubId,
        }).then(result => {
          logPushNotification(
            userId!,
            'tournament_created',
            { tournamentId, tournamentName, clubId, language },
            result.success ? 'sent' : 'failed'
          );
          return result;
        });

        pushNotifications.push(pushPromise);
      }
    }

    await Promise.all([...firestoreNotifications, ...pushNotifications]);

    console.log(
      `✅ [NOTIFICATION] Tournament creation notifications: ${firestoreNotifications.length} Firestore, ${pushNotifications.length} Push`
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send tournament creation notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send registration confirmation to participant
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendRegistrationConfirmation(
  userId: string,
  tournamentId: string,
  tournamentName: string,
  isDoublesPartner: boolean = false
): Promise<{ success: boolean; error?: string }> {
  console.log(`✅ [NOTIFICATION] Sending registration confirmation to user ${userId}`);

  try {
    const { pushToken, language } = await getUserPushInfo(userId);

    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    const title = isDoublesPartner
      ? i18nPushMessages.registrationConfirmed.titleDoubles[language]
      : i18nPushMessages.registrationConfirmed.titleSingles[language];

    const bodyTemplate = isDoublesPartner
      ? i18nPushMessages.registrationConfirmed.bodyDoubles[language]
      : i18nPushMessages.registrationConfirmed.bodySingles[language];

    const body = replacePlaceholders(bodyTemplate, { tournamentName });

    console.log(`🌍 [NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'tournament_registration_confirmed',
      notificationType: 'tournament_registration_confirmed',
      tournamentId,
      tournamentName,
    });

    await logPushNotification(
      userId,
      'tournament_registration_confirmed',
      { tournamentId, tournamentName, language },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send registration confirmation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send new participant notification to tournament host
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendNewParticipantNotification(
  hostUserId: string,
  tournamentId: string,
  tournamentName: string,
  participantName: string,
  participantCount: number,
  maxParticipants: number
): Promise<{ success: boolean; error?: string }> {
  console.log(`📢 [NOTIFICATION] Sending new participant notification to host ${hostUserId}`);

  try {
    const { pushToken, language } = await getUserPushInfo(hostUserId);

    if (!pushToken) {
      return { success: false, error: 'No push token' };
    }

    const title = i18nPushMessages.newParticipant.title[language];
    const bodyTemplate = i18nPushMessages.newParticipant.body[language];
    const body = replacePlaceholders(bodyTemplate, {
      participantName,
      tournamentName,
      count: participantCount.toString(),
      max: maxParticipants.toString(),
    });

    console.log(`🌍 [NOTIFICATION] Sending in language: ${language}`);

    const result = await sendExpoPushNotification(pushToken, title, body, {
      type: 'tournament_new_participant',
      notificationType: 'tournament_new_participant',
      tournamentId,
      tournamentName,
      participantName,
      participantCount,
      maxParticipants,
    });

    await logPushNotification(
      hostUserId,
      'tournament_new_participant',
      { tournamentId, tournamentName, participantName, language },
      result.success ? 'sent' : 'failed'
    );

    return result;
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send new participant notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send tournament status change notification to all participants
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendTournamentStatusChangeNotification(
  tournamentId: string,
  tournamentName: string,
  newStatus: TournamentStatus,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `📢 [NOTIFICATION] Sending status change notification to ${participantIds.length} participants`
  );

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    for (const userId of participantIds) {
      const { pushToken, language } = await getUserPushInfo(userId);

      if (!pushToken) {
        continue;
      }

      // Determine notification message based on status
      let statusMessages;
      switch (newStatus) {
        case 'registration':
          statusMessages = i18nPushMessages.statusChange.registration;
          break;
        case 'bracket_generation':
          statusMessages = i18nPushMessages.statusChange.bracket_generation;
          break;
        case 'in_progress':
          statusMessages = i18nPushMessages.statusChange.in_progress;
          break;
        case 'completed':
          statusMessages = i18nPushMessages.statusChange.completed;
          break;
        case 'cancelled':
          statusMessages = i18nPushMessages.statusChange.cancelled;
          break;
        default:
          statusMessages = i18nPushMessages.statusChange.default;
      }

      const title = statusMessages.title[language];
      const body = replacePlaceholders(statusMessages.body[language], { tournamentName });

      console.log(`🌍 [NOTIFICATION] Sending to user ${userId} in language: ${language}`);

      const notificationPromise = sendExpoPushNotification(pushToken, title, body, {
        type: 'tournament_status_change',
        notificationType: 'tournament_status_change',
        tournamentId,
        tournamentName,
        newStatus,
      }).then(result => {
        logPushNotification(
          userId,
          'tournament_status_change',
          { tournamentId, tournamentName, newStatus, language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(notificationPromise);
    }

    await Promise.all(notifications);

    console.log(
      `✅ [NOTIFICATION] Status change notifications sent to ${notifications.length} participants`
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send status change notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send bracket published notification to all participants
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendBracketPublishedNotification(
  tournamentId: string,
  tournamentName: string,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `🎾 [NOTIFICATION] Sending bracket published notification to ${participantIds.length} participants`
  );

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    for (const userId of participantIds) {
      const { pushToken, language } = await getUserPushInfo(userId);

      if (!pushToken) {
        continue;
      }

      const title = i18nPushMessages.bracketPublished.title[language];
      const body = replacePlaceholders(i18nPushMessages.bracketPublished.body[language], {
        tournamentName,
      });

      console.log(`🌍 [NOTIFICATION] Sending to user ${userId} in language: ${language}`);

      const notificationPromise = sendExpoPushNotification(pushToken, title, body, {
        type: 'bracket_published',
        notificationType: 'bracket_published',
        tournamentId,
        tournamentName,
      }).then(result => {
        logPushNotification(
          userId,
          'bracket_published',
          { tournamentId, tournamentName, language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(notificationPromise);
    }

    await Promise.all(notifications);

    console.log(
      `✅ [NOTIFICATION] Bracket published notifications sent to ${notifications.length} participants`
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send bracket published notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 📍 [PHASE 5.6] Send match start notification to participants
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendMatchStartNotification(
  tournamentId: string,
  tournamentName: string,
  matchId: string,
  round: string,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `📍 [NOTIFICATION] Sending match start notification to ${participantIds.length} participants`
  );

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    for (const userId of participantIds) {
      const { pushToken, language } = await getUserPushInfo(userId);

      if (!pushToken) {
        continue;
      }

      const title = i18nPushMessages.matchStart.title[language];
      const body = replacePlaceholders(i18nPushMessages.matchStart.body[language], {
        tournamentName,
        round,
      });

      console.log(`🌍 [NOTIFICATION] Sending to user ${userId} in language: ${language}`);

      const notificationPromise = sendExpoPushNotification(pushToken, title, body, {
        type: 'match_start',
        notificationType: 'match_start',
        tournamentId,
        tournamentName,
        matchId,
        round,
      }).then(result => {
        logPushNotification(
          userId,
          'match_start',
          { tournamentId, tournamentName, matchId, round, language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(notificationPromise);
    }

    await Promise.all(notifications);

    console.log(
      `✅ [NOTIFICATION] Match start notifications sent to ${notifications.length} participants`
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send match start notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 🏆 [PHASE 5.6] Send match result notification to participants
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendMatchResultNotification(
  tournamentId: string,
  tournamentName: string,
  matchId: string,
  winnerId: string,
  loserId: string,
  score: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏆 [NOTIFICATION] Sending match result notifications`);

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    // Send to winner
    const winnerInfo = await getUserPushInfo(winnerId);
    if (winnerInfo.pushToken) {
      const title = i18nPushMessages.matchResultWin.title[winnerInfo.language];
      const body = replacePlaceholders(i18nPushMessages.matchResultWin.body[winnerInfo.language], {
        tournamentName,
        score,
      });

      console.log(
        `🌍 [NOTIFICATION] Sending WIN to user ${winnerId} in language: ${winnerInfo.language}`
      );

      const winnerNotification = sendExpoPushNotification(winnerInfo.pushToken, title, body, {
        type: 'match_result',
        notificationType: 'match_result',
        tournamentId,
        tournamentName,
        matchId,
        result: 'win',
        score,
      }).then(result => {
        logPushNotification(
          winnerId,
          'match_result',
          { tournamentId, matchId, result: 'win', language: winnerInfo.language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(winnerNotification);
    }

    // Send to loser
    const loserInfo = await getUserPushInfo(loserId);
    if (loserInfo.pushToken) {
      const title = i18nPushMessages.matchResultLoss.title[loserInfo.language];
      const body = replacePlaceholders(i18nPushMessages.matchResultLoss.body[loserInfo.language], {
        tournamentName,
        score,
      });

      console.log(
        `🌍 [NOTIFICATION] Sending LOSS to user ${loserId} in language: ${loserInfo.language}`
      );

      const loserNotification = sendExpoPushNotification(loserInfo.pushToken, title, body, {
        type: 'match_result',
        notificationType: 'match_result',
        tournamentId,
        tournamentName,
        matchId,
        result: 'loss',
        score,
      }).then(result => {
        logPushNotification(
          loserId,
          'match_result',
          { tournamentId, matchId, result: 'loss', language: loserInfo.language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(loserNotification);
    }

    await Promise.all(notifications);

    console.log(`✅ [NOTIFICATION] Match result notifications sent`);

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send match result notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * 👑 [PHASE 5.6] Send champion announcement notification to all participants
 * 🌍 Supports 10 languages based on recipient's preferredLanguage
 */
export async function sendChampionAnnouncementNotification(
  tournamentId: string,
  tournamentName: string,
  championId: string,
  championName: string,
  participantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  console.log(
    `👑 [NOTIFICATION] Sending champion announcement to ${participantIds.length} participants`
  );

  try {
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    for (const userId of participantIds) {
      const { pushToken, language } = await getUserPushInfo(userId);

      if (!pushToken) {
        continue;
      }

      const isChampion = userId === championId;

      const title = isChampion
        ? i18nPushMessages.championAnnouncement.titleChampion[language]
        : i18nPushMessages.championAnnouncement.titleOthers[language];

      const bodyTemplate = isChampion
        ? i18nPushMessages.championAnnouncement.bodyChampion[language]
        : i18nPushMessages.championAnnouncement.bodyOthers[language];

      const body = replacePlaceholders(bodyTemplate, { tournamentName, championName });

      console.log(
        `🌍 [NOTIFICATION] Sending to user ${userId} (champion: ${isChampion}) in language: ${language}`
      );

      const notificationPromise = sendExpoPushNotification(pushToken, title, body, {
        type: 'champion_announcement',
        notificationType: 'champion_announcement',
        tournamentId,
        tournamentName,
        championId,
        championName,
        isChampion,
      }).then(result => {
        logPushNotification(
          userId,
          'champion_announcement',
          { tournamentId, championId, championName, language },
          result.success ? 'sent' : 'failed'
        );
        return result;
      });

      notifications.push(notificationPromise);
    }

    await Promise.all(notifications);

    console.log(
      `✅ [NOTIFICATION] Champion announcement sent to ${notifications.length} participants`
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send champion announcement:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
