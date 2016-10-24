# js-beautify for VS Code

[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeBeautify.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeBeautify) [![Build status](https://ci.appveyor.com/api/projects/status/mu73cgat3r1t0weu/branch/master?svg=true)](https://ci.appveyor.com/project/HookyQR/vscodebeautify) [![Licence](https://img.shields.io/github/license/HookyQR/VSCodeBeautify.svg)](https://github.com/HookyQR/VSCodeBeautify)
[![VS Code Marketplace](http://vsmarketplacebadge.apphb.com/version-short/HookyQR.beautify.svg) ![Rating](http://vsmarketplacebadge.apphb.com/rating-short/HookyQR.beautify.svg) ![Installs](http://vsmarketplacebadge.apphb.com/installs/HookyQR.beautify.svg)](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify)

Beautify `javascript`, `JSON`, `CSS`, `Sass`, and `HTML` in Visual Studio Code.

VS Code uses js-beautify internally, but it lacks the ability to modify the style you wish to use. This extension enables running [js-beautify](http://jsbeautifier.org/) in VS Code, _AND_ honouring any `.jsbeautifyrc` file in the open file's path tree to load *your* code styling. Run with  **F1** `Beautify` (to beautify a selection) or **F1** `Beautify file`.

### How we determine what settings to use:

1. If there is a valid `.jsbeautifyrc` in the file's path tree, these will be the only settings used.
2. If there is a valid `.jsbeautifyrc` in your home directory, these will be the only settings used.

otherwise...

3. Settings are translated from your VS Code workspace/user setttings.
4. Any open editor settings (indent spaces/tabs, line ending) for the specific file are merged in.
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
end_with_newline              | html.format.endWithNewline
extra_liners                  | html.format.extraLiners
space_after_anon_function | javascript.format<br> .insertSpaceAfterFunctionKeywordForAnonymousFunctions
space_in_paren | javascript.format<br> .insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis

Note that the `html.format` settings will ONLY be used when the document is html. `javascript.format` settings are included always.

Also runs http and css beautify from the same package, as determined by the file extension. The schema indicates which beautifier each of the settings pertains to.

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

Will result in the `indent_size` being set to 4 for Javascript and HTML, but set to 2 for css. All will get the same `indent_char` setting.

If the file is unsaved, or the type is undetermined, you'll be prompted for which beautifier to use.

You can contol which file types, extensions, or specific file names should be beautified with the `beautify.language` setting.

_Note:_ This used to be controlled by the `beautify.*Files` settings. If you still have those settings in your configuration, you'll be told that they're deprecated. Note that you may have to fix your global and project settings before the notification stops.

```javascript
{
  "beautify.language": {
    "js": {
      "type": ["javascript", "json"],
      "filename": [".jshintrc", ".jsbeautify"]
      // "ext": ["js", "json"]
      // ^^ to set extensions to be beautified using the javascript beautifier
    },
    "css": ["css", "scss"],
    "html": ["htm", "html"]
    // ^^ providing just an array sets the VS Code file type
  }
}
```

Beautify on save will be enabled when `"editor.formatOnSave"` is true. You can limit the beautifiers which will be called by setting `"beautify.onSave"` to an array. Files that you do not wish to be beautified can be excluded in the user or workspace settings files. Settings examples:

```javascript
"beautify.onSave": ["js","css"], // only beautify those that match the js and css beautifiers

"beautify.onSaveIgnore": [
    // don't beautify any file in any 'minified' directory, at any depth:
    "**/minified/**",
    // don't minify any file that contains '.min.', '_min.', '-min.' in the filename (This is the default ignore setting):
    "**/*+(.|_|-)min.*",
  ]
```

If you wish to exclude the files that are included by default, set `"beautify.onSaveIgnore" = []`. The onSaveIgnore settings does not stop a manual execution of beautify working.

Embedded version of js-beautify is v1.6.4.

## Changes:
### 0.5.2: 24 Oct 2016
* Fix readme typo

### 0.5.1: 24 Oct 2016
* Remove requirement for `beautify.editorconfig` flag

### 0.5.0: 22 Oct 2016
* Remove boolean option for `beautify.onSave` in favour of `"editor.formatOnSave"`

### 0.4.0 - 0.4.1: 15 Oct 2016
* Stop beautify on save from trying to format unknown types
* Change settings structure
* Reload file association settings when user config is changed
* Allow beautify of (primary) selected lines only

### 0.3.0: 03 Oct 2016
* Add editorconfig as a settings source

### 0.2.1: 24 Sep 2016
* Bump js-beautify version to 1.6.4
* Add non-null defaults for VS Code settings
* Use VS Code format settings as a fallback
* Enable `.jsbeautifyrc` in home drive as a global default
* Default format command **(Alt+Shift+F)** will now work for javascript files (for whole document formatting)

### 0.1.0 - 0.1.10: 10 Sep 2016
* Fix module structure (again)
* Add sass support explicitly
* Fix beautify on save for JSON
* Improve tests
* Bump js-beautify version to v1.6.3. Adds: `operator_position`(js), and `space_around_selector_separator`(css)
* Fix [Issue #18: Duplication](https://github.com/HookyQR/VSCodeBeautify/issues/18) - same cause as #14 (VS Code changed the way ranges are processed)
* Fix [Issue #15: Fail to correctly use workspace setting for file types](https://github.com/HookyQR/VSCodeBeautify/issues/14) - introduced in version 0.1.3 (oops)
* Fix [Issue #14: Full file beautify doubles text on version 1.1.0](https://github.com/HookyQR/VSCodeBeautify/issues/14)
* Add tests for supported formats and nested settings.
* Cosmetic changes to readme/icon
* Beautify with no .jsbeautifyrc file in path tree will use workspace settings for tabs/spaces indent. [Issue #11](https://github.com/HookyQR/VSCodeBeautify/issues/11)<br>Will use the editor setting if the file being beautified is visible, or workspace/user setting if it is not visible. (Beautify of a non-visible file can be envoked when beautify on save is enabled.)
* Allow beautify on save to work with types in `beautify.*Files` settings. [Issue #9](https://github.com/HookyQR/VSCodeBeautify/issues/9)
* Fix `beautify.*Files` settings requiring a `.` before the extension (both styles are now accepted).
* Add beautify on save option. [Issue #5: Add Beautify on Save](https://github.com/HookyQR/VSCodeBeautify/issues/5)
* Added `css`, and `html` beautifiers to the system range formatters. This means that beautify will run as the system `Format code` option.

### 0.0.2 - 0.0.10: 03 Mar 2016
* Fix typo: [Issue #7](https://github.com/HookyQR/VSCodeBeautify/pull/7)
* Show info message when VS Code doesn't provide document info and beautify can't run. (Generally caused when file is too large)
* Update js-beautify version to v1.6.2. See [js-beautify change log](https://github.com/beautify-web/js-beautify/blob/852919d2241476d877656312238f4539688abba1/CHANGELOG.md)
* Updated schema to match js-beautify v1.6.2 options
* Fix bad type matching when no json schema in user settings.
* Added allowing sub elements in config. Fixes [Issue #3: Allow separation of settings for html, css and js options like sublime.](https://github.com/HookyQR/VSCodeBeautify/issues/3)
* Changed embedded schema to allow the type sub elements.
* Schema published at http://json.schemastore.org/jsbeautifyrc.
* Added README details for schema install for users of VSCode < v0.10.5
* Added comments remover before JSON parse. Fixes [Issue #2: .jsbeautifyrc file not being used](https://github.com/HookyQR/VSCodeBeautify/issues/2)
* Changed default (unknown) processing to ask you what you want to use.
* Fixed [Issue #1: No handler found for the command: 'HookyQR.beautify'](https://github.com/HookyQR/VSCodeBeautify/issues/1)
* _Tries_ to mark any elements in `json.schema` settings as JSON, and thus beautify as JS.
* Added schema for `.jsbeautifyrc` file. (Requires VS Code v0.10.5+ see [Issue #1](https://github.com/HookyQR/VSCodeBeautify/issues/1))
* Added language type so `.jsbeautifyrc` is recognised as JSON.
* Add options for other file extensions.

