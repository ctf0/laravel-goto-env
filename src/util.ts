'use strict'

import {
    commands,
    env,
    Position,
    Range,
    Selection,
    Uri,
    window,
    workspace
} from 'vscode'

export function getFilePath(envPath, text) {
    let info = text.replace(/['"]/g, '')
    let editor = `${env.uriScheme}://file`
    let tt = getKeyLine(info)

    return tt
        ? {
            tooltip: tt,
            fileUri: Uri
                .parse(`${editor}/${envPath}`)
                .with({authority: 'ctf0.laravel-goto-env', query: info})
        }
        : {
            tooltip: `add "${info}" To .env`,
            fileUri: Uri
                .parse(`${editor}/${envPath}`)
                .with({authority: 'ctf0.laravel-goto-env', fragment: info})
        }
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText() {
    window.registerUriHandler({
        handleUri(uri) {
            let {authority, path, query, fragment} = uri

            if (authority == 'ctf0.laravel-goto-env') {
                commands.executeCommand('vscode.openFolder', Uri.file(path))
                    .then(() => {
                        setTimeout(() => {
                            let editor = window.activeTextEditor
                            let {document} = editor
                            let range

                            if (fragment) {
                                let pos = new Position(document.lineCount + 1, 0)
                                range = document.validateRange(new Range(pos, pos))
                            } else {
                                range = getTextPosition(query, document)
                            }

                            if (range) {
                                editor.selection = new Selection(range.start, range.end)
                                editor.revealRange(range, 3)

                                if (fragment) {
                                    editor.edit((edit) => {
                                        edit.insert(range.start, `\n${fragment}=`)
                                    })
                                }
                            }
                        }, 500)
                    })
            }
        }
    })
}

function getTextPosition(searchFor, doc) {
    const regex = new RegExp(searchFor)
    const match = regex.exec(doc.getText())

    if (match) {
        let pos = doc.positionAt(match.index + match[0].length)

        return new Range(pos, pos)
    }
}

/* Content ------------------------------------------------------------------ */
const fs = require('fs')
export let envFileContents = ''

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

function getEnvFileContent(envFile) {
    return fs.readFile(envFile.path, 'utf8', (err, data) => {
        envFileContents = data
    })
}

/* Config ------------------------------------------------------------------- */
const escapeStringRegexp = require('escape-string-regexp')
export let methods: string = ''

export function readConfig() {
    let config = workspace.getConfiguration('laravel_goto_env')

    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|')
}
