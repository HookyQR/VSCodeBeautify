"use strict";
const vscode = require('vscode'),
	beautify = require('js-beautify'),
	path = require('path'),
	minimatch = require('minimatch'),
	options = require('./options');
const dumpError = e => {
	if (e) console.log('beautify err:', e);
	return [];
};

const extMatch = n => ({
	pattern: n.startsWith("**/") ? n : ("**/" + n)
});

const getBeautifyType = function(doc, dontAsk) {
	if (doc.languageId === 'javascript') return 'js';
	if (doc.languageId === 'json') return 'js';
	if (doc.languageId === 'html') return 'html';
	if (doc.languageId === 'css') return 'css';
	if (doc.languageId === 'scss') return 'css';
	const type = doc.isUntitled ? "" : path.extname(doc.fileName)
		.toLowerCase();
	const cfg = vscode.workspace.getConfiguration('beautify');
	//if a type is set on the window, use that
	//check if the file is in the users json schema set
	const jsSchema = vscode.workspace.getConfiguration('json')
		.schemas;
	if (jsSchema.length) {
		let matcher = [];
		jsSchema.forEach(schema => {
			if (typeof schema.fileMatch === 'string') matcher.push(extMatch(schema.fileMatch));
			else matcher = matcher.concat(schema.fileMatch.map(extMatch));
		});
		if (vscode.languages.match(matcher, doc)) return "js";
	}
	if (cfg.HTMLfiles.indexOf(type) >= 0 || (type[0] === '.' && cfg.HTMLfiles.indexOf(type.slice(1)) >= 0)) return 'html';
	else if (cfg.CSSfiles.indexOf(type) >= 0 || (type[0] === '.' && cfg.CSSfiles.indexOf(type.slice(1)) >= 0)) return 'css';
	else if (cfg.JSfiles.indexOf(type) >= 0 || (type[0] === '.' && cfg.JSfiles.indexOf(type.slice(1)) >= 0)) return 'js';
	if (dontAsk) return;
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
	return Promise.resolve(type ? type : getBeautifyType(doc))
		.then(type => options(doc, type, formattingOptions)
			.then(config => {
				const original = doc.getText(doc.validateRange(range));
				return beautify[type](original, config);
			}));
}

function documentEdit(range, newText) {
	return [vscode.TextEdit.replace(range, newText)];
}

function extendRange(doc, rng) {
	const r = new vscode.Range(new vscode.Position(rng.start.line, 0), rng.end.translate(0, Infinity));
	return doc.validateRange(r);
}

function fullRange(doc) {
	return doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
}

const fullEdit = (doc, formattingOptions) => {
	const type = getBeautifyType(doc, true);
	const rng = fullRange(doc);
	return beautifyDoc(doc, rng, type, formattingOptions)
		.then(newText => documentEdit(rng, newText), dumpError);
};

const rangeEdit = (doc, rng, formattingOptions) => {
	const type = getBeautifyType(doc, true);
	rng = extendRange(doc, rng);
	return beautifyDoc(doc, rng, type, formattingOptions)
		.then(newText => documentEdit(rng, newText), dumpError);
};

function beautifyOnSave(doc) {
	if (doc.beautified) {
		delete doc.beautified;
		return;
	}
	const cfg = vscode.workspace.getConfiguration('beautify');
	let matcher = cfg.onSaveIgnore || ["**/*+(.|_|-)min.*"];
	if (typeof matcher === 'string') matcher = [matcher];
	if (Array.isArray(matcher)) {
		let fName = doc.fileName;
		if (fName.startsWith(vscode.workspace.rootPath)) {
			fName.slice(vscode.workspace.rootPath.length);
			if (fName[0] === '/' || fName[0] === '\\') fName.slice(1);
		}
		if (matcher.some(m => minimatch(fName, m))) return;
	}
	let refType = doc.languageId;
	if (refType === 'javascript') refType = 'js';
	if (['js', 'json', 'html', 'css', 'sass'].indexOf(refType) === -1) {
		refType = getBeautifyType(doc, true);
		if (!refType) return;
	}
	if (cfg.onSave === true || (Array.isArray(cfg.onSave) && cfg.onSave.indexOf(refType) >= 0)) {
		if (refType === 'json') refType = 'js';
		if (refType === 'sass') refType = 'css';
		let range = fullRange(doc);
		//determine a default options
		return beautifyDoc(doc, range, refType)
			.then(newText => {
				let we = new vscode.WorkspaceEdit();
				we.replace(doc.uri, range, newText);
				doc.beautified = true;
				return vscode.workspace.applyEdit(we);
			})
			.then(() => doc.save())
			.then(() => 1, () => 1);
	}
}
//register on activation
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('HookyQR.beautify', () => {
		const active = vscode.window.activeTextEditor;
		if (!active) return;
		if (!active.document) return;
		let range = fullRange(active.document);
		return beautifyDoc(active.document, range)
			.then(newText => active.edit(editor => editor.replace(range, newText)), dumpError);
	}));
	// setupFormatters(context.subscriptions);
	// context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(()=>{
	// 	setupFormatters(context.subscriptions);
	// }));
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('html', {
		provideDocumentFormattingEdits: fullEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('html', {
		provideDocumentRangeFormattingEdits: rangeEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(['css', 'sass'], {
		provideDocumentFormattingEdits: fullEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('scss', {
		provideDocumentFormattingEdits: fullEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(['css', 'sass'], {
		provideDocumentRangeFormattingEdits: rangeEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(['javascript', 'json'], {
		provideDocumentFormattingEdits: fullEdit
	}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(['javascript', 'json'], {
		provideDocumentRangeFormattingEdits: rangeEdit
	}));
	vscode.workspace.onDidSaveTextDocument(beautifyOnSave);
}
exports.activate = activate;
