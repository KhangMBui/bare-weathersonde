module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from',
    'react-native-reanimated/plugin',
  ],
  // If using babel-loader, set requireConfigFile: false in your loader options, not here.
};
