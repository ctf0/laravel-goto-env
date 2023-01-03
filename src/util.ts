'use strict';

import escapeStringRegexp from 'escape-string-regexp';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    commands,
    DocumentSymbol,
    Position,
    Range,
    Selection, TextEditorRevealType, Uri,
    window,
    workspace,
} from 'vscode';

const sep = path.sep;
export const CMND_NAME = 'lge.openFile';
const SCHEME = `command:${CMND_NAME}`;

/* -------------------------------------------------------------------------- */
const cache_store = [];

export function getFilePath(envPath, text) {
    const info = text.replace(/['"]/g, '');
    const list = checkCache(envPath, info);
    const fileNameOnly = path.basename(envPath);

    if (!list.length) {
        let tooltip = getKeyLine(envPath, info);
        const obj = { path: normalizePath(`${sep}${envPath}`), query: info };

        if (tooltip) {
            tooltip = `${tooltip} (${fileNameOnly})`;
        } else {
            tooltip = `add "${info}" To (${fileNameOnly})`;
            Object.assign(obj, { add: true });
        }

        const args = prepareArgs(obj);

        list.push({
            tooltip : tooltip,
            fileUri : Uri.parse(`${SCHEME}?${args}`),
        });

        saveCache(envPath, info, list);
    }

    return list;
}

function prepareArgs(args: object) {
    return encodeURIComponent(JSON.stringify([args]));
}

function normalizePath(path) {
    return path
        .replace(/\/+/g, '/')
        .replace(/\+/g, '\\');
}

function getKeyLine(envPath, k) {
    const file = envFileContents.find((e) => e.path == envPath);

    if (file) {
        const match = file.data.match(new RegExp(`^${k}.*`, 'm'));

        return match
            ? match[0].replace(`${k}=`, '')
            : null;
    }

    return null;
}

/* Scroll ------------------------------------------------------------------- */
export function scrollToText(args) {
    if (args !== undefined) {
        const { path, query, add } = args;
        const addNew = add !== undefined;

        commands.executeCommand('vscode.open', Uri.file(path))
            .then(async () => {
                const editor = window.activeTextEditor;
                const { document } = editor;

                const symbols: DocumentSymbol[] = await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
                let range: any;

                if (addNew) {
                    const pos = new Position(document.lineCount + 1, 0);
                    range = document.validateRange(new Range(pos, pos));
                } else {
                    range = symbols.find((symbol) => symbol.name == query)?.location.range;
                }

                if (range) {
                    editor.selection = new Selection(range.start, range.end);
                    editor.revealRange(range, TextEditorRevealType.InCenter);

                    if (addNew) {
                        editor.edit((edit) => {
                            edit.insert(range.start, `\n${query}=`);
                        });
                    }
                }
            });
    }
}


/* Content ------------------------------------------------------------------ */
export const envFileContents = [];

export async function listenForEnvFileChanges(files, debounce) {
    try {
        for (const file of files) {
            await getEnvFileContent(file.path);

            const watcher = workspace.createFileSystemWatcher(`**/*${file}`);

            watcher.onDidChange(
                debounce(async (e) => {
                    await getEnvFileContent(file);
                }, 500),
            );
        }
    } catch (error) {
        // console.error(error);
    }
}

async function getEnvFileContent(path) {
    return fs.readFile(path, 'utf8', (err, data) => {
        envFileContents.push({
            path : path,
            data : data,
        });
    });
}

/* Helpers ------------------------------------------------------------------ */

function checkCache(envPath, text) {
    const check = cache_store.find((e) => e.key == text && e.path == envPath);

    return check ? check.val : [];
}

function saveCache(envPath, text, val) {
    cache_store.push({
        key  : text,
        val  : val,
        path : envPath,
    });
}

/* Config ------------------------------------------------------------------- */
export const PACKAGE_NAME = 'laravelGotoEnv';
export let methods = '';
export let newKeysFile = '';
export let envFiles: any = [];

export function readConfig() {
    const config = workspace.getConfiguration(PACKAGE_NAME);

    methods = config.methods.map((e) => escapeStringRegexp(e)).join('|');
    envFiles = config.envFiles;
    newKeysFile = config.newKeysFile;
}
