const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/storage': path.resolve(__dirname, 'src/storage'),
      '@/types': path.resolve(__dirname, 'src/types')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [
          /node_modules/,
          /test/,
          /\.test\./,
          /\.spec\./
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json'
            }
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log"
  }
};