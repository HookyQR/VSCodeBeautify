'use strict';
const vscode = require('vscode'),
    beautify = require('js-beautify'),
	path = require('path'),
	os = require('os'),
	fs = require('fs'),
	minimatch = require('minimatch'),
    options = require('./options');

const dumpError = e => {
	if (e) console.log('beautify err:', e);
	return [];
};

exports.activate = context => {
    context.subscriptions.push(vscode.commands.registerCommand('HookyQR.beautify', () => {
		const active = vscode.window.activeTextEditor;
		if (!active || !active.document) return;
		let range = fullRange(active.document);
		return beautifyDoc(active.document, range)
			.then(newText => active.edit(editor => editor.replace(range, newText)), dumpError);
	}));
};

