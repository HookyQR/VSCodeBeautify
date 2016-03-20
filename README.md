# js-beautify for VS Code 

[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeBeautify.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeBeautify)

VS Code uses js-beautify internally, bit it lacks the ability to modify the style you wish to use. This extension enables running [js-beautify](http://jsbeautifier.org/) in VS Code, _AND_ honouring any `.jsbeautifyrc` file in the open file's path tree to load *your* code styling. Run with  **F1** `Beautify`.

This package includes hints when editing your `.jsbeautifyrc`. Only the first file found will be used. If the format is bad, the default js-beautify settings will be used, but a warning will be issued to let you know. Comments in your settings file are acceptable (they're removed before the file is parsed). The embedded schema for `.jsbeautifyrc` has also been published at [JSON Schema Store](http://schemastore.org) which allows users of VSCode 0.10.3 to add it manually to their user or workspace settings:

```json
"json.schemas": [
	{
		"fileMatch": ["**/.jsbeautifyrc"],
		"url": "http://json.schemastore.org/jsbeautifyrc"
	}
]
```

Also runs http and css beautify from the same package, as determined by the file extension. The schema indicates which beautifier each of the settings pertains to.

The `.jsbeautifyrc` config parser accepts sub elements of `html`, `js` and `css` so that different settings can be used for each of the beautifiers (like sublime allows). Note that this will cause the config file to be incorrectly structure for running `js-beautify` from the command line.

Settings are inherited from the base of the file. Thus:

```json
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

Extra (permanent) file extension may be added under user or workspace settings.

Beautify on save can be enables for all, or just specific file types. Files that you do not wish to be beautified can be excluded in the user or workspace settings files. Settings examples:

```javascript
"beautify.onSave": true, // beautify HTML, CSS, JavaScript, and JSON on save
  //or
"beautify.onSave": ["js","json"], //only beautify JavaScript and JSON files on save

"beautify.onSaveIgnore": [
    "**/minified/**", //don't beautify any file in any 'minified' directory, at any depth
    "**/*+(.|_|-)min.*", //don't minify any file that contains '.min.', '_min.', '-min.' in the filename (This is the default ignore setting)
  ]
``` 

If you wish to include the files that are included by default, set `"beautify.onSaveIgnore" = []`. The onSaveIgnore settings does not stop a manual execution of beautify working.
 
Embedded version of js-beautify is v1.6.2.

## Changes:
### 0.1.2: 20 Mar 2016
* Beautify with no .jsbeautifyrc file in path tree will use workspace settings for tabs/spaces indent. [Issue #11](https://github.com/HookyQR/VSCodeBeautify/issues/11)<br>Will use the editor setting if the file being beautified is visible, or workspace/user setting if it is not visible. (Beautify of a non-visible file can be envoked when beautify on save is enabled.)

### 0.1.1: 15 Mar 2016
* Allow beautify on save to work with types in `beautify.*Files` settings. [Issue #9](https://github.com/HookyQR/VSCodeBeautify/issues/9)
* Fix `beautify.*Files` settings requiring a `.` before the extension (both styles are now accepted).

### 0.1.0: 13 Mar 2016
* Add beautify on save option. [Issue #5: Add Beautify on Save](https://github.com/HookyQR/VSCodeBeautify/issues/5)
* Added `css`, and `html` beautifiers to the system range formatters. This means that beautify will run as the system `Format code` option.

### 0.0.10: 03 Mar 2016
* Fix typo: [Issue #7](https://github.com/HookyQR/VSCodeBeautify/pull/7)

### 0.0.9: 19 Feb 2016
* Show info message when VS Code doesn't provide document info and beautify can't run. (Generally caused when file is too large)

### 0.0.8: 13 Feb 2016
* Update js-beautify version to v1.6.2. See [js-beautify change log](https://github.com/beautify-web/js-beautify/blob/852919d2241476d877656312238f4539688abba1/CHANGELOG.md)
* Updated schema to match js-beautify v1.6.2 options

### 0.0.7: 02 Jan 2016
* Fix bad type matching when no json schema in user settings.

### 0.0.6: 27 Dec 2015
* Added allowing sub elements in config. Fixes [Issue #3: Allow separation of settings for html, css and js options like sublime.](https://github.com/HookyQR/VSCodeBeautify/issues/3)
* Changed embeded schema to allow the type sub elements.


### 0.0.5: 24 Dec 2015
* Schema published at http://json.schemastore.org/jsbeautifyrc.
* Added README details for schema install for users of VSCode < v0.10.5
* Added comments remover before JSON parse. Fixes [Issue #2: .jsbeautifyrc file not being used](https://github.com/HookyQR/VSCodeBeautify/issues/2)

### 0.0.4: 19 Dec 2015
* Changed default (unknown) processing to ask you what you want to use.
* Fixed [Issue #1: No handler found for the command: 'HookyQR.beautify'](https://github.com/HookyQR/VSCodeBeautify/issues/1)

### 0.0.3: 19 Dec 2015
* _Tries_ to mark any elements in `json.schema` settings as JSON, and thus beautify as JS.
* Added schema for `.jsbeautifyrc` file. (Requires VS Code v0.10.5+ see [Issue #1](https://github.com/HookyQR/VSCodeBeautify/issues/1))
* Added language type so `.jsbeautifyrc` is recognised as JSON.

### 0.0.2: 17 Dec 2015
* Add options for other file extensions.
