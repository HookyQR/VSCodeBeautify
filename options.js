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

const findRecursive = (dir, fileName, root) => {
	const fullPath = path.join(dir, fileName);
	const nextDir = path.dirname(dir);
	let result = fs.existsSync(fullPath) ? fullPath : null;
	if (!result && nextDir !== dir && dir !== root) {
		result = findRecursive(nextDir, fileName, root);
	}
	return result;
};

const optionsFromVSCode = (doc, formattingOptions, type) => {
	const config = vscode.workspace.getConfiguration();
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
		indent_with_tabs: formattingOptions.insertSpaces === undefined ? true : !formattingOptions.insertSpaces,
		indent_size: formattingOptions.tabSize,
		indent_char: ' ',
		end_with_newline: config.files.insertFinalNewLine,
		eol: config.files.eol,
		space_after_anon_function: config.javascript.format.insertSpaceAfterFunctionKeywordForAnonymousFunctions,
		space_in_paren: config.javascript.format.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis
	};
	if (type === 'html') {
		options.end_with_newline = config.html.format.endWithNewline;
		if (typeof config.html.format.extra_liners === 'string') {
			options.extra_liners = config.html.format.extraLiners
				.split(',')
				.map(s => s.trim());
		}
		options.indent_handlebars = config.html.format.indentHandlebars;
		options.indent_inner_html = config.html.format.indentInnerHtml;
		options.max_preserve_newlines = config.html.format.maxPreserveNewLines;
		options.preserve_newlines = config.html.format.preserveNewLines;

		if (typeof config.html.format.unformatted === 'string') {
			options.unformatted = config.html.format.unformatted
				.split(',')
				.map(s => s.trim());
		}
		options.wrap_line_length = config.html.format.wrapLineLength;
	}
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
			config.indent_char = ' ';
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
	let root = vscode.workspace.rootPath;
	let dir = doc.isUntitled ? root : path.dirname(doc.fileName);
	let opts = optionsFromVSCode(doc, formattingOptions, type);
	set_file_editorconfig_opts(doc.fileName, opts); // this does nothing if no ec file was found
	let configFile = dir ? findRecursive(dir, '.jsbeautifyrc', root) : null;

	if (!configFile) {
		let beautify_config = vscode.workspace.getConfiguration('beautify')
			.config;
		if (beautify_config) {
			if (typeof beautify_config === 'object') {
				return Promise.resolve(mergeOpts(beautify_config, type));
			} else if (typeof beautify_config === 'string') {
				if (path.isAbsolute(beautify_config)) configFile = beautify_config;
				else configFile = path.resolve(root, beautify_config);

				configFile = fs.existsSync(configFile) ? configFile : null;
			}
		}
	}
	if (!configFile && root) {
		configFile = findRecursive(path.dirname(root), '.jsbeautifyrc');
	}
	if (!configFile) {
		configFile = path.join(os.homedir(), '.jsbeautifyrc');
		if (!fs.existsSync(configFile)) return Promise.resolve(opts);
	}
	return new Promise((resolve, reject) => {
		fs.readFile(configFile, 'utf8', (e, d) => {
			if (!d || !d.length) return resolve(opts);
			try {
				const unCommented = dropComments(d.toString());
				opts = JSON.parse(unCommented);
				opts = mergeOpts(opts, type);
				resolve(opts);
			} catch (e) {
				vscode.window.showWarningMessage(`Found a .jsbeautifyrc file [${configFile}], but it didn't parse correctly.`);
				reject();
			}
		});
	});
};
