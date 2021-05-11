import {
    CommandRegistry
  } from '@lumino/commands';
import { Widget } from "@lumino/widgets";
import { ILayoutRestorer, JupyterFrontEnd } from "@jupyterlab/application";

import "../style/index.css";
import { queryProcesses } from './rest';
import { sortBy } from 'lodash';

export function constructTreeWidget(app: JupyterFrontEnd,
    id: string, side: string = "left", restorer: ILayoutRestorer) {
    const widget = new AiidaTreeWidget(app, id);
    restorer.add(widget, widget.id);
    app.shell.add(widget, side);
    return widget;
}

export class AiidaTreeWidget extends Widget {

    public commands: CommandRegistry;
    // public table: HTMLTableElement;
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
    
        return {table, tbody};
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
        this.node.appendChild(html.table);
      }

}
