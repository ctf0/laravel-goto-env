'use strict'

import { workspace, TextDocument, Uri } from 'vscode'

const glob = require("fast-glob")

export async function getFilePaths(text: string, document: TextDocument) {
    let info = text.match(new RegExp(/['"](.*?)['"]/))[1]
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.fsPath
    let result = []
    let urls = await glob('.env', { cwd: workspaceFolder })

    for (const url of urls) {
        result.push({
            showPath: `${url}`,
            fileUri: Uri.file(`${workspaceFolder}/${url}`)
        })
    }

    return result
}
