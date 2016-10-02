'use strict';
const vscode = require('vscode'),
	path = require('path'),
	os = require('os'),
	fs = require('fs');
const dropComments = inText => inText.replace(/(\/\*.*\*\/)|\/\/.*(?:[\r\n]|$)/g, "");
const mergeOpts = (opts, kind) => {
	const finOpts = {};
	for (let a in opts) {
		if (a !== 'js' && a !== 'html' && a !== 'css') {
			finOpts[a] = opts[a];
		}
	}
	//merge in the per type settings
	if (kind in opts) {
		for (let b in opts[kind]) {
			if (b === 'allowed_file_extensions') continue;
			finOpts[b] = opts[kind][b];
		}
	}
	return finOpts;
};
const findRecursive = (dir, fileName) => {
	const fullPath = path.join(dir, fileName);
	const nextDir = path.dirname(dir);
	let result = fs.existsSync(fullPath) ? fullPath : null;
	if (!result && (nextDir !== dir)) {
		result = findRecursive(nextDir, fileName);
	}
	return result;
};
const optionsFromVSCode = (doc, formattingOptions, type) => {
	if (!formattingOptions) {
		formattingOptions = vscode.workspace.getConfiguration('editor');
		//if this document is open, use the settings from that window
		vscode.window.visibleTextEditors.some(editor => {
			if (editor.document && editor.document.fileName === doc.fileName) {
				return (formattingOptions = editor.options);
			}
		});
	}
	const options = {
		indent_with_tabs: !formattingOptions.insertSpaces,
		indent_size: formattingOptions.tabSize,
		indent_char: ' '
	};
	if (type === 'html') {
		const html = vscode.workspace.getConfiguration('html.format');
		options.end_with_newline = html.endWithNewline;
		options.extra_liners = (html.extraLiners || "head, body, /html")
			.split(',')
			.map(s => s.trim());
		options.indent_handlebars = html.indentHandlebars;
		options.indent_inner_html = html.indentInnerHtml;
		options.max_preserve_newlines = html.maxPreserveNewLines;
		options.preserve_newlines = html.preserveNewLines;
		options.unformatted = (html.unformatted ||
				"a, abbr, acronym, b, bdo, big, br, button, cite, code, dfn, em, i, img, input, kbd, label, map, object, q, samp, script, select, small, span, strong, sub, sup, textarea, tt, var"
			)
			.split(',')
			.map(s => s.trim());
		options.wrap_line_length = html.wrapLineLength;
	}
	const js = vscode.workspace.getConfiguration('javascript.format');
	options.space_after_anon_function = js.insertSpaceAfterFunctionKeywordForAnonymousFunctions;
	options.space_in_paren = js.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis;
	return options;
};
module.exports = (doc, type, formattingOptions) => {
	let base = vscode.workspace.rootPath;
	const defaultOptions = optionsFromVSCode(doc, formattingOptions, type);
	let configFile;
	if (!doc.isUntitled) base = path.dirname(doc.fileName);
	if (base) configFile = findRecursive(base, '.jsbeautifyrc');
	if (!configFile) {
		configFile = path.join(os.homedir(), '.jsbeautifyrc');
		if (!fs.existsSync(configFile)) return Promise.resolve(defaultOptions);
	}
	return new Promise(resolve => {
		fs.readFile(configFile, 'utf8', (e, d) => {
			let opts = defaultOptions;
			if (!d) return resolve(opts);
			try {
				const unCommented = dropComments(d.toString());
				opts = JSON.parse(unCommented);
				opts = mergeOpts(opts, type);
			} catch (e) {
				vscode.window.showWarningMessage(`Found a .jsbeautifyrc file [${configFile}], but it didn't parse correctly.`);
			}
			resolve(opts);
		});
	});
};
