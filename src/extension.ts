import * as vscode from 'vscode';
import Range = vscode.Range;

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	vscode.commands.registerCommand('extension.textFunctions', textFunctions);

	console.log('decorator sample is activated');

	// create a decorator type that we use to decorate small numbers
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			borderColor: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			borderColor: 'lightblue'
		}
	});

	// create a decorator type that we use to decorate large numbers
	const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		backgroundColor: 'rgba(255,0,0,0.3)'
	});

	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	var timeout = null;
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /'[\u4e00-\u9fa5|\s]+'/g;
		const text = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			if(startPos.character >= 3) {
				// 如果目标位置在一行的第三位之后，则需要判断是否前两位为__(
				const beforeText = text.substring(match.index, match.index - 3);
				const afterText = text.substring(match.index + match[0].length, match.index + match[0].length + 1);
				if(beforeText === '__\(' && afterText === '\)') {
					continue;
				}
			}
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'need add i18n __(\'**' + match[0] + '**\')' };
			if (match[0].length < 3) {
				smallNumbers.push(decoration);
			} else {
				largeNumbers.push(decoration);
			}
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
		activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
	}
}

// Main menu /////////////////////////////////////
function textFunctions() {
	
	if (!vscode.window.activeTextEditor) {
		vscode.window.showInformationMessage('Open a file first to manipulate text selections');
		return;
	}
	let e = vscode.window.activeTextEditor;
	let d = e.document;
	let sel = e.selections;
	e.edit(function (edit) {
		// itterate through the selections and convert all text to Upper
		for (var x = 0; x < sel.length; x++) {
			let txt: string = d.getText(new Range(sel[x].start, sel[x].end));
			console.log(txt)
			edit.replace(sel[x], `__(${txt})`);
		}
	});

}
