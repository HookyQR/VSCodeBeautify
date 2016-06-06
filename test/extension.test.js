'use strict';
const vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs');

const getBeautifiedText = name => vscode.workspace.openTextDocument(name)
	.then(doc => vscode.window.showTextDocument(doc)
		.then(() => vscode.commands.executeCommand('HookyQR.beautify'))
		.then(() => doc.getText()));

const getFormattedText = name => vscode.workspace.openTextDocument(name)
	.then(doc => vscode.window.showTextDocument(doc)
		.then(() => vscode.commands.executeCommand('editor.action.format'))
		.then(() => doc.getText()));

const root = path.join(path.dirname(__filename), 'data', '');

describe('with empty .jsbeautify', function() {
	this.timeout(4000);
	this.slow(400);
	before(() => fs.writeFileSync(path.join(root, '.jsbeautifyrc'), "{}"));
	['.js', '.html', '.json', '.css'].forEach(extension =>
		it('beautify of "' + extension + "'", () => getBeautifiedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));

	['.html', '.css'].forEach(extension =>
		it('format of "' + extension + "'", () => getFormattedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));
});

describe('with nested options in .jsbeautify', function() {
	this.timeout(4000);
	this.slow(200);
	before(() => fs.writeFileSync(path.join(root, '.jsbeautifyrc'),
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
		it('beautify of "' + extension + "'", () => getBeautifiedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out.2' + extension), 'utf8')))));

});
/* On save tests don't work on CI
describe('on save', function () {
	this.timeout(16000);
	before(()=>fs.writeFileSync(path.join(root, '.jsbeautifyrc'), "{}"));
	describe('saving a file with onSave true', function() {
		this.timeout(4000);
		this.slow(350);
		before(done => {
			fs.writeFileSync(path.join(root, '.vscode', 'settings.json'), '{"beautify.onSave": true}');
			fs.writeFileSync(path.join(root, '.jsbeautifyrc'), "{}");
			setTimeout(done, 400);
		});
		['.js', '.html', '.json', '.css'].forEach(extension => {
			vscode.workspace.getConfiguration('beautify');
			it('beautify of "' + extension + "'", () => vscode.workspace.openTextDocument(path.join(root, 'in_out' +
					extension))
				.then(doc => vscode.window.showTextDocument(doc)
					.then(editor =>
						editor.edit(edit => edit.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(10000)), fs.readFileSync(
							path.join(root, 'in' + extension), 'utf8') + ' ')))
					.then(() => doc.save())
					//have to wait for the second save
					.then(() => new Promise(r => setTimeout(r, 50)))
					.then(() => expect(doc.getText())
						.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));
		});
	});
	describe('saving a file with onSave false', function() {
		this.timeout(4000);
		this.slow(350);
		before(done => {
			fs.writeFileSync(path.join(root, '.vscode', 'settings.json'), '{"beautify.onSave": false}');
			//wait for vscodde toread the workspace settings
			setTimeout(done, 400);
		});
		['.js', '.html', '.json', '.css'].forEach(extension => {
			it('no beautify of "' + extension + "'", () =>
				vscode.workspace.openTextDocument(path.join(root, 'in_out' +
					extension))
				.then(doc => vscode.window.showTextDocument(doc)
					.then(editor =>
						editor.edit(edit => edit.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(10000)), fs.readFileSync(
							path.join(root, 'in' + extension), 'utf8') + ' ')))
					.then(() => doc.save())
					//have to wait for the second save (to not happen here)
					.then(() => new Promise(r => setTimeout(r, 50)))
					.then(() => expect(doc.getText())
						.to.eql(fs.readFileSync(path.join(root, 'in' + extension), 'utf8') + ' '))));
		});
	});

	describe('saving a file with onSave specific', function() {
		this.timeout(4000);
		this.slow(350);
		before(done => {
			fs.writeFileSync(path.join(root, '.vscode', 'settings.json'), '{"beautify.onSave": ["js","html"]}');
			//wait for vscodde toread the workspace settings
			setTimeout(done, 400);
		});
		['.js', '.html'].forEach(extension => {
			it('no beautify of "' + extension + "'", () =>
				vscode.workspace.openTextDocument(path.join(root, 'in_out' +
					extension))
				.then(doc => vscode.window.showTextDocument(doc)
					.then(editor =>
						editor.edit(edit => edit.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(10000)), fs.readFileSync(
							path.join(root, 'in' + extension), 'utf8') + ' ')))
					.then(() => doc.save())
					//have to wait for the second save
					.then(() => new Promise(r => setTimeout(r, 50)))
					.then(() => expect(doc.getText())
						.to.eql(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));
		});
		['.json', '.css'].forEach(extension => {
			it('no beautify of "' + extension + "'", () =>
				vscode.workspace.openTextDocument(path.join(root, 'in_out' +
					extension))
				.then(doc => vscode.window.showTextDocument(doc)
					.then(editor =>
						editor.edit(edit => edit.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(10000)), fs.readFileSync(
							path.join(root, 'in' + extension), 'utf8') + ' ')))
					.then(() => doc.save())
					//have to wait for the second save (to not happen here)
					.then(() => new Promise(r => setTimeout(r, 50)))
					.then(() => expect(doc.getText())
						.to.eql(fs.readFileSync(path.join(root, 'in' + extension), 'utf8') + ' '))));
		});
	});
});
*/