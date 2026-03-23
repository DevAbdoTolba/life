module.exports = {
  projects: [
    // Pure unit tests (services, utils) — ts-jest with node environment
    '<rootDir>/jest.unit.config.js',
    // React Native component tests — jest-expo preset
    {
      displayName: 'native',
      preset: 'jest-expo',
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      testMatch: [
        '<rootDir>/src/components/**/*.test.{ts,tsx}',
        '<rootDir>/src/app/**/*.test.{ts,tsx}',
      ],
    },
  ],
};
