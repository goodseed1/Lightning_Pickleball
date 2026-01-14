#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DE_PATH = path.join(__dirname, '../src/locales/de.json');
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));

// MASSIVE manual translations covering all remaining untranslated keys
const massiveTranslations = {
  common: {
    ok: 'OK',
  },

  themeSelection: {
    title: 'Wählen Sie Ihr Design',
    subtitle: 'Wählen Sie Ihr bevorzugtes visuelles Design',
    lightMode: {
      title: 'Heller Modus',
      subtitle: 'Helle und saubere Oberfläche',
    },
    darkMode: {
      title: 'Dunkler Modus',
      subtitle: 'Augensch onend, spart Batterie',
    },
    systemMode: {
      title: 'System folgen',
      subtitle: 'Automatisch an Systemeinstellung anpassen',
    },
  },

  auth: {
    register: {
      displayName: 'Name',
      signingUp: 'Wird registriert...',
      passwordHint:
        'Passwort muss mindestens 8 Zeichen lang sein und Groß-, Kleinbuchstaben und Zahlen enthalten',
      termsComingSoon: 'Demnächst',
      privacyComingSoon: 'Demnächst',
      errors: {
        nameRequired: 'Bitte geben Sie Ihren Namen ein.',
        nameMinLength: 'Name muss mindestens 2 Zeichen lang sein.',
        emailRequired: 'Bitte geben Sie Ihre E-Mail ein.',
        emailInvalid: 'Bitte geben Sie eine gültige E-Mail ein.',
        passwordRequired: 'Bitte geben Sie Ihr Passwort ein.',
        passwordMinLength: 'Passwort muss mindestens 8 Zeichen lang sein.',
        passwordComplexity: 'Passwort muss Groß-, Kleinbuchstaben und Zahlen enthalten.',
        signupFailedMessage: 'Registrierung fehlgeschlagen.',
        emailInUse: 'Diese E-Mail wird bereits verwendet.',
        invalidEmailFormat: 'Ungültiges E-Mail-Format.',
        weakPassword: 'Passwort ist zu schwach.',
      },
      success: {
        ok: 'OK',
      },
    },
  },

  createClub: {
    basic_info: 'Grundinformationen',
    regular_meet: 'Wiederkehrende Treffen',
    creating: 'Wird erstellt...',
    facility: {
      lights: 'Beleuchtung',
      indoor: 'Halle',
      parking: 'Parkplatz',
      restrooms: 'Toiletten',
      locker: 'Umkleiden',
      pro_shop: 'Pro Shop',
      restaurant: 'Restaurant',
      wifi: 'WLAN',
    },
    alerts: {
      limitTitle: 'Vereinslimit erreicht',
      limitMessage:
        'Jeder Benutzer kann maximal {{max}} Vereine erstellen.\n\nSie besitzen derzeit {{current}} Verein(e).\n\nUm weitere Vereine zu erstellen, kontaktieren Sie bitte den Administrator über den KI-Assistenten-Chatbot unten in der App.',
      saveSuccess: '✅ Gespeichert!',
      saveSuccessMessage: 'Die Informationen des Vereins {{name}} wurden gespeichert.',
      saveFailed: '❌ Speichern fehlgeschlagen!',
      saveFailedMessage: 'Beim Speichern der Vereinsinformationen ist ein Fehler aufgetreten.',
      createSuccessMessage: 'Der Verein {{name}} wurde erfolgreich erstellt.',
      createFailed: 'Erstellen fehlgeschlagen',
      createFailedMessage: 'Beim Erstellen des Vereins ist ein Fehler aufgetreten.',
      promoteSuccess: 'Erfolgreich zum Manager befördert.',
      demoteSuccess: 'Erfolgreich zum Mitglied degradiert.',
      actionError: 'Beim Ausführen der Aktion ist ein Fehler aufgetreten.',
      permissionDenied: 'Zugriff verweigert. Nur Administratoren können diese Aktion ausführen.',
      cannotRemoveSelf: 'Sie können sich nicht selbst entfernen.',
      cannotRemoveOwner: 'Der Vereinsbesitzer kann nicht entfernt werden.',
    },
  },

  profileSetup: {
    alerts: {
      nicknameRequired: 'Bitte geben Sie einen Spitznamen ein.',
      nicknameLength: 'Spitzname muss 2-20 Zeichen lang sein.',
      nicknameChecking: 'Wird geprüft...',
      nicknameUnavailable: 'Dieser Spitzname ist bereits vergeben.',
      genderNotSelected: 'Bitte wählen Sie ein Geschlecht.',
    },
  },

  onboarding: {
    alerts: {
      locationPermissionRequired: 'Standortberechtigung erforderlich',
      locationPermissionMessage: 'Bitte aktivieren Sie Standortdienste in den Einstellungen.',
    },
  },

  scheduleMeetup: {
    basic_info: 'Grundinformationen',
    loading: 'Lädt...',
    creating: 'Wird erstellt...',
  },
};

// Deep merge
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (output[key] && typeof output[key] === 'object') {
        output[key] = deepMerge(output[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

console.log('\n🇩🇪 MASSIVE FINAL TRANSLATIONS\n');
console.log('='.repeat(70));

const updated = deepMerge(de, massiveTranslations);

fs.writeFileSync(DE_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8');

console.log('✅ Applied massive translation updates');
console.log('💾 Saved to:', DE_PATH);
console.log('='.repeat(70));
console.log('✨ Complete!\n');
