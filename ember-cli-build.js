'use strict';

const GlimmerApp = require('@glimmer/application-pipeline').GlimmerApp;
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const concat = require('broccoli-concat');
const { map } = require('broccoli-stew');

module.exports = function(defaults) {
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
            'node_modules/handlebars/lib/index.js': ['parse']
          }
        })
      ]
    }
  });

  let monaco = new Funnel('node_modules/monaco-editor/dev/vs', {
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

  // monaco = new Concat(monaco, {
  //   outputFile: 'monaco-editor.js'
  // });

  // let css = new Funnel('node_modules/codemirror', {
  //   include: ['lib/codemirror.css', 'theme/solarized.css']
  // });

  // css = new Concat(css, {
  //   outputFile: 'code-editor.css'
  // });

  return mergeTrees([app.toTree(), monaco, libs]);

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  // return app.toTree();
};
