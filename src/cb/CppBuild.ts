import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { spawnShellScript } from '../util/Shell';

const mkdir = promisify(fs.mkdir);

export class CppBuild
{
	
	projectFile = "";
	buildDirectory = "";
	workspaceDirectory = "";
	outputChannel?: vscode.OutputChannel;

	constructor()
	{
	}

	setProjectFile(projectFile : string)
	{
		this.projectFile = projectFile;
	}

	async buildProject()
	{
		this.outputChannel?.show();

		this.log(`# Building project "${this.projectFile}"`);

		const scriptFile = path.resolve(this.workspaceDirectory, this.projectFile); 

		mkdir(this.buildDirectory, { recursive: true }).then(
		() => {		
			const proc = spawnShellScript("cpp-build", [ scriptFile ], { cwd: this.buildDirectory });

			proc.stdout.on("data", (str : string) => { this.log(`[cpp-build | Info]: ${str}`); });
			proc.stderr.on("data", (str : string) => { this.log(`[cpp-build | Error]: ${str}`); });
			proc.on("error", (err) => { vscode.window.showErrorMessage(`Failed to run CppBuild, details:\n${err}`); });
			proc.on("close", (code, signal) =>
				{
					if (code !== 0) {
						this.log(`# Build failed (code: ${code}, signal: ${signal})`);
					}
					else {
						this.log(`# Build succeeded.`);
					}
					return Promise.resolve();
				});
		});
	}

	private log(msg : string) {
		this.outputChannel?.appendLine(msg);
	}
}

