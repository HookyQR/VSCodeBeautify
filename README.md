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

Will result in the `indent_size` being set to 4 for Javascript and HTML, but set to 2 for css. All will get the same `intent_char` setting.

If the file is unsaved, or the type is undetermined, you'll be prompted for which beautifier to use.

Extra (permanent) file extension may be added under user or workspace settings.


Embedded version of js-beautify is v1.5.10.

## Changes:
### 0.0.7: 02 Jan 2015
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
