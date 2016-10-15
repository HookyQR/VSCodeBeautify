'use strict';
let runner = require('vscode/lib/testrunner');

runner.configure({
	useColors: true
});

module.exports = runner;
