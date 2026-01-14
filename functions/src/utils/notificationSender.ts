/**
 * 🏛️ PROJECT OLYMPUS: Notification Sender
 *
 * Sends push notifications for trophy and badge awards via Expo Push Notification Service.
 * Integrates with trophyAwarder and tournamentBadgeChecker for immediate user engagement.
 *
 * Philosophy: Celebrate achievements immediately with instant push notifications
 *
 * 🌍 i18n Support: All notifications support 10 languages based on user's preferredLanguage
 * Supported: ko, en, ja, zh, de, fr, es, it, pt, ru
 *
 * @author Kim
 * @date 2025-01-10 (Updated for 10-language support)
 */

import * as admin from 'firebase-admin';

// 🌍 Notification-supported languages (10 languages)
type NotificationLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'ru';

/**
 * 🌍 Notification text translations (10 languages)
 * Supported: ko, en, ja, zh, de, fr, es, it, pt, ru
 */
const NOTIFICATION_TEXTS = {
  // Trophy notifications (tournament)
  trophy: {
    ko: {
      winner: {
        title: '🥇 축하합니다! 우승 트로피 획득!',
        body: (tournament: string) =>
          `${tournament}에서 우승을 달성했습니다! Hall of Fame에서 확인하세요.`,
      },
      runnerUp: {
        title: '🥈 축하합니다! 준우승 트로피 획득!',
        body: (tournament: string) =>
          `${tournament}에서 준우승을 달성했습니다! Hall of Fame에서 확인하세요.`,
      },
    },
    en: {
      winner: {
        title: '🥇 Congratulations! You won the championship!',
        body: (tournament: string) =>
          `You achieved 1st place in ${tournament}! Check your Hall of Fame.`,
      },
      runnerUp: {
        title: '🥈 Congratulations! Runner-up trophy!',
        body: (tournament: string) =>
          `You achieved 2nd place in ${tournament}! Check your Hall of Fame.`,
      },
    },
    ja: {
      winner: {
        title: '🥇 おめでとうございます！優勝トロフィー獲得！',
        body: (tournament: string) => `${tournament}で優勝しました！Hall of Fameでご確認ください。`,
      },
      runnerUp: {
        title: '🥈 おめでとうございます！準優勝トロフィー獲得！',
        body: (tournament: string) =>
          `${tournament}で準優勝しました！Hall of Fameでご確認ください。`,
      },
    },
    zh: {
      winner: {
        title: '🥇 恭喜！获得冠军奖杯！',
        body: (tournament: string) => `您在${tournament}中获得冠军！请在名人堂查看。`,
      },
      runnerUp: {
        title: '🥈 恭喜！获得亚军奖杯！',
        body: (tournament: string) => `您在${tournament}中获得亚军！请在名人堂查看。`,
      },
    },
    de: {
      winner: {
        title: '🥇 Herzlichen Glückwunsch! Meisterschaftstrophäe!',
        body: (tournament: string) =>
          `Sie haben bei ${tournament} den 1. Platz erreicht! Schauen Sie in Ihre Hall of Fame.`,
      },
      runnerUp: {
        title: '🥈 Herzlichen Glückwunsch! Zweitplatzierter-Trophäe!',
        body: (tournament: string) =>
          `Sie haben bei ${tournament} den 2. Platz erreicht! Schauen Sie in Ihre Hall of Fame.`,
      },
    },
    fr: {
      winner: {
        title: '🥇 Félicitations ! Trophée du champion !',
        body: (tournament: string) =>
          `Vous avez remporté ${tournament} ! Consultez votre Hall of Fame.`,
      },
      runnerUp: {
        title: '🥈 Félicitations ! Trophée du finaliste !',
        body: (tournament: string) =>
          `Vous avez terminé 2ème de ${tournament} ! Consultez votre Hall of Fame.`,
      },
    },
    es: {
      winner: {
        title: '🥇 ¡Felicitaciones! ¡Trofeo de campeón!',
        body: (tournament: string) =>
          `¡Ganaste el 1er lugar en ${tournament}! Revisa tu Salón de la Fama.`,
      },
      runnerUp: {
        title: '🥈 ¡Felicitaciones! ¡Trofeo de subcampeón!',
        body: (tournament: string) =>
          `¡Obtuviste el 2do lugar en ${tournament}! Revisa tu Salón de la Fama.`,
      },
    },
    it: {
      winner: {
        title: '🥇 Congratulazioni! Trofeo del campione!',
        body: (tournament: string) => `Hai vinto ${tournament}! Controlla la tua Hall of Fame.`,
      },
      runnerUp: {
        title: '🥈 Congratulazioni! Trofeo del secondo classificato!',
        body: (tournament: string) =>
          `Sei arrivato 2° in ${tournament}! Controlla la tua Hall of Fame.`,
      },
    },
    pt: {
      winner: {
        title: '🥇 Parabéns! Troféu de campeão!',
        body: (tournament: string) =>
          `Você conquistou o 1º lugar em ${tournament}! Confira seu Hall da Fama.`,
      },
      runnerUp: {
        title: '🥈 Parabéns! Troféu de vice-campeão!',
        body: (tournament: string) =>
          `Você conquistou o 2º lugar em ${tournament}! Confira seu Hall da Fama.`,
      },
    },
    ru: {
      winner: {
        title: '🥇 Поздравляем! Чемпионский трофей!',
        body: (tournament: string) =>
          `Вы заняли 1-е место в ${tournament}! Проверьте свой Зал славы.`,
      },
      runnerUp: {
        title: '🥈 Поздравляем! Трофей финалиста!',
        body: (tournament: string) =>
          `Вы заняли 2-е место в ${tournament}! Проверьте свой Зал славы.`,
      },
    },
  },
  // Season trophy notifications
  seasonTrophy: {
    ko: {
      season_champion_gold: { emoji: '🥇', name: '시즌 챔피언 (골드)' },
      season_champion_silver: { emoji: '🥈', name: '시즌 챔피언 (실버)' },
      season_champion_bronze: { emoji: '🥉', name: '시즌 챔피언 (브론즈)' },
      rank_up: { emoji: '📈', name: '등급 상승' },
      iron_man: { emoji: '💪', name: '아이언 맨' },
      ace: { emoji: '⭐', name: '에이스' },
      title: (emoji: string) => `${emoji} 시즌 트로피 획득!`,
      body: (season: string, trophyName: string) =>
        `${season}에서 "${trophyName}" 트로피를 획득했습니다! Hall of Fame에서 확인하세요.`,
      feedBody: (season: string, trophyName: string) =>
        `${season}에서 "${trophyName}" 트로피를 획득했습니다!`,
    },
    en: {
      season_champion_gold: { emoji: '🥇', name: 'Season Champion (Gold)' },
      season_champion_silver: { emoji: '🥈', name: 'Season Champion (Silver)' },
      season_champion_bronze: { emoji: '🥉', name: 'Season Champion (Bronze)' },
      rank_up: { emoji: '📈', name: 'Rank Up' },
      iron_man: { emoji: '💪', name: 'Iron Man' },
      ace: { emoji: '⭐', name: 'Ace' },
      title: (emoji: string) => `${emoji} Season Trophy Earned!`,
      body: (season: string, trophyName: string) =>
        `You earned the "${trophyName}" trophy in ${season}! Check your Hall of Fame.`,
      feedBody: (season: string, trophyName: string) =>
        `You earned the "${trophyName}" trophy in ${season}!`,
    },
    ja: {
      season_champion_gold: { emoji: '🥇', name: 'シーズンチャンピオン（ゴールド）' },
      season_champion_silver: { emoji: '🥈', name: 'シーズンチャンピオン（シルバー）' },
      season_champion_bronze: { emoji: '🥉', name: 'シーズンチャンピオン（ブロンズ）' },
      rank_up: { emoji: '📈', name: 'ランクアップ' },
      iron_man: { emoji: '💪', name: 'アイアンマン' },
      ace: { emoji: '⭐', name: 'エース' },
      title: (emoji: string) => `${emoji} シーズントロフィー獲得！`,
      body: (season: string, trophyName: string) =>
        `${season}で「${trophyName}」トロフィーを獲得しました！Hall of Fameでご確認ください。`,
      feedBody: (season: string, trophyName: string) =>
        `${season}で「${trophyName}」トロフィーを獲得しました！`,
    },
    zh: {
      season_champion_gold: { emoji: '🥇', name: '赛季冠军（金牌）' },
      season_champion_silver: { emoji: '🥈', name: '赛季冠军（银牌）' },
      season_champion_bronze: { emoji: '🥉', name: '赛季冠军（铜牌）' },
      rank_up: { emoji: '📈', name: '等级提升' },
      iron_man: { emoji: '💪', name: '钢铁侠' },
      ace: { emoji: '⭐', name: '王牌' },
      title: (emoji: string) => `${emoji} 获得赛季奖杯！`,
      body: (season: string, trophyName: string) =>
        `您在${season}获得了"${trophyName}"奖杯！请在名人堂查看。`,
      feedBody: (season: string, trophyName: string) => `您在${season}获得了"${trophyName}"奖杯！`,
    },
    de: {
      season_champion_gold: { emoji: '🥇', name: 'Saisonmeister (Gold)' },
      season_champion_silver: { emoji: '🥈', name: 'Saisonmeister (Silber)' },
      season_champion_bronze: { emoji: '🥉', name: 'Saisonmeister (Bronze)' },
      rank_up: { emoji: '📈', name: 'Rangaufstieg' },
      iron_man: { emoji: '💪', name: 'Iron Man' },
      ace: { emoji: '⭐', name: 'Ass' },
      title: (emoji: string) => `${emoji} Saison-Trophäe erhalten!`,
      body: (season: string, trophyName: string) =>
        `Sie haben die "${trophyName}"-Trophäe in ${season} erhalten! Schauen Sie in Ihre Hall of Fame.`,
      feedBody: (season: string, trophyName: string) =>
        `Sie haben die "${trophyName}"-Trophäe in ${season} erhalten!`,
    },
    fr: {
      season_champion_gold: { emoji: '🥇', name: 'Champion de saison (Or)' },
      season_champion_silver: { emoji: '🥈', name: 'Champion de saison (Argent)' },
      season_champion_bronze: { emoji: '🥉', name: 'Champion de saison (Bronze)' },
      rank_up: { emoji: '📈', name: 'Montée en rang' },
      iron_man: { emoji: '💪', name: 'Iron Man' },
      ace: { emoji: '⭐', name: 'As' },
      title: (emoji: string) => `${emoji} Trophée de saison obtenu !`,
      body: (season: string, trophyName: string) =>
        `Vous avez obtenu le trophée "${trophyName}" en ${season} ! Consultez votre Hall of Fame.`,
      feedBody: (season: string, trophyName: string) =>
        `Vous avez obtenu le trophée "${trophyName}" en ${season} !`,
    },
    es: {
      season_champion_gold: { emoji: '🥇', name: 'Campeón de temporada (Oro)' },
      season_champion_silver: { emoji: '🥈', name: 'Campeón de temporada (Plata)' },
      season_champion_bronze: { emoji: '🥉', name: 'Campeón de temporada (Bronce)' },
      rank_up: { emoji: '📈', name: 'Subida de rango' },
      iron_man: { emoji: '💪', name: 'Iron Man' },
      ace: { emoji: '⭐', name: 'As' },
      title: (emoji: string) => `${emoji} ¡Trofeo de temporada obtenido!`,
      body: (season: string, trophyName: string) =>
        `¡Ganaste el trofeo "${trophyName}" en ${season}! Revisa tu Salón de la Fama.`,
      feedBody: (season: string, trophyName: string) =>
        `¡Ganaste el trofeo "${trophyName}" en ${season}!`,
    },
    it: {
      season_champion_gold: { emoji: '🥇', name: 'Campione di stagione (Oro)' },
      season_champion_silver: { emoji: '🥈', name: 'Campione di stagione (Argento)' },
      season_champion_bronze: { emoji: '🥉', name: 'Campione di stagione (Bronzo)' },
      rank_up: { emoji: '📈', name: 'Promozione' },
      iron_man: { emoji: '💪', name: 'Iron Man' },
      ace: { emoji: '⭐', name: 'Asso' },
      title: (emoji: string) => `${emoji} Trofeo stagionale ottenuto!`,
      body: (season: string, trophyName: string) =>
        `Hai ottenuto il trofeo "${trophyName}" in ${season}! Controlla la tua Hall of Fame.`,
      feedBody: (season: string, trophyName: string) =>
        `Hai ottenuto il trofeo "${trophyName}" in ${season}!`,
    },
    pt: {
      season_champion_gold: { emoji: '🥇', name: 'Campeão da temporada (Ouro)' },
      season_champion_silver: { emoji: '🥈', name: 'Campeão da temporada (Prata)' },
      season_champion_bronze: { emoji: '🥉', name: 'Campeão da temporada (Bronze)' },
      rank_up: { emoji: '📈', name: 'Subida de nível' },
      iron_man: { emoji: '💪', name: 'Homem de Ferro' },
      ace: { emoji: '⭐', name: 'Ás' },
      title: (emoji: string) => `${emoji} Troféu da temporada conquistado!`,
      body: (season: string, trophyName: string) =>
        `Você conquistou o troféu "${trophyName}" em ${season}! Confira seu Hall da Fama.`,
      feedBody: (season: string, trophyName: string) =>
        `Você conquistou o troféu "${trophyName}" em ${season}!`,
    },
    ru: {
      season_champion_gold: { emoji: '🥇', name: 'Чемпион сезона (Золото)' },
      season_champion_silver: { emoji: '🥈', name: 'Чемпион сезона (Серебро)' },
      season_champion_bronze: { emoji: '🥉', name: 'Чемпион сезона (Бронза)' },
      rank_up: { emoji: '📈', name: 'Повышение ранга' },
      iron_man: { emoji: '💪', name: 'Железный человек' },
      ace: { emoji: '⭐', name: 'Туз' },
      title: (emoji: string) => `${emoji} Сезонный трофей получен!`,
      body: (season: string, trophyName: string) =>
        `Вы получили трофей "${trophyName}" в ${season}! Проверьте свой Зал славы.`,
      feedBody: (season: string, trophyName: string) =>
        `Вы получили трофей "${trophyName}" в ${season}!`,
    },
  },
  // Season start notifications
  seasonStart: {
    ko: {
      title: '🎾 새로운 시즌이 시작되었습니다!',
      body: (season: string) =>
        `${season}이(가) 시작되었습니다! 새로운 목표를 세우고 랭킹에 도전하세요. 화이팅!`,
      feedBody: (season: string) =>
        `${season}이(가) 시작되었습니다! 새로운 목표를 세우고 랭킹에 도전하세요!`,
    },
    en: {
      title: '🎾 New Season Has Begun!',
      body: (season: string) =>
        `${season} has started! Set new goals and climb the rankings. Play your best!`,
      feedBody: (season: string) => `${season} has started! Set new goals and climb the rankings!`,
    },
    ja: {
      title: '🎾 新シーズンが始まりました！',
      body: (season: string) =>
        `${season}が始まりました！新しい目標を立ててランキングに挑戦しましょう。頑張ってください！`,
      feedBody: (season: string) =>
        `${season}が始まりました！新しい目標を立ててランキングに挑戦しましょう！`,
    },
    zh: {
      title: '🎾 新赛季开始了！',
      body: (season: string) => `${season}已经开始！设定新目标，攀登排名榜。加油！`,
      feedBody: (season: string) => `${season}已经开始！设定新目标，攀登排名榜！`,
    },
    de: {
      title: '🎾 Neue Saison hat begonnen!',
      body: (season: string) =>
        `${season} hat begonnen! Setzen Sie neue Ziele und steigen Sie in der Rangliste. Viel Erfolg!`,
      feedBody: (season: string) =>
        `${season} hat begonnen! Setzen Sie neue Ziele und steigen Sie in der Rangliste!`,
    },
    fr: {
      title: '🎾 Nouvelle saison commencée !',
      body: (season: string) =>
        `${season} a commencé ! Fixez de nouveaux objectifs et grimpez dans le classement. Bon courage !`,
      feedBody: (season: string) =>
        `${season} a commencé ! Fixez de nouveaux objectifs et grimpez dans le classement !`,
    },
    es: {
      title: '🎾 ¡Nueva temporada ha comenzado!',
      body: (season: string) =>
        `¡${season} ha comenzado! Establece nuevas metas y sube en el ranking. ¡Mucha suerte!`,
      feedBody: (season: string) =>
        `¡${season} ha comenzado! Establece nuevas metas y sube en el ranking!`,
    },
    it: {
      title: '🎾 Nuova stagione iniziata!',
      body: (season: string) =>
        `${season} è iniziata! Stabilisci nuovi obiettivi e scala la classifica. In bocca al lupo!`,
      feedBody: (season: string) =>
        `${season} è iniziata! Stabilisci nuovi obiettivi e scala la classifica!`,
    },
    pt: {
      title: '🎾 Nova temporada começou!',
      body: (season: string) =>
        `${season} começou! Defina novas metas e suba no ranking. Boa sorte!`,
      feedBody: (season: string) => `${season} começou! Defina novas metas e suba no ranking!`,
    },
    ru: {
      title: '🎾 Новый сезон начался!',
      body: (season: string) =>
        `${season} начался! Поставьте новые цели и поднимитесь в рейтинге. Удачи!`,
      feedBody: (season: string) =>
        `${season} начался! Поставьте новые цели и поднимитесь в рейтинге!`,
    },
  },
  // Badge notifications
  badge: {
    ko: {
      title: (emoji: string) => `${emoji} 새로운 배지 획득!`,
      body: (name: string, tier: string) =>
        `${name} (${tier}) 배지를 획득했습니다! Hall of Fame에서 확인하세요.`,
    },
    en: {
      title: (emoji: string) => `${emoji} New Badge Earned!`,
      body: (name: string, tier: string) =>
        `You earned the ${name} (${tier}) badge! Check your Hall of Fame.`,
    },
    ja: {
      title: (emoji: string) => `${emoji} 新しいバッジ獲得！`,
      body: (name: string, tier: string) =>
        `${name}（${tier}）バッジを獲得しました！Hall of Fameでご確認ください。`,
    },
    zh: {
      title: (emoji: string) => `${emoji} 获得新徽章！`,
      body: (name: string, tier: string) => `您获得了${name}（${tier}）徽章！请在名人堂查看。`,
    },
    de: {
      title: (emoji: string) => `${emoji} Neues Abzeichen erhalten!`,
      body: (name: string, tier: string) =>
        `Sie haben das ${name} (${tier}) Abzeichen erhalten! Schauen Sie in Ihre Hall of Fame.`,
    },
    fr: {
      title: (emoji: string) => `${emoji} Nouveau badge obtenu !`,
      body: (name: string, tier: string) =>
        `Vous avez obtenu le badge ${name} (${tier}) ! Consultez votre Hall of Fame.`,
    },
    es: {
      title: (emoji: string) => `${emoji} ¡Nueva insignia obtenida!`,
      body: (name: string, tier: string) =>
        `¡Ganaste la insignia ${name} (${tier})! Revisa tu Salón de la Fama.`,
    },
    it: {
      title: (emoji: string) => `${emoji} Nuovo badge ottenuto!`,
      body: (name: string, tier: string) =>
        `Hai ottenuto il badge ${name} (${tier})! Controlla la tua Hall of Fame.`,
    },
    pt: {
      title: (emoji: string) => `${emoji} Novo distintivo conquistado!`,
      body: (name: string, tier: string) =>
        `Você conquistou o distintivo ${name} (${tier})! Confira seu Hall da Fama.`,
    },
    ru: {
      title: (emoji: string) => `${emoji} Новый значок получен!`,
      body: (name: string, tier: string) =>
        `Вы получили значок ${name} (${tier})! Проверьте свой Зал славы.`,
    },
  },
  // Friend invite notifications
  friendInvite: {
    ko: {
      title: '🎾 친구가 당신을 매치에 초대했습니다!',
      body: (inviter: string, event: string) =>
        `${inviter}님이 "${event}" 매치에 초대했습니다. 수락하고 참가하세요!`,
    },
    en: {
      title: '🎾 A friend invited you to a match!',
      body: (inviter: string, event: string) =>
        `${inviter} invited you to "${event}". Accept and join!`,
    },
    ja: {
      title: '🎾 友達がマッチに招待しました！',
      body: (inviter: string, event: string) =>
        `${inviter}さんが「${event}」マッチに招待しました。参加しましょう！`,
    },
    zh: {
      title: '🎾 朋友邀请您参加比赛！',
      body: (inviter: string, event: string) =>
        `${inviter}邀请您参加"${event}"比赛。接受并加入吧！`,
    },
    de: {
      title: '🎾 Ein Freund hat Sie zu einem Match eingeladen!',
      body: (inviter: string, event: string) =>
        `${inviter} hat Sie zu "${event}" eingeladen. Akzeptieren und mitmachen!`,
    },
    fr: {
      title: '🎾 Un ami vous a invité à un match !',
      body: (inviter: string, event: string) =>
        `${inviter} vous a invité à "${event}". Acceptez et participez !`,
    },
    es: {
      title: '🎾 ¡Un amigo te invitó a un partido!',
      body: (inviter: string, event: string) =>
        `${inviter} te invitó a "${event}". ¡Acepta y únete!`,
    },
    it: {
      title: '🎾 Un amico ti ha invitato a una partita!',
      body: (inviter: string, event: string) =>
        `${inviter} ti ha invitato a "${event}". Accetta e partecipa!`,
    },
    pt: {
      title: '🎾 Um amigo te convidou para uma partida!',
      body: (inviter: string, event: string) =>
        `${inviter} convidou você para "${event}". Aceite e participe!`,
    },
    ru: {
      title: '🎾 Друг пригласил вас на матч!',
      body: (inviter: string, event: string) =>
        `${inviter} пригласил вас на "${event}". Примите и присоединяйтесь!`,
    },
  },
  // Tournament completed notifications
  tournamentCompleted: {
    ko: {
      title: '🎾 토너먼트 완료!',
      body: (tournament: string) => `${tournament}이(가) 완료되었습니다. 결과를 확인해보세요!`,
    },
    en: {
      title: '🎾 Tournament Completed!',
      body: (tournament: string) => `${tournament} has ended. Check the results!`,
    },
    ja: {
      title: '🎾 トーナメント終了！',
      body: (tournament: string) => `${tournament}が終了しました。結果をご確認ください！`,
    },
    zh: {
      title: '🎾 锦标赛结束！',
      body: (tournament: string) => `${tournament}已结束。查看结果吧！`,
    },
    de: {
      title: '🎾 Turnier beendet!',
      body: (tournament: string) =>
        `${tournament} ist beendet. Schauen Sie sich die Ergebnisse an!`,
    },
    fr: {
      title: '🎾 Tournoi terminé !',
      body: (tournament: string) => `${tournament} est terminé. Consultez les résultats !`,
    },
    es: {
      title: '🎾 ¡Torneo completado!',
      body: (tournament: string) => `${tournament} ha terminado. ¡Mira los resultados!`,
    },
    it: {
      title: '🎾 Torneo completato!',
      body: (tournament: string) => `${tournament} è terminato. Controlla i risultati!`,
    },
    pt: {
      title: '🎾 Torneio concluído!',
      body: (tournament: string) => `${tournament} terminou. Confira os resultados!`,
    },
    ru: {
      title: '🎾 Турнир завершен!',
      body: (tournament: string) => `${tournament} завершен. Проверьте результаты!`,
    },
  },
  // Event cancelled notifications
  eventCancelled: {
    ko: {
      title: '모임 취소 알림 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" 모임이 호스트에 의해 취소되었습니다. 사유: ${reason}`
          : `"${eventTitle}" 모임이 호스트에 의해 취소되었습니다.`,
    },
    en: {
      title: 'Event Cancelled 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" has been cancelled by the host. Reason: ${reason}`
          : `"${eventTitle}" has been cancelled by the host.`,
    },
    ja: {
      title: 'イベントキャンセル 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `「${eventTitle}」がホストによってキャンセルされました。理由：${reason}`
          : `「${eventTitle}」がホストによってキャンセルされました。`,
    },
    zh: {
      title: '活动取消通知 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}"已被主办方取消。原因：${reason}`
          : `"${eventTitle}"已被主办方取消。`,
    },
    de: {
      title: 'Veranstaltung abgesagt 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" wurde vom Gastgeber abgesagt. Grund: ${reason}`
          : `"${eventTitle}" wurde vom Gastgeber abgesagt.`,
    },
    fr: {
      title: 'Événement annulé 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" a été annulé par l'hôte. Raison : ${reason}`
          : `"${eventTitle}" a été annulé par l'hôte.`,
    },
    es: {
      title: 'Evento cancelado 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" ha sido cancelado por el anfitrión. Motivo: ${reason}`
          : `"${eventTitle}" ha sido cancelado por el anfitrión.`,
    },
    it: {
      title: 'Evento annullato 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" è stato annullato dall'host. Motivo: ${reason}`
          : `"${eventTitle}" è stato annullato dall'host.`,
    },
    pt: {
      title: 'Evento cancelado 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" foi cancelado pelo anfitrião. Motivo: ${reason}`
          : `"${eventTitle}" foi cancelado pelo anfitrião.`,
    },
    ru: {
      title: 'Событие отменено 😔',
      body: (eventTitle: string, reason?: string) =>
        reason
          ? `"${eventTitle}" было отменено организатором. Причина: ${reason}`
          : `"${eventTitle}" было отменено организатором.`,
    },
  },
  // Quick match notifications
  quickMatch: {
    ko: {
      chatCreated: '매치가 생성되었습니다. 장소와 시간을 협의해주세요!',
      requestTitle: '⚡ 퀵 매치 신청!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname}님이 기록 매치를 신청했습니다! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname}님이 친선 매치를 신청했습니다! (기록경기 불가)`,
    },
    en: {
      chatCreated: 'Match created. Please coordinate the location and time!',
      requestTitle: '⚡ Quick Match Request!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} requested a ranked match! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} requested a friendly match! (Unranked)`,
    },
    ja: {
      chatCreated: 'マッチが作成されました。場所と時間を調整してください！',
      requestTitle: '⚡ クイックマッチ申請！',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname}さんが記録マッチを申請しました！(LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname}さんが親善マッチを申請しました！(記録なし)`,
    },
    zh: {
      chatCreated: '比赛已创建。请协调地点和时间！',
      requestTitle: '⚡ 快速比赛申请！',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname}申请了记录比赛！(LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) => `${hostNickname}申请了友谊赛！(不计分)`,
    },
    de: {
      chatCreated: 'Match erstellt. Bitte koordinieren Sie Ort und Zeit!',
      requestTitle: '⚡ Schnellmatch-Anfrage!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} hat ein gewertetes Match angefordert! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} hat ein Freundschaftsmatch angefordert! (Nicht gewertet)`,
    },
    fr: {
      chatCreated: 'Match créé. Veuillez coordonner le lieu et l\'heure !',
      requestTitle: '⚡ Demande de match rapide !',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} a demandé un match classé ! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} a demandé un match amical ! (Non classé)`,
    },
    es: {
      chatCreated: '¡Partido creado. Por favor coordinen el lugar y la hora!',
      requestTitle: '⚡ ¡Solicitud de partido rápido!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `¡${hostNickname} solicitó un partido clasificado! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `¡${hostNickname} solicitó un partido amistoso! (Sin clasificar)`,
    },
    it: {
      chatCreated: 'Partita creata. Coordinate luogo e ora!',
      requestTitle: '⚡ Richiesta di match rapido!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} ha richiesto una partita classificata! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} ha richiesto una partita amichevole! (Non classificata)`,
    },
    pt: {
      chatCreated: 'Partida criada. Coordenem o local e o horário!',
      requestTitle: '⚡ Solicitação de partida rápida!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} solicitou uma partida ranqueada! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} solicitou uma partida amistosa! (Não ranqueada)`,
    },
    ru: {
      chatCreated: 'Матч создан. Согласуйте место и время!',
      requestTitle: '⚡ Запрос быстрого матча!',
      requestBodyRanked: (hostNickname: string, hostLtr: number) =>
        `${hostNickname} запросил рейтинговый матч! (LTR ${hostLtr})`,
      requestBodyFriendly: (hostNickname: string) =>
        `${hostNickname} запросил товарищеский матч! (Без рейтинга)`,
    },
  },
  // Application approval notifications
  applicationApproval: {
    ko: {
      title: '참여가 승인되었습니다! 🎾',
      body: (eventTitle: string) => `"${eventTitle}" 참여가 승인되었습니다.`,
    },
    en: {
      title: 'Application Approved! 🎾',
      body: (eventTitle: string) => `Your application for "${eventTitle}" has been approved.`,
    },
    ja: {
      title: '参加が承認されました！🎾',
      body: (eventTitle: string) => `「${eventTitle}」への参加が承認されました。`,
    },
    zh: {
      title: '申请已批准！🎾',
      body: (eventTitle: string) => `您的"${eventTitle}"申请已被批准。`,
    },
    de: {
      title: 'Antrag genehmigt! 🎾',
      body: (eventTitle: string) => `Ihr Antrag für "${eventTitle}" wurde genehmigt.`,
    },
    fr: {
      title: 'Demande approuvée ! 🎾',
      body: (eventTitle: string) => `Votre demande pour "${eventTitle}" a été approuvée.`,
    },
    es: {
      title: '¡Solicitud aprobada! 🎾',
      body: (eventTitle: string) => `Su solicitud para "${eventTitle}" ha sido aprobada.`,
    },
    it: {
      title: 'Richiesta approvata! 🎾',
      body: (eventTitle: string) => `La tua richiesta per "${eventTitle}" è stata approvata.`,
    },
    pt: {
      title: 'Solicitação aprovada! 🎾',
      body: (eventTitle: string) => `Sua solicitação para "${eventTitle}" foi aprovada.`,
    },
    ru: {
      title: 'Заявка одобрена! 🎾',
      body: (eventTitle: string) => `Ваша заявка на "${eventTitle}" была одобрена.`,
    },
  },
};

