'use strict'

import {
    Uri,
    env,
    Range,
    commands,
    window,
    workspace,
    Selection
} from 'vscode'

const fs = require("fs")
let envFileContents = ''
export let methods

export function readConfig() {
    methods = workspace.getConfiguration('laravel_goto_env').methods
    methods = methods.join('|')
}

export function getFilePath(envPath, text) {
    let info = text.match(new RegExp(/['"](.*?)['"]/))[1]
    let editor = `${env.uriScheme}://file`
    let tt = getKeyLine(info)

    return tt
        ? {
            tooltip: tt,
            fileUri: Uri
                .parse(`${editor}/${envPath}?query=${info}`)
                .with({ authority: 'ctf0.laravel-goto-env' })
        }
        : false
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText() {
    window.registerUriHandler({
        handleUri(uri) {
            let { authority, path, query } = uri

            if (authority == 'ctf0.laravel-goto-env') {
                commands.executeCommand('vscode.openFolder', Uri.file(path))
                    .then(() => {
                        setTimeout(() => {
                            let editor = window.activeTextEditor
                            let range = getTextPosition(query.replace('query=', ''), editor.document)

                            if (range) {
                                editor.selection = new Selection(range.start, range.end)
                                editor.revealRange(range, 2)
                            }
                        }, 100)
                    })
            }
        }
    })
}

export function getTextPosition(searchFor, doc) {
    const regex = new RegExp(searchFor)
    const match = regex.exec(doc.getText())

    if (match) {
        let pos = doc.positionAt(match.index + match[0].length)

        return new Range(pos, pos)
    }
}

/* Content ------------------------------------------------------------------ */
export async function listenForEnvFileChanges(envFile, debounce) {
    await getEnvFileContent(envFile)

    let watcher = workspace.createFileSystemWatcher('**/*.env')

    watcher.onDidChange(
        debounce(async function (e) {
            await getEnvFileContent(envFile)
        }, 500)
    )
}

function getKeyLine(k) {
    let match = envFileContents.match(new RegExp(`^${k}.*`, 'm'))

    return match ? match[0] : null
}

export function getEnvFileContent(envFile) {
    return fs.readFile(envFile.path, 'utf8', (err, data) => {
        envFileContents = data
    })
}
