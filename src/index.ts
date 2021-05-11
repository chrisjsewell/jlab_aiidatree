import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { constructTreeWidget } from './tree';

/**
 * Initialization data for the jlab_aiidatree extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jlab_aiidatree:plugin',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: async (app: JupyterFrontEnd, resolver: ILayoutRestorer) => {
    console.log('JupyterLab extension jlab_aiidatree is activated!');

    const widget = constructTreeWidget(app, "jlab_aiidatree", "left", resolver)
    await widget.buildProcessesTable()
  }
};

export default extension;
