"use strict";
const vscode = require('vscode'),
	beautify = require('js-beautify'),
	options = require('./options'),
	minimatch = require('minimatch'),
	path = require('path');
const dumpError = e => {
	//	if (e) console.log('beautify err:', e);
};

const getBeautifyType = () => {
	return vscode.window.showQuickPick([
			{ label: "JS", description: "Does JavaScript and JSON" },
			{ label: "CSS", description: "Does CSS and SCSS" },
			{ label: "HTML" }], {
			matchOnDescription: true,
			placeHolder: "Couldn't determine type to beautify, please choose."
		})
		.then(choice => {
			if (!choice || !choice.label) throw 'no beautify type selected';
			return choice.label.toLowerCase();
		});
};

const beautifyDocRanges = (doc, ranges, type, formattingOptions) => {
	if (!doc) {
		vscode.window.showInformationMessage(
			"Beautify can't get the file information because the editor won't supply it. (File probably too large)");
		throw "";
	}
	return Promise.resolve(type ? type : getBeautifyType())
		.then(type => options(doc, type, formattingOptions)
			.then(config => Promise.all(ranges.map(range =>
				beautify[type](doc.getText(range), config)))));
};

const documentEdit = (range, newText) => [vscode.TextEdit.replace(range, newText)];

const extendRange = (doc, rng) => {
	let end = rng.end;
	if (end.character === 0) end = end.translate(-1, Number.MAX_VALUE);
	else end = end.translate(0, Number.MAX_VALUE);
	const r = new vscode.Range(new vscode.Position(rng.start.line, 0), end);
	return doc.validateRange(r);
};

const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));

// gets bound
function fullEdit(type, doc, formattingOptions) {
	let name = doc.fileName;
	let base = vscode.workspace.rootPath || '';
	let ignore = vscode.workspace.getConfiguration('beautify')
		.ignore;
	if (!Array.isArray(ignore)) ignore = [ignore];
	if (base && name.startsWith(base)) name = path.relative(base, name);
	if (ignore.some(glob => minimatch(name, glob))) return [];

	const rng = fullRange(doc);
	return beautifyDocRanges(doc, [rng], type, formattingOptions)
		.then(newText => documentEdit(rng, newText[0]), dumpError);
}

function rangeEdit(type, doc, rng, formattingOptions) {
	// Fixes bug #106
	rng = extendRange(doc, rng);
	return beautifyDocRanges(doc, [rng], type, formattingOptions)
		.then(newText => documentEdit(rng, newText[0]), dumpError);
}

const register = (type, selector, partial) => {
	if (partial) return vscode.languages.registerDocumentRangeFormattingEditProvider(selector, {
		provideDocumentRangeFormattingEdits: rangeEdit.bind(0, type)
	});
	else return vscode.languages.registerDocumentFormattingEditProvider(selector, {
		provideDocumentFormattingEdits: fullEdit.bind(0, type)
	});
};

class Formatters {
	constructor() {
		this.available = {
			js: beautify.js,
			css: beautify.css,
			html: beautify.html
		};
		this.configTypes = {
			type: 1,
			ext: 1,
			filename: 1
		};
		this.handlers = {};
	}
	onFileOpen(doc) {
		for (let a in this.handlers) {
			if (vscode.languages.match(this.handlers[a].selector, doc)) {
				// drop and re-register this one
				this.handlers[a].full.dispose();
				this.handlers[a].partial.dispose();
				this.handlers[a].full = register(a, this.handlers[a].selector);
				this.handlers[a].partial = register(a, this.handlers[a].selector, true);
				return a;
			}
		}
	}
	configure() {
		let beautifyCfg = vscode.workspace.getConfiguration('beautify');
		let cfg = beautifyCfg.language;
		let js = beautifyCfg.JSFiles;
		let css = beautifyCfg.CSSFiles;
		let html = beautifyCfg.HTMLFiles;
		if (js || css || html) {
			cfg = {};
			if (js) cfg.js = { ext: js };
			if (css) cfg.css = { ext: css };
			if (html) cfg.html = { ext: html };
			vscode.window.showInformationMessage(
					"`beautify.*Files` setting is deprecated. please use `beautify.language` instead. Open settings ->",
					"Global", "Workspace")
				.then(open => {
					if (open) vscode.commands.executeCommand(`workbench.action.open${open}Settings`);
				}, dumpError);
		}
		cfg = cfg || {};
		this.dispose();
		for (let a in cfg) {
			if (!(a in this.available)) continue;
			// dispose of the current
			let selector = [];
			if (Array.isArray(cfg[a])) {
				selector = [].concat(cfg[a]);
			} else {
				for (let b in cfg[a]) {
					let adder;
					switch (b) {
						case 'type':
							adder = cfg[a][b];
							break;
						case 'ext':
							adder = [{ pattern: `**/*.{${cfg[a][b].join(',')}}` }];
							break;
						case 'filename':
							adder = [{ pattern: `**/{${cfg[a][b].join(',')}}` }];
							break;
						default:
							continue;
					}
					selector = selector.concat(adder);
				}
			}
			this.handlers[a] = {
				selector,
				full: register(a, selector),
				partial: register(a, selector, true)
			};
		}
	}
	getFormat(doc) {
		for (let a in this.handlers) {
			if (vscode.languages.match(this.handlers[a].selector, doc)) return a;
		}
	}
	dispose() {
		for (let a in this.handlers) {
			this.handlers[a].full.dispose();
			this.handlers[a].partial.dispose();
		}
		this.handlers = {};
	}
}

const formatters = new Formatters();
formatters.configure();

const applyEdits = (editor, ranges, edits) => {
	if (ranges.length !== edits.length) {
		console.log("FAILED:", ranges.length, edits.length, ":failed");
		vscode.window.showInformationMessage(
			"Beautify ranges didin't get back the right number of edits");
		throw "";
	}
	return editor.edit(editorEdit => {
		for (let i = 0; i < ranges.length; i++) {
			editorEdit.replace(ranges[i], edits[i]);
		}
	});
};

const formatActiveDocument = ranged => {
	const active = vscode.window.activeTextEditor;
	if (!active || !active.document) return;

	const type = formatters.getFormat(active.document);
	let ranges = [];
	if (ranged && active.selection)
		ranges = active.selections.filter(selection => !selection.isEmpty)
		.map(range => extendRange(active.document, range));
	if (ranges.length === 0)
		ranges = [fullRange(active.document)];

	if (ranges.length) {
		return beautifyDocRanges(active.document, ranges, type)
			.then(edits => applyEdits(active, ranges, edits), dumpError);
	} else return Promise.resolve();
};

//register on activation
exports.activate = (context) => {
	let sub = context.subscriptions;
	sub.push(vscode.commands.registerCommand('HookyQR.beautify', formatActiveDocument.bind(0, true)));
	sub.push(vscode.commands.registerCommand('HookyQR.beautifyFile', formatActiveDocument));
	sub.push(vscode.workspace.onDidChangeConfiguration(formatters.configure.bind(formatters)));
	sub.push(vscode.workspace.onDidOpenTextDocument(formatters.onFileOpen.bind(formatters)));
};
