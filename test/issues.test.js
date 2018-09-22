const vscode = require('vscode');
const fs = require('fs');
const expect = require('expect.js');

const issues = {};

const buildIssue = fileName => {
  if (fileName.startsWith('.')) return;
  issues[fileName.split('.')[0]] = require(__dirname + '/issues/' + fileName);
};

fs.readdirSync(__dirname + '/issues')
  .forEach(buildIssue);

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
          fs.writeFileSync(beautifySettingFilename, JSON.stringify(issue.beautifySetting));
        } else {
          fs.unlinkSync(beautifySettingFilename);
        }
        if ('codeSetting' in issue) {
          fs.writeFileSync(codeSettingFilename, JSON.stringify(issue.codeSetting));
        }
        await new Promise(resolve => setTimeout(resolve, 400));
      });
      afterEach(async function() {
        restoreCodeSettings();
        restoreBeautifySettings();
        await new Promise(resolve => setTimeout(resolve, 400));
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