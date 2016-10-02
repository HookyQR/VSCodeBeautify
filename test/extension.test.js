'use strict';
const vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	testData = require('./testData');

const slow = 700;
const root = path.join(path.dirname(__filename), 'data', '');

const lag = () => new Promise(resolve => setTimeout(resolve, slow / 2));

const setupConfigs = (beautify, editor) => {
	fs.writeFileSync(path.join(root, '.jsbeautifyrc'), beautify ? JSON.stringify(beautify) : '');
	fs.writeFileSync(path.join(root, '.editorconfig'), editor ? editor : '');
	return lag();
};

vscode.window.onDidChangeActiveTextEditor(editor => {
	if (!editor.document.test || !editor.document.test.eol) return;
	const eol = editor.document.test.eol;
	const cmd = editor.document.test.cmd;
	return editor.edit(te => te.setEndOfLine(eol))
		.then(() => {
			return vscode.commands.executeCommand(cmd)
				.then(() => {
					const doc = editor.document;
					const resolve = doc.test.resolve;
					// somehow, calling this stops the timeout errors. Go figure
					const t = process.hrtime(doc.test.t);
					const txt = doc.getText();
					return vscode.commands.executeCommand('workbench.action.closeAllEditors')
						.then(() => resolve(txt));
				});
		});
});

const executeWithCommand = (cmd, name, eol) => vscode.workspace.openTextDocument(name)
	.then(doc => new Promise(resolve => {
		vscode.window.showTextDocument(doc);
		doc.test = {
			cmd,
			eol,
			resolve,
			t: process.hrtime()
		};
	}));

const getBeautifiedText = (name, eol) => executeWithCommand('HookyQR.beautify', name, eol);
const getFormattedText = (name, eol) => executeWithCommand('editor.action.format', name, eol);

function beautifyEach(fmt) {
	testData.types.forEach(function(ext) {
		it(`For '${ext}' "beautify" changes for ${fmt[0]}`, function() {
			return getBeautifiedText(path.join(root, 'test.' + ext), fmt[1])
				.then(txt => expect(txt)
					.to.be(testData.expected(fmt[0], ext)));
		});
	});
}

function formatEach(fmt) {
	testData.types.forEach(function(ext) {
		it(`For '${ext}' "format" changes for ${fmt[0]}`, function() {
			return getFormattedText(path.join(root, 'test.' + ext), fmt[1])
				.then(txt => expect(txt)
					.to.be(testData.expected(fmt[0], ext)));
		});
	});
}

describe("VS code beautify", function() {
	this.timeout(slow * 2);
	this.slow(slow);
	before(() => {
		testData.clean(root);
		vscode.commands.executeCommand("workbench.action.toggleSidebarVisibility");
	});
	let eolstr = {
		"\\n": ["lf", vscode.EndOfLine.LF],
		"\\r\\n": ["crlf", vscode.EndOfLine.CRLF]
	};
	Object.keys(eolstr)
		.forEach(eol => {
			let config = {
				jsbeautify: [{
					eol: eol
					}, `root = true\r\n[*]\r\nend_of_line = lf\r\nindent_style = tab\r\nindent_size = 2\r\n`],
				editorconfig: [null,
					`root = true\r\n[*]\r\nend_of_line = ${eolstr[eol][0]}\r\nindent_style = space\r\nindent_size = 4`],
				'vs code': [null, ""]
			};
			Object.keys(config)
				.forEach(cfg => {
					context(`with ${cfg} cr set to '${eol}'`, function() {
						before(() => setupConfigs(config[cfg][0], config[cfg][1], config[cfg][2]));
						beautifyEach(eolstr[eol]);
						formatEach(eolstr[eol]);
					});
				});
		});
	let config = {
		jsbeautify: [{
			eol: "\n",
			indent_with_tabs: true
		}, ""],
		editorconfig: [null, `root = true\r\n[*]\r\nend_of_line = lf\r\nindent_style = tab\r\nindent_size = 2\r\n`]
	};
	Object.keys(config)
		.forEach(cfg => {
			context(`with ${cfg} indent set to 'tab'`, function() {
				this.timeout(slow * testData.types.length + 1000);
				this.slow(slow);
				before(() => setupConfigs(config[cfg][0], config[cfg][1], config[cfg][2]));
				beautifyEach(['tab', vscode.EndOfLine.LF]);
				formatEach(['tab', vscode.EndOfLine.LF]);
			});
		});
});
/*
describe('with empty .jsbeautify', function() {
	this.timeout(4000);
	this.slow(400);
	before(() => setupConfigs("{}", ""));
	['.js', '.html', '.json', '.css', '.scss'].forEach(extension =>
		it('beautify of "' + extension + "'", () => getBeautifiedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));

	['.js', '.html', '.json', '.css', '.scss'].forEach(extension =>
		it('format of "' + extension + "'", () => getFormattedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));
});

describe('with nested options in .jsbeautify', function() {
	this.timeout(4000);
	this.slow(200);
	before(() => setupConfigs(
		`{
			"indent_with_tabs": true,
			"eol": "\\r\\n",
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
		}`,
		""));
	['.js', '.html', '.json', '.css', '.scss'].forEach(extension =>
		it('beautify of "' + extension + "'", () => getBeautifiedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out.2' + extension), 'utf8')))));
});

describe('with editorconfig', function() {
	this.timeout(4000);
	this.slow(200);
	before(() => setupConfigs(
		`{
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
		}`,
		`
[*]
end_of_line = crlf
insert_final_newline = true
indent_style = tab
	`
	));
	['.js', '.html', '.json', '.css', '.scss'].forEach(extension =>
		it('beautify of "' + extension + "'", () => getBeautifiedText(path.join(root, 'in' + extension))
			.then(txt => expect(txt)
				.to.be(fs.readFileSync(path.join(root, 'out' + extension), 'utf8')))));
})

// On save tests don't work on CI
describe('on save', function() {
	this.timeout(16000);
	before(() => fs.writeFileSync(path.join(root, '.jsbeautifyrc'), "{}"));
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
		this.slow(500);
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
		this.slow(500);
		before(done => {
			fs.writeFileSync(path.join(root, '.vscode', 'settings.json'), '{"beautify.onSave": ["js","html"]}');
			//wait for vscodde to read the workspace settings
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
		['.json', '.css', '.scss'].forEach(extension => {
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
