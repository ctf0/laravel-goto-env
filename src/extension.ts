'use strict'

import {languages, window, workspace} from 'vscode'
import LinkProvider                   from './providers/linkProvider'
import * as util                      from './util'

const debounce = require('lodash.debounce')
let providers  = []
let envFile

export async function activate() {
    envFile = await workspace.findFiles('.env', null, 1)

    if (envFile.length) {
        util.readConfig()
        envFile = envFile[0]

        // config
        workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration(util.PACKAGE_NAME)) {
                util.readConfig()
            }
        })

        // links
        initProviders()
        window.onDidChangeActiveTextEditor(async (e) => {
            await clearAll()
            initProviders()
        })

        // scroll
        util.scrollToText()

        // .env content changes
        util.listenForEnvFileChanges(envFile, debounce)
    }
}

const initProviders = debounce(function() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider(envFile)))
}, 250)

function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose())
        providers = []

        setTimeout(() => {
            return res(true)
        }, 500)
    })
}

export function deactivate() {
    clearAll()
}
