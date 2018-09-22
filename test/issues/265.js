module.exports = {
  extension: 'scss',
  command: 'HookyQR.beautifyFile',
  codeSetting: {
    'terminal.integrated.shell.osx': 'zsh',
    'workbench.startupEditor': 'newUntitledFile',
    'editor.minimap.enabled': true,
    'files.autoSave': 'off',
    'editor.tabSize': 2,
    'telemetry.enableTelemetry': false,
    'window.zoomLevel': 0,
    'javascript.updateImportsOnFileMove.enabled': 'always',
    'files.associations': {
      '.jsbeautifyrc': 'jsonc'
    },
    'beautify.config': {
      newline_between_rules: false,
      indent_size: 2
    },
    'beautify.language': {
      'css': ['scss']
    }
  },
  input: `$color-variable:    #000;
.offers-table {
  margin: 0 auto;
.table-row {
margin: 0 auto;
}
.table-cell {
         margin: 0 auto;
}
}`,
  expected: `$color-variable: #000;
.offers-table {
  margin: 0 auto;
  .table-row {
    margin: 0 auto;
  }
  .table-cell {
    margin: 0 auto;
  }
}`
};
