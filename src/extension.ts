import * as path from 'path';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Track the last saved file name
  let lastFileName: string | undefined = undefined;

  // Get the root directory of the workspace
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // Check if the workspace is a Flutter project
    isFlutterProject(workspaceRoot)
      .then((isFlutter) => {
        if (isFlutter) {
          // Calculate the relative path from the 'lib' directory
          const relativePathFromLib = (filePath: string) => {
            const libPath = path.join(workspaceRoot, 'lib');
            const relativePath = path.relative(libPath, filePath);
            // Replace backslashes with forward slashes
            return relativePath.replace(/\\/g, '/');
          };

          // Register a listener for the "onWillSaveTextDocument" event
          vscode.workspace.onWillSaveTextDocument(
            (event: vscode.TextDocumentWillSaveEvent) => {
              const document = event.document;

              // Check if the saved document is a Dart file
              if (document.languageId === 'dart') {
                // Get the file name of the saved document
                const fileName = relativePathFromLib(document.fileName);

                // Create a commented-out version of the file name
                const commentedFileName = `// ${fileName}`;

                // Get the text at the beginning of the document
                const firstLine = document.lineAt(0).text.trim();

                // Check if the first line starts with "//" and ends with ".dart"
                if (firstLine.startsWith('//') && firstLine.endsWith('.dart')) {
                  // Replace the first line with the commented file name
                  event.waitUntil(
                    Promise.resolve([
                      new vscode.TextEdit(
                        new vscode.Range(
                          new vscode.Position(0, 0),
                          new vscode.Position(0, firstLine.length)
                        ),
                        commentedFileName
                      ),
                    ])
                  );
                } else {
                  // Check if the commented file name is different from the last saved file name
                  if (fileName !== lastFileName) {
                    // Save the current file name as the last saved file name
                    lastFileName = fileName;

                    // Insert the commented-out file name at the beginning of the document
                    event.waitUntil(
                      Promise.resolve([
                        new vscode.TextEdit(
                          new vscode.Range(
                            new vscode.Position(0, 0),
                            new vscode.Position(0, 0)
                          ),
                          `${commentedFileName}\n${firstLine}`
                        ),
                      ])
                    );
                  }
                }
              }
            }
          );
        } else {
          console.log('This is not a Flutter project.');
        }
      })
      .catch((error) => {
        console.error('Error checking if Flutter project:', error);
      });
  }
}

export function deactivate() {}

async function isFlutterProject(workspaceRoot: string): Promise<boolean> {
  try {
    // Check if the 'pubspec.yaml' file exists in the workspace root directory
    const pubspecPath = path.join(workspaceRoot, 'pubspec.yaml');
    await vscode.workspace.fs.stat(vscode.Uri.file(pubspecPath));
    return true;
  } catch (error) {
    // Handle the error if 'pubspec.yaml' does not exist
    return false;
  }
}
