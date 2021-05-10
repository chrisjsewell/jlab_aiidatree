import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the jlab_aiidatree extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jlab_aiidatree:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jlab_aiidatree is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jlab_aiidatree server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default extension;
