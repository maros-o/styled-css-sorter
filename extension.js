const vscode = require("vscode");
const { propsPriority } = require("./propsPriority");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("styled-css-sorter is now active");

  let editFileDisposable = vscode.commands.registerCommand(
    "styled-css-sorter.helloWorld",
    function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const docUri = editor.document.uri;

      vscode.workspace.openTextDocument(docUri).then((document) => {
        let isInsideBacktick = false;
        let skipping = false;
        const groups = [];
        let currentGroup = {};

        for (let i = 0; i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const lineText = line.text;

          if (lineText.includes("&") || lineText.trim().length === 0) {
            skipping = true;
          }

          if (lineText.includes("`")) {
            skipping = false;

            if (isInsideBacktick) {
              isInsideBacktick = false;
            } else {
              isInsideBacktick = true;
              currentGroup = { start: i + 1, lines: [] };
              groups.push(currentGroup);
            }
            continue;
          }

          if (skipping) {
            continue;
          }

          if (isInsideBacktick) {
            const prop = lineText.split(":")[0].trim();

            currentGroup.lines.push({
              prop: prop,
              text: lineText,
              priority: prop in propsPriority ? propsPriority[prop] : Infinity,
            });
          }
        }

        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];

          group.lines.sort((a, b) => {
            return a.priority - b.priority;
          });
        }

        console.log(groups);

        const newLines = document.getText().split("\n");

        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];

          for (let j = 0; j < group.lines.length; j++) {
            const line = group.lines[j];
            newLines[group.start + j] = line.text;
          }
        }

        editor.edit((editBuilder) => {
          editBuilder.replace(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(document.lineCount + 1, 0)
            ),
            newLines.join("\n")
          );
        });
      });
    }
  );

  context.subscriptions.push(editFileDisposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
