// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	
	
	var disposable = vscode.commands.registerCommand('HookyQR.beautify', function () {
		// The code you place here will be executed every time your command is executed
		//walk to find a .jsbeautifyrc
		
		var active = vscode.window.activeTextEditor;
		if (!active) return;
		var doc = active.document;
		if (!doc) return;
		//get a settings file
		var base = vscode.workspace.rootPath;
		if (!doc.isUntitled) base = doc.fileName;
		var beautFile = findRecursive(base, ".jsbeautifyrc");
		if (beautFile) fs.readFile(beautFile, function (ee, d) {
			if (ee && !d) d = "{}";
			var better = doc.getText();
			var opts = {};
			try {
				opts = JSON.parse(d.toString());
			} catch (e) {
				opts = {};//just use the default opts
			}
			var type = doc.isUntitled ? "js" : doc.fileName.split('.').pop();

			if (type === 'htm' || type === 'html') better = beautify.html(better, opts);
			else if (type === 'css') better = beautify.css(better, opts);
			else if (type === 'js') better = beautify.js(better, opts);
			else return;
			//get the whole file:
			var range = new vscode.Range(new vscode.Position(0, 0), doc.positionAt(Infinity));
			//and make the change:
			active.edit(editor=> editor.replace(range, better));
		});
	});
	context.subscriptions.push(disposable);
}
exports.activate = activate;