const path = require('path');
const pkg = require('./package.json');
const webpack = require('webpack');


module.exports = env => {
  let mode, outputFile, outPath;
  outPath = env.TARGET === 'umd' ? path.join(__dirname, 'lib', 'bundle') : path.join(__dirname, 'lib');
  if (env.NODE_ENV === 'build') {
    mode = 'production';
    outputFile = env.TARGET === 'umd' ? pkg.name + '.min.js' : 'index.js';
  } else {
    mode = 'development';
    outputFile = env.TARGET === 'umd' ? pkg.name + '.dev.js' : 'index.js';
  }

  return {
    entry: ['./src/index.js'],
    mode: mode,
    output: {
      path: outPath,
      filename: outputFile,
      library: pkg.name,
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /templateweb.js/],
          loader: 'babel-loader',
          options: {
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  "absoluteRuntime": false,
                  "corejs": 2,
                  "helpers": true,
                  "regenerator": true,
                  "useESModules": true
                }
              ]
            ]
          }
        },
        {
          test: /\.art$/,
          use: ['art-template-loader']
        }
      ]
    },
    resolve: {
      alias: {
        'art-web-template': path.resolve(__dirname, "./src/lib/templateweb.js")
      }
    }
  };
  
}