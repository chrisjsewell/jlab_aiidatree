import { CommandRegistry } from '@lumino/commands';

import { PanelLayout, Widget } from "@lumino/widgets";
import { Toolbar, ToolbarButton } from "@jupyterlab/apputils";
import { ILayoutRestorer, JupyterFrontEnd } from "@jupyterlab/application";
import { refreshIcon } from "@jupyterlab/ui-components";

import { sortBy } from 'lodash';

import "../style/index.css";
import { CommandIDs } from './consts';
import { queryNode, queryProcesses } from './rest';
import { dump } from 'js-yaml';


export function constructTreeWidget(app: JupyterFrontEnd,
    id: string, side: string = "left", restorer: ILayoutRestorer) {
    const widget = new AiidaTreeWidget(app, id);
    restorer.add(widget, widget.id);
    app.shell.add(widget, side);
    createCoreCommands(app, widget);
    createItemsContextMenu(app, widget);
    createMainToolbar(app, widget);
    return widget;
}


export class AiidaTreeWidget extends Widget {

    public commands: CommandRegistry;
    public toolbar: Toolbar;
    public processTable: HTMLTableElement;
    // public tree: HTMLElement;
    public selected_pk: number | undefined;

    public constructor(
        app: JupyterFrontEnd,
        id: string,
    ) {
        super();
        this.id = id;
        this.title.iconClass = "aiidatree-icon";
        this.title.caption = "AiiDA Tree";
        this.title.closable = true;
        this.addClass("jp-aiidatreeWidget");
        this.addClass(id);

        this.commands = app.commands;

        this.toolbar = new Toolbar<Widget>();
        this.toolbar.addClass("aiidatree-toolbar");
        this.toolbar.addClass(id);
        const layout = new PanelLayout();
        layout.addWidget(this.toolbar);
        this.layout = layout;

        this.selected_pk = undefined;
    }

    public async refresh() {
        if (typeof this.processTable !== 'undefined') {
            this.node.removeChild(this.processTable)
        }
        await this.buildProcessesTable()
    }

    public buildHTMLTable(headers: string[], classPrefix: string = "aiidatree") {
        /**
         * Build a HTML Table
         * 
         * @param  {string[]} headers
         * @param  {any} data
         */
        const table = document.createElement("table");
        table.className = `${classPrefix}-head`;
        const thead = table.createTHead();
        const tbody = table.createTBody();
        tbody.id = `${classPrefix}-body`;
        const headRow = document.createElement("tr");
        headers.forEach((el: string) => {
            const th = document.createElement("th");
            th.className = `${classPrefix}-header`;
            th.appendChild(document.createTextNode(el));
            headRow.appendChild(th);
        });
        headRow.children[headRow.children.length - 1].className += " modified";
        thead.appendChild(headRow);
        table.appendChild(thead);
        table.appendChild(tbody);

        return { table, tbody };
    }

    public buildTableRow(tree: HTMLElement, row: any[], level: number, parent: any, id: string) {
        const tr = this.createTreeElement(row, level, id);
        tree.appendChild(tr);
        return tr
    }

    public createTreeElement(row: any[], level: number, id: string) {
        const tr = document.createElement("tr");
        for (const column of row) {
            const td = document.createElement("td");
            const content = document.createElement("span");
            content.innerHTML = `${column}`;
            td.appendChild(content);
            tr.appendChild(td);
        }
        tr.className = "aiidatree-item";
        tr.id = id
        return tr;
    }

    public async buildProcessesTable() {
        let processes = await queryProcesses(100)
        processes = sortBy(processes, ['id'])
        const html = this.buildHTMLTable(['id', 'Label', 'State']);
        for (const process of processes) {
            const tr = this.buildTableRow(html.tbody, [process.id, process.processLabel, process.processState], 1, "", `${process.id}`)
            tr.oncontextmenu = () => {
                this.commands.execute(CommandIDs.setContext + ":" + this.id, { pk: process.id });
            };
            tr.onclick = () => {
                this.commands.execute(CommandIDs.setContext + ":" + this.id, { pk: process.id });
            };
            tr.ondblclick = () => {
                this.commands.execute(CommandIDs.inspectNode + ":" + this.id, { pk: process.id })
            }
        }
        this.processTable = html.table
        this.node.appendChild(html.table);
    }

}

function createCoreCommands(app: JupyterFrontEnd, widget: AiidaTreeWidget) {
    app.commands.addCommand(CommandIDs.refresh + ":" + widget.id, {
        execute: (args) => {
            widget.refresh();
        }
    })

    app.commands.addCommand(CommandIDs.setContext + ":" + widget.id, {
        execute: (args) => {
            if (typeof widget.selected_pk !== "undefined") {
                const element = widget.node.querySelector(
                    `[id='${widget.selected_pk}']`,
                );
                if (element !== null) {
                    element.className = element.className.replace("selected", "");
                }
            }
            widget.selected_pk = args.pk as number;
            if (typeof widget.selected_pk !== "undefined") {
                const element = widget.node.querySelector(
                    `[id='${widget.selected_pk}']`,
                );
                if (element !== null) {
                    element.className += " selected";
                }
            }
        },
        label: "Need some Context",
    });

    app.commands.addCommand(CommandIDs.select + ":" + widget.id, {
        execute: (args) => {
            if (typeof widget.selected_pk !== "undefined") {
                const element = widget.node.querySelector(
                    `[id='${widget.selected_pk}']`,
                );
                if (element !== null) {
                    element.className = element.className.replace("selected", "");
                }
            }
            if (typeof args.pk === "undefined") {
                return;
            }
            widget.selected_pk = args.pk as number;
            const element = widget.node.querySelector(
                `[id='${widget.selected_pk}']`,
            );
            if (element !== null) {
                element.className += " selected";
            }
        },
        label: "Select",
    });

    app.commands.addCommand(CommandIDs.inspectNode + ":" + widget.id, {
        execute: async (args) => {
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
            const inspect_widget = new Widget();
            const pk = typeof args['pk'] === 'undefined' ? widget.selected_pk : args['pk'] as number;
            let data = await queryNode(pk)
            inspect_widget.id = `${widget.id}-pk-${pk}`
            inspect_widget.title.label = `Inspect Node ${pk}`
            inspect_widget.title.caption = "Inspect a node's data"
            inspect_widget.title.closable = true
            inspect_widget.addClass("aiidatree-yaml")
            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.className = "language-yaml"
            code.innerText = dump(data, { indent: 2 })
            pre.appendChild(code)
            inspect_widget.node.appendChild(pre)
            app.shell.add(inspect_widget, 'main');
        },
        label: "Inspect"
    })
}

function createItemsContextMenu(app: JupyterFrontEnd, widget: Widget) {
    app.contextMenu.addItem({
        command: CommandIDs.inspectNode + ":" + widget.id,
        rank: 3,
        selector: "div." + widget.id + " > table > *> .aiidatree-item",
    });
}

function createMainToolbar(app: JupyterFrontEnd, widget: AiidaTreeWidget) {
    const refresh = new ToolbarButton({
        icon: refreshIcon,
        onClick: () => {
            app.commands.execute(CommandIDs.refresh + ":" + widget.id);
        },
        tooltip: "Refresh",
    });
    widget.toolbar.addItem("refresh", refresh);
}
