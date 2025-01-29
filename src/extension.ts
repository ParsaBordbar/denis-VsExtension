import ollama from 'ollama';
import * as vscode from 'vscode';

const getWebViewContent = () => {
	return /*html*/ ` 
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>DENIS AI</title>
			<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
			<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/core.min.js"></script>
			<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/languages/javascript.min.js"></script>
			<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/languages/c.min.js"></script>
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github-dark.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github-dark.min.css">
			<style>
				:root {
					--vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "Ubuntu", "Droid Sans", sans-serif;
					--vscode-button-background: #8f5e15;
					--tokyo-terminal-black: #414868;
					--tokyo-editor-bg: #24283b;
					--tokyo-text: #7aa2f7;
					--header: #b4f9f81;
					--response-text: #bb9af7;
				}
	
				body {
					font-family: var(--vscode-font-family);
					background: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					display: flex;
					flex-direction: column;
					margin: 3rem 16rem;
				}

				#askBtn {
					background-color: #8c4351;
					color: white;
					font: bold;
					margin-right: 1rem;
					width: 7.2rem;
					height: 2rem;
					border: none;
					padding: 0.5rem 1rem;
					border-radius: 1.2rem;
					cursor: pointer;
					align-self: flex-start;
					transition: opacity 0.2s;
					border-radius: 16px;
					display: flex;
					gap: .1rem;
					justify-content: center;
					align-items: center;
				}

				#askBtn:hover {
					opacity: 0.9;
				}

				#askBtn:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				#prompt{
					background: var(--tokyo-editor-bg);
					color: var(--tokyo-text);
					flex: 1;
					padding: 1rem;
					border-radius: 16px;
					margin: 1.2rem;
					height: 6rem;
					resize: none;
					border: none;
					outline: none;
				}

				#response{
					flex: 1;
					color: var(--response-text);
					margin: 2rem 1rem;
					border-radius: 4px;
					overflow-y: auto;
					white-space: pre-wrap;
				}

				.title{
					color: var(--header);
					font: bold;
					margin: 2rem 0px;
				}

				.inputs{
					display: flex;
					justify-content: end;
					align-items: start;
				}
				background: #1a1a1a;
				padding: 1rem;
				border-radius: 8px;
				margin: 1rem 0;
				font-family: 'Fira Code', monospace;
			}

			.think-block {
				background: #2a2a2a40;
				color: #88c0d0;
				padding: 1rem;
				border-left: 3px solid #8fbcbb;
				margin: 1rem 0;
				font-style: italic;
			}

			pre {
				margin: 0;
				padding: 0;
			}

			code {
				font-family: 'Fira Code', monospace;
			}
			</style>
		</head>
		<body>
			<h2 class="title">Denis chatbot</h2>
			<textarea id="prompt" placeholder="Hello There! How can I assist you?"></textarea>
			<div class="inputs">
				<button id="askBtn">Ask</button>
			</div>
			<div id="response"></div>
			<script>
				const vsCode = acquireVsCodeApi();
				const prompt = document.getElementById('prompt');
				const askBtn = document.getElementById('askBtn');

				askBtn.addEventListener('click', () => {
					prompt.value.trim();
					const text = document.getElementById('prompt').value;
					vsCode.postMessage({ command: 'chat', text });
					prompt.value = ''
				});

				
				prompt.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						askBtn.click();
					}
				});
				
				window.addEventListener('message', event => {
					const { command, text } = event.data;
					if (command === 'chatResponse') {
						document.getElementById('response').innerText = text;
					}
				});
			</script>
		</body>
	</html>
	`;
};

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "denis-ai" is now active!');

	const disposable = vscode.commands.registerCommand('denis-ai-ext.start', () => {
		// Chat dialog here
		const panel = vscode.window.createWebviewPanel(
			'DenisAi',
			'Denis Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true},
		);
		panel.webview.html = getWebViewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let response = '';
				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:latest',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true,
					});
				
					for await (const part of streamResponse) {
						response += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: response });
					}
				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error ${String(err)}` });
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
