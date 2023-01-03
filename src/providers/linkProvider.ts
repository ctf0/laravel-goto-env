'use strict';

import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window,
} from 'vscode';
import * as util from '../util';

export default class LinkProvider implements DocumentLinkProvider {
    envFiles;
    methods;

    constructor(envFiles) {
        this.envFiles = envFiles;
        this.methods = util.methods;
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        const editor = window.activeTextEditor;

        if (editor) {
            const text = doc.getText();
            const regex = new RegExp(`(?<=(${this.methods})\\()['"](.*?)['"]`, 'g');
            const links = [];
            const matches = text.matchAll(regex);

            for (const match of matches) {
                const found = match[0];
                const range = doc.getWordRangeAtPosition(
                    doc.positionAt(match.index),
                    regex,
                );

                const files = [];

                for (const file of this.envFiles) {
                    const path = file.path;
                    files.push({
                        path : path,
                        data : await util.getFilePath(path, found),
                    });
                }

                if (files.length && range) {
                    for (const file of files) {
                        if (file.data) {
                            for (const link of file.data) {
                                const documentlink = new DocumentLink(range, link.fileUri);
                                documentlink.tooltip = link.tooltip;

                                links.push(documentlink);
                            }
                        }
                    }
                }
            }

            return links;
        }
    }
}
