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
		var original = doc.getText();
		var type = doc.isUntitled ? "" : doc.fileName.split('.')
			.pop()
			.toLowerCase();
		var cfg = vscode.workspace.getConfiguration('beautify');
		//if a type is set on the window, use that
		//check if the file is in the users json schema set
		var jsSchema = vscode.workspace.getConfiguration('json')
			.schemas;
		//get the whole file:
		var range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
		var result;
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
				result = beautify.js(original, opts);
				//get the whole file:
				range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
				//and make the change:
				active.edit(editor => editor.replace(range, result));
				return;
			}
		}
		if (cfg.HTMLfiles.indexOf(type) + 1) {
			result = beautify.html(original, opts);
		} else if (cfg.CSSfiles.indexOf(type) + 1) {
			result = beautify.css(original, opts);
		} else if (cfg.JSfiles.indexOf(type) + 1) {
			result = beautify.js(original, opts);
		} else {
			//Ask what they want to do:
			vscode.window.showQuickPick([{
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
					result=beautify[choice.label.toLowerCase()](original, opts);
					
					active.edit(editor => editor.replace(range, result));
				});
			return;
		}
		//and make the change:
		active.edit(editor => editor.replace(range, result));
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
