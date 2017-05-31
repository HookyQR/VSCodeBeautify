Within VS Code, subordinate settings on `js`, `html`, and `css` are accepted. Note that this is non-standard operation for js-beautify.

Setting                         | Formatter | [Type] Description / Default
---------------------------------|-----------|------------------------------
eol                             | _All_     |  [String] **Character(s) to use as line terminators.** <br> "\n"
end_with_newline                | _All_     |  [Boolean] **Ensure newline at end of file.** <br> false
indent_char                     | _All_     |  [String] **Indentation character.** <br> " "
indent_size                     | _All_     |  [Integer] **Indent size.** <br> 4
indent_with_tabs                | _All_     |  [Boolean] **Indent with tabs, overrides 'indent_size' and 'indent_char'** <br> false
preserve_newlines               | _All_     |  [Boolean] **Preserve line-breaks.** <br> true
brace_style                     | JS, HTML  |  [String] **"collapse", "expand", "end-expand", "none", "collapse,preserve-inline", "expand,preserve-inline", "end-expand,preserve-inline", or "none,preserve-inline"** <br> "collapse"
max_preserve_newlines           | JS, HTML  |  [Integer] **Number of line-breaks to be preserved in one chunk.** <br> 10
wrap_line_length                | JS, HTML  |  [Integer] **Wrap lines at next opportunity after N characters. (Set zero to ignore wrapping)** <br> 0
extra_liners                    | HTML      |  [Array&lt;String>] **List of tags that should have an extra newline before them.** <br> ["head", "body", "/html"]
indent_body_inner_html          | HTML      |  [Boolean] **Indent elements within html `<body>` element.** <br> true
indent_handlebars               | HTML      |  [Boolean] **format and indent `{{#foo}}` and `{{/foo}}`.** <br> false
indent_head_inner_html          | HTML      |  [Boolean] **Indent elements within html &lt;head> element.** <br> true
indent_inner_html               | HTML      |  [Boolean] **Indent `<head>` and `<body>` sections.** <br> false
indent_scripts                  | HTML      |  [Boolean] **"keep", "separate", or "normal"** <br> "normal"
wrap_attributes                 | HTML      |  [String] **Wrap attributes to new lines. "auto", "force", "force-aligned" or "force-expand-multiline"** <br> "auto"
wrap_attributes_indent_size     | HTML      |  [Boolean] **Indent wrapped attributes to after N characters. Defaults to 'indent_size'.** <br> false
unformatted                     | HTML      |  [Array&lt;String>] **List of tags that should not be reformatted.** <br> ["a", "abbr", "area", "audio", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "embed", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "select", "small", "span", "strong", "sub", "sup", "svg", "template", "textarea", "time", "u", "var", "video", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"]
content_unformatted             | HTML      |  [Array&lt;String>] List of tags who's content should not be reformatted<br>["pre"]
void_elements                   | HTML      |  [Array&lt;String>] HTLM void elements - aka self-closing tags<br> ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr", "!doctype", "?xml", "?php", "basefont", "isindex"]
newline_between_rules           | CSS       |  [Boolean] **Add a newline between CSS rules.** <br> false
selector_separator_newline      | CSS       |  [Boolean] **Add a newline between multiple selectors.** <br> true
space_around_combinator         | CSS       |  [Boolean] **Ensure space around selector separators (>+~).** <br> false
break_chained_methods           | JS        |  [Boolean] **Break chained method calls across subsequent lines.** <br> false
comma_first                     | JS        |  [Boolean] **Put commas at the beginning of new line instead of end.** <br> false
e4x                             | JS        |  [Boolean] **Pass E4X xml literals through untouched.** <br> false
indent_level                    | JS        |  [Integer] **Initial indentation level.** <br> 0
jslint_happy                    | JS        |  [Boolean] **Enable jslint-stricter mode. (Forces 'space_after_anon_function')** <br> false
keep_array_indentation          | JS        |  [Boolean] **Preserve array indentation.** <br> false
keep_function_indentation       | JS        |  [Boolean] **Preserve function indentation.** <br> false
operator_position               | JS        |  [Boolean] **Move operators to before or after a new line, or keep as is.** <br> "before-newline"
space_after_anon_function       | JS        |  [Boolean] **Add a space before an anonymous function's parens, ie. `function ()`.** <br> false
space_before_conditional        | JS        |  [Boolean] **Ensure a space before conditional statement.** <br> true
space_in_empty_paren            | JS        |  [Boolean] **Leave space in empty parentheses, ie. `f( )`.** <br> false
space_in_paren                  | JS        |  [Boolean] **Add padding spaces within parentheses, ie. `f( a, b )`.** <br> false
unescape_strings                | JS        |  [Boolean] **Decode printable characters encoded in xNN notation.** <br> false
