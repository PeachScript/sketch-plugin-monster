const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pkg = require('./package.json');

module.exports = {
  entry: {
    'manager': './src/webview/manager.js'
  },
  output: {
    path: path.join(__dirname, pkg.skpm.main, 'Contents'),
    filename: 'Sketch/webview/[name].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      'vue$': 'vue/dist/vue.min.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.(vue|js)$/,
        enforce: 'pre',
        include: path.join(__dirname, './src/webview'),
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, './src'),
        loader: 'babel-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          postcss: [require('autoprefixer')]
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'Resources/[name].[hash:7].[ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'Sketch/webview/manager.html',
      template: './src/webview/index.html',
      chunks: ['manager']
    })
  ]
};
