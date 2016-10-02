'use strict';
const vscode = require('vscode'),
	path = require('path'),
	os = require('os'),
	fs = require('fs'),
	editorconfig = require('editorconfig');
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
	if (!result && nextDir !== dir) {
		result = findRecursive(nextDir, fileName);
	}
	return result;
};

const optionsFromVSCode = (doc, formattingOptions, type) => {
	const fileFormat = vscode.workspace.getConfiguration('files');
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
	if (fileFormat.eol) options.eol = fileFormat.eol;
	if (type === 'html') {
		const html = vscode.workspace.getConfiguration('html.format');
		options.end_with_newline = html.endWithNewline;
		if (typeof html.extra_liners === 'string') {
			options.extra_liners = html.extraLiners.split(',')
				.map(s => s.trim());
		}
		options.indent_handlebars = html.indentHandlebars;
		options.indent_inner_html = html.indentInnerHtml;
		options.max_preserve_newlines = html.maxPreserveNewLines;
		options.preserve_newlines = html.preserveNewLines;
		if (typeof html.unformatted === 'string') {
			options.unformatted = html.unformatted.split(',')
				.map(s => s.trim());
		}
		options.wrap_line_length = html.wrapLineLength;
	}
	const js = vscode.workspace.getConfiguration('javascript.format');
	options.space_after_anon_function = js.insertSpaceAfterFunctionKeywordForAnonymousFunctions;
	options.space_in_paren = js.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis;
	return options;
};

/* set_file_editorconfig_opts directly from js-beautify/lib/cli.js */
function set_file_editorconfig_opts(file, config) {
	try {
		const eConfigs = editorconfig.parseSync(file);

		if (eConfigs.indent_style === "tab") {
			config.indent_with_tabs = true;
		} else if (eConfigs.indent_style === "space") {
			config.indent_with_tabs = false;
		}

		if (eConfigs.indent_size) {
			config.indent_size = eConfigs.indent_size;
		}

		if (eConfigs.max_line_length) {
			if (eConfigs.max_line_length === "off") {
				config.wrap_line_length = 0;
			} else {
				config.wrap_line_length = parseInt(eConfigs.max_line_length);
			}
		}

		if (eConfigs.insert_final_newline === true) {
			config.end_with_newline = true;
		} else if (eConfigs.insert_final_newline === false) {
			config.end_with_newline = false;
		}

		if (eConfigs.end_of_line) {
			if (eConfigs.end_of_line === 'cr') {
				config.eol = '\r';
			} else if (eConfigs.end_of_line === 'lf') {
				config.eol = '\n';
			} else if (eConfigs.end_of_line === 'crlf') {
				config.eol = '\r\n';
			}
		}
	} catch (e) {}
}

module.exports = (doc, type, formattingOptions) => {
	let base = vscode.workspace.rootPath;
	let opts = optionsFromVSCode(doc, formattingOptions, type);
	let configFile;
	if (vscode.workspace.getConfiguration('beautify')
		.editorconfig) set_file_editorconfig_opts(doc.fileName, opts);
	if (!doc.isUntitled) base = path.dirname(doc.fileName);
	if (base) configFile = findRecursive(base, '.jsbeautifyrc');
	if (!configFile) {
		configFile = path.join(os.homedir(), '.jsbeautifyrc');
		if (!fs.existsSync(configFile)) return Promise.resolve(opts);
	}
	return new Promise(resolve => {
		fs.readFile(configFile, 'utf8', (e, d) => {
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
