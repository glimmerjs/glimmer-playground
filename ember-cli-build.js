'use strict';

const GlimmerApp = require('@glimmer/application-pipeline').GlimmerApp;
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const concat = require('broccoli-concat');
const { map } = require('broccoli-stew');

module.exports = function(defaults) {
  const isProduction = process.env.EMBER_ENV === 'production';

  function handlebars() {
    return {
      resolveId(id) {
        if (id === 'handlebars') {
          return 'node_modules/handlebars/lib/handlebars/compiler/base.js';
        }
      }
    };
  }

  let app = new GlimmerApp(defaults, {
    rollup: {
      plugins: [
        handlebars(),
        resolve({ jsnext: true, module: true, main: true }),
        commonjs({
          namedExports: {
            'node_modules/handlebars/lib/index.js': ['parse'],
            'node_modules/decko/dist/decko.js': ['debounce', 'bind']
          }
        })
      ]
    }
  });

  let monacoMode = isProduction ? 'min' : 'dev';
  let monaco = new Funnel(`node_modules/monaco-editor/${monacoMode}/vs`, {
    destDir: 'vs'
  });

  let libs = new Funnel('node_modules/@glimmer', {
    include: ['*/dist/**/*.d.ts', '*/package.json']
  });

  libs = map(libs, (content, relativePath) => {
    relativePath = `node_modules/@glimmer/${relativePath}`;
    return `typings['${relativePath}'] = ${JSON.stringify(content)};\n`;
  });

  libs = concat(libs, {
    header: `window.typings = {};\n`,
    outputFile: 'types.js'
  });

  return mergeTrees([app.toTree(), monaco, libs]);
};
