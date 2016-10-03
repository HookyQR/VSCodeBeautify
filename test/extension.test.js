'use strict';
const vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	testData = require('./testData');

const slow = 700 + (process.platform === 'win32' ? 200 : 0);
const root = path.join(__dirname, 'data', '');

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
const getOnSaveText = (name, eol) => vscode.workspace.openTextDocument(name)
	.then(doc => vscode.window.showTextDocument(doc)
	.then(editor => editor.edit(te => {
		te.setEndOfLine(eol);
		te.insert(doc.positionAt(Infinity), ' ');
	})))
	.then(() => vscode.commands.executeCommand('workbench.action.files.save'))
	.then(lag)
	.then(() => vscode.commands.executeCommand('workbench.action.closeAllEditors'))
	.then(lag)
	.then(() => fs.readFileSync(name, "utf8"));

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
			// inbuild format command doesn't allow beautify to run. Maybe in 1.6?
		if (ext === 'json') return;
		it(`For '${ext}' "format" changes for ${fmt[0]}`, function() {
			return getFormattedText(path.join(root, 'test.' + ext), fmt[1])
				.then(txt => expect(txt)
					.to.be(testData.expected(fmt[0], ext)));
		});
	});
}

function doSaveEach(fmt) {
	testData.types.forEach(function(ext) {
		//if (ext === 'js') return;
		it(`For '${ext}' "beautify on save" changes`, function() {
			return getOnSaveText(path.join(root, 'test.' + ext), fmt[1])
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
						before(() => setupConfigs(config[cfg][0], config[cfg][1]));
						beautifyEach(eolstr[eol]);
						//this combo doesn't work on AV. Seems there's another formatter being called
						if (process.platform === 'win32' && cfg === 'vs code' && eol === "\\n") return;
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
				before(() => setupConfigs(config[cfg][0], config[cfg][1]));
				beautifyEach(['tab', vscode.EndOfLine.LF]);
				formatEach(['tab', vscode.EndOfLine.LF]);
			});
		});
	// nested config
	context('with nested config', function() {
		before(() => setupConfigs({
			js: {
				indent_size: 5
			},
			css: {
				indent_size: 4
			},
			html: {
				indent_size: 3
			},
			eol: "\r\n",
			indent_with_tabs: false,
			indent_size: 2
		}, ""));
		beautifyEach(['nested', vscode.EndOfLine.CRLF]);
		formatEach(['nested', vscode.EndOfLine.CRLF]);
	});
	context('on save', function() {
		let preconfig;
		before(() => {
			preconfig = fs.readFileSync(path.join(__dirname, '.vscode', 'settings.json'), 'utf8');
			const asObj = JSON.parse(preconfig);
			asObj["beautify.onSave"] = true;
			fs.writeFileSync(path.join(__dirname, '.vscode', 'settings.json'), JSON.stringify(asObj));
			return setupConfigs({
				js: {
					indent_size: 5
				},
				css: {
					indent_size: 4
				},
				html: {
					indent_size: 3
				},
				eol: "\r\n",
				indent_with_tabs: false,
				indent_size: 2
			}, "");
		});
		after(() => {
			fs.writeFileSync(path.join(__dirname, '.vscode', 'settings.json'), preconfig);
			testData.clean(root);
		});
		doSaveEach(['nested', vscode.EndOfLine.CRLF]);
	});
});
/*
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
		}); */
