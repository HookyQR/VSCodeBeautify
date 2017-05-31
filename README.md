# js-beautify for VS Code

[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeBeautify.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeBeautify) [![Build status](https://ci.appveyor.com/api/projects/status/mu73cgat3r1t0weu/branch/master?svg=true)](https://ci.appveyor.com/project/HookyQR/vscodebeautify) [![Licence](https://img.shields.io/github/license/HookyQR/VSCodeBeautify.svg)](https://github.com/HookyQR/VSCodeBeautify)
[![VS Code Marketplace](http://vsmarketplacebadge.apphb.com/version-short/HookyQR.beautify.svg) ![Rating](http://vsmarketplacebadge.apphb.com/rating-short/HookyQR.beautify.svg) ![Installs](http://vsmarketplacebadge.apphb.com/installs/HookyQR.beautify.svg)](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify)

Beautify `javascript`, `JSON`, `CSS`, `Sass`, and `HTML` in Visual Studio Code.

VS Code uses js-beautify internally, but it lacks the ability to modify the style you wish to use. This extension enables running [js-beautify](http://jsbeautifier.org/) in VS Code, _AND_ honouring any `.jsbeautifyrc` file in the open file's path tree to load *your* code styling. Run with  **F1** `Beautify` (to beautify a selection) or **F1** `Beautify file`.

For help on the settings in the `.jsbeautifyrc` see [Settings.md](https://github.com/HookyQR/VSCodeBeautify/blob/master/Settings.md)

### How we determine what settings to use:

1. If there is a valid `.jsbeautifyrc` in the file's path tree, up to project root, these will be the only settings used.
2. If an option is a file path or object of configuration specified in the user or workspace settings like this:
`"beautify.config" : "string|Object.<string,string|number|boolean>"`, these will be the only settings used.
The file path is interpreted relative to the workspace's root folder.
3. If there is a valid `.jsbeautifyrc` in the file's path tree, above project root, these will be the only settings used.
4. If there is a valid `.jsbeautifyrc` in your home directory, these will be the only settings used.

otherwise...

3. Settings are translated from your VS Code workspace/user setttings.
4. Any open editor settings (indent spaces/tabs) for the specific file are merged in.
5. Editorconfig settings are searched for (See http://editorconfig.org/) and are merged in.

### VS Code | .jsbeautifyrc settings map:

.jsbeautifyrc setting         | VS Code setting
---                           | ---
eol                           | files.eol
tab_size                      | editor.tabSize
indent_with_tabs&nbsp;_(inverted)_ | editor.insertSpaces
wrap_line_length              | html.format.wrapLineLength
unformatted                   | html.format.unformatted
indent_inner_html             | html.format.indentInnerHtml
preserve_newlines             | html.format.preserveNewLines
max_preserve_newlines         | html.format.maxPreserveNewLines
indent_handlebars             | html.format.indentHandlebars
end_with_newline              | html.format.endWithNewline (html)
end_with_newline              | file.insertFinalNewLine (css, js)
extra_liners                  | html.format.extraLiners
space_after_anon_function | javascript.format<br> .insertSpaceAfterFunctionKeywordForAnonymousFunctions
space_in_paren | javascript.format<br> .insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis

Note that the `html.format` settings will ONLY be used when the document is html. `javascript.format` settings are included always.

Also runs html and css beautify from the same package, as determined by the file extension. The schema indicates which beautifier each of the settings pertains to.

The `.jsbeautifyrc` config parser accepts sub elements of `html`, `js` and `css` so that different settings can be used for each of the beautifiers (like sublime allows). Note that this will cause the config file to be incorrectly structured for running `js-beautify` from the command line.

Settings are inherited from the base of the file. Thus:

```javascript
{
  "indent_size": 4,
  "indent_char": " ",
  "css": {
    "indent_size": 2
  }
}
```

Will result in the `indent_size` being set to 4 for Javascript and HTML, but set to 2 for CSS. All will get the same `indent_char` setting.

If the file is unsaved, or the type is undetermined, you'll be prompted for which beautifier to use.

You can contol which file types, extensions, or specific file names should be beautified with the `beautify.language` setting.

```javascript
{
  "beautify.language": {
    "js": {
      "type": ["javascript", "json"],
      "filename": [".jshintrc", ".jsbeautifyrc"]
      // "ext": ["js", "json"]
      // ^^ to set extensions to be beautified using the javascript beautifier
    },
    "css": ["css", "scss"],
    "html": ["htm", "html"]
    // ^^ providing just an array sets the VS Code file type
  }
}
```

Beautify on save will be enabled when `"editor.formatOnSave"` is true.

Beautification on particular files using the built in **Format Document** (which includes formatting on save) can be skipped with the `beautify.ignore` option. Using the `Beautify file` and `Beautify selection` will still work. For files opened from within the workspace directory, the glob patterns will match from the workspace root. For files opened from elsewhere, or when no workspace is open, the patterns will match from the system root.


Examples:
```javascript
/* ignore all files named 'test.js' not in the root folder,
   all files directly in any 'spec' directory, and
   all files in any 'test' directory at any depth
*/
"beautify.ignore": ["*/test.js", "**/spec/*", "**/test/**/*"]

/* ignore all files ending in '_test.js' anywhere */
"beautify.ignore": "**/*_test.js"
```
Note that the glob patterns are not used to test against the containing folder. You must match the filename as well.

Embedded version of js-beautify is v1.6.14

### Keyboard Shortcut
Use the following to embed a beautify shortcut in keybindings.json. Replace with your preferred key bindings.

```javascript
{
  "key": "cmd+b",
  "command": "HookyQR.beautify",
  "when": "editorFocus"
}
```
