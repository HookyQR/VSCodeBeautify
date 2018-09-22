'use strict';
let runner = require('vscode/lib/testrunner');

runner.configure({
  useColors: true,
  slow: 200
});

module.exports = runner;
