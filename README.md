# js-beautify for VS Code 

[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeBeautify.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeBeautify)

VS Code has its own code formater. But it lacks the ability to modify the style you wish to use. This extension enables running [js-beautify](http://jsbeautifier.org/) in VS Code, and searches for `.jsbeautifyrc` file in the files path tree to load *your* code styling. Run with  **⌘⇧P** `Beautify`.

See [js-beautify on gitHub](https://github.com/beautify-web/js-beautify) for available options in the rc file. The file must be valid JSON to be used. Only the first file of the correct name found will be used. If the format is bad, the default js-beautify settings will be used.

Also runs http and css beautify from the same package, as determined by the file extension. If the file is unsaved, js-beautify will be attempted by default.

Extra file extenstion may be added under user or workspace settings.

Embeded version of js-beautify is v1.5.10.

## Changes:
### 0.0.2: 17 Dec 2015
* Add options for other file extensions.

