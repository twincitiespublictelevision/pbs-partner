var webpack = require('webpack');

module.exports = {
  entry: './src/COVEMessageAPI.js',
  output: {
    path: __dirname,
    filename: 'dist/covepartner.min.js',
    library: 'COVEPartner',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /test\.js/],
        loaders: [
          'babel'
        ]
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
