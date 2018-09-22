
module.exports = {
  extension: 'scss',
  command: 'HookyQR.beautifyFile',
  beautifySetting: {
    newline_between_rules: true,
    preserve_newlines: true,
    space_around_combinator: true
  },
  input: `@mixin navbar-variant($color, $font-color: rgba(255, 255, 255, 0.8), $hover-color: #f6f6f6, $hover-bg: rgba(0, 0, 0, 0.1)) {
    background-color: $color; 
    
    //Navbar links
    .nav > li > a {
        color: $font-color;
    }
}`,
  expected: `@mixin navbar-variant($color, $font-color: rgba(255, 255, 255, 0.8), $hover-color: #f6f6f6, $hover-bg: rgba(0, 0, 0, 0.1)) {
    background-color: $color;

    //Navbar links
    .nav > li > a {
        color: $font-color;
    }
}`
};
