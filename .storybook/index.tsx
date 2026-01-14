/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from 'react';
import { View } from 'react-native';
import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports
import './storybook.requires';

// Legacy Storybook API imports with type assertions
const storybookModule = require('@storybook/react-native') as any;
const knobsModule = require('@storybook/addon-ondevice-knobs') as any;

const getStorybookUI = storybookModule.getStorybookUI as any;
const configure = storybookModule.configure as any;
const addDecorator = storybookModule.addDecorator as any;
const withKnobs = knobsModule.withKnobs as any;

// Enable knobs addon
addDecorator(withKnobs);

// Add padding decorator
addDecorator((StoryFn: ComponentType<any>) => (
  <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
    <StoryFn />
  </View>
));

configure(() => {
  require('./storybook.requires');
}, module);

// Refer to https://github.com/storybookjs/react-native/tree/master/app/react-native#start-command-parameters
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({});

export default StorybookUIRoot;
