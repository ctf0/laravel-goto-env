'use strict'

import {languages, window, workspace} from 'vscode'
import LinkProvider                   from './providers/linkProvider'
import * as util                      from './util'

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
            if (e.affectsConfiguration(util.PACKAGE_NAME)) {
                util.readConfig()
            }
        })

        // links
        initProviders()
        window.onDidChangeActiveTextEditor((e) => initProviders())

        // scroll
        util.scrollToText()

        // .env content changes
        util.listenForEnvFileChanges(envFile, debounce)
    }
}

const initProviders = debounce(function () {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider(envFile)))
}, 250)


export function deactivate() {
    providers.forEach((e) => e.dispose())
}
