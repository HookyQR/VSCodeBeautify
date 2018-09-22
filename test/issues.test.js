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
      'beautify.config': {
        newline_between_rules: false
      },
      'beautify.language':{
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

let codeSettings, beautifySettings;
const codeSettingFilename = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.vscode/settings.json';
const beautifySettingFilename = vscode.workspace.workspaceFolders[0].uri.fsPath + '/.jsbeautifyrc';

const storeCodeSettings = () => codeSettings = fs.readFileSync(codeSettingFilename);
const storeBeautifySettings = () => beautifySettings = fs.readFileSync(beautifySettingFilename);
const restoreBeautifySettings = () => fs.writeFileSync(beautifySettingFilename, beautifySettings);
const restoreCodeSettings = () => fs.writeFileSync(codeSettingFilename, codeSettings);

describe('Issues', () => {
  for (let issueId in issues) {
    context(issueId, () => {
      const issue = issues[issueId];
      beforeEach(async function() {
        this.timeout(0);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        storeCodeSettings();
        storeBeautifySettings();
        if ('beautifySetting' in issue) {
          const editor = await vscode.window.showTextDocument(
            vscode.Uri.file(beautifySettingFilename)
          );
          await editor.edit(fillEditor.bind(0, JSON.stringify(issue.beautifySetting)));
          await editor.document.save();
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        } else {
          await new Promise(resolve => fs.unlink(beautifySettingFilename, resolve));
        }
        if ('codeSetting' in issue) {
          const editor = await vscode.window.showTextDocument(
            vscode.Uri.file(codeSettingFilename)
          );
          await editor.edit(fillEditor.bind(0, JSON.stringify(issue.codeSetting)));
          await editor.document.save();
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        await new Promise(resolve => setTimeout(resolve, 400));
      });
      afterEach(() => {
        restoreCodeSettings();
        restoreBeautifySettings();
      });
      it('fixed', async () => {
        if (process.platform.startsWith('win')) {
          issue.input = issue.input.replace(/\n/g, '\r\n');
          issue.expected = issue.expected.replace(/\n/g, '\r\n');
        }
        const editor = await openFileWithInput(issue.extension, issue.input);
        await vscode.commands.executeCommand(issue.command);

        expect(editor.document.getText())
          .to.be(issue.expected);
      });
    });
  }
});