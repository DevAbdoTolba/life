module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        require('expo/internal/babel-preset'),
        {
          // Disable reanimated babel plugin — causes issues in Jest with react-native-worklets
          reanimated: false,
        },
      ],
    ],
  };
};
