'use strict'

import {languages, window, workspace, commands} from 'vscode'
import LinkProvider from './providers/linkProvider'
import * as util from './util'
import { debounce } from 'lodash'

let providers  = []
let envFiles = []

export async function activate({subscriptions}) {
    util.readConfig()

    let promises = util.envFiles.map(async (file) => await workspace.findFiles(file, null, 1))
    envFiles = await Promise.all(promises)
    envFiles = envFiles
                    .filter((e)=>e.length)
                    .map((e)=>e[0])

    if (envFiles.length) {
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
        subscriptions.push(commands.registerCommand(util.cmndName, util.scrollToText))


        // .env content changes
        util.listenForEnvFileChanges(envFiles, debounce)
    }
}

const initProviders = debounce(function() {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider(envFiles)))
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
