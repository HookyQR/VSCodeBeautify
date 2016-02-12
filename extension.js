"use strict";
const vscode = require('vscode');
const beautify = require('js-beautify');
const path = require('path');
const fs = require('fs');

function findRecursive(dir, fileName) {
	const fullPath = path.join(dir, fileName);
	const nextDir = path.dirname(dir);
	let result = fs.existsSync(fullPath) ? fullPath : null;
	if (!result && (nextDir !== dir)) {
		result = findRecursive(nextDir, fileName);
	}
	return result;
}
const dropComments = inText => inText.replace(/(\/\*.*\*\/)|\/\/.*(?:[\r\n]|$)/g, "");

//register on activation
function activate(context) {
	const mergeOpts = function(opts, type) {
		const finOpts = {};
		for (let a in opts) {
			if (a !== 'js' && a !== 'html' && a !== 'css') {
				finOpts[a] = opts[a];
			}
		}
		//merge in the per type settings
		if (type in opts) {
			for (let b in opts[type]) {
				if (b === 'allowed_file_extensions') continue;
				finOpts[b] = opts[type][b];
			}
		}
		return finOpts;
	};
	const getBeautifyType = function(doc) {
		return Promise.resolve()
			.then(() => {
				const type = doc.isUntitled ? "" : doc.fileName.split('.')
					.pop()
					.toLowerCase();
				const cfg = vscode.workspace.getConfiguration('beautify');
				//if a type is set on the window, use that
				//check if the file is in the users json schema set
				const jsSchema = vscode.workspace.getConfiguration('json')
					.schemas;
				if (jsSchema.length) {
					let matcher = [];
					const extMatch = n => ({
						pattern: n.startsWith("**/") ? n : ("**/" + n)
					});
					jsSchema.forEach(schema => {
						if (typeof schema.fileMatch === 'string') {
							matcher.push(extMatch(schema.fileMatch));
						} else {
							const t = schema.fileMatch.map(extMatch);
							matcher = matcher.concat(t);
						}
					});
					if (vscode.languages.match(matcher, doc)) {
						return "js";
					}
				}
				if (cfg.HTMLfiles.indexOf(type) + 1) return "html";
				else if (cfg.CSSfiles.indexOf(type) + 1) return "css";
				else if (cfg.JSfiles.indexOf(type) + 1) return "js";
				else {
					//Ask what they want to do:
					return vscode.window.showQuickPick([{
							label: "JS",
							description: "Does JavaScript and JSON"
						}, {
							label: "CSS"
						}, {
							label: "HTML"
						}], {
							matchOnDescription: true,
							placeHolder: "Couldn't determine type to beautify, pleae choose."
						})
						.then(function(choice) {
							if (!choice || !choice.label) return;
							return choice.label.toLowerCase();
						});
				}
			});
	};
	const doBeautify = function(active, doc, type, opts) {
		const original = doc.getText();
		//get the whole file:
		const range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
		const result = beautify[type](original, opts);
		//and make the change:
		active.edit(editor => editor.replace(range, result));
	};
	//it's ok to build and pass the re from outside of here, we always run
	//to completion.
	const disposable = vscode.commands.registerCommand('HookyQR.beautify', function() {
		const active = vscode.window.activeTextEditor;
		if (!active) return;
		const doc = active.document;
		if (!doc) return;
		//get a settings file
		let base = vscode.workspace.rootPath;

		if (!doc.isUntitled) base = doc.fileName;

		//get the type of beautify to be done
		getBeautifyType(doc)
			.then(type => {
				if (!type) return; //user skipped the selection
				let beautFile;
				if (base) beautFile = findRecursive(base, ".jsbeautifyrc");
				//walk to find a .jsbeautifyrc
				if (beautFile) fs.readFile(beautFile, function(ee, d) {
					if (!d) d = "{}";
					let opts = {};
					try {
						const unCommented = dropComments(d.toString());
						opts = JSON.parse(unCommented);
						opts = mergeOpts(opts, type);
					} catch (e) {
						vscode.window.showWarningMessage("Found a .jsbeautifyrc file, but it didn't parse correctly.");
						opts = {}; //just use the default opts
					}
					doBeautify(active, doc, type, opts);
				});
				else doBeautify(active, doc, type, {});
			});
	});
	context.subscriptions.push(disposable);
}
exports.activate = activate;
