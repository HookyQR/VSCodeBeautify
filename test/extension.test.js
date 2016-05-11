'use strict';
let vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs');

let root = path.join(path.dirname(__filename), 'data');

describe('with empty .jsbeautify', () => {
	beforeEach(() => fs.writeFileSync(path.join(root, '.jsbeautifyrc'), "{}"));
	
	['.js', '.html', '.json', '.css'].forEach(extension =>
		it('beautify of "' + extension + "'", () => vscode.workspace.openTextDocument(path.join(root, 'in' + extension))
			.then(doc => vscode.window.showTextDocument(doc)
				.then(() => vscode.commands.executeCommand('HookyQR.beautify')
					.then(() => expect(doc.getText())
						.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))))));

	['.html', '.css'].forEach(extension =>
		it('format of "' + extension + "'", () => vscode.workspace.openTextDocument(path.join(root, 'in' + extension))
			.then(doc => vscode.window.showTextDocument(doc)
				.then(() => vscode.commands.executeCommand('editor.action.format')
					.then(() => expect(doc.getText())
						.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))))));
});

describe('with nested options in .jsbeautify', () => {
	beforeEach(() => fs.writeFileSync(path.join(root, '.jsbeautifyrc'),
		`{
	"indent_with_tabs": true,
	"css": {
		"selector_separator_newline": true
	},
	"js": {
		"break_chained_methods": true,
		"max_preserve_newlines": 2
	},
	"html": {
		"brace_style": "none",
		"preserve_newlines": false
	}
}`
	));

	['.js', '.html', '.json', '.css'].forEach(extension =>
		it('beautify of "' + extension + "'", () => vscode.workspace.openTextDocument(path.join(root, 'in' + extension))
			.then(doc => vscode.window.showTextDocument(doc)
				.then(() => vscode.commands.executeCommand('HookyQR.beautify')
					.then(() => expect(doc.getText())
						.to.be(fs.readFileSync(path.join(root, 'out.2' + extension), 'utf8')))))));

});