'use strict'

import {
    DocumentLink,
    DocumentLinkProvider,
    TextDocument,
    window
} from 'vscode'
import * as util from '../util'

export default class LinkProvider implements DocumentLinkProvider {
    envPath
    methods

    constructor(envFile) {
        this.envPath = envFile.path
        this.methods = util.methods
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        let editor = window.activeTextEditor

        if (editor) {
            const text = doc.getText()
            const regex = new RegExp(`(?<=(${this.methods})\\()['"](.*?)['"]`, 'g')
            let links = []
            let matches = text.matchAll(regex)

            for (const match of matches) {
                let found = match[0]
                let files = await util.getFilePath(this.envPath, found)

                if (files.length) {
                    const range = doc.getWordRangeAtPosition(
                        doc.positionAt(match.index),
                        regex
                    )

                    for (const file of files) {
                        let documentlink = new DocumentLink(range, file.fileUri)
                        documentlink.tooltip = file.tooltip

                        links.push(documentlink)
                    }
                }
            }

            return links
        }
    }
}
