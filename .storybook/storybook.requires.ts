import {
  configure,
  addDecorator,
  addParameters,
  addArgsEnhancer,
  addArgTypesEnhancer,
  setGlobalRender,
} from '@storybook/react-native';
import type { StoryFn, StoryContext } from '@storybook/react-native';

import { withKnobs } from '@storybook/addon-ondevice-knobs';
import {
  withBackgrounds,
  addBackgroundParameter,
} from '@storybook/addon-ondevice-backgrounds';
import { withActions } from '@storybook/addon-ondevice-actions';

import { argsEnhancers } from '@storybook/addon-actions/dist/modern/preset/addArgs';
import { inferArgTypesFromParameters } from '@storybook/addon-controls/dist/modern/helpers';

import { decorateStory } from '@storybook/addon-actions/dist/modern/preset/addDecorator';

import React from 'react';
import { View } from 'react-native';

// Enable if you want to use a background addon
// addBackgroundParameter({
//   default: 'plain',
//   list: [
//     { name: 'plain', value: 'white', default: true },
//     { name: 'warm', value: 'hotpink' },
//     { name: 'cool', value: 'deepskyblue' },
//   ],
// });

addDecorator(withKnobs);
addDecorator(withActions);
addDecorator((StoryFn: StoryFn, context: StoryContext) => (
  <View style={{ flex: 1, padding: 8 }}>
    <StoryFn {...context} />
  </View>
));

// addDecorator(withBackgrounds);

// Import story files
const loadStories = () => {
  require('../src/components/cards/HostedMeetupCard.stories.tsx');
};

configure(loadStories, module);

export const view = { getStorybookUI: () => {} };