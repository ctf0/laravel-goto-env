'use strict'

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    DocumentLink,
    Position,
    window,
    Range
} from "vscode"
import * as util from '../util'

export default class LinkProvider implements vsDocumentLinkProvider {

    envPath
    regex

    constructor(envFile) {
        this.envPath = envFile.path
        this.regex = util.methods
    }

    async provideDocumentLinks(doc: TextDocument): Promise<DocumentLink[]> {
        let range = window.activeTextEditor.visibleRanges[0]
        let reg = new RegExp(`(?<=(${this.regex})\\()['"](.*?)['"]`, 'g')
        let documentLinks = []

        for (let i = range.start.line; i <= range.end.line; i++) {
            let line = doc.lineAt(i)
            let txt = line.text
            let result = txt.match(reg)

            if (result != null) {
                for (let found of result) {
                    let file = await util.getFilePath(this.envPath, found)

                    if (file) {
                        let start = new Position(line.lineNumber, txt.indexOf(found))
                        let end = start.translate(0, found.length)

                        let documentlink = new DocumentLink(new Range(start, end), file.fileUri)
                        documentlink.tooltip = file.tooltip
                        documentLinks.push(documentlink)
                    }
                }
            }
        }

        return documentLinks
    }
}
