// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ProjectTreeProvider, ProjectTreeItem } from './views/Projects';
import { NewProjectWizardWebviewHandler } from './views/NewProjectWizard';

import { CppBuild } from './cb/CppBuild';
import { CppBuildViewModel } from './ExtensionViewModel';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-cppbuild" is now active!');

	const vm = new CppBuildViewModel;
	vm.newProjectWizard = new NewProjectWizardWebviewHandler();

	const cppBuild = new CppBuild;
	vm.model = cppBuild;

	const updateWorkspaceFolders = () => {
		if (vscode.workspace.rootPath)
		{
			cppBuild.buildDirectory = path.join(vscode.workspace.rootPath, "build");
			cppBuild.workspaceDirectory = vscode.workspace.rootPath;
			vscode.window.showInformationMessage("Workspace folders updated.");
		}
		else
		{
			vscode.window.showInformationMessage("No workspace open.");
		}
	};
	updateWorkspaceFolders();

	vscode.workspace.onDidChangeWorkspaceFolders(ev => updateWorkspaceFolders());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('cppBuild.openNewProjectWizard', () => {
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'newProjectWizard', // Identifies the type of the webview. Used internally
				'New Project', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					enableScripts: true
				} // Webview options. More on these later.
			);

			vm.newProjectWizard!.setup(panel);

			context.subscriptions.push(vm.newProjectWizard!);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('cppBuild.buildProject',
			(element : ProjectTreeItem) => {
				vscode.window.showInformationMessage(`Building project "${element.label!}"`);
				vm.model!.buildProject();
			}
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('cppBuild.loadRootProject',
			(uri : vscode.Uri) => {
				const projectName = path.relative(vm.model!.workspaceDirectory, uri.fsPath);
				vscode.window.showInformationMessage(`Loading root project "${projectName}"\nPath: ${uri.fsPath} \nWorkspace: ${vm.model!.workspaceDirectory}`);
				vm.model!.setProjectFile(projectName);
				vm.projectTree!.projects = [ projectName ];
				vm.projectTree!.refresh();
			}
		)
	);
	
	

	cppBuild.outputChannel = vscode.window.createOutputChannel("CppBuild");
	context.subscriptions.push(cppBuild.outputChannel);

	const projectTree = new ProjectTreeProvider();
	vm.projectTree = projectTree;

	vscode.window.createTreeView('cppBuildProjectView', {
		treeDataProvider: projectTree
	});

	vm.setup();
}

// this method is called when your extension is deactivated
export function deactivate() { }
