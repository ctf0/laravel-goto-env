'use strict'

import {
    languages,
    ExtensionContext,
    window,
    commands,
    Uri,
    Range,
    Selection
} from 'vscode'
import LinkProvider from './providers/linkProvider'

const debounce = require('lodash.debounce')
let providers = []

export function activate(context: ExtensionContext) {
    setTimeout(() => {
        if (window.activeTextEditor) {
            initProvider()
        }

        window.onDidChangeTextEditorVisibleRanges(
            debounce(function (e) {
                clearAll()
                initProvider()
            }, 250)
        )

        window.onDidChangeActiveTextEditor(
            debounce(function (editor) {
                if (editor) {
                    clearAll()
                    initProvider()
                }
            }, 250)
        )
    }, 2000)

    window.registerUriHandler({
        handleUri(uri) {
            let { authority, path, query } = uri

            if (authority == 'ctf0.laravel-goto-env') {
                commands.executeCommand('vscode.openFolder', Uri.file(path))
                    .then(() => {
                        setTimeout(() => {
                            let editor = window.activeTextEditor
                            let range = getTextPosition(query.replace('query=', ''), editor.document)

                            editor.selection = new Selection(range.start, range.end)
                            editor.revealRange(range, 2)
                        }, 100)
                    })
            }
        }
    })
}

function getTextPosition(searchFor, doc) {
    const regx = new RegExp(searchFor)
    const match = regx.exec(doc.getText())

    if (match) {
        return new Range(
            doc.positionAt(match.index),
            doc.positionAt(match.index + match[0].length)
        )
    }
}


function initProvider() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()))
}

function clearAll() {
    return providers.forEach((e) => e.dispose())
}

export function deactivate() {
    clearAll()
}
