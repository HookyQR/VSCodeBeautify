'use strict';
const vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	testData = require('./testData'),
	os = require('os');

const slow = 10 * (1000000 / os.cpus()
	.slice(0, 4)
	.reduce((t, cpu) => t + cpu.speed, 0)) | 0;

const root = path.join(__dirname, 'data', '');

const lag = () => new Promise(resolve => setTimeout(resolve, slow / 4 | 0));

const setupConfigs = (beautify, editor) => {
	fs.writeFileSync(path.join(root, '.jsbeautifyrc'), beautify ? JSON.stringify(beautify) : '');
	fs.writeFileSync(path.join(root, '.editorconfig'), editor ? editor : '');
	return lag();
};

const executeWithCommand = (cmd, texteditorAction, name, eol) => vscode.workspace.openTextDocument(name)
	.then(doc => vscode.window.showTextDocument(doc)
		.then(editor => {
			return editor.edit(te => {
					te.setEndOfLine(eol);
					if (texteditorAction) return texteditorAction(te)
						.then(lag);
				})
				.then(() => vscode.commands.executeCommand(cmd)
					.then(() => doc.getText()));
		}));

const getPartialBeautifiedText = (name, eol) => executeWithCommand(
	'HookyQR.beautify', () => vscode.commands.executeCommand(
		'cursorMove', {
			to: 'right',
			by: 'character',
			amount: 1,
			select: true
		}), name, eol);

const getBeautifiedText = (name, eol) => executeWithCommand('HookyQR.beautifyFile', null, name, eol);
const getFormattedText = (name, eol) => executeWithCommand('editor.action.formatDocument', null, name, eol);
const getOnSaveText = (name, eol) => executeWithCommand('workbench.action.files.save', te => {
		te.setEndOfLine(eol);
		te.insert(new vscode.Position(Infinity, Infinity), ' ');
		return Promise.resolve();
	}, name, eol)
	.then(lag)
	.then(() => fs.readFileSync(name, "utf8"));

function beautifyEach(fmt) {
	testData.types.forEach(function(ext) {
		it(`For '${ext}' "beautifyFile" changes for ${fmt[0]}`, function() {
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

function beautifyPartialEach(fmt) {
	testData.types.forEach(function(ext) {
		it(`For '${ext}' "beautify" changes for ${fmt[0]}`, function() {
			return getPartialBeautifiedText(path.join(root, 'test.' + ext), fmt[1])
				.then(txt => expect(txt)
					.to.be(testData.expected(fmt[0], ext)));
		});
	});
}

function doSaveEach(fmt) {
	testData.types.forEach(function(ext) {
		it(`For '${ext}' "beautify on save" changes`, function() {
			return getOnSaveText(path.join(root, 'test.' + ext), fmt[1])
				.then(txt => expect(txt)
					.to.be(testData.expected(fmt[0], ext)));
		});
	});
}

const clean = () => vscode.commands.executeCommand('workbench.action.closeAllEditors')
	.then(() => testData.clean(root));

// delay test start to give vscode a chance to load (For Travis OSX)
describe("VS code beautify", function() {
	this.timeout(slow * 2);
	this.slow(slow);
	before(() => {
		testData.clean(root);
		vscode.commands.executeCommand("workbench.action.toggleSidebarVisibility");
	});

	let eolstr = {
		"\n": ["lf", vscode.EndOfLine.LF],
		"\r\n": ["crlf", vscode.EndOfLine.CRLF]
	};
	Object.keys(eolstr)
		.forEach(eol => {
			let config = {
				jsbeautify: [{
					indent_size: 4,
					indent_with_tabs: false,
					eol
					}, null],
				editorconfig: [null,
					`root = true\r\n[*]\r\nend_of_line = ${eolstr[eol][0]}\r\nindent_style = space\r\nindent_size = 4`],
				'vs code': [null, ""]
			};
			Object.keys(config)
				.forEach(cfg => {
					context(`with ${cfg} cr set to ${JSON.stringify(eol)}`, function() {
						before(() => setupConfigs(config[cfg][0], config[cfg][1]));
						context('beautify', function() {
							after(clean);
							beautifyEach(eolstr[eol]);
						});
						// this combo doesn't work on AV.
						// There are some conversion errors that seem to happen in
						// the editor.
						if (process.platform === 'win32' && cfg === 'vs code' && eol === "\n") return;
						context('format', function() {
							after(clean);

							formatEach(eolstr[eol]);
						});
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
				context('beautify', function() {
					after(clean);
					beautifyEach(['tab', vscode.EndOfLine.LF]);
				});
				context('format', function() {
					after(clean);
					formatEach(['tab', vscode.EndOfLine.LF]);
				});
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
		}));
		context('beautify', function() {
			after(clean);
			beautifyEach(['nested', vscode.EndOfLine.CRLF]);
		});
		context('format', function() {
			after(clean);
			formatEach(['nested', vscode.EndOfLine.CRLF]);
		});
	});

	context('Using `config` setting', function() {
		const config = vscode.workspace.getConfiguration();
		let revert = config.get("beautify.config");

		before(() => fs.renameSync(path.join(root, ".jsbeautifyrc"), path.join(root, "tmp.jsbeautifyrc")));
		after(() => fs.renameSync(path.join(root, "tmp.jsbeautifyrc"), path.join(root, ".jsbeautifyrc")));

		context('with file name', function() {
			before(() => config.update("beautify.config", path.join(root, "jsbeautify_config.json"))
				.then(lag));
			beautifyEach(['tab', vscode.EndOfLine.LF]);
			after(() => clean()
				.then(() => config.update("beautify.config", revert)));
		});

		context('with inline settings', function() {
			before(() => config.update("beautify.config", {
					"eol": "\n",
					"indent_with_tabs": true
				})
				.then(lag));
			after(() => clean()
				.then(() => config.update("beautify.config", revert)));
			beautifyEach(['tab', vscode.EndOfLine.LF]);
		});
	});

	context('partial', function() {
		before(() => setupConfigs({
			eol: "\r\n",
			indent_with_tabs: false,
			indent_size: 2
		}));
		after(clean);
		beautifyPartialEach(['partial', vscode.EndOfLine.LF]);
	});

	context('on save', function() {
		this.timeout(slow * 4);
		this.slow(slow * 2);
		const config = vscode.workspace.getConfiguration();
		before(() => config.update("editor.formatOnSave", true)
			.then(() => setupConfigs({
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
			})));
		after(() => config.update("editor.formatOnSave", false)
			.then(clean));
		doSaveEach(['nested', vscode.EndOfLine.CRLF]);
	});
});
