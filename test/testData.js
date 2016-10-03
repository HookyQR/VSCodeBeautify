'use strict';

const fs = require('fs'),
	path = require('path');

const inputFiles = {
	js: "var a=1;\n\nfunction b(){a=      5}",
	html: "<div>\n<article     id='my_id'>Article Content         </article></div>",
	css: "a\n,b>c{border:\n1px;color:blue}",
	scss: "@mixin first(){\n&:before,&:after{content:\n\"|\"} border: 1px    solid green} .a {@include first();\nmargin:1px}"
};

const outputFiles = {
	lf: {
		js: 'var a = 1;\n\nfunction b() {\n    a = 5\n}',
		html: '<div>\n    <article id=\'my_id\'>Article Content </article>\n</div>',
		css: 'a,\nb>c {\n    border: 1px;\n    color: blue\n}',
		scss: '@mixin first() {\n    &:before,\n    &:after {\n        content: "|"\n    }\n    border: 1px solid green\n}\n\n.a {\n    @include first();\n    margin: 1px\n}'
	},
	crlf: {},
	tab: {
		js: 'var a = 1;\n\nfunction b() {\n\ta = 5\n}',
		html: '<div>\n\t<article id=\'my_id\'>Article Content </article>\n</div>',
		css: 'a,\nb>c {\n\tborder: 1px;\n\tcolor: blue\n}',
		scss: '@mixin first() {\n\t&:before,\n\t&:after {\n\t\tcontent: "|"\n\t}\n\tborder: 1px solid green\n}\n\n.a {\n\t@include first();\n\tmargin: 1px\n}'
	}
};

for (let n in outputFiles.lf) {
	outputFiles.crlf[n] = outputFiles.lf[n].replace(/\n/g, "\r\n");
}

exports.clean = base => {
	for (let ext in inputFiles) {
		fs.writeFileSync(path.join(base, `test.${ext}`), inputFiles[ext]);
	}
};

exports.expected = (mod, ext) => {
	return outputFiles[mod][ext];
};

exports.types = ['js', 'html', 'css', 'scss'];
