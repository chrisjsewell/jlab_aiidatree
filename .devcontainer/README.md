# Development container configuration

This folder contains configuration for creating a development container in VS Code: https://code.visualstudio.com/docs/remote/create-dev-container

Once inside the container, if it is new, you need to:

1. Create a new conda environment: `conda env create -f=.devcontainer/conda_env.yml`
2. Activate: `conda activate jupyterlab-ext`
3. Setup an aiida database:  `verdi quicksetup --config .devcontainer/quicksetup.yml`
4. Import the archive: `verdi archive import .devcontainer/archive.aiida`
5. Install the extension: `pip install -e .`
6. Link to JupyterLab: `jupyter labextension develop . --overwrite`
7. Install server: `jupyter server extension enable jlab_aiidatree`
8. Rebuild: `jlpm run build`
9. Start jupyter lab (in another tab): `jupyter lab --allow-root --ip 0.0.0.0 --port 8888 --no-browser --port-retries 0`
10. In a local browser you should be able to now do: `http://localhost:8888/lab`
