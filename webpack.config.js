const path = require('path');
const Webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  node: {
    fs: 'empty'
  },
  entry: './src/App.jsx',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'] //, 'eslint-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  output: {
    filename: 'App.js',
    path: path.resolve(__dirname, 'static', 'dist', 'js')
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()]
  },
  plugins: [new Webpack.IgnorePlugin(/uws/)]
};
