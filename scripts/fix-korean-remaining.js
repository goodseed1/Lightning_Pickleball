const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

const translations = {
  createEventChoice: {
    lightningMatch: {
      subtitle: '랭크 매치',
    },
    lightningMeetup: {
      subtitle: '캐주얼 모임',
    },
    createClub: {
      subtitle: '피클볼 커뮤니티',
    },
  },
  createModal: {
    lightningMatch: {
      subtitle: '랭크 매치',
    },
    lightningMeetup: {
      subtitle: '캐주얼 모임',
    },
  },
  rankingPrivacy: {
    visibility: {
      private: {
        label: '비공개',
      },
    },
  },
  tournamentDetail: {
    hallOfFame: '명예의 전당',
  },
  hallOfFame: {
    title: '명예의 전당',
  },
  duesManagement: {
    settings: {
      venmo: 'Venmo', // Keep as brand name
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

const filePath = path.join(localesDir, 'ko.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
deepMerge(content, translations);
fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
console.log('✅ Updated ko.json');
