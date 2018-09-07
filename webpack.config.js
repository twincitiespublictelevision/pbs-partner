var webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname,
    filename: 'dist/pbspartner.min.js',
    library: 'PBSPartner',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /test\.js/],
        loaders: [
          'babel-loader'
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
