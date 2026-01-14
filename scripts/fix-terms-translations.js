/**
 * Fix Terms of Service translations for all languages
 * This script updates the terms section with complete translations
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Complete translations for each language
const translations = {
  'ja.json': {
    terms: {
      title: '利用規約',
      description: 'サービスを利用するには規約に同意してください',
      introSubtitle: 'これらの規約は安全で楽しいテニスコミュニティを確保するためのものです',
      stepProgress: 'ステップ {{current}} / {{total}}',
      agreeAll: 'すべての規約に同意',
      importantNotice: '重要なお知らせ',
      noticeContent:
        'Lightning Tennisはテニスプレイヤーを繋ぐプラットフォームです。実際の試合中に発生する安全事故や紛争の責任は参加者にあり、当社はこれらの事項について法的責任を負いません。',
      requiredTermsTitle: '必須規約',
      requiredTermsMessage: '続行するにはすべての必須規約に同意してください。',
      serviceTerms: 'サービス利用規約',
      privacyPolicy: 'プライバシーポリシー',
      locationServices: '位置情報サービス規約',
      liabilityDisclaimer: '免責事項',
      marketingCommunications: 'サービス更新とお知らせ',
      inclusivityPolicy: '多様性・包括性ポリシー',
      required: '必須',
      optional: '任意',
      details: {
        serviceTerms: {
          title: 'サービス利用規約',
          content:
            'Lightning Tennis サービス利用規約\n\n⚠️ 重要なお知らせ\nLightning Tennisはテニスプレイヤーを繋ぐプラットフォームです。実際の試合中に発生する安全事故や紛争の責任は参加者にあり、当社はこれらの事項について法的責任を負いません。\n\n1. サービス利用\n- 本アプリはテニスプレイヤーを繋ぐプラットフォームサービスです。\n- ユーザーは試合作成、参加、クラブ活動などの機能を利用できます。\n- サービス利用時は相互尊重とスポーツマンシップを守ってください。\n\n2. ユーザーの義務\n- 正確な情報を提供する必要があります。\n- 他者の権利を侵害してはなりません。\n- 違法または不適切なコンテンツを投稿してはなりません。\n\n3. AIチャットボットサービス条項\n3.1 AI回答の限界（免責条項）\n- チャットボットが提供するテニス関連情報はAIによって生成されています。\n- AIが提供する情報は不正確または最新でない場合があります。\n- 当社はAIチャットボットが提供する情報の正確性、完全性、信頼性を保証しません。\n- AIチャットボット情報により発生するすべての損害について当社は責任を負いません。\n\n3.2 ユーザー行動規定\n- チャットボットを利用して違法な内容を生成または質問することを禁止します。\n- 侮辱的または差別的な内容を生成または質問することを禁止します。\n- 他者の権利を侵害する内容を生成または質問することを禁止します。\n- 個人情報、機密情報を意図的に共有することを禁止します。\n\n3.3 サービスの変更と中断\n- 当社はいつでもAIチャットボット機能を変更できます。\n- 当社は技術的、運営上の理由でチャットボットサービスを一時的または永久に中断できます。\n- サービスの変更または中断による損害について当社は責任を負いません。\n\n4. サービス提供者の権利\n- サービス品質向上のためのアップデートを行うことができます。\n- 不適切なユーザーに対して制裁措置を取ることができます。',
        },
        privacyPolicy: {
          title: 'プライバシーポリシー',
          content:
            'プライバシーポリシー\n\n1. 収集する個人情報\n- 基本情報：ニックネーム、性別、年齢層\n- テニス情報：LTRレベル、好みのプレイスタイル\n- 位置情報：活動地域、GPS位置（試合検索用）\n- 連絡先情報：メールアドレス\n- AIチャットボット会話情報：ユーザーが入力した質問内容と会話履歴\n\n2. 個人情報の利用目的\n- マッチメイキングサービスの提供\n- パーソナライズされた推奨サービスの提供\n- ユーザー間のコミュニケーション支援\n- サービス改善と統計分析\n- AIチャットボットサービスの提供：ユーザーの質問に対する回答生成\n- チャットボットサービス品質改善とユーザー問い合わせトレンド分析\n\n3. 第三者への情報提供（重要）\n3.1 Google AIサービス連携\n- AIチャットボット回答生成のため、ユーザーの会話内容がGoogle（Alphabet Inc.）に送信されます。\n- GoogleはAIモデル（Gemini）を通じて回答を生成する目的でのみデータを処理します。\n- Googleのプライバシーポリシー：https://policies.google.com/privacy\n- ユーザーはAIチャットボット機能の使用を拒否でき、拒否しても他のサービス利用には制限がありません。\n\n3.2 第三者提供時の保護措置\n- 個人識別情報は最大限削除して送信します。\n- 暗号化された通信を通じて安全に送信されます。\n\n4. データ保存期間\n- 基本個人情報：サービス利用期間中保管\n- AIチャットボット会話ログ：サービス改善目的で最大2年間保管後自動削除\n- 退会時、すべての個人情報は即時削除（ただし、法的義務がある場合は該当期間中保管）\n\n5. 個人情報保護とユーザーの権利\n- 収集された個人情報は暗号化されて安全に保管されます。\n- ユーザーはいつでも個人情報処理の停止を要求できます。\n- 個人情報の閲覧、訂正、削除を要求できます。\n\n⚠️ 6. 個人情報セキュリティ免責条項（重要）\n- ハッキング、マルウェア、システムエラーなどの外部攻撃やプログラムエラーにより個人情報が漏洩した場合、当社はこれに対する法的責任を負いません。\n- ユーザーは本サービス利用時、住民登録番号、金融情報、パスワードなどの機密個人情報をアプリ内に公開または保存しないことを推奨します。\n- プロフィール、投稿、チャットなどに機密情報を入力して発生する被害について当社は責任を負いません。\n- ユーザーは自身のアカウントセキュリティのため、強力なパスワードの使用と定期的な変更を推奨します。',
        },
        locationServices: {
          title: '位置情報サービス規約',
          content:
            '位置情報サービス規約\n\n1. 位置情報の収集と利用\n- 近くの試合検索サービスの提供\n- テニスコート検索サービスの提供\n- 距離ベースの通知サービスの提供\n\n2. 位置情報提供の同意\n- ユーザーはいつでも位置情報の提供を拒否できます。\n- 位置情報の提供を拒否した場合、一部のサービス利用が制限される場合があります。\n\n3. 位置情報の保護\n- 収集された位置情報は暗号化されて安全に保管されます。\n- ユーザーの同意なしに第三者に提供されません。',
        },
        liabilityDisclaimer: {
          title: '免責事項',
          content:
            '⚠️ 重要な法的告知 ⚠️\n\nLightning Tennisアプリは個々のテニスプレイヤーを繋ぐプラットフォームサービスです。\n\n当社は以下の事項について法的責任を負いません：\n\n1. 安全事故の免責\n- テニス試合中に発生する怪我、事故\n- 試合参加者間の個人的な紛争\n- テニスコート施設の安全事故\n\n2. 金銭的紛争の免責\n- 試合費用に関する紛争\n- コート使用料に関する問題\n- ユーザー間の金銭取引紛争\n\n3. ユーザーの責任\n- すべての試合の安全と責任は主催者と参加者にあります。\n- ユーザーは自身の健康状態を確認してから参加する必要があります。\n- 適切な保険への加入を推奨します。\n\n本サービスを利用することにより、上記の免責条項に同意したものとみなされます。',
        },
        marketingCommunications: {
          title: 'マーケティング情報受信同意',
          content:
            'マーケティング情報受信同意（オプション）\n\n1. 受信内容\n- 新機能とサービスアップデート\n- 特別イベントとプロモーションのお知らせ\n- テニス関連の有用な情報とヒント\n- パートナーシップ特典と割引情報\n\n2. 受信方法\n- プッシュ通知\n- メール\n- アプリ内通知\n\n3. 受信拒否\n- いつでも設定で受信を拒否できます。\n- 個別の通知ごとに選択的に受信拒否できます。\n\nこの同意はオプションであり、拒否してもサービス利用には制限がありません。',
        },
        inclusivityPolicy: {
          title: '多様性・包括性ポリシー',
          content:
            '🌈 多様性・包括性ポリシーと免責条項\n\nLightning Tennisはすべてのユーザーに開かれたプラットフォームです。\n\n1. 包括性の原則\n- 性別、性的指向、性自認に関係なく、すべてのユーザーは平等にサービスを利用できます。\n- 性的マイノリティ（LGBTQ+）ユーザーもすべての活動（試合作成、参加、クラブ活動など）に制限なく参加できます。\n- すべてのユーザーは相互尊重の原則を遵守する必要があります。\n\n2. プログラムエラーの免責\n- プログラムエラーにより一部の機能が意図せず制限される場合があります。\n- このようなエラーは意図的な差別ではなく、発見次第修正されます。\n- プログラムエラーによる機能制限に対して法的訴訟を提起しないことに同意します。\n\n3. 差別の禁止\n- 性別、性的指向、性自認を理由とした差別的な言動は禁止されています。\n- 差別行為が発見された場合、サービス利用が制限される場合があります。\n\nこのポリシーに同意することにより、上記の条項を理解し、受け入れることを認めます。',
        },
      },
      accept: '同意する',
      decline: '同意しない',
      lastUpdated: '最終更新',
      readMore: '続きを読む',
      readLess: '閉じる',
    },
  },

  'de.json': {
    terms: {
      title: 'Allgemeine Geschäftsbedingungen',
      description: 'Bitte stimmen Sie den Nutzungsbedingungen zu',
      introSubtitle: 'Diese Bedingungen gewährleisten eine sichere und angenehme Tennis-Community',
      stepProgress: 'Schritt {{current}} von {{total}}',
      agreeAll: 'Allen Bedingungen zustimmen',
      importantNotice: 'Wichtiger Hinweis',
      noticeContent:
        'Lightning Tennis ist eine Plattform, die Tennisspieler verbindet. Die Verantwortung für Sicherheitsvorfälle oder Streitigkeiten während tatsächlicher Spiele liegt bei den Teilnehmern, und wir übernehmen keine rechtliche Haftung für diese Angelegenheiten.',
      requiredTermsTitle: 'Erforderliche Bedingungen',
      requiredTermsMessage:
        'Bitte stimmen Sie allen erforderlichen Bedingungen zu, um fortzufahren.',
      serviceTerms: 'Nutzungsbedingungen',
      privacyPolicy: 'Datenschutzrichtlinie',
      locationServices: 'Standortbasierte Dienste',
      liabilityDisclaimer: 'Haftungsausschluss',
      marketingCommunications: 'Service-Updates & Neuigkeiten',
      inclusivityPolicy: 'Diversitäts- & Inklusionsrichtlinie',
      required: 'Erforderlich',
      optional: 'Optional',
      details: {
        serviceTerms: {
          title: 'Nutzungsbedingungen',
          content:
            'Lightning Tennis Nutzungsbedingungen\n\n⚠️ Wichtiger Hinweis\nLightning Tennis ist eine Plattform, die Tennisspieler verbindet. Die Verantwortung für Sicherheitsvorfälle oder Streitigkeiten während tatsächlicher Spiele liegt bei den Teilnehmern, und wir übernehmen keine rechtliche Haftung für diese Angelegenheiten.\n\n1. Servicenutzung\n- Diese App ist ein Plattformdienst, der Tennisspieler verbindet.\n- Benutzer können Funktionen wie Spielerstellung, Teilnahme und Clubaktivitäten nutzen.\n- Bitte wahren Sie gegenseitigen Respekt und Sportlichkeit bei der Nutzung des Dienstes.\n\n2. Benutzerpflichten\n- Müssen genaue Informationen bereitstellen.\n- Dürfen die Rechte anderer nicht verletzen.\n- Dürfen keine illegalen oder unangemessenen Inhalte veröffentlichen.\n\n3. KI-Chatbot-Servicebedingungen\n3.1 Einschränkungen der KI-Antworten (Haftungsausschluss)\n- Die vom Chatbot bereitgestellten Tennis-Informationen werden von KI generiert.\n- Von KI bereitgestellte Informationen können ungenau oder veraltet sein.\n- Das Unternehmen garantiert nicht die Genauigkeit, Vollständigkeit oder Zuverlässigkeit der KI-Chatbot-Informationen.\n- Das Unternehmen haftet nicht für Schäden, die aus KI-Chatbot-Informationen entstehen.\n\n3.2 Verhaltensregeln für Benutzer\n- Es ist verboten, den Chatbot zu nutzen, um illegale Inhalte zu generieren oder anzufragen.\n- Es ist verboten, beleidigende oder diskriminierende Inhalte zu generieren oder anzufragen.\n- Es ist verboten, Inhalte zu generieren oder anzufragen, die die Rechte anderer verletzen.\n- Es ist verboten, absichtlich persönliche oder sensible Informationen zu teilen.\n\n3.3 Serviceänderungen und -einstellung\n- Das Unternehmen kann die KI-Chatbot-Funktionalität jederzeit ändern.\n- Das Unternehmen kann den Chatbot-Service aus technischen oder betrieblichen Gründen vorübergehend oder dauerhaft einstellen.\n- Das Unternehmen haftet nicht für Schäden durch Serviceänderungen oder -einstellung.\n\n4. Rechte des Dienstanbieters\n- Kann Updates zur Qualitätsverbesserung durchführen.\n- Kann Disziplinarmaßnahmen gegen unangemessene Benutzer ergreifen.',
        },
        privacyPolicy: {
          title: 'Datenschutzrichtlinie',
          content:
            'Datenschutzrichtlinie\n\n1. Persönliche Informationen, die wir sammeln\n- Grundlegende Informationen: Spitzname, Geschlecht, Altersgruppe\n- Tennis-Informationen: LTR-Level, bevorzugter Spielstil\n- Standortinformationen: Aktivitätsbereiche, GPS-Standort (für Spielsuche)\n- Kontaktinformationen: E-Mail-Adresse\n- KI-Chatbot-Gesprächsdaten: Benutzerfragen und Gesprächsprotokolle\n\n2. Zweck der Nutzung persönlicher Informationen\n- Bereitstellung von Matchmaking-Diensten\n- Bereitstellung personalisierter Empfehlungen\n- Unterstützung der Benutzerkommunikation\n- Serviceverbesserung und statistische Analyse\n- KI-Chatbot-Service: Generierung von Antworten auf Benutzerfragen\n- Qualitätsverbesserung des Chatbot-Services und Analyse von Benutzeranfragen\n\n3. Weitergabe von Informationen an Dritte (Wichtig)\n3.1 Google KI-Service-Integration\n- Benutzergesprächsinhalte werden zur Generierung von KI-Chatbot-Antworten an Google (Alphabet Inc.) übermittelt.\n- Google verarbeitet diese Daten ausschließlich zur Generierung von Antworten durch KI-Modelle (Gemini).\n- Google Datenschutzrichtlinie: https://policies.google.com/privacy\n- Benutzer können die Nutzung von KI-Chatbot-Funktionen ablehnen, ohne dass andere Dienste eingeschränkt werden.\n\n3.2 Schutzmaßnahmen bei Drittanbieter-Weitergabe\n- Persönlich identifizierende Informationen werden vor der Übermittlung minimiert.\n- Daten werden sicher über verschlüsselte Kommunikation übertragen.\n\n4. Datenspeicherungsdauer\n- Grundlegende persönliche Informationen: Während der Servicenutzung gespeichert\n- KI-Chatbot-Gesprächsprotokolle: Bis zu 2 Jahre zur Serviceverbesserung gespeichert, dann automatisch gelöscht\n- Alle persönlichen Informationen werden bei Kontolöschung sofort gelöscht (außer bei gesetzlichen Aufbewahrungspflichten)\n\n5. Schutz persönlicher Informationen und Benutzerrechte\n- Gesammelte persönliche Informationen werden verschlüsselt und sicher gespeichert\n- Benutzer können jederzeit die Einstellung der Verarbeitung persönlicher Informationen beantragen\n- Benutzer können Zugang, Korrektur oder Löschung persönlicher Informationen beantragen\n\n⚠️ 6. Haftungsausschluss für die Sicherheit persönlicher Informationen (Wichtig)\n- Bei Verlust persönlicher Informationen durch Hacking, Malware, Systemfehler oder andere externe Angriffe oder Programmfehler übernimmt das Unternehmen keine rechtliche Haftung.\n- Benutzern wird empfohlen, keine sensiblen persönlichen Informationen wie Sozialversicherungsnummern, Finanzinformationen oder Passwörter in der App zu veröffentlichen oder zu speichern.\n- Das Unternehmen haftet nicht für Schäden, die durch Eingabe sensibler Informationen in Profilen, Beiträgen, Chats usw. entstehen.\n- Benutzern wird empfohlen, starke Passwörter zu verwenden und diese regelmäßig zu ändern.',
        },
        locationServices: {
          title: 'Standortbasierte Dienste',
          content:
            'Bedingungen für standortbasierte Dienste\n\n1. Sammlung und Nutzung von Standortinformationen\n- Bereitstellung von Diensten zur Suche nach Spielen in der Nähe\n- Bereitstellung von Tennisplatz-Suchdiensten\n- Bereitstellung von entfernungsbasierten Benachrichtigungsdiensten\n\n2. Zustimmung zur Standortinformation\n- Benutzer können die Bereitstellung von Standortinformationen jederzeit ablehnen\n- Die Ablehnung von Standortinformationen kann einige Servicefunktionen einschränken\n\n3. Schutz von Standortinformationen\n- Gesammelte Standortinformationen werden verschlüsselt und sicher gespeichert\n- Werden nicht ohne Zustimmung des Benutzers an Dritte weitergegeben',
        },
        liabilityDisclaimer: {
          title: 'Haftungsausschluss',
          content:
            '⚠️ WICHTIGER RECHTLICHER HINWEIS ⚠️\n\nDie Lightning Tennis App dient als Plattform zur Verbindung einzelner Tennisspieler.\n\nWIR ÜBERNEHMEN KEINE RECHTLICHE HAFTUNG für:\n\n1. Haftungsausschluss für Sicherheitsvorfälle\n- Verletzungen oder Unfälle während Tennisspielen\n- Persönliche Streitigkeiten zwischen Spielteilnehmern\n- Sicherheitsvorfälle in Tennisplatzeinrichtungen\n\n2. Haftungsausschluss für finanzielle Streitigkeiten\n- Streitigkeiten im Zusammenhang mit Spielkosten\n- Probleme im Zusammenhang mit Platzmieten\n- Finanzielle Transaktionen zwischen Benutzern\n\n3. Benutzerverantwortung\n- Alle Sicherheits- und Verantwortlichkeiten für Spiele liegen bei Gastgebern und Teilnehmern\n- Benutzer müssen ihren Gesundheitszustand vor der Teilnahme überprüfen\n- Ein angemessener Versicherungsschutz wird empfohlen\n\nDurch die Nutzung dieses Dienstes stimmen Sie diesen Haftungsausschlussbestimmungen zu.',
        },
        marketingCommunications: {
          title: 'Einwilligung zu Marketingkommunikation',
          content:
            'Einwilligung zu Marketingkommunikation (Optional)\n\n1. Inhalt\n- Neue Funktionen und Service-Updates\n- Ankündigungen zu besonderen Veranstaltungen und Aktionen\n- Nützliche Tennis-bezogene Informationen und Tipps\n- Partnerschaftsvorteile und Rabattinformationen\n\n2. Übermittlungsmethoden\n- Push-Benachrichtigungen\n- E-Mail\n- In-App-Benachrichtigungen\n\n3. Abmeldung\n- Sie können sich jederzeit in den Einstellungen abmelden\n- Selektive Abmeldung für einzelne Benachrichtigungen möglich\n\nDiese Einwilligung ist optional und eine Ablehnung schränkt Ihre Servicenutzung nicht ein.',
        },
        inclusivityPolicy: {
          title: 'Diversitäts- & Inklusionsrichtlinie',
          content:
            '🌈 Diversitäts- & Inklusionsrichtlinie und Haftungsausschluss\n\nLightning Tennis ist eine Plattform, die allen Benutzern offen steht.\n\n1. Inklusionsprinzipien\n- Alle Benutzer haben unabhängig von Geschlecht, sexueller Orientierung oder Geschlechtsidentität gleichen Zugang zu unseren Diensten.\n- LGBTQ+ Benutzer können ohne Einschränkungen an allen Aktivitäten (Spielerstellung, Teilnahme, Clubaktivitäten usw.) teilnehmen.\n- Alle Benutzer müssen die Prinzipien des gegenseitigen Respekts einhalten.\n\n2. Haftungsausschluss für Programmfehler\n- Programmfehler können gelegentlich unbeabsichtigte Einschränkungen einiger Funktionen verursachen.\n- Solche Fehler sind keine absichtliche Diskriminierung und werden bei Entdeckung korrigiert.\n- Sie stimmen zu, keine rechtlichen Klagen wegen durch Programmfehler verursachter Funktionseinschränkungen einzureichen.\n\n3. Antidiskriminierung\n- Diskriminierende Äußerungen oder Verhaltensweisen aufgrund von Geschlecht, sexueller Orientierung oder Geschlechtsidentität sind verboten.\n- Diskriminierendes Verhalten kann zu Servicebeschränkungen führen.\n\nMit der Zustimmung zu dieser Richtlinie bestätigen Sie das Verständnis und die Akzeptanz dieser Bedingungen.',
        },
      },
      accept: 'Zustimmen',
      decline: 'Ablehnen',
      lastUpdated: 'Zuletzt aktualisiert',
      readMore: 'Mehr lesen',
      readLess: 'Weniger anzeigen',
    },
  },

  'fr.json': {
    terms: {
      title: "Conditions d'utilisation",
      description: "Veuillez accepter les conditions d'utilisation du service",
      introSubtitle: 'Ces conditions garantissent une communauté de tennis sûre et agréable',
      stepProgress: 'Étape {{current}} sur {{total}}',
      agreeAll: 'Accepter toutes les conditions',
      importantNotice: 'Avis important',
      noticeContent:
        "Lightning Tennis est une plateforme qui connecte les joueurs de tennis. La responsabilité des incidents de sécurité ou des litiges lors des matchs réels incombe aux participants, et nous n'assumons aucune responsabilité légale pour ces questions.",
      requiredTermsTitle: 'Conditions requises',
      requiredTermsMessage: 'Veuillez accepter toutes les conditions requises pour continuer.',
      serviceTerms: "Conditions d'utilisation",
      privacyPolicy: 'Politique de confidentialité',
      locationServices: 'Conditions des services de localisation',
      liabilityDisclaimer: 'Clause de non-responsabilité',
      marketingCommunications: 'Mises à jour et actualités du service',
      inclusivityPolicy: "Politique de diversité et d'inclusion",
      required: 'Requis',
      optional: 'Optionnel',
      details: {
        serviceTerms: {
          title: "Conditions d'utilisation",
          content:
            "Conditions d'utilisation de Lightning Tennis\n\n⚠️ Avis important\nLightning Tennis est une plateforme qui connecte les joueurs de tennis. La responsabilité des incidents de sécurité ou des litiges lors des matchs réels incombe aux participants, et nous n'assumons aucune responsabilité légale pour ces questions.\n\n1. Utilisation du service\n- Cette application est un service de plateforme connectant les joueurs de tennis.\n- Les utilisateurs peuvent utiliser des fonctionnalités telles que la création de matchs, la participation et les activités de club.\n- Veuillez maintenir le respect mutuel et l'esprit sportif lors de l'utilisation du service.\n\n2. Obligations des utilisateurs\n- Doivent fournir des informations exactes.\n- Ne doivent pas porter atteinte aux droits d'autrui.\n- Ne doivent pas publier de contenu illégal ou inapproprié.\n\n3. Conditions du service de chatbot IA\n3.1 Limitations des réponses IA (Avertissement)\n- Les informations liées au tennis fournies par le chatbot sont générées par l'IA.\n- Les informations fournies par l'IA peuvent être inexactes ou obsolètes.\n- L'entreprise ne garantit pas l'exactitude, l'exhaustivité ou la fiabilité des informations du chatbot IA.\n- L'entreprise n'est pas responsable des dommages résultant des informations du chatbot IA.\n\n3.2 Règles de conduite des utilisateurs\n- Il est interdit d'utiliser le chatbot pour générer ou demander du contenu illégal.\n- Il est interdit de générer ou demander du contenu offensant ou discriminatoire.\n- Il est interdit de générer ou demander du contenu qui porte atteinte aux droits d'autrui.\n- Il est interdit de partager intentionnellement des informations personnelles ou sensibles.\n\n3.3 Modifications et interruption du service\n- L'entreprise peut modifier la fonctionnalité du chatbot IA à tout moment.\n- L'entreprise peut temporairement ou définitivement interrompre le service de chatbot pour des raisons techniques ou opérationnelles.\n- L'entreprise n'est pas responsable des dommages résultant des modifications ou de l'interruption du service.\n\n4. Droits du fournisseur de services\n- Peut effectuer des mises à jour pour améliorer la qualité.\n- Peut prendre des mesures disciplinaires contre les utilisateurs inappropriés.",
        },
        privacyPolicy: {
          title: 'Politique de confidentialité',
          content:
            "Politique de confidentialité\n\n1. Informations personnelles que nous collectons\n- Informations de base : Pseudonyme, genre, tranche d'âge\n- Informations tennis : Niveau LTR, style de jeu préféré\n- Informations de localisation : Zones d'activité, position GPS (pour la recherche de matchs)\n- Coordonnées : Adresse e-mail\n- Données de conversation du chatbot IA : Questions des utilisateurs et journaux de conversation\n\n2. Objectif de l'utilisation des informations personnelles\n- Fourniture de services de mise en relation\n- Fourniture de recommandations personnalisées\n- Support de communication entre utilisateurs\n- Amélioration du service et analyse statistique\n- Service de chatbot IA : Génération de réponses aux questions des utilisateurs\n- Amélioration de la qualité du service chatbot et analyse des tendances des demandes utilisateurs\n\n3. Partage d'informations avec des tiers (Important)\n3.1 Intégration du service Google IA\n- Le contenu des conversations des utilisateurs est transmis à Google (Alphabet Inc.) pour la génération des réponses du chatbot IA.\n- Google traite ces données uniquement pour générer des réponses via des modèles IA (Gemini).\n- Politique de confidentialité de Google : https://policies.google.com/privacy\n- Les utilisateurs peuvent refuser d'utiliser les fonctionnalités du chatbot IA sans limiter l'utilisation des autres services.\n\n3.2 Protections lors du partage avec des tiers\n- Les informations personnellement identifiables sont minimisées avant la transmission.\n- Les données sont transmises de manière sécurisée via une communication chiffrée.\n\n4. Durée de conservation des données\n- Informations personnelles de base : Conservées pendant la période d'utilisation du service\n- Journaux de conversation du chatbot IA : Conservés jusqu'à 2 ans pour l'amélioration du service, puis automatiquement supprimés\n- Toutes les informations personnelles sont immédiatement supprimées lors de la suppression du compte (sauf obligations légales de conservation)\n\n5. Protection des informations personnelles et droits des utilisateurs\n- Les informations personnelles collectées sont chiffrées et stockées de manière sécurisée\n- Les utilisateurs peuvent demander à tout moment l'arrêt du traitement de leurs informations personnelles\n- Les utilisateurs peuvent demander l'accès, la correction ou la suppression de leurs informations personnelles\n\n⚠️ 6. Avertissement sur la sécurité des informations personnelles (Important)\n- En cas de fuite d'informations personnelles due au piratage, aux logiciels malveillants, aux erreurs système ou autres attaques externes ou erreurs de programme, l'entreprise n'assume aucune responsabilité légale.\n- Il est conseillé aux utilisateurs de NE PAS exposer ou stocker des informations personnelles sensibles telles que les numéros de sécurité sociale, les informations financières ou les mots de passe dans l'application.\n- L'entreprise n'est pas responsable des dommages résultant de la saisie d'informations sensibles dans les profils, publications, chats, etc.\n- Les utilisateurs sont encouragés à utiliser des mots de passe forts et à les changer périodiquement pour la sécurité de leur compte.",
        },
        locationServices: {
          title: 'Conditions des services de localisation',
          content:
            "Conditions des services de localisation\n\n1. Collecte et utilisation des informations de localisation\n- Fourniture de services de recherche de matchs à proximité\n- Fourniture de services de recherche de courts de tennis\n- Fourniture de services de notification basés sur la distance\n\n2. Consentement aux informations de localisation\n- Les utilisateurs peuvent refuser la fourniture d'informations de localisation à tout moment\n- Le refus des informations de localisation peut limiter certaines fonctionnalités du service\n\n3. Protection des informations de localisation\n- Les informations de localisation collectées sont chiffrées et stockées de manière sécurisée\n- Ne sont pas fournies à des tiers sans le consentement de l'utilisateur",
        },
        liabilityDisclaimer: {
          title: 'Clause de non-responsabilité',
          content:
            "⚠️ AVIS JURIDIQUE IMPORTANT ⚠️\n\nL'application Lightning Tennis sert de plateforme pour connecter les joueurs de tennis individuels.\n\nNOUS N'ASSUMONS AUCUNE RESPONSABILITÉ LÉGALE pour :\n\n1. Avertissement sur les incidents de sécurité\n- Blessures ou accidents pendant les matchs de tennis\n- Litiges personnels entre les participants au match\n- Incidents de sécurité dans les installations de courts de tennis\n\n2. Avertissement sur les litiges financiers\n- Litiges liés aux coûts des matchs\n- Problèmes liés aux frais de location de courts\n- Transactions financières entre utilisateurs\n\n3. Responsabilité de l'utilisateur\n- Toute la sécurité et la responsabilité des matchs incombent aux hôtes et aux participants\n- Les utilisateurs doivent vérifier leur état de santé avant de participer\n- Une couverture d'assurance appropriée est recommandée\n\nEn utilisant ce service, vous acceptez ces conditions de non-responsabilité.",
        },
        marketingCommunications: {
          title: 'Consentement aux communications marketing',
          content:
            "Consentement aux communications marketing (Optionnel)\n\n1. Contenu\n- Nouvelles fonctionnalités et mises à jour du service\n- Annonces d'événements spéciaux et de promotions\n- Informations et conseils utiles liés au tennis\n- Avantages de partenariat et informations sur les réductions\n\n2. Méthodes de livraison\n- Notifications push\n- E-mail\n- Notifications dans l'application\n\n3. Désinscription\n- Vous pouvez vous désinscrire à tout moment dans les paramètres\n- Désinscription sélective disponible pour les notifications individuelles\n\nCe consentement est optionnel et le refuser ne limitera pas votre utilisation du service.",
        },
        inclusivityPolicy: {
          title: "Politique de diversité et d'inclusion",
          content:
            "🌈 Politique de diversité et d'inclusion et avertissement\n\nLightning Tennis est une plateforme ouverte à tous les utilisateurs.\n\n1. Principes d'inclusivité\n- Tous les utilisateurs ont un accès égal à nos services, indépendamment de leur genre, orientation sexuelle ou identité de genre.\n- Les utilisateurs LGBTQ+ peuvent participer à toutes les activités (création de matchs, participation, activités de club, etc.) sans restrictions.\n- Tous les utilisateurs doivent adhérer aux principes de respect mutuel.\n\n2. Avertissement sur les erreurs de programme\n- Des erreurs de programme peuvent occasionnellement causer des restrictions involontaires sur certaines fonctionnalités.\n- De telles erreurs ne constituent pas une discrimination intentionnelle et seront corrigées dès leur découverte.\n- Vous acceptez de ne pas intenter de poursuites judiciaires pour des restrictions de fonctionnalités causées par des erreurs de programme.\n\n3. Anti-discrimination\n- Les discours ou comportements discriminatoires basés sur le genre, l'orientation sexuelle ou l'identité de genre sont interdits.\n- Un comportement discriminatoire peut entraîner des restrictions de service.\n\nEn acceptant cette politique, vous reconnaissez comprendre et accepter ces conditions.",
        },
      },
      accept: 'Accepter',
      decline: 'Refuser',
      lastUpdated: 'Dernière mise à jour',
      readMore: 'Lire plus',
      readLess: 'Réduire',
    },
  },

  'es.json': {
    terms: {
      title: 'Términos y condiciones',
      description: 'Por favor, acepte los términos para usar el servicio',
      introSubtitle: 'Estos términos garantizan una comunidad de tenis segura y agradable',
      stepProgress: 'Paso {{current}} de {{total}}',
      agreeAll: 'Aceptar todos los términos',
      importantNotice: 'Aviso importante',
      noticeContent:
        'Lightning Tennis es una plataforma que conecta jugadores de tenis. La responsabilidad por incidentes de seguridad o disputas durante partidos reales recae en los participantes, y no asumimos responsabilidad legal por estos asuntos.',
      requiredTermsTitle: 'Términos requeridos',
      requiredTermsMessage: 'Por favor, acepte todos los términos requeridos para continuar.',
      serviceTerms: 'Términos de servicio',
      privacyPolicy: 'Política de privacidad',
      locationServices: 'Términos de servicios de ubicación',
      liabilityDisclaimer: 'Exención de responsabilidad',
      marketingCommunications: 'Actualizaciones y noticias del servicio',
      inclusivityPolicy: 'Política de diversidad e inclusión',
      required: 'Requerido',
      optional: 'Opcional',
      details: {
        serviceTerms: {
          title: 'Términos de servicio',
          content:
            'Términos de servicio de Lightning Tennis\n\n⚠️ Aviso importante\nLightning Tennis es una plataforma que conecta jugadores de tenis. La responsabilidad por incidentes de seguridad o disputas durante partidos reales recae en los participantes, y no asumimos responsabilidad legal por estos asuntos.\n\n1. Uso del servicio\n- Esta aplicación es un servicio de plataforma que conecta jugadores de tenis.\n- Los usuarios pueden utilizar funciones como creación de partidos, participación y actividades de club.\n- Por favor, mantenga el respeto mutuo y el espíritu deportivo al usar el servicio.\n\n2. Obligaciones del usuario\n- Debe proporcionar información precisa.\n- No debe infringir los derechos de otros.\n- No debe publicar contenido ilegal o inapropiado.\n\n3. Términos del servicio de chatbot de IA\n3.1 Limitaciones de respuestas de IA (Descargo de responsabilidad)\n- La información relacionada con el tenis proporcionada por el chatbot es generada por IA.\n- La información proporcionada por IA puede ser inexacta o desactualizada.\n- La empresa no garantiza la precisión, integridad o confiabilidad de la información del chatbot de IA.\n- La empresa no es responsable de ningún daño derivado de la información del chatbot de IA.\n\n3.2 Reglas de conducta del usuario\n- Está prohibido usar el chatbot para generar o solicitar contenido ilegal.\n- Está prohibido generar o solicitar contenido ofensivo o discriminatorio.\n- Está prohibido generar o solicitar contenido que infrinja los derechos de otros.\n- Está prohibido compartir intencionalmente información personal o sensible.\n\n3.3 Cambios y discontinuación del servicio\n- La empresa puede cambiar la funcionalidad del chatbot de IA en cualquier momento.\n- La empresa puede suspender temporal o permanentemente el servicio de chatbot por razones técnicas u operativas.\n- La empresa no es responsable de daños por cambios o discontinuación del servicio.\n\n4. Derechos del proveedor de servicios\n- Puede realizar actualizaciones para mejorar la calidad.\n- Puede tomar medidas disciplinarias contra usuarios inapropiados.',
        },
        privacyPolicy: {
          title: 'Política de privacidad',
          content:
            'Política de privacidad\n\n1. Información personal que recopilamos\n- Información básica: Apodo, género, rango de edad\n- Información de tenis: Nivel LTR, estilo de juego preferido\n- Información de ubicación: Áreas de actividad, ubicación GPS (para búsqueda de partidos)\n- Información de contacto: Dirección de correo electrónico\n- Datos de conversación del chatbot de IA: Preguntas de usuarios y registros de conversación\n\n2. Propósito del uso de información personal\n- Proporcionar servicios de emparejamiento\n- Proporcionar recomendaciones personalizadas\n- Apoyar la comunicación entre usuarios\n- Mejora del servicio y análisis estadístico\n- Servicio de chatbot de IA: Generar respuestas a preguntas de usuarios\n- Mejora de calidad del servicio de chatbot y análisis de tendencias de consultas de usuarios\n\n3. Compartir información con terceros (Importante)\n3.1 Integración del servicio de IA de Google\n- El contenido de la conversación del usuario se transmite a Google (Alphabet Inc.) para la generación de respuestas del chatbot de IA.\n- Google procesa estos datos únicamente para generar respuestas a través de modelos de IA (Gemini).\n- Política de privacidad de Google: https://policies.google.com/privacy\n- Los usuarios pueden optar por no usar las funciones del chatbot de IA sin limitar el uso de otros servicios.\n\n3.2 Protecciones al compartir con terceros\n- La información de identificación personal se minimiza antes de la transmisión.\n- Los datos se transmiten de forma segura a través de comunicación encriptada.\n\n4. Período de almacenamiento de datos\n- Información personal básica: Almacenada durante el período de uso del servicio\n- Registros de conversación del chatbot de IA: Almacenados hasta 2 años para mejora del servicio, luego eliminados automáticamente\n- Toda la información personal se elimina inmediatamente al eliminar la cuenta (excepto requisitos legales de retención)\n\n5. Protección de información personal y derechos del usuario\n- La información personal recopilada se encripta y almacena de forma segura\n- Los usuarios pueden solicitar el cese del procesamiento de información personal en cualquier momento\n- Los usuarios pueden solicitar acceso, corrección o eliminación de información personal\n\n⚠️ 6. Descargo de responsabilidad de seguridad de información personal (Importante)\n- En caso de fuga de información personal debido a hackeo, malware, errores del sistema u otros ataques externos o errores de programa, la empresa no es legalmente responsable.\n- Se aconseja a los usuarios NO exponer ni almacenar información personal sensible como números de seguro social, información financiera o contraseñas dentro de la aplicación.\n- La empresa no es responsable de daños derivados de ingresar información sensible en perfiles, publicaciones, chats, etc.\n- Se alienta a los usuarios a usar contraseñas seguras y cambiarlas periódicamente para la seguridad de su cuenta.',
        },
        locationServices: {
          title: 'Términos de servicios de ubicación',
          content:
            'Términos de servicios basados en ubicación\n\n1. Recopilación y uso de información de ubicación\n- Proporcionar servicios de búsqueda de partidos cercanos\n- Proporcionar servicios de búsqueda de canchas de tenis\n- Proporcionar servicios de notificación basados en distancia\n\n2. Consentimiento de información de ubicación\n- Los usuarios pueden rechazar la provisión de información de ubicación en cualquier momento\n- Rechazar la información de ubicación puede limitar algunas funciones del servicio\n\n3. Protección de información de ubicación\n- La información de ubicación recopilada se encripta y almacena de forma segura\n- No se proporciona a terceros sin el consentimiento del usuario',
        },
        liabilityDisclaimer: {
          title: 'Exención de responsabilidad',
          content:
            '⚠️ AVISO LEGAL IMPORTANTE ⚠️\n\nLa aplicación Lightning Tennis sirve como plataforma para conectar jugadores de tenis individuales.\n\nNO ASUMIMOS NINGUNA RESPONSABILIDAD LEGAL por:\n\n1. Exención de responsabilidad por incidentes de seguridad\n- Lesiones o accidentes durante partidos de tenis\n- Disputas personales entre participantes del partido\n- Incidentes de seguridad en instalaciones de canchas de tenis\n\n2. Exención de responsabilidad por disputas financieras\n- Disputas relacionadas con costos de partidos\n- Problemas relacionados con tarifas de alquiler de canchas\n- Transacciones financieras entre usuarios\n\n3. Responsabilidad del usuario\n- Toda la seguridad y responsabilidad de los partidos recae en los anfitriones y participantes\n- Los usuarios deben verificar su estado de salud antes de participar\n- Se recomienda una cobertura de seguro adecuada\n\nAl usar este servicio, acepta estos términos de exención de responsabilidad.',
        },
        marketingCommunications: {
          title: 'Consentimiento de comunicaciones de marketing',
          content:
            'Consentimiento de comunicaciones de marketing (Opcional)\n\n1. Contenido\n- Nuevas funciones y actualizaciones del servicio\n- Anuncios de eventos especiales y promociones\n- Información útil relacionada con el tenis y consejos\n- Beneficios de asociación e información de descuentos\n\n2. Métodos de entrega\n- Notificaciones push\n- Correo electrónico\n- Notificaciones en la aplicación\n\n3. Cancelación de suscripción\n- Puede cancelar su suscripción en cualquier momento en configuración\n- Cancelación selectiva disponible para notificaciones individuales\n\nEste consentimiento es opcional y rechazarlo no limitará su uso del servicio.',
        },
        inclusivityPolicy: {
          title: 'Política de diversidad e inclusión',
          content:
            '🌈 Política de diversidad e inclusión y descargo de responsabilidad\n\nLightning Tennis es una plataforma abierta a todos los usuarios.\n\n1. Principios de inclusividad\n- Todos los usuarios tienen igual acceso a nuestros servicios independientemente de su género, orientación sexual o identidad de género.\n- Los usuarios LGBTQ+ pueden participar en todas las actividades (creación de partidos, participación, actividades de club, etc.) sin restricciones.\n- Todos los usuarios deben adherirse a los principios de respeto mutuo.\n\n2. Descargo de responsabilidad por errores de programa\n- Los errores de programa pueden ocasionalmente causar restricciones no intencionadas en algunas funciones.\n- Tales errores no son discriminación intencional y se corregirán al descubrirse.\n- Acepta no presentar demandas legales por restricciones de funciones causadas por errores de programa.\n\n3. Anti-discriminación\n- El discurso o comportamiento discriminatorio basado en género, orientación sexual o identidad de género está prohibido.\n- El comportamiento discriminatorio puede resultar en restricciones del servicio.\n\nAl aceptar esta política, reconoce que comprende y acepta estos términos.',
        },
      },
      accept: 'Aceptar',
      decline: 'Rechazar',
      lastUpdated: 'Última actualización',
      readMore: 'Leer más',
      readLess: 'Mostrar menos',
    },
  },

  'it.json': {
    terms: {
      title: 'Termini e condizioni',
      description: "Si prega di accettare i termini per l'utilizzo del servizio",
      introSubtitle: 'Questi termini garantiscono una comunità tennistica sicura e piacevole',
      stepProgress: 'Passaggio {{current}} di {{total}}',
      agreeAll: 'Accetta tutti i termini',
      importantNotice: 'Avviso importante',
      noticeContent:
        'Lightning Tennis è una piattaforma che connette giocatori di tennis. La responsabilità per incidenti di sicurezza o controversie durante le partite reali spetta ai partecipanti, e non assumiamo responsabilità legale per queste questioni.',
      requiredTermsTitle: 'Termini richiesti',
      requiredTermsMessage: 'Si prega di accettare tutti i termini richiesti per continuare.',
      serviceTerms: 'Termini di servizio',
      privacyPolicy: 'Informativa sulla privacy',
      locationServices: 'Termini dei servizi di localizzazione',
      liabilityDisclaimer: 'Esclusione di responsabilità',
      marketingCommunications: 'Aggiornamenti e novità del servizio',
      inclusivityPolicy: 'Politica di diversità e inclusione',
      required: 'Richiesto',
      optional: 'Opzionale',
      details: {
        serviceTerms: {
          title: 'Termini di servizio',
          content:
            "Termini di servizio di Lightning Tennis\n\n⚠️ Avviso importante\nLightning Tennis è una piattaforma che connette giocatori di tennis. La responsabilità per incidenti di sicurezza o controversie durante le partite reali spetta ai partecipanti, e non assumiamo responsabilità legale per queste questioni.\n\n1. Utilizzo del servizio\n- Questa app è un servizio di piattaforma che connette giocatori di tennis.\n- Gli utenti possono utilizzare funzionalità come creazione di partite, partecipazione e attività di club.\n- Si prega di mantenere rispetto reciproco e sportività durante l'utilizzo del servizio.\n\n2. Obblighi dell'utente\n- Deve fornire informazioni accurate.\n- Non deve violare i diritti altrui.\n- Non deve pubblicare contenuti illegali o inappropriati.\n\n3. Termini del servizio chatbot AI\n3.1 Limitazioni delle risposte AI (Avvertenza)\n- Le informazioni relative al tennis fornite dal chatbot sono generate dall'AI.\n- Le informazioni fornite dall'AI potrebbero essere imprecise o obsolete.\n- L'azienda non garantisce l'accuratezza, completezza o affidabilità delle informazioni del chatbot AI.\n- L'azienda non è responsabile per eventuali danni derivanti dalle informazioni del chatbot AI.\n\n3.2 Regole di condotta dell'utente\n- È vietato utilizzare il chatbot per generare o richiedere contenuti illegali.\n- È vietato generare o richiedere contenuti offensivi o discriminatori.\n- È vietato generare o richiedere contenuti che violano i diritti altrui.\n- È vietato condividere intenzionalmente informazioni personali o sensibili.\n\n3.3 Modifiche e interruzione del servizio\n- L'azienda può modificare la funzionalità del chatbot AI in qualsiasi momento.\n- L'azienda può sospendere temporaneamente o permanentemente il servizio chatbot per motivi tecnici o operativi.\n- L'azienda non è responsabile per danni derivanti da modifiche o interruzione del servizio.\n\n4. Diritti del fornitore di servizi\n- Può effettuare aggiornamenti per migliorare la qualità.\n- Può adottare misure disciplinari contro utenti inappropriati.",
        },
        privacyPolicy: {
          title: 'Informativa sulla privacy',
          content:
            "Informativa sulla privacy\n\n1. Informazioni personali che raccogliamo\n- Informazioni di base: Nickname, genere, fascia d'età\n- Informazioni tennis: Livello LTR, stile di gioco preferito\n- Informazioni sulla posizione: Aree di attività, posizione GPS (per la ricerca di partite)\n- Informazioni di contatto: Indirizzo email\n- Dati di conversazione del chatbot AI: Domande degli utenti e registri delle conversazioni\n\n2. Scopo dell'utilizzo delle informazioni personali\n- Fornire servizi di abbinamento\n- Fornire raccomandazioni personalizzate\n- Supportare la comunicazione tra utenti\n- Miglioramento del servizio e analisi statistica\n- Servizio chatbot AI: Generare risposte alle domande degli utenti\n- Miglioramento della qualità del servizio chatbot e analisi delle tendenze delle richieste degli utenti\n\n3. Condivisione di informazioni con terze parti (Importante)\n3.1 Integrazione del servizio Google AI\n- Il contenuto delle conversazioni degli utenti viene trasmesso a Google (Alphabet Inc.) per la generazione delle risposte del chatbot AI.\n- Google elabora questi dati esclusivamente per generare risposte attraverso modelli AI (Gemini).\n- Informativa sulla privacy di Google: https://policies.google.com/privacy\n- Gli utenti possono rinunciare all'utilizzo delle funzionalità del chatbot AI senza limitare l'utilizzo di altri servizi.\n\n3.2 Protezioni nella condivisione con terze parti\n- Le informazioni di identificazione personale vengono minimizzate prima della trasmissione.\n- I dati vengono trasmessi in modo sicuro attraverso comunicazione crittografata.\n\n4. Periodo di conservazione dei dati\n- Informazioni personali di base: Conservate durante il periodo di utilizzo del servizio\n- Registri delle conversazioni del chatbot AI: Conservati fino a 2 anni per il miglioramento del servizio, poi eliminati automaticamente\n- Tutte le informazioni personali vengono eliminate immediatamente alla cancellazione dell'account (eccetto requisiti legali di conservazione)\n\n5. Protezione delle informazioni personali e diritti dell'utente\n- Le informazioni personali raccolte sono crittografate e conservate in modo sicuro\n- Gli utenti possono richiedere in qualsiasi momento la cessazione del trattamento delle informazioni personali\n- Gli utenti possono richiedere accesso, correzione o eliminazione delle informazioni personali\n\n⚠️ 6. Avvertenza sulla sicurezza delle informazioni personali (Importante)\n- In caso di fuga di informazioni personali dovuta a hacking, malware, errori di sistema o altri attacchi esterni o errori di programma, l'azienda non è legalmente responsabile.\n- Si consiglia agli utenti di NON esporre o memorizzare informazioni personali sensibili come numeri di previdenza sociale, informazioni finanziarie o password all'interno dell'app.\n- L'azienda non è responsabile per danni derivanti dall'inserimento di informazioni sensibili in profili, post, chat, ecc.\n- Si incoraggiano gli utenti a utilizzare password forti e a cambiarle periodicamente per la sicurezza del proprio account.",
        },
        locationServices: {
          title: 'Termini dei servizi di localizzazione',
          content:
            "Termini dei servizi basati sulla posizione\n\n1. Raccolta e utilizzo delle informazioni sulla posizione\n- Fornire servizi di ricerca di partite nelle vicinanze\n- Fornire servizi di ricerca di campi da tennis\n- Fornire servizi di notifica basati sulla distanza\n\n2. Consenso alle informazioni sulla posizione\n- Gli utenti possono rifiutare di fornire informazioni sulla posizione in qualsiasi momento\n- Il rifiuto delle informazioni sulla posizione può limitare alcune funzionalità del servizio\n\n3. Protezione delle informazioni sulla posizione\n- Le informazioni sulla posizione raccolte sono crittografate e conservate in modo sicuro\n- Non vengono fornite a terze parti senza il consenso dell'utente",
        },
        liabilityDisclaimer: {
          title: 'Esclusione di responsabilità',
          content:
            "⚠️ AVVISO LEGALE IMPORTANTE ⚠️\n\nL'app Lightning Tennis funge da piattaforma per connettere singoli giocatori di tennis.\n\nNON ASSUMIAMO ALCUNA RESPONSABILITÀ LEGALE per:\n\n1. Esclusione di responsabilità per incidenti di sicurezza\n- Infortuni o incidenti durante le partite di tennis\n- Controversie personali tra i partecipanti alla partita\n- Incidenti di sicurezza nelle strutture dei campi da tennis\n\n2. Esclusione di responsabilità per controversie finanziarie\n- Controversie relative ai costi delle partite\n- Problemi relativi alle tariffe di noleggio dei campi\n- Transazioni finanziarie tra utenti\n\n3. Responsabilità dell'utente\n- Tutta la sicurezza e la responsabilità per le partite spetta agli organizzatori e ai partecipanti\n- Gli utenti devono verificare il proprio stato di salute prima di partecipare\n- Si raccomanda una copertura assicurativa adeguata\n\nUtilizzando questo servizio, accetti questi termini di esclusione di responsabilità.",
        },
        marketingCommunications: {
          title: 'Consenso alle comunicazioni di marketing',
          content:
            "Consenso alle comunicazioni di marketing (Opzionale)\n\n1. Contenuto\n- Nuove funzionalità e aggiornamenti del servizio\n- Annunci di eventi speciali e promozioni\n- Informazioni utili relative al tennis e suggerimenti\n- Vantaggi delle partnership e informazioni sugli sconti\n\n2. Metodi di consegna\n- Notifiche push\n- Email\n- Notifiche in-app\n\n3. Cancellazione\n- Puoi cancellarti in qualsiasi momento nelle impostazioni\n- Cancellazione selettiva disponibile per notifiche individuali\n\nQuesto consenso è opzionale e il rifiuto non limiterà l'utilizzo del servizio.",
        },
        inclusivityPolicy: {
          title: 'Politica di diversità e inclusione',
          content:
            '🌈 Politica di diversità e inclusione e avvertenza\n\nLightning Tennis è una piattaforma aperta a tutti gli utenti.\n\n1. Principi di inclusività\n- Tutti gli utenti hanno uguale accesso ai nostri servizi indipendentemente da genere, orientamento sessuale o identità di genere.\n- Gli utenti LGBTQ+ possono partecipare a tutte le attività (creazione di partite, partecipazione, attività di club, ecc.) senza restrizioni.\n- Tutti gli utenti devono aderire ai principi di rispetto reciproco.\n\n2. Avvertenza sugli errori di programma\n- Gli errori di programma possono occasionalmente causare restrizioni non intenzionali su alcune funzionalità.\n- Tali errori non sono discriminazione intenzionale e saranno corretti al momento della scoperta.\n- Accetti di non intentare azioni legali per restrizioni di funzionalità causate da errori di programma.\n\n3. Anti-discriminazione\n- Discorsi o comportamenti discriminatori basati su genere, orientamento sessuale o identità di genere sono vietati.\n- Il comportamento discriminatorio può comportare restrizioni del servizio.\n\nAccettando questa politica, riconosci di aver compreso e accettato questi termini.',
        },
      },
      accept: 'Accetta',
      decline: 'Rifiuta',
      lastUpdated: 'Ultimo aggiornamento',
      readMore: 'Leggi di più',
      readLess: 'Mostra meno',
    },
  },

  'pt.json': {
    terms: {
      title: 'Termos e condições',
      description: 'Por favor, aceite os termos para usar o serviço',
      introSubtitle: 'Estes termos garantem uma comunidade de tênis segura e agradável',
      stepProgress: 'Passo {{current}} de {{total}}',
      agreeAll: 'Aceitar todos os termos',
      importantNotice: 'Aviso importante',
      noticeContent:
        'Lightning Tennis é uma plataforma que conecta jogadores de tênis. A responsabilidade por incidentes de segurança ou disputas durante partidas reais é dos participantes, e não assumimos responsabilidade legal por esses assuntos.',
      requiredTermsTitle: 'Termos obrigatórios',
      requiredTermsMessage: 'Por favor, aceite todos os termos obrigatórios para continuar.',
      serviceTerms: 'Termos de serviço',
      privacyPolicy: 'Política de privacidade',
      locationServices: 'Termos de serviços de localização',
      liabilityDisclaimer: 'Isenção de responsabilidade',
      marketingCommunications: 'Atualizações e notícias do serviço',
      inclusivityPolicy: 'Política de diversidade e inclusão',
      required: 'Obrigatório',
      optional: 'Opcional',
      details: {
        serviceTerms: {
          title: 'Termos de serviço',
          content:
            'Termos de serviço do Lightning Tennis\n\n⚠️ Aviso importante\nLightning Tennis é uma plataforma que conecta jogadores de tênis. A responsabilidade por incidentes de segurança ou disputas durante partidas reais é dos participantes, e não assumimos responsabilidade legal por esses assuntos.\n\n1. Uso do serviço\n- Este aplicativo é um serviço de plataforma que conecta jogadores de tênis.\n- Os usuários podem utilizar recursos como criação de partidas, participação e atividades de clube.\n- Por favor, mantenha respeito mútuo e espírito esportivo ao usar o serviço.\n\n2. Obrigações do usuário\n- Deve fornecer informações precisas.\n- Não deve violar os direitos de outros.\n- Não deve publicar conteúdo ilegal ou inadequado.\n\n3. Termos do serviço de chatbot de IA\n3.1 Limitações das respostas de IA (Aviso)\n- As informações relacionadas ao tênis fornecidas pelo chatbot são geradas por IA.\n- As informações fornecidas pela IA podem ser imprecisas ou desatualizadas.\n- A empresa não garante a precisão, completude ou confiabilidade das informações do chatbot de IA.\n- A empresa não é responsável por quaisquer danos decorrentes das informações do chatbot de IA.\n\n3.2 Regras de conduta do usuário\n- É proibido usar o chatbot para gerar ou solicitar conteúdo ilegal.\n- É proibido gerar ou solicitar conteúdo ofensivo ou discriminatório.\n- É proibido gerar ou solicitar conteúdo que viole os direitos de outros.\n- É proibido compartilhar intencionalmente informações pessoais ou sensíveis.\n\n3.3 Alterações e descontinuação do serviço\n- A empresa pode alterar a funcionalidade do chatbot de IA a qualquer momento.\n- A empresa pode suspender temporária ou permanentemente o serviço de chatbot por razões técnicas ou operacionais.\n- A empresa não é responsável por danos decorrentes de alterações ou descontinuação do serviço.\n\n4. Direitos do provedor de serviços\n- Pode realizar atualizações para melhoria da qualidade.\n- Pode tomar medidas disciplinares contra usuários inadequados.',
        },
        privacyPolicy: {
          title: 'Política de privacidade',
          content:
            'Política de privacidade\n\n1. Informações pessoais que coletamos\n- Informações básicas: Apelido, gênero, faixa etária\n- Informações de tênis: Nível LTR, estilo de jogo preferido\n- Informações de localização: Áreas de atividade, localização GPS (para busca de partidas)\n- Informações de contato: Endereço de e-mail\n- Dados de conversa do chatbot de IA: Perguntas dos usuários e registros de conversa\n\n2. Propósito do uso de informações pessoais\n- Fornecer serviços de matchmaking\n- Fornecer recomendações personalizadas\n- Apoiar comunicação entre usuários\n- Melhoria do serviço e análise estatística\n- Serviço de chatbot de IA: Gerar respostas às perguntas dos usuários\n- Melhoria da qualidade do serviço de chatbot e análise de tendências de consultas dos usuários\n\n3. Compartilhamento de informações com terceiros (Importante)\n3.1 Integração do serviço Google AI\n- O conteúdo da conversa do usuário é transmitido ao Google (Alphabet Inc.) para geração de respostas do chatbot de IA.\n- O Google processa esses dados apenas para gerar respostas através de modelos de IA (Gemini).\n- Política de privacidade do Google: https://policies.google.com/privacy\n- Os usuários podem optar por não usar os recursos do chatbot de IA sem limitar o uso de outros serviços.\n\n3.2 Proteções no compartilhamento com terceiros\n- Informações de identificação pessoal são minimizadas antes da transmissão.\n- Os dados são transmitidos de forma segura através de comunicação criptografada.\n\n4. Período de armazenamento de dados\n- Informações pessoais básicas: Armazenadas durante o período de uso do serviço\n- Registros de conversa do chatbot de IA: Armazenados por até 2 anos para melhoria do serviço, depois excluídos automaticamente\n- Todas as informações pessoais são excluídas imediatamente após a exclusão da conta (exceto requisitos legais de retenção)\n\n5. Proteção de informações pessoais e direitos do usuário\n- As informações pessoais coletadas são criptografadas e armazenadas de forma segura\n- Os usuários podem solicitar a cessação do processamento de informações pessoais a qualquer momento\n- Os usuários podem solicitar acesso, correção ou exclusão de informações pessoais\n\n⚠️ 6. Aviso de segurança de informações pessoais (Importante)\n- Em caso de vazamento de informações pessoais devido a hacking, malware, erros de sistema ou outros ataques externos ou erros de programa, a empresa não é legalmente responsável.\n- Aconselha-se aos usuários a NÃO expor ou armazenar informações pessoais sensíveis, como números de seguro social, informações financeiras ou senhas dentro do aplicativo.\n- A empresa não é responsável por danos decorrentes da inserção de informações sensíveis em perfis, publicações, chats, etc.\n- Encoraja-se os usuários a usar senhas fortes e alterá-las periodicamente para a segurança de suas contas.',
        },
        locationServices: {
          title: 'Termos de serviços de localização',
          content:
            'Termos de serviços baseados em localização\n\n1. Coleta e uso de informações de localização\n- Fornecer serviços de busca de partidas próximas\n- Fornecer serviços de busca de quadras de tênis\n- Fornecer serviços de notificação baseados em distância\n\n2. Consentimento de informações de localização\n- Os usuários podem recusar o fornecimento de informações de localização a qualquer momento\n- Recusar informações de localização pode limitar alguns recursos do serviço\n\n3. Proteção de informações de localização\n- As informações de localização coletadas são criptografadas e armazenadas de forma segura\n- Não são fornecidas a terceiros sem o consentimento do usuário',
        },
        liabilityDisclaimer: {
          title: 'Isenção de responsabilidade',
          content:
            '⚠️ AVISO LEGAL IMPORTANTE ⚠️\n\nO aplicativo Lightning Tennis serve como plataforma para conectar jogadores de tênis individuais.\n\nNÃO ASSUMIMOS NENHUMA RESPONSABILIDADE LEGAL por:\n\n1. Isenção de responsabilidade por incidentes de segurança\n- Lesões ou acidentes durante partidas de tênis\n- Disputas pessoais entre participantes da partida\n- Incidentes de segurança em instalações de quadras de tênis\n\n2. Isenção de responsabilidade por disputas financeiras\n- Disputas relacionadas a custos de partidas\n- Problemas relacionados a taxas de aluguel de quadras\n- Transações financeiras entre usuários\n\n3. Responsabilidade do usuário\n- Toda a segurança e responsabilidade pelas partidas é dos anfitriões e participantes\n- Os usuários devem verificar seu estado de saúde antes de participar\n- Recomenda-se cobertura de seguro adequada\n\nAo usar este serviço, você concorda com estes termos de isenção de responsabilidade.',
        },
        marketingCommunications: {
          title: 'Consentimento de comunicações de marketing',
          content:
            'Consentimento de comunicações de marketing (Opcional)\n\n1. Conteúdo\n- Novas funcionalidades e atualizações do serviço\n- Anúncios de eventos especiais e promoções\n- Informações úteis relacionadas ao tênis e dicas\n- Benefícios de parceria e informações de descontos\n\n2. Métodos de entrega\n- Notificações push\n- E-mail\n- Notificações no aplicativo\n\n3. Cancelamento de inscrição\n- Você pode cancelar a inscrição a qualquer momento nas configurações\n- Cancelamento seletivo disponível para notificações individuais\n\nEste consentimento é opcional e recusá-lo não limitará seu uso do serviço.',
        },
        inclusivityPolicy: {
          title: 'Política de diversidade e inclusão',
          content:
            '🌈 Política de diversidade e inclusão e aviso\n\nLightning Tennis é uma plataforma aberta a todos os usuários.\n\n1. Princípios de inclusividade\n- Todos os usuários têm igual acesso aos nossos serviços, independentemente de gênero, orientação sexual ou identidade de gênero.\n- Usuários LGBTQ+ podem participar de todas as atividades (criação de partidas, participação, atividades de clube, etc.) sem restrições.\n- Todos os usuários devem aderir aos princípios de respeito mútuo.\n\n2. Aviso sobre erros de programa\n- Erros de programa podem ocasionalmente causar restrições não intencionais em alguns recursos.\n- Tais erros não são discriminação intencional e serão corrigidos ao serem descobertos.\n- Você concorda em não apresentar processos legais por restrições de recursos causadas por erros de programa.\n\n3. Anti-discriminação\n- Discurso ou comportamento discriminatório baseado em gênero, orientação sexual ou identidade de gênero é proibido.\n- Comportamento discriminatório pode resultar em restrições de serviço.\n\nAo concordar com esta política, você reconhece que entende e aceita estes termos.',
        },
      },
      accept: 'Aceitar',
      decline: 'Recusar',
      lastUpdated: 'Última atualização',
      readMore: 'Ler mais',
      readLess: 'Mostrar menos',
    },
  },

  'zh.json': {
    terms: {
      title: '条款和条件',
      description: '请同意服务使用条款',
      introSubtitle: '这些条款确保一个安全愉快的网球社区',
      stepProgress: '步骤 {{current}}/{{total}}',
      agreeAll: '同意所有条款',
      importantNotice: '重要通知',
      noticeContent:
        'Lightning Tennis是一个连接网球运动员的平台。实际比赛期间发生的安全事故或纠纷的责任由参与者承担，我们不承担这些事项的法律责任。',
      requiredTermsTitle: '必需条款',
      requiredTermsMessage: '请同意所有必需条款以继续。',
      serviceTerms: '服务条款',
      privacyPolicy: '隐私政策',
      locationServices: '位置服务条款',
      liabilityDisclaimer: '免责声明',
      marketingCommunications: '服务更新与新闻',
      inclusivityPolicy: '多元化与包容政策',
      required: '必需',
      optional: '可选',
      details: {
        serviceTerms: {
          title: '服务条款',
          content:
            'Lightning Tennis服务条款\n\n⚠️ 重要通知\nLightning Tennis是一个连接网球运动员的平台。实际比赛期间发生的安全事故或纠纷的责任由参与者承担，我们不承担这些事项的法律责任。\n\n1. 服务使用\n- 本应用是一个连接网球运动员的平台服务。\n- 用户可以使用比赛创建、参与和俱乐部活动等功能。\n- 使用服务时请保持相互尊重和体育精神。\n\n2. 用户义务\n- 必须提供准确的信息。\n- 不得侵犯他人权利。\n- 不得发布非法或不当内容。\n\n3. AI聊天机器人服务条款\n3.1 AI回答的限制（免责声明）\n- 聊天机器人提供的网球相关信息由AI生成。\n- AI提供的信息可能不准确或过时。\n- 公司不保证AI聊天机器人信息的准确性、完整性或可靠性。\n- 公司不对AI聊天机器人信息造成的任何损害负责。\n\n3.2 用户行为规则\n- 禁止使用聊天机器人生成或请求非法内容。\n- 禁止生成或请求冒犯性或歧视性内容。\n- 禁止生成或请求侵犯他人权利的内容。\n- 禁止故意分享个人或敏感信息。\n\n3.3 服务变更和终止\n- 公司可以随时更改AI聊天机器人功能。\n- 公司可以因技术或运营原因暂时或永久终止聊天机器人服务。\n- 公司不对服务变更或终止造成的损害负责。\n\n4. 服务提供商权利\n- 可以进行质量改进更新。\n- 可以对不当用户采取纪律措施。',
        },
        privacyPolicy: {
          title: '隐私政策',
          content:
            '隐私政策\n\n1. 我们收集的个人信息\n- 基本信息：昵称、性别、年龄段\n- 网球信息：LTR级别、首选比赛风格\n- 位置信息：活动区域、GPS位置（用于比赛搜索）\n- 联系信息：电子邮件地址\n- AI聊天机器人对话数据：用户问题和对话记录\n\n2. 个人信息使用目的\n- 提供配对服务\n- 提供个性化推荐\n- 支持用户间通信\n- 服务改进和统计分析\n- AI聊天机器人服务：生成用户问题的回答\n- 聊天机器人服务质量改进和用户查询趋势分析\n\n3. 第三方信息共享（重要）\n3.1 Google AI服务集成\n- 用户对话内容传输至Google（Alphabet Inc.）以生成AI聊天机器人回答。\n- Google仅为通过AI模型（Gemini）生成回答而处理此数据。\n- Google隐私政策：https://policies.google.com/privacy\n- 用户可以选择不使用AI聊天机器人功能，不会限制其他服务的使用。\n\n3.2 第三方共享保护措施\n- 传输前最小化个人识别信息。\n- 通过加密通信安全传输数据。\n\n4. 数据存储期限\n- 基本个人信息：在服务使用期间存储\n- AI聊天机器人对话记录：为服务改进存储最多2年，然后自动删除\n- 账户删除时立即删除所有个人信息（法律要求的保留除外）\n\n5. 个人信息保护和用户权利\n- 收集的个人信息经过加密安全存储\n- 用户可以随时要求停止处理个人信息\n- 用户可以要求访问、更正或删除个人信息\n\n⚠️ 6. 个人信息安全免责声明（重要）\n- 因黑客攻击、恶意软件、系统错误或其他外部攻击或程序错误导致个人信息泄露时，公司不承担法律责任。\n- 建议用户不要在应用内暴露或存储敏感个人信息，如社会保险号、财务信息或密码。\n- 公司不对因在个人资料、帖子、聊天等中输入敏感信息而造成的损害负责。\n- 建议用户使用强密码并定期更改以保护账户安全。',
        },
        locationServices: {
          title: '位置服务条款',
          content:
            '位置服务条款\n\n1. 位置信息收集和使用\n- 提供附近比赛搜索服务\n- 提供网球场搜索服务\n- 提供基于距离的通知服务\n\n2. 位置信息同意\n- 用户可以随时拒绝提供位置信息\n- 拒绝位置信息可能会限制某些服务功能\n\n3. 位置信息保护\n- 收集的位置信息经过加密安全存储\n- 未经用户同意不会提供给第三方',
        },
        liabilityDisclaimer: {
          title: '免责声明',
          content:
            '⚠️ 重要法律通知 ⚠️\n\nLightning Tennis应用作为连接个人网球运动员的平台。\n\n我们不承担以下法律责任：\n\n1. 安全事故免责\n- 网球比赛期间的伤害或事故\n- 比赛参与者之间的个人纠纷\n- 网球场设施的安全事故\n\n2. 财务纠纷免责\n- 与比赛费用相关的纠纷\n- 与场地租赁费相关的问题\n- 用户之间的财务交易\n\n3. 用户责任\n- 比赛的所有安全和责任由主办方和参与者承担\n- 用户必须在参加前确认自己的健康状况\n- 建议购买适当的保险\n\n使用本服务即表示您同意这些免责条款。',
        },
        marketingCommunications: {
          title: '营销通讯同意',
          content:
            '营销通讯同意（可选）\n\n1. 内容\n- 新功能和服务更新\n- 特别活动和促销公告\n- 有用的网球相关信息和技巧\n- 合作伙伴福利和折扣信息\n\n2. 发送方式\n- 推送通知\n- 电子邮件\n- 应用内通知\n\n3. 取消订阅\n- 您可以随时在设置中取消订阅\n- 可选择性地取消订阅个别通知\n\n此同意是可选的，拒绝不会限制您使用服务。',
        },
        inclusivityPolicy: {
          title: '多元化与包容政策',
          content:
            '🌈 多元化与包容政策及免责声明\n\nLightning Tennis是一个向所有用户开放的平台。\n\n1. 包容性原则\n- 所有用户无论性别、性取向或性别认同如何，都可以平等访问我们的服务。\n- LGBTQ+用户可以不受限制地参与所有活动（比赛创建、参与、俱乐部活动等）。\n- 所有用户必须遵守相互尊重的原则。\n\n2. 程序错误免责\n- 程序错误可能偶尔导致某些功能的意外限制。\n- 此类错误不是故意歧视，发现后将予以纠正。\n- 您同意不因程序错误导致的功能限制而提起法律诉讼。\n\n3. 反歧视\n- 禁止基于性别、性取向或性别认同的歧视性言论或行为。\n- 歧视行为可能导致服务限制。\n\n同意此政策，即表示您确认理解并接受这些条款。',
        },
      },
      accept: '接受',
      decline: '拒绝',
      lastUpdated: '最后更新',
      readMore: '阅读更多',
      readLess: '收起',
    },
  },

  'ru.json': {
    terms: {
      title: 'Условия и положения',
      description: 'Пожалуйста, примите условия использования сервиса',
      introSubtitle: 'Эти условия обеспечивают безопасное и приятное теннисное сообщество',
      stepProgress: 'Шаг {{current}} из {{total}}',
      agreeAll: 'Принять все условия',
      importantNotice: 'Важное уведомление',
      noticeContent:
        'Lightning Tennis — это платформа, соединяющая теннисистов. Ответственность за инциденты безопасности или споры во время реальных матчей лежит на участниках, и мы не несем юридической ответственности за эти вопросы.',
      requiredTermsTitle: 'Обязательные условия',
      requiredTermsMessage: 'Пожалуйста, примите все обязательные условия для продолжения.',
      serviceTerms: 'Условия обслуживания',
      privacyPolicy: 'Политика конфиденциальности',
      locationServices: 'Условия услуг на основе местоположения',
      liabilityDisclaimer: 'Отказ от ответственности',
      marketingCommunications: 'Обновления и новости сервиса',
      inclusivityPolicy: 'Политика разнообразия и инклюзии',
      required: 'Обязательно',
      optional: 'Необязательно',
      details: {
        serviceTerms: {
          title: 'Условия обслуживания',
          content:
            'Условия обслуживания Lightning Tennis\n\n⚠️ Важное уведомление\nLightning Tennis — это платформа, соединяющая теннисистов. Ответственность за инциденты безопасности или споры во время реальных матчей лежит на участниках, и мы не несем юридической ответственности за эти вопросы.\n\n1. Использование сервиса\n- Это приложение является платформенным сервисом, соединяющим теннисистов.\n- Пользователи могут использовать функции создания матчей, участия и клубной деятельности.\n- Пожалуйста, соблюдайте взаимное уважение и спортивный дух при использовании сервиса.\n\n2. Обязанности пользователя\n- Необходимо предоставлять точную информацию.\n- Не нарушать права других.\n- Не публиковать незаконный или неуместный контент.\n\n3. Условия сервиса AI-чатбота\n3.1 Ограничения ответов AI (Отказ от ответственности)\n- Информация о теннисе, предоставляемая чатботом, генерируется AI.\n- Информация, предоставляемая AI, может быть неточной или устаревшей.\n- Компания не гарантирует точность, полноту или надежность информации AI-чатбота.\n- Компания не несет ответственности за любой ущерб от информации AI-чатбота.\n\n3.2 Правила поведения пользователя\n- Запрещено использовать чатбот для генерации или запроса незаконного контента.\n- Запрещено генерировать или запрашивать оскорбительный или дискриминационный контент.\n- Запрещено генерировать или запрашивать контент, нарушающий права других.\n- Запрещено намеренно делиться личной или конфиденциальной информацией.\n\n3.3 Изменения и прекращение сервиса\n- Компания может изменить функциональность AI-чатбота в любое время.\n- Компания может временно или постоянно приостановить сервис чатбота по техническим или операционным причинам.\n- Компания не несет ответственности за ущерб от изменений или прекращения сервиса.\n\n4. Права поставщика услуг\n- Может проводить обновления для улучшения качества.\n- Может применять дисциплинарные меры к неподобающим пользователям.',
        },
        privacyPolicy: {
          title: 'Политика конфиденциальности',
          content:
            'Политика конфиденциальности\n\n1. Личная информация, которую мы собираем\n- Базовая информация: Никнейм, пол, возрастная группа\n- Теннисная информация: Уровень LTR, предпочитаемый стиль игры\n- Информация о местоположении: Зоны активности, GPS-местоположение (для поиска матчей)\n- Контактная информация: Адрес электронной почты\n- Данные разговоров AI-чатбота: Вопросы пользователей и журналы разговоров\n\n2. Цель использования личной информации\n- Предоставление услуг подбора партнеров\n- Предоставление персонализированных рекомендаций\n- Поддержка общения между пользователями\n- Улучшение сервиса и статистический анализ\n- Сервис AI-чатбота: Генерация ответов на вопросы пользователей\n- Улучшение качества сервиса чатбота и анализ тенденций запросов пользователей\n\n3. Передача информации третьим лицам (Важно)\n3.1 Интеграция сервиса Google AI\n- Содержание разговоров пользователей передается в Google (Alphabet Inc.) для генерации ответов AI-чатбота.\n- Google обрабатывает эти данные исключительно для генерации ответов через AI-модели (Gemini).\n- Политика конфиденциальности Google: https://policies.google.com/privacy\n- Пользователи могут отказаться от использования функций AI-чатбота без ограничения использования других сервисов.\n\n3.2 Меры защиты при передаче третьим лицам\n- Персонально идентифицируемая информация минимизируется перед передачей.\n- Данные передаются безопасно через зашифрованную связь.\n\n4. Срок хранения данных\n- Базовая личная информация: Хранится в период использования сервиса\n- Журналы разговоров AI-чатбота: Хранятся до 2 лет для улучшения сервиса, затем автоматически удаляются\n- Вся личная информация немедленно удаляется при удалении аккаунта (кроме случаев, требуемых законом)\n\n5. Защита личной информации и права пользователя\n- Собранная личная информация шифруется и хранится безопасно\n- Пользователи могут в любое время запросить прекращение обработки личной информации\n- Пользователи могут запросить доступ, исправление или удаление личной информации\n\n⚠️ 6. Отказ от ответственности за безопасность личной информации (Важно)\n- В случае утечки личной информации из-за взлома, вредоносного ПО, системных ошибок или других внешних атак или программных ошибок, компания не несет юридической ответственности.\n- Пользователям рекомендуется НЕ раскрывать и не хранить конфиденциальную личную информацию, такую как номера социального страхования, финансовую информацию или пароли в приложении.\n- Компания не несет ответственности за ущерб от ввода конфиденциальной информации в профилях, постах, чатах и т.д.\n- Пользователям рекомендуется использовать надежные пароли и периодически их менять для безопасности аккаунта.',
        },
        locationServices: {
          title: 'Условия услуг на основе местоположения',
          content:
            'Условия услуг на основе местоположения\n\n1. Сбор и использование информации о местоположении\n- Предоставление услуг поиска матчей поблизости\n- Предоставление услуг поиска теннисных кортов\n- Предоставление услуг уведомлений на основе расстояния\n\n2. Согласие на информацию о местоположении\n- Пользователи могут в любое время отказаться от предоставления информации о местоположении\n- Отказ от информации о местоположении может ограничить некоторые функции сервиса\n\n3. Защита информации о местоположении\n- Собранная информация о местоположении шифруется и хранится безопасно\n- Не передается третьим лицам без согласия пользователя',
        },
        liabilityDisclaimer: {
          title: 'Отказ от ответственности',
          content:
            '⚠️ ВАЖНОЕ ЮРИДИЧЕСКОЕ УВЕДОМЛЕНИЕ ⚠️\n\nПриложение Lightning Tennis служит платформой для соединения отдельных теннисистов.\n\nМЫ НЕ НЕСЕМ ЮРИДИЧЕСКОЙ ОТВЕТСТВЕННОСТИ за:\n\n1. Отказ от ответственности за инциденты безопасности\n- Травмы или несчастные случаи во время теннисных матчей\n- Личные споры между участниками матча\n- Инциденты безопасности на теннисных кортах\n\n2. Отказ от ответственности за финансовые споры\n- Споры, связанные с расходами на матчи\n- Проблемы, связанные с арендой кортов\n- Финансовые транзакции между пользователями\n\n3. Ответственность пользователя\n- Вся безопасность и ответственность за матчи лежит на организаторах и участниках\n- Пользователи должны проверить состояние своего здоровья перед участием\n- Рекомендуется соответствующее страховое покрытие\n\nИспользуя этот сервис, вы соглашаетесь с этими условиями отказа от ответственности.',
        },
        marketingCommunications: {
          title: 'Согласие на маркетинговые коммуникации',
          content:
            'Согласие на маркетинговые коммуникации (Необязательно)\n\n1. Содержание\n- Новые функции и обновления сервиса\n- Объявления о специальных мероприятиях и акциях\n- Полезная информация о теннисе и советы\n- Партнерские преимущества и информация о скидках\n\n2. Способы доставки\n- Push-уведомления\n- Электронная почта\n- Уведомления в приложении\n\n3. Отписка\n- Вы можете отписаться в любое время в настройках\n- Доступна выборочная отписка от отдельных уведомлений\n\nЭто согласие необязательно, и отказ не ограничит использование сервиса.',
        },
        inclusivityPolicy: {
          title: 'Политика разнообразия и инклюзии',
          content:
            '🌈 Политика разнообразия и инклюзии и отказ от ответственности\n\nLightning Tennis — это платформа, открытая для всех пользователей.\n\n1. Принципы инклюзивности\n- Все пользователи имеют равный доступ к нашим услугам независимо от пола, сексуальной ориентации или гендерной идентичности.\n- ЛГБТК+ пользователи могут участвовать во всех мероприятиях (создание матчей, участие, клубная деятельность и т.д.) без ограничений.\n- Все пользователи должны придерживаться принципов взаимного уважения.\n\n2. Отказ от ответственности за программные ошибки\n- Программные ошибки могут иногда вызывать непреднамеренные ограничения некоторых функций.\n- Такие ошибки не являются преднамеренной дискриминацией и будут исправлены при обнаружении.\n- Вы соглашаетесь не подавать судебные иски за ограничения функций, вызванные программными ошибками.\n\n3. Антидискриминация\n- Дискриминационные высказывания или поведение на основе пола, сексуальной ориентации или гендерной идентичности запрещены.\n- Дискриминационное поведение может привести к ограничениям сервиса.\n\nСоглашаясь с этой политикой, вы подтверждаете понимание и принятие этих условий.',
        },
      },
      accept: 'Принять',
      decline: 'Отклонить',
      lastUpdated: 'Последнее обновление',
      readMore: 'Читать далее',
      readLess: 'Свернуть',
    },
  },
};

// Process each locale file
for (const [filename, newData] of Object.entries(translations)) {
  const filePath = path.join(localesDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Update the terms section
    json.terms = newData.terms;

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');

    console.log(`✅ ${filename}: Updated terms section with complete translations`);
  } catch (err) {
    console.error(`❌ ${filename}: Error - ${err.message}`);
  }
}

console.log('\n🎾 Terms translation update complete!');
