import debounce from 'lodash.debounce';
import { commands, languages, window, workspace } from 'vscode';
import LinkProvider from './providers/linkProvider';
import * as util from './util';

let providers: any = [];

export async function activate({ subscriptions }) {
    util.readConfig();
    await util.getEnvFiles();

    if (util.envFilesPaths.length) {
        // config
        subscriptions.push(
            workspace.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(util.PACKAGE_NAME)) {
                    util.readConfig();
                    await util.getEnvFiles();
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
        util.listenForEnvFileChanges(subscriptions);
    }
}

const initProviders = debounce(() => {
    providers.push(languages.registerDocumentLinkProvider(['php', 'blade'], new LinkProvider()));
}, 250);

function clearAll() {
    return new Promise((res, rej) => {
        providers.map((e) => e.dispose());
        providers = [];

        setTimeout(res, 500);
    });
}

export function deactivate() {
    clearAll();
}
