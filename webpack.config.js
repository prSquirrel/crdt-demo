const path = require('path');
const Webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'web',
  mode: 'development',
  node: {
    fs: 'empty'
  },
  entry: './src/client.js',
  output: {
    filename: 'client.js',
    library: 'Client',
    path: path.resolve(__dirname, 'static', 'js')
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()]
  },
  plugins: [new Webpack.IgnorePlugin(/uws/)]
};
