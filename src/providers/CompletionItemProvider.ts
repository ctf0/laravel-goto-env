'use strict'

import {
    CompletionItemKind,
    CompletionItem
} from "vscode"
import * as util from '../util'

export default class CompletionItemProvider {
    env_list
    methods

    constructor() {
        this.methods = util.methods
        this.env_list = util.envFileContents.split('\n').filter((e) => e)
    }

    provideCompletionItems(document, position) {
        let txt = document.lineAt(position).text
        let reg = new RegExp(`(?<=(${this.methods})\\()['"].*?['"]`, 'g')

        if (!txt.match(reg)) {
            return undefined
        }

        let arr = []

        for (const line of this.env_list) {
            let split = line.split('=')
            let label = split[0]

            let comp = new CompletionItem(label, CompletionItemKind.Reference)
            comp.commitCharacters = ['_']
            comp.detail = 'Laravel GoTo Env'
            comp.documentation = line

            arr.push(comp)
        }

        return arr
    }
}