/**
 * Get user's preferred language with fallback to English
 * Returns NotificationLanguage for type safety (supports 10 languages)
 */
function getUserLanguage(userData: admin.firestore.DocumentData | undefined): NotificationLanguage {
  const lang =
    userData?.preferredLanguage || userData?.language || userData?.preferences?.language || 'en';
  const supportedLanguages: NotificationLanguage[] = [
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
  if (supportedLanguages.includes(lang as NotificationLanguage)) {
    return lang as NotificationLanguage;
  }
  return 'en'; // Default fallback
}

/**
 * Get localized event cancelled notification
 */
export function getEventCancelledNotification(
  userLang: NotificationLanguage,
  eventTitle: string,
  reason?: string
): { title: string; body: string } {
  const texts = NOTIFICATION_TEXTS.eventCancelled[userLang];
  return {
    title: texts.title,
    body: texts.body(eventTitle, reason),
  };
}

/**
 * Get localized quick match notification
 */
export function getQuickMatchNotification(
  userLang: NotificationLanguage,
  isRankedMatch: boolean,
  hostNickname: string,
  hostLtr: number
): { title: string; body: string; chatMessage: string } {
  const texts = NOTIFICATION_TEXTS.quickMatch[userLang];
  return {
    title: texts.requestTitle,
    body: isRankedMatch
      ? texts.requestBodyRanked(hostNickname, hostLtr)
      : texts.requestBodyFriendly(hostNickname),
    chatMessage: texts.chatCreated,
  };
}

/**
 * Get localized application approval notification
 */
export function getApplicationApprovalNotification(
  userLang: NotificationLanguage,
  eventTitle: string
): { title: string; body: string } {
  const texts = NOTIFICATION_TEXTS.applicationApproval[userLang];
  return {
    title: texts.title,
    body: texts.body(eventTitle),
  };
}

/**
 * Send trophy award push notification
 *
 * @param userId - User ID to send notification to
 * @param trophyData - Trophy data (name, rank, tournament)
 * @param context - Optional context for additional data
 * @returns Success status
 */
export async function sendTrophyNotification(
  userId: string,
  trophyData: {
    rank: 'Winner' | 'Runner-up';
    tournamentName: string;
    tournamentId?: string;
    clubName?: string;
    clubId?: string;
  },
  context?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏆 [NOTIFICATION] Sending trophy notification to user ${userId}:`, {
    rank: trophyData.rank,
    tournament: trophyData.tournamentName,
  });

  try {
    const db = admin.firestore();

    // 1. Get user's push token
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [NOTIFICATION] User ${userId} does not have a push token. Skipping notification.`
      );
      return { success: false, error: 'No push token' };
    }

    // Check user's notification settings
    const settings = userData?.notificationSettings || {};
    if (settings.trophyNotifications === false) {
      console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled trophy notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    console.log('✅ [NOTIFICATION] Push token found. Preparing trophy notification...');

    // 2. Get user's language and determine trophy text
    const userLang = getUserLanguage(userData);
    const trophyType = trophyData.rank === 'Winner' ? 'winner' : 'runnerUp';
    const texts = NOTIFICATION_TEXTS.trophy[userLang][trophyType];

    // 3. Prepare push notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title: texts.title,
      body: texts.body(trophyData.tournamentName),
      data: {
        type: 'trophy_awarded',
        notificationType: 'trophy_awarded',
        rank: trophyData.rank,
        tournamentId: trophyData.tournamentId || '',
        tournamentName: trophyData.tournamentName,
        clubId: trophyData.clubId || '',
        clubName: trophyData.clubName || '',
        ...context,
      },
      priority: 'high',
      channelId: 'achievements', // Android notification channel
    };

    console.log('📤 [NOTIFICATION] Sending trophy push notification:', {
      recipient: userId,
      title: message.title,
    });

    // 4. Send push notification via Expo Push Notification Service
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
      console.error('❌ [NOTIFICATION] Trophy push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [NOTIFICATION] Trophy push notification sent successfully!', {
      recipient: userId,
      ticketId: result.data?.id,
    });

    // 5. Log push notification
    await db.collection('push_notification_logs').add({
      userId: userId,
      type: 'trophy_awarded',
      rank: trophyData.rank,
      tournamentId: trophyData.tournamentId,
      tournamentName: trophyData.tournamentName,
      clubId: trophyData.clubId,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send trophy push notification:', error);

    // Log error
    try {
      await admin
        .firestore()
        .collection('push_notification_logs')
        .add({
          userId: userId,
          type: 'trophy_awarded',
          status: 'failed',
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
      console.error('❌ [NOTIFICATION] Failed to log error:', logError);
    }

    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send badge award push notification
 *
 * @param userId - User ID to send notification to
 * @param badgeData - Badge data (name, tier, description)
 * @param context - Optional context for additional data
 * @returns Success status
 */
export async function sendBadgeNotification(
  userId: string,
  badgeData: {
    name: string;
    nameKo: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    tournamentName?: string;
    tournamentId?: string;
    clubName?: string;
    clubId?: string;
  },
  context?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏅 [NOTIFICATION] Sending badge notification to user ${userId}:`, {
    name: badgeData.name,
    tier: badgeData.tier,
  });

  try {
    const db = admin.firestore();

    // 1. Get user's push token
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [NOTIFICATION] User ${userId} does not have a push token. Skipping notification.`
      );
      return { success: false, error: 'No push token' };
    }

    // Check user's notification settings
    const settings = userData?.notificationSettings || {};
    if (settings.badgeNotifications === false) {
      console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled badge notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    console.log('✅ [NOTIFICATION] Push token found. Preparing badge notification...');

    // 2. Get user's language and determine badge text
    const userLang = getUserLanguage(userData);
    const texts = NOTIFICATION_TEXTS.badge[userLang];
    const tierEmoji = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    }[badgeData.tier];

    const tierText = {
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    }[badgeData.tier];

    // Use localized badge name if available, otherwise use English name
    const badgeName = userLang === 'ko' ? badgeData.nameKo : badgeData.name;

    // 3. Prepare push notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title: texts.title(tierEmoji || '🏅'),
      body: texts.body(badgeName, tierText || 'Unknown'),
      data: {
        type: 'badge_earned',
        notificationType: 'badge_earned',
        badgeName: badgeData.name,
        badgeNameKo: badgeData.nameKo,
        tier: badgeData.tier,
        tournamentId: badgeData.tournamentId || '',
        tournamentName: badgeData.tournamentName || '',
        clubId: badgeData.clubId || '',
        clubName: badgeData.clubName || '',
        ...context,
      },
      priority: 'high',
      channelId: 'achievements', // Android notification channel
    };

    console.log('📤 [NOTIFICATION] Sending badge push notification:', {
      recipient: userId,
      title: message.title,
    });

    // 4. Send push notification via Expo Push Notification Service
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
      console.error('❌ [NOTIFICATION] Badge push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [NOTIFICATION] Badge push notification sent successfully!', {
      recipient: userId,
      ticketId: result.data?.id,
    });

    // 5. Log push notification
    await db.collection('push_notification_logs').add({
      userId: userId,
      type: 'badge_earned',
      badgeName: badgeData.name,
      badgeNameKo: badgeData.nameKo,
      tier: badgeData.tier,
      tournamentId: badgeData.tournamentId,
      tournamentName: badgeData.tournamentName,
      clubId: badgeData.clubId,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send badge push notification:', error);

    // Log error
    try {
      await admin
        .firestore()
        .collection('push_notification_logs')
        .add({
          userId: userId,
          type: 'badge_earned',
          status: 'failed',
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
      console.error('❌ [NOTIFICATION] Failed to log error:', logError);
    }

    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send tournament completion notification to all participants
 *
 * @param tournamentId - Tournament ID
 * @param tournamentName - Tournament name
 * @param participantIds - Array of participant user IDs
 * @returns Array of notification results
 */
export async function sendTournamentCompletionNotifications(
  tournamentId: string,
  tournamentName: string,
  participantIds: string[]
): Promise<Array<{ userId: string; success: boolean; error?: string }>> {
  console.log(`🏆 [NOTIFICATION] Sending tournament completion notifications:`, {
    tournamentId,
    tournamentName,
    participantCount: participantIds.length,
  });

  const results: Array<{ userId: string; success: boolean; error?: string }> = [];

  for (const userId of participantIds) {
    try {
      const db = admin.firestore();
      const userRef = db.doc(`users/${userId}`);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        results.push({ userId, success: false, error: 'User not found' });
        continue;
      }

      const userData = userSnap.data();
      const pushToken = userData?.pushToken;

      if (!pushToken) {
        results.push({ userId, success: false, error: 'No push token' });
        continue;
      }

      // Check user's notification settings
      const settings = userData?.notificationSettings || {};
      if (settings.tournamentNotifications === false) {
        console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled tournament notifications`);
        results.push({ userId, success: false, error: 'Notifications disabled' });
        continue;
      }

      // Get user's language
      const userLang = getUserLanguage(userData);
      const texts = NOTIFICATION_TEXTS.tournamentCompleted[userLang];

      const message = {
        to: pushToken,
        sound: 'default',
        title: texts.title,
        body: texts.body(tournamentName),
        data: {
          type: 'tournament_completed',
          notificationType: 'tournament_completed',
          tournamentId: tournamentId,
          tournamentName: tournamentName,
        },
        priority: 'high',
        channelId: 'tournaments',
      };

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
        results.push({ userId, success: false, error: result.errors[0]?.message });
      } else {
        results.push({ userId, success: true });

        // Log notification
        await db.collection('push_notification_logs').add({
          userId: userId,
          type: 'tournament_completed',
          tournamentId: tournamentId,
          tournamentName: tournamentName,
          pushToken: pushToken,
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          expoTicketId: result.data?.id,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ userId, success: false, error: errorMessage });
    }
  }

  console.log(`✅ [NOTIFICATION] Tournament completion notifications sent:`, {
    total: participantIds.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  });

  return results;
}

/**
 * Send push notification for new chat message
 * Supports Event Chat, Club Chat, and Direct Chat
 *
 * @param chatType - Type of chat ('event' | 'club' | 'direct')
 * @param chatId - Event ID, Club ID, or Chat Room ID
 * @param chatTitle - Event title, Club name, or sender name
 * @param senderName - Message sender name
 * @param messagePreview - First 50 chars of message
 * @param recipientIds - Array of participant user IDs (excluding sender)
 * @returns Array of notification results
 */
export async function sendChatNotification(
  chatType: 'event' | 'club' | 'direct',
  chatId: string,
  chatTitle: string,
  senderName: string,
  messagePreview: string,
  recipientIds: string[]
): Promise<Array<{ userId: string; success: boolean; error?: string }>> {
  console.log(`💬 [NOTIFICATION] Sending ${chatType} chat notification:`, {
    chatId,
    senderName,
    recipientCount: recipientIds.length,
  });

  const results: Array<{ userId: string; success: boolean; error?: string }> = [];
  const db = admin.firestore();

  for (const userId of recipientIds) {
    try {
      // 1. Get user's push token
      const userRef = db.doc(`users/${userId}`);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        results.push({ userId, success: false, error: 'User not found' });
        continue;
      }

      const userData = userSnap.data();
      const pushToken = userData?.pushToken;

      if (!pushToken) {
        results.push({ userId, success: false, error: 'No push token' });
        continue;
      }

      // 2. Check user's notification settings
      const settings = userData?.notificationSettings || {};
      const settingKey = `${chatType}ChatNotifications`;

      if (settings[settingKey] === false) {
        console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled ${chatType} chat notifications`);
        results.push({ userId, success: false, error: 'Notifications disabled' });
        continue;
      }

      // 3. Prepare push notification message
      const emojiMap = {
        event: '🎾',
        club: '🏟️',
        direct: '💬',
      };

      const titleMap = {
        event: `${emojiMap[chatType]} ${chatTitle}`,
        club: `${emojiMap[chatType]} ${chatTitle}`,
        direct: `${emojiMap[chatType]} ${senderName}`,
      };

      const message = {
        to: pushToken,
        sound: 'default',
        title: titleMap[chatType],
        body: `${senderName}: ${messagePreview}`,
        data: {
          type: `${chatType}_chat_message`,
          notificationType: `${chatType}_chat_message`,
          chatType,
          chatId,
          chatTitle,
          senderId: senderName,
        },
        priority: 'high',
        channelId: 'chat',
      };

      // 4. Send push notification
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
        results.push({ userId, success: false, error: result.errors[0]?.message });
      } else {
        results.push({ userId, success: true });

        // 5. Log notification
        await db.collection('push_notification_logs').add({
          userId: userId,
          type: `${chatType}_chat_message`,
          chatType,
          chatId,
          chatTitle,
          senderName,
          pushToken,
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          expoTicketId: result.data?.id,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ userId, success: false, error: errorMessage });
    }
  }

  console.log(`✅ [NOTIFICATION] ${chatType} chat notifications sent:`, {
    total: recipientIds.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  });

  return results;
}

/**
 * 🏆 [SEASON TROPHY] Send season trophy award notification
 *
 * @param userId - User ID to send notification to
 * @param trophyData - Trophy data (type, season info, metadata)
 * @returns Success status
 */
export async function sendSeasonTrophyNotification(
  userId: string,
  trophyData: {
    trophyType:
      | 'season_champion_gold'
      | 'season_champion_silver'
      | 'season_champion_bronze'
      | 'rank_up'
      | 'iron_man'
      | 'ace';
    seasonId: string;
    seasonName: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log(`🏆 [NOTIFICATION] Sending season trophy notification to user ${userId}:`, {
    trophyType: trophyData.trophyType,
    season: trophyData.seasonName,
  });

  try {
    const db = admin.firestore();

    // 1. Get user's push token
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [NOTIFICATION] User ${userId} does not have a push token. Skipping notification.`
      );
      return { success: false, error: 'No push token' };
    }

    // Check user's notification settings
    const settings = userData?.notificationSettings || {};
    if (settings.seasonTrophyNotifications === false) {
      console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled season trophy notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    console.log('✅ [NOTIFICATION] Push token found. Preparing season trophy notification...');

    // 2. Get user's language and determine trophy info
    const userLang = getUserLanguage(userData);
    const texts = NOTIFICATION_TEXTS.seasonTrophy[userLang];
    const trophyInfo = texts[trophyData.trophyType as keyof typeof texts] as {
      emoji: string;
      name: string;
    };
    const titleFn = texts.title as (emoji: string) => string;
    const bodyFn = texts.body as (season: string, name: string) => string;

    // 3. Prepare push notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title: titleFn(trophyInfo.emoji),
      body: bodyFn(trophyData.seasonName, trophyInfo.name),
      data: {
        type: 'season_trophy_awarded',
        notificationType: 'season_trophy_awarded',
        trophyType: trophyData.trophyType,
        seasonId: trophyData.seasonId,
        seasonName: trophyData.seasonName,
        ...trophyData.metadata,
      },
      priority: 'high',
      channelId: 'achievements', // Android notification channel
    };

    console.log('📤 [NOTIFICATION] Sending season trophy push notification:', {
      recipient: userId,
      title: message.title,
    });

    // 4. Send push notification via Expo Push Notification Service
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
      console.error('❌ [NOTIFICATION] Season trophy push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [NOTIFICATION] Season trophy push notification sent successfully!', {
      recipient: userId,
      ticketId: result.data?.id,
    });

    // 5. Log push notification
    await db.collection('push_notification_logs').add({
      userId: userId,
      type: 'season_trophy_awarded',
      trophyType: trophyData.trophyType,
      seasonId: trophyData.seasonId,
      seasonName: trophyData.seasonName,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    // 6. Add home feed notification (in-app notification)
    const feedBodyFn = texts.feedBody as (season: string, name: string) => string;
    await db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'season_trophy',
        trophyType: trophyData.trophyType,
        seasonId: trophyData.seasonId,
        seasonName: trophyData.seasonName,
        title: titleFn(trophyInfo.emoji),
        body: feedBodyFn(trophyData.seasonName, trophyInfo.name),
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log('📱 [NOTIFICATION] Home feed notification added for user:', userId);

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send season trophy push notification:', error);

    // Log error
    try {
      await admin
        .firestore()
        .collection('push_notification_logs')
        .add({
          userId: userId,
          type: 'season_trophy_awarded',
          trophyType: trophyData.trophyType,
          status: 'failed',
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
      console.error('❌ [NOTIFICATION] Failed to log error:', logError);
    }

    return { success: false, error: (error as Error).message };
  }
}

/**
 * 🎯 [FRIEND INVITE] Send friend invitation notification
 *
 * @param userId - User ID to send notification to
 * @param inviterName - Name of the person who invited them
 * @param eventTitle - Title of the event
 * @param eventId - Event ID for navigation
 * @returns Success status
 */
export async function sendFriendInviteNotification(
  userId: string,
  inviterName: string,
  eventTitle: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎯 [NOTIFICATION] Sending friend invite notification to user ${userId}:`, {
    inviter: inviterName,
    event: eventTitle,
  });

  try {
    const db = admin.firestore();

    // 1. Get user's push token
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [NOTIFICATION] User ${userId} does not have a push token. Skipping notification.`
      );
      return { success: false, error: 'No push token' };
    }

    // Check user's notification settings
    const settings = userData?.notificationSettings || {};
    if (settings.eventNotifications === false) {
      console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled event notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    console.log('✅ [NOTIFICATION] Push token found. Preparing friend invite notification...');

    // 2. Get user's language and prepare notification text
    const userLang = getUserLanguage(userData);
    const texts = NOTIFICATION_TEXTS.friendInvite[userLang];

    // 3. Prepare push notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title: texts.title,
      body: texts.body(inviterName, eventTitle),
      data: {
        type: 'friend_invite',
        notificationType: 'friend_invite',
        eventId: eventId,
        eventTitle: eventTitle,
        inviterName: inviterName,
      },
      priority: 'high',
      channelId: 'events', // Android notification channel
    };

    console.log('📤 [NOTIFICATION] Sending friend invite push notification:', {
      recipient: userId,
      title: message.title,
    });

    // 3. Send push notification via Expo Push Notification Service
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
      console.error('❌ [NOTIFICATION] Friend invite push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [NOTIFICATION] Friend invite push notification sent successfully!', {
      recipient: userId,
      ticketId: result.data?.id,
    });

    // 4. Log push notification
    await db.collection('push_notification_logs').add({
      userId: userId,
      type: 'friend_invite',
      eventId: eventId,
      eventTitle: eventTitle,
      inviterName: inviterName,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send friend invite push notification:', error);

    // Log error
    try {
      await admin
        .firestore()
        .collection('push_notification_logs')
        .add({
          userId: userId,
          type: 'friend_invite',
          eventId: eventId,
          status: 'failed',
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
      console.error('❌ [NOTIFICATION] Failed to log error:', logError);
    }

    return { success: false, error: (error as Error).message };
  }
}

/**
 * 🎾 [SEASON START] Send season start notification
 * Called at 10 AM local time on the first day of each quarter
 *
 * @param userId - User ID to send notification to
 * @param seasonData - Season data (ID, name)
 * @returns Success status
 */
export async function sendSeasonStartNotification(
  userId: string,
  seasonData: {
    seasonId: string;
    seasonName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log(`🎾 [NOTIFICATION] Sending season start notification to user ${userId}:`, {
    season: seasonData.seasonName,
  });

  try {
    const db = admin.firestore();

    // 1. Get user's push token and language
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const pushToken = userData?.pushToken;

    if (!pushToken) {
      console.log(
        `⚠️ [NOTIFICATION] User ${userId} does not have a push token. Skipping notification.`
      );
      return { success: false, error: 'No push token' };
    }

    // Check user's notification settings
    const settings = userData?.notificationSettings || {};
    if (settings.seasonNotifications === false) {
      console.log(`⚙️ [NOTIFICATION] User ${userId} has disabled season notifications`);
      return { success: false, error: 'Notifications disabled by user' };
    }

    console.log('✅ [NOTIFICATION] Push token found. Preparing season start notification...');

    // 2. Get user's language
    const userLang = getUserLanguage(userData);
    const texts = NOTIFICATION_TEXTS.seasonStart[userLang];

    // 3. Prepare push notification message
    const message = {
      to: pushToken,
      sound: 'default',
      title: texts.title,
      body: texts.body(seasonData.seasonName),
      data: {
        type: 'season_start',
        notificationType: 'season_start',
        seasonId: seasonData.seasonId,
        seasonName: seasonData.seasonName,
      },
      priority: 'high',
      channelId: 'announcements', // Android notification channel
    };

    console.log('📤 [NOTIFICATION] Sending season start push notification:', {
      recipient: userId,
      title: message.title,
    });

    // 4. Send push notification via Expo Push Notification Service
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
      console.error('❌ [NOTIFICATION] Season start push notification errors:', result.errors);
      throw new Error(`Push notification failed: ${result.errors[0]?.message}`);
    }

    console.log('✅ [NOTIFICATION] Season start push notification sent successfully!', {
      recipient: userId,
      ticketId: result.data?.id,
    });

    // 5. Log push notification
    await db.collection('push_notification_logs').add({
      userId: userId,
      type: 'season_start',
      seasonId: seasonData.seasonId,
      seasonName: seasonData.seasonName,
      pushToken: pushToken,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expoTicketId: result.data?.id,
    });

    // 6. Add home feed notification (in-app notification)
    await db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'season_start',
        seasonId: seasonData.seasonId,
        seasonName: seasonData.seasonName,
        title: texts.title,
        body: texts.feedBody(seasonData.seasonName),
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log('📱 [NOTIFICATION] Home feed notification added for user:', userId);

    return { success: true };
  } catch (error: unknown) {
    console.error('❌ [NOTIFICATION] Failed to send season start push notification:', error);

    // Log error
    try {
      await admin
        .firestore()
        .collection('push_notification_logs')
        .add({
          userId: userId,
          type: 'season_start',
          seasonId: seasonData.seasonId,
          status: 'failed',
          error: (error as Error).message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
      console.error('❌ [NOTIFICATION] Failed to log error:', logError);
    }

    return { success: false, error: (error as Error).message };
  }
}
