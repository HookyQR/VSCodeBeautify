const vscode = require('vscode');
const expect = require('expect.js');

const createEditor = extension => vscode.window.showTextDocument(
  vscode.Uri.parse(`untitled:./test.${extension}`)
);

const fillEditor = (text, edits) => edits.replace(
  new vscode.Range(0, 0, Infinity, Infinity),
  text
);

const openFileWithInput = async (extension) => await createEditor(extension);

const beautified = async editor => {
  await vscode.commands.executeCommand('HookyQR.beautifyFile');
  return editor.document.getText();
};

const formatter = async editor => {
  await vscode.commands.executeCommand('editor.action.formatDocument');
  return editor.document.getText();
};

const beautifiedFirstLine = async editor => {
  await vscode.commands.executeCommand('cursorMove', {
    to: 'viewPortTop',
    select: false
  });
  await vscode.commands.executeCommand('cursorMove', {
    to: 'right',
    by: 'character',
    amount: 1,
    select: true
  });
  await vscode.commands.executeCommand('HookyQR.beautify');
  return editor.document.getText();
};

const beautifyTests = {
  js: {
    '"end_with_newline":true': ['var a=1;\n  var b=2;  ', 'var a = 1;\nvar b = 2;\n', 'var a = 1;\n  var b=2;  '],
    '"end_with_newline":false': ['var a=1;\n  var b=2;  \n', 'var a = 1;\nvar b = 2;', 'var a = 1;\n  var b=2;  \n'],
  },
  html: {
    '"end_with_newline":true': [
      '<div><span></span>\n   </div>',
      '<div><span></span>\n</div>\n',
      '<div><span></span>\n   </div>'
    ],
    '"end_with_newline":false': [
      '<div><span></span>\n   </div>\n',
      '<div><span></span>\n</div>',
      '<div><span></span>\n   </div>\n'
    ],
    '"wrap_attributes":"force"': [
      '<div data-thing="abc" class="a" style=""></div>',
      '<div data-thing="abc"\n    class="a"\n    style=""></div>'
    ],
    '"wrap_attributes":"force-expand-multiline"': [
      '<div data-thing="abc" class="a" style=""></div>',
      '<div\n    data-thing="abc"\n    class="a"\n    style=""\n></div>'
    ]
  },
  css: {
    '"end_with_newline":true': [
      '.a,   .b { color:blue;\ndisplay:block;}',
      '.a,\n.b {\n    color: blue;\n    display: block;\n}\n',
      '.a,\n.b {\n    color: blue;\ndisplay:block;}'
    ],
    '"end_with_newline":false': [
      '.a,   .b { color:blue;\ndisplay:block;}\n',
      '.a,\n.b {\n    color: blue;\n    display: block;\n}',
      '.a,\n.b {\n    color: blue;\ndisplay:block;}\n'
    ],
    '"newline_between_rules":true': [
      '.a{}.b{}',
      '.a {}\n\n.b {}'
    ],
  },
  scss: {
    '"newline_between_rules":true': [
      '.a,.b { &.c{} &.d{}\ncolor:blue;display:block;}',
      '.a,\n.b {\n    &.c {}\n\n    &.d {}\n\n    color:blue;\n    display:block;\n}'
    ],
    '"newline_between_rules":false': [
      '.a,.b { &.c{} &.d{}\ncolor:blue;display:block;}',
      '.a,\n.b {\n    &.c {}\n    &.d {}\n    color:blue;\n    display:block;\n}'
    ]
  }
};

describe('Beautify', () => {
  for (let ext in beautifyTests) {
    context(`${ext} file`, () => {
      for (let setting in beautifyTests[ext]) {
        let line = beautifyTests[ext][setting];
        if ( process.platform.startsWith('win')) {
          line = line.map( l => l.replace(/\n/g, '\r\n'));
        }
        context(`with: ${setting}`, () => {
          let editor;
          before(async function() {
            this.timeout(0);
            editor = await vscode.window.showTextDocument(
              vscode.Uri.parse(vscode.workspace.workspaceFolders[0].uri.toString() +
                '/.jsbeautifyrc')
            );
            await editor.edit(fillEditor.bind(0, `{${setting}}`));
            await editor.document.save();
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            editor = await openFileWithInput(ext);
          });
          beforeEach(async () => {
            await editor.edit(fillEditor.bind(0, line[0]));
          });
          after(async () => {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          });
          it('beautifies the file', async () => expect(await beautified(editor))
            .to.be(line[1]));
          if (line.length > 2) {
            it('beautifies a single line', async () => expect(await beautifiedFirstLine(editor))
              .to.be(line[2]));
            it('formats the file', async () => expect(await formatter(editor))
              .to.be(line[1]));
          }
        });
      }
    });
  }
});
