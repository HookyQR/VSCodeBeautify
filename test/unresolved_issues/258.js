module.exports = {
  extension: 'js',
  command: 'HookyQR.beautifyFile',
  beautifySetting: {
    indent_size: 2,
    indent_char: ' ',
    end_with_newline: true,
    space_after_anon_function: false,
    keep_array_indentation: true,
    brace_style: 'none,preserve-inline'
  },
  input: `export default class VISUAL {
  constructor(_dom) {
    this._dom = _dom
  }
  baseFun() {}
    [pieCase](params) {
      return true
    }
}`,
  expected: `export default class VISUAL {
  constructor(_dom) {
    this._dom = _dom
  }
  baseFun() {}
  [pieCase](params) {
    return true
  }
}`
};
