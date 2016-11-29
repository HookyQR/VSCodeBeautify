### 0.6.2: 28 Nov 2016
* Force eol to document setting in editor.

### 0.6.1: 28 Nov 2016
* Put back redundant call on save until the textEdit fix is in VS Code (hopefully 1.8.0)

### 0.6.0: 26 Nov 2016
* Remove ***onSaveIgnore*** setting as it won't work with the VS Code formatOnSave setting
* Remove redundant format call on save
* Add [Settings.md](https://github.com/HookyQR/VSCodeBeautify/blob/master/Settings.md) help file

### 0.5.0 - 0.5.5: 16 Nov 2016
* Change setting retrieval mechanism. Fixes [#70 Compatibility with 1.8 Insiders](https://github.com/HookyQR/VSCodeBeautify/issues/70)
* Move changelog per VS Code 1.7 workings
* Change icon so it is visible on dark theme
* Add to formatters category
* Add shortcut example (PR #63) Thanks @Tallyb
* Fix VSCode minimum version requirement
* Fix readme typo
* Remove requirement for `beautify.editorconfig` flag
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
