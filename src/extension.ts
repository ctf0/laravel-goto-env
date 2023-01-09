'use strict';

import debounce from 'lodash.debounce';
import { commands, languages, window, workspace } from 'vscode';
import LinkProvider from './providers/linkProvider';
import * as util from './util';

let providers: any = [];
let envFiles: any = [];

export async function activate({ subscriptions }) {
    util.readConfig();

    const promises = util.envFiles.map(async (file) => await workspace.findFiles(file, null, 1));
    envFiles = await Promise.all(promises);
    envFiles = envFiles
        .filter((e) => e.length)
        .map((e) => e[0]);

    if (envFiles.length) {
        // config
        subscriptions.push(
            workspace.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(util.PACKAGE_NAME)) {
                    util.readConfig();
                }
            }),
        );

        // links
        initProviders();
        subscriptions.push(
            window.onDidChangeActiveTextEditor(async (e) => {
                await clearAll();
                initProviders();
            }),
        );

        // scroll
        subscriptions.push(commands.registerCommand(util.CMND_NAME, util.scrollToText));

        // .env content changes
        util.listenForEnvFileChanges(envFiles, debounce);
    }
}

const initProviders = debounce(() => {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider(envFiles)));
}, 250);

function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose());
        providers = [];

        setTimeout(() => res(true), 500);
    });
}

export function deactivate() {
    clearAll();
}
