"use strict";
const vscode = require('vscode'),
	beautify = require('js-beautify'),
	path = require('path'),
	fs = require('fs'),
	minimatch = require('minimatch');

const dumpError = e => {
	if (e) console.log('beautify err:', e);
	return [];
};
const dropComments = inText => inText.replace(/(\/\*.*\*\/)|\/\/.*(?:[\r\n]|$)/g, "");

const mergeOpts = function(opts, type) {
	const finOpts = {};
	for (let a in opts) {
		if (a !== 'js' && a !== 'html' && a !== 'css') {
			finOpts[a] = opts[a];
		}
	}
	//merge in the per type settings
	if (type in opts) {
		for (let b in opts[type]) {
			if (b === 'allowed_file_extensions') continue;
			finOpts[b] = opts[type][b];
		}
	}
	return finOpts;
};

function findRecursive(dir, fileName) {
	const fullPath = path.join(dir, fileName);
	const nextDir = path.dirname(dir);
	let result = fs.existsSync(fullPath) ? fullPath : null;
	if (!result && (nextDir !== dir)) {
		result = findRecursive(nextDir, fileName);
	}
	return result;
}

const extMatch = n => ({
	pattern: n.startsWith("**/") ? n : ("**/" + n)
});

const getBeautifyType = function(doc) {
	if (doc.languageId === 'javascript') return 'js';
	if (doc.languageId === 'json') return 'js';
	if (doc.languageId === 'html') return 'html';
	if (doc.languageId === 'css') return 'css';

	return new Promise((resolve, reject) => {
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
			if (vscode.languages.match(matcher, doc)) return resolve("js");
		}
		if (cfg.HTMLfiles.indexOf(type) + 1) {
			//showDepWarning();
			return resolve("html");
		} else if (cfg.CSSfiles.indexOf(type) + 1) {
			//showDepWarning();
			return resolve("css");
		} else if (cfg.JSfiles.indexOf(type) + 1) {
			//showDepWarning();
			return resolve("js");
		} else {
			//Ask what they want to do:
			return vscode.window.showQuickPick([{
					label: "JS",
					description: "Does JavaScript and JSON"
                }, {
					label: "CSS"
                }, {
					label: "HTML"
                }], {
					matchOnDescription: true,
					placeHolder: "Couldn't determine type to beautify, please choose."
				})
				.then(function(choice) {
					if (!choice || !choice.label) return reject('no beautify type selected');
					return resolve(choice.label.toLowerCase());
				});
		}
	});
};

function getConfigFor(doc, type) {

	let base = vscode.workspace.rootPath;

	if (!doc.isUntitled) base = path.dirname(doc.fileName);
	if (!base) return Promise.resolve({});
	let configFile = findRecursive(base, '.jsbeautifyrc');
	if (!configFile) return Promise.resolve({});
	return new Promise(resolve => {
		fs.readFile(configFile, 'utf8', (e, d) => {
			if (!d) d = '{}';
			let opts = {};
			try {
				const unCommented = dropComments(d.toString());
				opts = JSON.parse(unCommented);
				opts = mergeOpts(opts, type);
			} catch (e) {
				vscode.window.showWarningMessage(`Found a .jsbeautifyrc file [${configFile}], but it didn't parse correctly.`);
				opts = {}; //just use the default opts
			}
			resolve(opts);
		});
	});
}

function beautifyDoc(doc, range, type) {
	if (!doc) {
		vscode.window.showInformationMessage(
			"Beautify can't get the file information because the editor won't supply it. (File probably too large)");
		throw "";
	}
	return (Promise.resolve(type ? type : getBeautifyType(doc)))
		.then(type => getConfigFor(doc, type)
			.then(config => {
				const original = doc.getText(doc.validateRange(range));
				return beautify[type](original, config);
			}));
}

function documentEdit(range, newText) {
	return [vscode.TextEdit.replace(range, newText)];
}

function extendRange(doc, rng) {
	const r = new vscode.Range(new vscode.Position(rng.start.line, 0), rng.end.translate(0, Number.MAX_VALUE));
	return r;
}

function rangeEditByType(type) {
	return (doc, rng) => {
		rng = extendRange(doc, rng);
		return beautifyDoc(doc, rng, type)
			.then(newText => documentEdit(rng, newText))
			.catch(dumpError);
	};
}

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
	if (['json', 'js', 'html', 'css'].indexOf(refType) === -1) return;

	if (cfg.onSave === true || (
			Array.isArray(cfg.onSave) && cfg.onSave.indexOf(refType) >= 0
		)) {
		const range = new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
		beautifyDoc(doc, range)
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
		const range = new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
		beautifyDoc(active.document, range)
			.then(newText => active.edit(editor => editor.replace(range, newText)))
			.catch(dumpError);
	}));

	//VS Code won't allow the formatters to run for json, or js. The inbuild
	//js-beautify runs instead
	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider('html', {
			provideDocumentRangeFormattingEdits: rangeEditByType('html')
		}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('css', {
		provideDocumentRangeFormattingEdits: rangeEditByType('css')
	}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('javascript', {
		provideDocumentRangeFormattingEdits: rangeEditByType('js')
	}));
	context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider('json', {
		provideDocumentRangeFormattingEdits: rangeEditByType('js')
	}));
	vscode.workspace.onDidSaveTextDocument(beautifyOnSave);

}
exports.activate = activate;
