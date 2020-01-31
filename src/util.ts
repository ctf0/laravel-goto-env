'use strict'

import { workspace, TextDocument, Uri, env } from 'vscode'

const glob = require("fast-glob")

export async function getFilePath(text: string, document: TextDocument) {
    let info = text.match(new RegExp(/['"](.*?)['"]/))[1]
    let workspaceFolder = workspace.getWorkspaceFolder(document.uri).uri.fsPath
    let url = await glob('.env', { cwd: workspaceFolder })
    let editor = `${env.uriScheme}://file`

    return {
        showPath: `${url}#${info}`,
        fileUri: Uri
            .parse(`${editor}${workspaceFolder}/${url}?query=${info}`)
            .with({ authority: 'ctf0.laravel-goto-env' })
    }
}
