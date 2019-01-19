const path = require('path');
const Webpack = require('webpack');

const isProd = false;

module.exports = {
  target: 'web',
  mode: isProd ? 'production' : 'development',
  node: {
    fs: 'empty'
  },
  entry: './src/App.jsx',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: ['babel-loader']
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: ['babel-loader'] //, 'eslint-loader']
      },
      {
        test: /\.purs$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'purs-loader',
            options: {
              src: [
                path.join('src', '**', '*.purs'),
                path.join('bower_components', 'purescript-*', 'src', '**', '*.purs')
              ],
              bundle: isProd,
              psc: 'psa',
              watch: !isProd
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.purs']
  },
  output: {
    filename: 'App.js',
    path: path.resolve(__dirname, 'static', 'dist', 'js')
  },
  plugins: [new Webpack.IgnorePlugin(/uws/)]
};
