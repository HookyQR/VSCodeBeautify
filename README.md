# js-beautify for VS Code 

Enables running [js-beautify](http://jsbeautifier.org/) in VS Code.
Searches for `.jsbeautifyrc` file in the files path tree. 

See [js-beautify on gitHub](https://github.com/beautify-web/js-beautify) for available options. The file must be valid JSON to be used. Only the first file of the correct name found will be used. If the format is bad, the default js-beautify settings will be used.

Also runs http and css beautify from the same package, as determined by the file extension. If the file is unsaved, js-beautify will be attempted by default.

Embeded version of js-beautify is v1.5.10.

** Enjoy!**