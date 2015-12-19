# js-beautify for VS Code 

[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeBeautify.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeBeautify)

VS Code uses js-beautify internally, bit it lacks the ability to modify the style you wish to use. This extension enables running [js-beautify](http://jsbeautifier.org/) in VS Code, _AND_ honouring any `.jsbeautifyrc` file in the open file's path tree to load *your* code styling. Run with  **⌘⇧P** `Beautify`.

This package now includes hints when editing your `.jsbeautifyrc`. Only the first file found will be used. If the format is bad, the default js-beautify settings will be used.

Also runs http and css beautify from the same package, as determined by the file extension. If the file is unsaved, or the type is undetermined, you'll be prompted for which beautifier to use.

Extra (permanent) file extension may be added under user or workspace settings.

Embedded version of js-beautify is v1.5.10.

## Changes:
### 0.0.4: 19 Dec 2015
* Changed default (unknown) processing to ask you what you want to use.
* Fixed [Issue #1: No handler found for the command: 'HookyQR.beautify'](https://github.com/HookyQR/VSCodeBeautify/issues/1)

### 0.0.3: 19 Dec 2015
* _Tries_ to mark any elements in `json.schema` settings as JSON, and thus beautify as JS.
* Added schema for `.jsbeautifyrc` file. (Requires VS Code v0.10.5+ see [Issue #1](https://github.com/HookyQR/VSCodeBeautify/issues/1))
* Added language type so `.jsbeautifyrc` is recognised as JSON.

### 0.0.2: 17 Dec 2015
* Add options for other file extensions.
