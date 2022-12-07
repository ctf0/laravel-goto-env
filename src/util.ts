'use strict'

import escapeStringRegexp from 'escape-string-regexp';
import {
    commands,
    DocumentSymbol,
    Position,
    Range,
    Selection, TextEditorRevealType, Uri,
    window,
    workspace
} from 'vscode';

const fs = require('fs')
const path = require('path')
const sep = path.sep
export const cmndName = 'lge.openFile'
const scheme = `command:${cmndName}`

/* -------------------------------------------------------------------------- */
let cache_store = []

export function getFilePath(envPath, text) {
    let info = text.replace(/['"]/g, '')
    let list = checkCache(envPath, info)
    let fileNameOnly = path.basename(envPath)

    if (!list.length) {
        let tooltip = getKeyLine(envPath, info)
        let obj = { path: normalizePath(`${sep}${envPath}`), query: info }

        if (tooltip) {
            tooltip = `${tooltip} (${fileNameOnly})`
        } else {
            tooltip = `add "${info}" To (${fileNameOnly})`
            Object.assign(obj, { add: true })
        }

        let args = prepareArgs(obj);

        list.push({
            tooltip: tooltip,
            fileUri: Uri.parse(`${scheme}?${args}`)
        })

        saveCache(envPath, info, list)
    }

    return list
}

function prepareArgs(args: object) {
    return encodeURIComponent(JSON.stringify([args]));
}

function normalizePath(path) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\+/g, '\\')
}

function getKeyLine(envPath, k) {
    let file = envFileContents.find((e) => e.path == envPath)
    let match = file.data.match(new RegExp(`^${k}.*`, 'm'))

    return match
        ? match[0].replace(`${k}=`, '')
        : null
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText(args) {
    if (args !== undefined) {
        let { path, query, add } = args
        let addNew = add !== undefined

        commands.executeCommand('vscode.open', Uri.file(path))
            .then(async () => {
                let editor = window.activeTextEditor
                let { document } = editor

                let symbols: DocumentSymbol[] = await commands.executeCommand("vscode.executeDocumentSymbolProvider", document.uri)
                let range: any

                if (addNew) {
                    let pos = new Position(document.lineCount + 1, 0)
                    range = document.validateRange(new Range(pos, pos))
                } else {
                    range = symbols.find((symbol) => symbol.name == query)?.location.range
                }

                if (range) {
                    editor.selection = new Selection(range.start, range.end)
                    editor.revealRange(range, TextEditorRevealType.InCenter)

                    if (addNew) {
                        editor.edit((edit) => {
                            edit.insert(range.start, `\n${query}=`)
                        })
                    }
                }
            })
    }
}


/* Content ------------------------------------------------------------------ */
export let envFileContents = []

export async function listenForEnvFileChanges(files, debounce) {
    try {
        for (const file of files) {
            await getEnvFileContent(file.path)

            let watcher = workspace.createFileSystemWatcher(`**/*${file}`)

            watcher.onDidChange(
                debounce(async function (e) {
                    await getEnvFileContent(file)
                }, 500)
            )
        }
    } catch (error) {
        // console.error(error);
    }
}

async function getEnvFileContent(path) {
    return fs.readFile(path, 'utf8', (err, data) => {
        envFileContents.push({
            path: path,
            data: data
        })
    })
}

/* Helpers ------------------------------------------------------------------ */

function checkCache(envPath, text) {
    let check = cache_store.find((e) => e.key == text && e.path == envPath)

    return check ? check.val : []
}

function saveCache(envPath, text, val) {
    cache_store.push({
        key: text,
        val: val,
        path: envPath
    })
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoEnv'
export let methods: string = ''
export let newKeysFile: string = ''
export let envFiles: any = []

export function readConfig() {
    let config = workspace.getConfiguration(PACKAGE_NAME)

    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|')
    envFiles = config.envFiles
    newKeysFile = config.newKeysFile
}
