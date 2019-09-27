// @ts-check
'use strict'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node',

  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    'ts-node': 'ts-node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: ['ts-loader', 'eslint-loader'],
      },
    ],
  },
}
module.exports = config
