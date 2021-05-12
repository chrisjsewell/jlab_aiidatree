import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { constructTreeWidget } from './tree_widget';

const PLUGIN_ID = 'jlab_aiidatree:settings-aiidatree'

/**
 * Initialization data for the jlab_aiidatree extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [ILayoutRestorer, ISettingRegistry],
  activate: async (app: JupyterFrontEnd, resolver: ILayoutRestorer, settings: ISettingRegistry) => {
    console.log('JupyterLab extension jlab_aiidatree is activated!');
    // await app.restored  // this was in the tutorial but it hangs
    const loadedSettings = await settings.load(PLUGIN_ID)    
    const widget = constructTreeWidget(app, "jlab_aiidatree", "left", resolver, loadedSettings)
    await widget.refresh()
  }
};

export default extension;
