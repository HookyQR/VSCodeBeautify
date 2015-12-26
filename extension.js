"use strict";
var vscode = require('vscode');
var beautify = require('js-beautify');
var path = require('path');
var fs = require('fs');

function findRecursive(dir, fileName) {
	var fullPath = path.join(dir, fileName);
	var nextDir = path.dirname(dir);
	var result = fs.existsSync(fullPath) ? fullPath : null;
	if (!result && (nextDir !== dir)) {
		result = findRecursive(nextDir, fileName);
	}
	return result;
}
var dropComments = inText => inText.replace(/(\/\*.*\*\/)|\/\/.*(?:[\r\n]|$)/g, "");

//register on activation
function activate(context) {
	var mergeOpts = function(opts, type) {
		var finOpts = {};
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
	var getBeautifyType = function(doc) {
		return Promise.resolve()
			.then(() => {
				var type = doc.isUntitled ? "" : doc.fileName.split('.')
					.pop()
					.toLowerCase();
				var cfg = vscode.workspace.getConfiguration('beautify');
				//if a type is set on the window, use that
				//check if the file is in the users json schema set
				var jsSchema = vscode.workspace.getConfiguration('json')
					.schemas;
				if (jsSchema) {
					var matcher = [];
					var extMatch = n => ({
						pattern: n.startsWith("**/") ? n : ("**/" + n)
					});
					jsSchema.forEach(schema => {
						if (typeof schema.fileMatch === 'string') {
							matcher.push(extMatch(schema.fileMatch));
						} else {
							var t = schema.fileMatch.map(extMatch);
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
	var doBeautify = function(active, doc, type, opts) {
		var original = doc.getText();
		//get the whole file:
		var range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
		var result = beautify[type](original, opts);
		//and make the change:
		active.edit(editor => editor.replace(range, result));
	};
	//it's ok to build and pass the re from outside of here, we always run
	//to completion.
	var disposable = vscode.commands.registerCommand('HookyQR.beautify', function() {
		var active = vscode.window.activeTextEditor;
		if (!active) return;
		var doc = active.document;
		if (!doc) return;
		//get a settings file
		var base = vscode.workspace.rootPath;

		if (!doc.isUntitled) base = doc.fileName;

		//get the type of beautify to be done
		getBeautifyType(doc)
			.then(type => {
				if (!type) return; //user skipped the selection
				var beautFile;
				if (base) beautFile = findRecursive(base, ".jsbeautifyrc");
				//walk to find a .jsbeautifyrc
				if (beautFile) fs.readFile(beautFile, function(ee, d) {
					if (!d) d = "{}";
					var opts = {};
					try {
						var unCommented = dropComments(d.toString());
						console.log(unCommented);
						opts = JSON.parse(unCommented);
						opts = mergeOpts(opts, type);
						console.log(opts);
					} catch (e) {
						console.log(e.message);
						//put a warning in here
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
