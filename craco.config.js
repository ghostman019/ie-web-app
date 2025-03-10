const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          path: require.resolve('path-browserify'),
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          https: require.resolve('https-browserify'),
          http: require.resolve('stream-http'),
          zlib: require.resolve('browserify-zlib'),
          url: require.resolve('url'),
          vm: require.resolve('vm-browserify'),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
};