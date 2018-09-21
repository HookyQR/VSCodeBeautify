const vscode = require('vscode');
const fs = require('fs');
const expect = require('expect.js');

const issues = {
  '265': {
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
      'beautify.language.css': 'scss'
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
  }
};

const createEditor = extension => vscode.window.showTextDocument(
  vscode.Uri.parse(`untitled:./test.${extension}`)
);

const fillEditor = (text, edits) => edits.replace(
  new vscode.Range(0, 0, Infinity, Infinity),
  text
);

const openFileWithInput = async (extension, text) => {
  const editor = await createEditor(extension);
  if (await editor.edit(fillEditor.bind(0, text))) {
    return editor;
  }
  return editor;
};

let codeSettings;
const settingFilename = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.vscode/settings.json';

const storeCodeSettings = () => codeSettings = fs.readFileSync(settingFilename);
const restoreCodeSettings = () => fs.writeFileSync(settingFilename, codeSettings);

describe('Issues', () => {
  for (let issueId in issues) {
    context(issueId, () => {
      beforeEach(() => storeCodeSettings());
      afterEach(() => restoreCodeSettings());
      it('fixed', async () => {
        const issue = issues[issueId];
        if ( process.platform.startsWith('win')) {
          issue.input = issue.input.replace(/\n/g, '\r\n');
          issue.expected = issue.expected.replace(/\n/g, '\r\n');
        }
        if (issue.codeSetting) {
          fs.writeFileSync(settingFilename, JSON.stringify(issue.codeSettings));
        }
        const editor = await openFileWithInput(issue.extension, issue.input);
        await vscode.commands.executeCommand(issue.command);

        expect(editor.document.getText()).to.be(issue.expected);
      });
    });
  }
});