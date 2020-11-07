'use strict'

import {
    languages,
    window,
    workspace
} from 'vscode'
import LinkProvider from './providers/linkProvider'
import * as util    from './util'

const debounce = require('lodash.debounce')
let providers = []
let envFile


export async function activate() {
    envFile = await workspace.findFiles('.env', null, 1)

    if (envFile.length) {
        util.readConfig()
        envFile = envFile[0]

        // config
        workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('laravel_goto_env')) {
                util.readConfig()
            }
        })

        // links
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

        // scroll
        util.scrollToText()

        // .env content changes
        util.listenForEnvFileChanges(envFile, debounce)
    }
}

function initProvider() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider(envFile)))
}

function clearAll() {
    return providers.forEach((e) => e.dispose())
}

export function deactivate() {
    clearAll()
}
