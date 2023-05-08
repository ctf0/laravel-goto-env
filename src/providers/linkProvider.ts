import escapeStringRegexp from 'escape-string-regexp';
import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window,
} from 'vscode';
import * as util from '../util';

export default class LinkProvider implements DocumentLinkProvider {
    methods;
    envFilesPaths;

    constructor() {
        this.envFilesPaths = util.envFilesPaths;
        this.methods = util.methods;
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        const editor = window.activeTextEditor;
        const links: DocumentLink[] = [];

        if (editor) {
            const text = doc.getText();
            const regex = new RegExp(`(?<=(${this.methods})\\()['"](.*?)['"]`, 'g');
            const matches = text.matchAll(regex);

            for (const match of matches) {
                const found = match[2];
                const range = doc.getWordRangeAtPosition(
                    // @ts-ignore
                    doc.positionAt(match.index + found.length),
                    new RegExp(escapeStringRegexp(found)),
                );

                const files: any = [];

                for (const file of this.envFilesPaths) {
                    const path = file.path;
                    files.push({
                        path,
                        data: await util.getFilePath(path, found),
                    });
                }

                if (files.length && range) {
                    for (const file of files) {
                        if (file.data) {
                            for (const link of file.data) {
                                const documentlink: DocumentLink = new DocumentLink(range, link.fileUri);
                                documentlink.tooltip = link.tooltip;

                                links.push(documentlink);
                            }
                        }
                    }
                }
            }
        }

        return links;
    }
}
