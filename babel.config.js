module.exports = function (api) {
  const isTest = api.env('test'); // 👈 Jest가 실행하면 true가 됨
  const isProduction = api.env('production') || process.env.NODE_ENV === 'production';
  api.cache(true);

  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow',
      // Jest 환경에서는 더 엄격한 변환 적용
      ...(isTest ? [['@babel/preset-env', { targets: { node: 'current' } }]] : []),
    ],
    plugins: [
      // Jest 환경에서는 reanimated 플러그인을 비활성화하여 충돌 방지
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
      // 🚀 프로덕션 빌드에서 console.log 자동 제거
      ...(isProduction && !isTest
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
    ],
  };
};
