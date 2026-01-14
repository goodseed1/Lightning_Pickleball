const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Missing FeesSection translations for createClub
const translations = {
  en: {
    createClub: {
      joinFee: 'Join Fee',
      joinFeePlaceholder: 'e.g., 50',
      monthlyFee: 'Monthly Dues',
      monthlyFeePlaceholder: 'e.g., 30',
      yearlyFee: 'Annual Dues',
      yearlyFeePlaceholder: 'e.g., 300',
      feesHint: 'Leave blank if not applicable',
    },
  },
  ko: {
    createClub: {
      joinFee: '가입비',
      joinFeePlaceholder: '예: 50',
      monthlyFee: '월회비',
      monthlyFeePlaceholder: '예: 30',
      yearlyFee: '연회비',
      yearlyFeePlaceholder: '예: 300',
      feesHint: '해당사항 없으면 비워두세요',
    },
  },
  es: {
    createClub: {
      joinFee: 'Cuota de Inscripción',
      joinFeePlaceholder: 'ej., 50',
      monthlyFee: 'Cuota Mensual',
      monthlyFeePlaceholder: 'ej., 30',
      yearlyFee: 'Cuota Anual',
      yearlyFeePlaceholder: 'ej., 300',
      feesHint: 'Deje en blanco si no aplica',
    },
  },
  de: {
    createClub: {
      joinFee: 'Aufnahmegebühr',
      joinFeePlaceholder: 'z.B., 50',
      monthlyFee: 'Monatsbeitrag',
      monthlyFeePlaceholder: 'z.B., 30',
      yearlyFee: 'Jahresbeitrag',
      yearlyFeePlaceholder: 'z.B., 300',
      feesHint: 'Leer lassen, falls nicht zutreffend',
    },
  },
  fr: {
    createClub: {
      joinFee: "Frais d'inscription",
      joinFeePlaceholder: 'ex., 50',
      monthlyFee: 'Cotisation mensuelle',
      monthlyFeePlaceholder: 'ex., 30',
      yearlyFee: 'Cotisation annuelle',
      yearlyFeePlaceholder: 'ex., 300',
      feesHint: 'Laisser vide si non applicable',
    },
  },
  it: {
    createClub: {
      joinFee: 'Quota di iscrizione',
      joinFeePlaceholder: 'es., 50',
      monthlyFee: 'Quota mensile',
      monthlyFeePlaceholder: 'es., 30',
      yearlyFee: 'Quota annuale',
      yearlyFeePlaceholder: 'es., 300',
      feesHint: 'Lasciare vuoto se non applicabile',
    },
  },
  ja: {
    createClub: {
      joinFee: '入会費',
      joinFeePlaceholder: '例: 50',
      monthlyFee: '月会費',
      monthlyFeePlaceholder: '例: 30',
      yearlyFee: '年会費',
      yearlyFeePlaceholder: '例: 300',
      feesHint: '該当しない場合は空白のままにしてください',
    },
  },
  pt: {
    createClub: {
      joinFee: 'Taxa de Inscrição',
      joinFeePlaceholder: 'ex., 50',
      monthlyFee: 'Mensalidade',
      monthlyFeePlaceholder: 'ex., 30',
      yearlyFee: 'Anuidade',
      yearlyFeePlaceholder: 'ex., 300',
      feesHint: 'Deixe em branco se não aplicável',
    },
  },
  ru: {
    createClub: {
      joinFee: 'Вступительный взнос',
      joinFeePlaceholder: 'напр., 50',
      monthlyFee: 'Ежемесячный взнос',
      monthlyFeePlaceholder: 'напр., 30',
      yearlyFee: 'Годовой взнос',
      yearlyFeePlaceholder: 'напр., 300',
      feesHint: 'Оставьте пустым, если не применимо',
    },
  },
  zh: {
    createClub: {
      joinFee: '入会费',
      joinFeePlaceholder: '例如: 50',
      monthlyFee: '月费',
      monthlyFeePlaceholder: '例如: 30',
      yearlyFee: '年费',
      yearlyFeePlaceholder: '例如: 300',
      feesHint: '如不适用请留空',
    },
  },
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

console.log('💰 Adding createClub fees translations...\n');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    deepMerge(content, translations[lang]);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`✅ ${lang}.json - Added fees translations`);
  } catch (err) {
    console.log(`❌ ${lang}.json - Error: ${err.message}`);
  }
});

console.log('\n🎉 Done!');
