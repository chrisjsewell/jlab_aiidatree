# jlab_aiidatree [IN-DEVELOPMENT]

![Github Actions Status](https://github.com/chrisjsewell/jlab_aiidatree/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/chrisjsewell/jlab_aiidatree/master?urlpath=lab)

A JupyterLab extension for exploring [AiiDA](https://www.aiida.net/) databases.
This is extension is intended to provide similar functionality for exploring graphs as the VS Code [AiiDA Explorer extension](https://marketplace.visualstudio.com/items?itemName=chrisjsewell.aiida-explore-vscode):

- View Processes
- Filter by process state
- Expand processes with their incoming/outgoing nodes
- View node attributes stored on the database
- Visualise node graphs (with D3 Graph)
- Visualise `StructureData` (the ThreeJS)

TODO:

- View Computers and attached codes
- View Groups and attached nodes

![Example](images/example.png)

This extension is composed of a Python package named `jlab_aiidatree`
for the server extension and a NPM package named `jlab_aiidatree`
for the frontend extension.

## Install

To install the extension, execute:

```bash
pip install jlab_aiidatree[aiida]
```

To connect to you database, ensure the setting are correct for your database (you can find these out with `verdi status`)

**IMPORTANT**: The database is connected to from the server side of AiiDA Lab, i.e. where you are hosting and not necessarily on your local machine:

![Settings](images/settings.png)

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jlab_aiidatree
```

## Requirements

* JupyterLab >= 3.0

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```


## Contributing

### Development install

Note: You will need NodeJS to build the extension package, e.g.

```bash
conda create -n jupyterlab-ext --override-channels --strict-channel-priority -c conda-forge -c anaconda jupyterlab=3 nodejs jupyter-packaging aiida-core~=1.6
conda activate jupyterlab-ext
reentry scan
```

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jlab_aiidatree directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jlab_aiidatree
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jlab_aiidatree
pip uninstall jlab_aiidatree
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jlab_aiidatree` within that folder.


### Deploying

See <https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html#packaging-your-extension>
