import {
    CommandRegistry
} from '@lumino/commands';
import { PanelLayout, Widget } from "@lumino/widgets";
import { Toolbar, ToolbarButton } from "@jupyterlab/apputils";
import { ILayoutRestorer, JupyterFrontEnd } from "@jupyterlab/application";
import { refreshIcon } from "@jupyterlab/ui-components";
import { sortBy } from 'lodash';

import "../style/index.css";
import { CommandIDs } from './consts';
import { queryProcesses } from './rest';


export function constructTreeWidget(app: JupyterFrontEnd,
    id: string, side: string = "left", restorer: ILayoutRestorer) {
    const widget = new AiidaTreeWidget(app, id);
    restorer.add(widget, widget.id);
    app.shell.add(widget, side);
    createCoreCommands(app, widget);
    createMainToolbar(app, widget);
    return widget;
}


export class AiidaTreeWidget extends Widget {

    public commands: CommandRegistry;
    public toolbar: Toolbar;
    public processTable: HTMLTableElement;
    // public tree: HTMLElement;

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

    public buildTableRow(tree: HTMLElement, row: any[], level: number, parent: any) {
        const tr = this.createTreeElement(row, level);
        tree.appendChild(tr);
    }

    public createTreeElement(row: any[], level: number) {
        const tr = document.createElement("tr");
        for (const column of row) {
            const td = document.createElement("td");
            const content = document.createElement("span");
            content.innerHTML = `${column}`;
            td.appendChild(content);
            tr.appendChild(td);
        }
        tr.className = "aiidatree-item";
        return tr;
    }

    public async buildProcessesTable() {
        let processes = await queryProcesses(100)
        processes = sortBy(processes, ['id'])
        const html = this.buildHTMLTable(['id', 'Label', 'State']);
        for (const process of processes) {
            this.buildTableRow(html.tbody, [process.id, process.processLabel, process.processState], 1, "");
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
