module.exports = {
  extension: 'js',
  command: 'HookyQR.beautifyFile',
  beautifySetting: {
    js: {
      brace_style: 'collapse',
      break_chained_methods: false,
      e4x: false,
      end_with_newline: true,
      indent_char: '\t',
      indent_level: 0,
      indent_size: 1,
      indent_with_tabs: true,
      jslint_happy: false,
      keep_array_indentation: false,
      keep_function_indentation: false,
      max_preserve_newlines: 4,
      preserve_newlines: true,
      space_after_anon_function: false,
      space_after_named_function: false,
      space_before_conditional: false,
      space_in_empty_paren: false,
      space_in_paren: true,
      unescape_strings: false,
      wrap_line_length: 0
    }
  },
  input: `if ( true ) {
    // Correctly removes space after conditional
  }
  try{
    // Some code
  }
  catch( e ) {
    // Some code
  }
  switch( value ) {
  
  }`,
  expected: `if( true ) {
	// Correctly removes space after conditional
}
try {
	// Some code
} catch( e ) {
	// Some code
}
switch( value ) {

}
`
};
