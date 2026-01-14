/**
 * Storybook Entry Point for Lightning Tennis App
 * Use this to run Storybook in development
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import StorybookUIRoot from './.storybook/index';

// Replace App with Storybook for development
export default function AppStorybook() {
  return <StorybookUIRoot />;
}

// Register the Storybook app
AppRegistry.registerComponent('main', () => AppStorybook);