'use strict';
let runner = require('vscode/lib/testrunner');

runner.configure({
	useColors: true,
	delay: true
});

module.exports = runner;
