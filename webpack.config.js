const path = require('path');
const Webpack = require('webpack');

const isProd = false;

module.exports = {
  target: 'web',
  mode: isProd ? 'production' : 'development',
  node: {
    fs: 'empty'
  },
  entry: './src/App.tsx',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /(node_modules|bower_components)/
      },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: [
          'css-modules-typescript-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css']
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
