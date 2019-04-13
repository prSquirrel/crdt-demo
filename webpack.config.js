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
  devtool: 'source-map',
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  output: {
    filename: 'App.js',
    path: path.resolve(__dirname, 'static', 'dist', 'js')
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  plugins: [new Webpack.IgnorePlugin(/uws/)]
};
