import { dump } from 'js-yaml';

import { Widget } from '@lumino/widgets';

export class JSONWidget extends Widget {
    constructor(id: string, label: string, caption: string) {
        super()
        this.id = id;
        this.title.label = label
        this.title.caption = caption
        this.title.closable = true
        this.addClass("aiidatree-yaml")
    }

    render(data: any) {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = "language-yaml"
        code.innerText = dump(data, { indent: 2 })
        pre.appendChild(code)
        this.node.appendChild(pre)
    }
}

// see: https://github.com/jupyterlab/jupyterlab/blob/master/packages/docmanager-extension/src/index.ts
// // Create a new untitled python file
// const model = await app.commands.execute('docmanager:new-untitled', {
//     type: 'file',
//     ext: 'json'
// });
// // Open the newly created file with the 'Editor'
// return app.commands.execute('docmanager:open', {
//     path: model.path,
//     factory: 'Editor'
// });