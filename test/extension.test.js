'use strict';
const vscode = require('vscode'),
	expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	testData = require('./testData');

const slow = 800;
const root = path.join(path.dirname(__filename), 'data', '');

const setupConfigs = (beautify, editor, code, done) => {
	beautify = beautify || "";
	editor = editor || "";
	code = code || "{}";
	fs.writeFileSync(path.join(root, '.jsbeautifyrc'), beautify);
	fs.writeFileSync(path.join(root, '.editorconfig'), editor);
	fs.writeFileSync(path.join(root, '.vscode', 'settings.json'), code);
	setTimeout(done, 100);
};

const executeWithCommand = (cmd, name, eol) => vscode.workspace.openTextDocument(name)
	.then(doc => vscode.window.showTextDocument(doc)
		.then(() => new Promise(resolve => setTimeout(resolve, 200)))
		// the existance of this setting sucks
		.then(() => vscode.window.activeTextEditor.edit(te => te.setEndOfLine(eol)))
		.then(() => vscode.commands.executeCommand(cmd))
		.then(() => new Promise(resolve => setTimeout(resolve, 200)))
		.then(() => doc.getText())
		.then(txt => vscode.commands.executeCommand('workbench.action.closeAllEditors')
			.then(() => txt)));

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
				jsbeautify: [`{"eol":"${eol}"}`, "",
					'{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false }'],
				editorconfig: ["", `root = true\r\n[*]\r\nend_of_line = ${eolstr[eol][0]}\r\nindent_style = space\r\nindent_size = 4`,
					'{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false, "beautify.editorconfig": true}'
					],
				'vs code': ["", "",
					`{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false, "files.eol": "${eol}", "editor.tabSize": 4}`
					]
			};
			Object.keys(config)
				.forEach(cfg => {
					context(`with ${cfg} cr set to '${eol}'`, function() {
						this.timeout(slow * testData.types.length + 1000);
						this.slow(slow);
						before(done => setupConfigs(config[cfg][0], config[cfg][1], config[cfg][2], done));
						beautifyEach(eolstr[eol]);
						formatEach(eolstr[eol]);
					});
				});
		});
	let config = {
		jsbeautify: [`{"eol":"\\n", "indent_with_tabs": true}`, "",
			'{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false }'],
		editorconfig: ["", `root = true\r\n[*]\r\nend_of_line = lf\r\nindent_style = tab\r\n`,
			'{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false, "beautify.editorconfig": true}'],
		'vs code': ["", "",
			`{"editor.detectIndentation": false, "telemetry.enableCrashReporter": false, "telemetry.enableTelemetry": false, "files.eol": "\\n", "editor.insertSpaces": false}`
			]
	};
	Object.keys(config)
		.forEach(cfg => {
			context(`with ${cfg} indent set to 'tab'`, function() {
				this.timeout(slow * testData.types.length + 1000);
				this.slow(slow);
				before(done => setupConfigs(config[cfg][0], config[cfg][1], config[cfg][2], done));
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
