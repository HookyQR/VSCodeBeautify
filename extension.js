"use strict";
const vscode = require('vscode'),
	beautify = require('js-beautify'),
	minimatch = require('minimatch'),
	options = require('./options');
const dumpError = e => {
	if (e) console.log('beautify err:', e);
	return [];
};

const getBeautifyType = () => {
	return new Promise((resolve, reject) => {
		//Ask what they want to do:
		return vscode.window.showQuickPick([{
				label: "JS",
				description: "Does JavaScript and JSON"
		}, {
				label: "CSS",
				description: "Does CSS and SCSS"
			}, {
				label: "HTML"
			}], {
				matchOnDescription: true,
				placeHolder: "Couldn't determine type to beautify, please choose."
			})
			.then(function(choice) {
				if (!choice || !choice.label) return reject('no beautify type selected');
				return resolve(choice.label.toLowerCase());
			}, () => 0);
	});
};

function beautifyDoc(doc, range, type, formattingOptions) {
	if (!doc) {
		vscode.window.showInformationMessage(
			"Beautify can't get the file information because the editor won't supply it. (File probably too large)");
		throw "";
	}
	return Promise.resolve(type ? type : getBeautifyType())
		.then(type => options(doc, type, formattingOptions)
			.then(config => {
				const original = doc.getText(range);
				return beautify[type](original, config);
			}));
}

function documentEdit(range, newText) {
	return [vscode.TextEdit.replace(range, newText)];
}

function extendRange(doc, rng) {
	let end = rng.end;
	if (end.character === 0) end = end.translate(-1, Number.MAX_VALUE);
	else end = end.translate(0, Number.MAX_VALUE);
	const r = new vscode.Range(new vscode.Position(rng.start.line, 0), end);
	return doc.validateRange(r);
}

function fullRange(doc) {
	return doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
}

function fullEdit(type, doc, formattingOptions) {
	const rng = fullRange(doc);
	return beautifyDoc(doc, rng, type, formattingOptions)
		.then(newText => documentEdit(rng, newText), dumpError);
}

function rangeEdit(type, doc, rng, formattingOptions) {
	rng = extendRange(doc, rng);
	return beautifyDoc(doc, rng, type, formattingOptions)
		.then(newText => documentEdit(rng, newText), dumpError);
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
		let cfg = vscode.workspace.getConfiguration('beautify.language');
		let beautifyCfg = vscode.workspace.getConfiguration('beautify');
		let js = beautifyCfg.JSFiles;
		let css = beautifyCfg.CSSFiles;
		let html = beautifyCfg.HTMLFiles;
		if (js || css || html) {
			cfg = {};
			if (js) cfg.js = {
				ext: js
			};
			if (css) cfg.css = {
				ext: css
			};
			if (html) cfg.html = {
				ext: html
			};
			vscode.window.showInformationMessage(
					"`beautify.*Files` setting is deprecated. please use `beautify.language` instead. Open settings ->",
					"Global", "Workspace")
				.then(open => {
					if (open) {
						vscode.commands.executeCommand(`workbench.action.open${open}Settings`);
					}
				});
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
							adder = [{
								pattern: `**/*.{${cfg[a][b].join(',')}}`
							}];
							break;
						case 'filename':
							adder = [{
								pattern: `**/{${cfg[a][b].join(',')}}`
							}];
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
			if (vscode.languages.match(this.handlers[a].selector, doc)) {
				return a;
			}
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

function beautifyOnSave(doc) {
	const cfg = vscode.workspace.getConfiguration('beautify');
	if (!cfg.onSave) return Promise.reject();

	let matcher = cfg.onSaveIgnore || ["**/*+(.|_|-)min.*"];
	if (typeof matcher === 'string') matcher = [matcher];
	if (Array.isArray(matcher)) {
		let fName = doc.fileName;
		if (fName.startsWith(vscode.workspace.rootPath)) {
			fName.slice(vscode.workspace.rootPath.length);
			if (fName[0] === '/' || fName[0] === '\\') fName.slice(1);
		}
		if (matcher.some(m => minimatch(fName, m))) return Promise.reject();
	}

	const refType = formatters.getFormat(doc);
	if (!refType) return Promise.reject();
	if ((Array.isArray(cfg.onSave) && !cfg.onSave.includes(refType))) return Promise.reject();
	let range = fullRange(doc);
	//determine a default options
	return beautifyDoc(doc, range, refType);
}

function formatActiveDocument(ranged) {
	const active = vscode.window.activeTextEditor;
	if (!active || !active.document) return;
	let range = fullRange(active.document);
	if (ranged && active.selection && !active.selection.isEmpty) range = extendRange(active.document, active.selection);
	const type = formatters.getFormat(active.document);
	return beautifyDoc(active.document, range, type)
		.then(newText => active.edit(editor => editor.replace(range, newText)), dumpError);
}
//register on activation
function activate(context) {
	let sub = context.subscriptions;
	sub.push(vscode.commands.registerCommand('HookyQR.beautify', formatActiveDocument.bind(0, true)));
	sub.push(vscode.commands.registerCommand('HookyQR.beautifyFile', formatActiveDocument));
	sub.push(vscode.workspace.onDidChangeConfiguration(formatters.configure.bind(formatters)));
	sub.push(vscode.workspace.onDidOpenTextDocument(formatters.onFileOpen.bind(formatters)));
	sub.push(vscode.workspace.onWillSaveTextDocument(e => {
		let range = fullRange(e.document);
		e.waitUntil(beautifyOnSave(e.document)
			.then(newText => [vscode.TextEdit.replace(range, newText)], () => []));
	}));
}
exports.activate = activate;
