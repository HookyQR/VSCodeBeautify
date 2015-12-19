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
//register on activation
function activate(context) {

	var doBeautify = function(active, doc, opts) {
		var better = doc.getText();
		var type = doc.isUntitled ? "js" : doc.fileName.split('.')
			.pop()
			.toLowerCase();
		var cfg = vscode.workspace.getConfiguration('beautify');
		//if a type is set on the window, use that
		console.log(vscode.window.activeTextEditor);
		//check if the file is in the users json schema set
		var jsSchema = vscode.workspace.getConfiguration('json')
			.schemas;
		var range;
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
				//beautify as javascript
				better = beautify.js(better, opts);
				//get the whole file:
				range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
				//and make the change:
				active.edit(editor => editor.replace(range, better));
			}
		}
		if (cfg.HTMLfiles.indexOf(type) + 1) {
			better = beautify.html(better, opts);
		} else if (cfg.CSSfiles.indexOf(type) + 1) {
			better = beautify.css(better, opts);
		} else if (cfg.JSfiles.indexOf(type) + 1) {
			better = beautify.js(better, opts);
		} else return;
		//get the whole file:
		range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
		//and make the change:
		active.edit(editor => editor.replace(range, better));
	};

	var disposable = vscode.commands.registerCommand('HookyQR.beautify', function() {
		var active = vscode.window.activeTextEditor;
		if (!active) return;
		var doc = active.document;
		if (!doc) return;
		//get a settings file
		var base = vscode.workspace.rootPath;

		if (!doc.isUntitled) base = doc.fileName;
		var beautFile;
		if (base) beautFile = findRecursive(base, ".jsbeautifyrc");

		//walk to find a .jsbeautifyrc
		if (beautFile) fs.readFile(beautFile, function(ee, d) {
			if (ee && !d) d = "{}";
			var opts = {};
			try {
				opts = JSON.parse(d.toString());
			} catch (e) {
				opts = {}; //just use the default opts
			}
			doBeautify(active, doc, opts);
		});
		else doBeautify(active, doc, {});
	});
	context.subscriptions.push(disposable);
}
exports.activate = activate;
