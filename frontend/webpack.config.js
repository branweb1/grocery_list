const path = require('path');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3000,
    hot: true,
    liveReload: true,
    proxy: {
          '/api': {
             target: {
                host: "0.0.0.0",
                protocol: 'http:',
                port: 5000
             },
             pathRewrite: {
                '^/api': ''
             }
          }
       }
  },
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: true
            }
          }
        ]
      }
    ]
  }
};
