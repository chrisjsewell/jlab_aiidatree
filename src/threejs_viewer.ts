// adapted from https://github.com/pschatzmann/jupyterlab-viewer-3d
import { Widget } from '@lumino/widgets';

import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


interface Coordinates {
    x: number;
    y: number;
    z: number;
}

export class Output3DWidget extends Widget {
    private scene = new THREE.Scene();
    private renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    private camera = new THREE.PerspectiveCamera(40, this.node.clientWidth / this.node.clientHeight, 1, 1000);
    private controls = new OrbitControls(this.camera, this.renderer.domElement);

    constructor(id: string, label: string) {
        super()
        this.id = id;
        this.title.label = label
        this.title.closable = true
        this.addClass("aiidatree-threejs")
    }

    public initialise() {
        this.scene.background = new THREE.Color(0x999999);
        this.scene.add(new THREE.AmbientLight(0xffffff));
        this.camera.add(new THREE.PointLight(0xffffff, 0.8));
        this.camera.up.set(0, 0, 1);
        this.scene.add(this.camera);
        const grid = new THREE.GridHelper(200, 20, 0xffffff, 0x555555);
        grid.rotation.x = Math.PI / 2;
        this.scene.add(grid);
        this.controls.enableZoom = true;
        this.controls.enabled = true;

        this.node.appendChild(this.renderer.domElement);

        // handle resizing
        window.addEventListener('resize', (event) => {
            //console.log("resize")
            this.resize()
        }, false);

        // handle mouse events
        this.controls.addEventListener('change', (event) => {
            this.render();
        });
        this.controls.update();

        // setup width/height
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // const meshes = [this.create_atom({x: 0, y: 0, z: 0}), this.create_atom({x: 0, y: 5, z: 0}), this.create_atom({x: 0, y: 0, z: 5}), this.create_atom({x: 0, y: 5, z: 5})]
        // this.fitCameraToMeshes(meshes, this.camera, this.controls);
        // this.scene.add(...meshes);

        this.resize()

    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.renderer.setSize(this.node.clientWidth, this.node.clientHeight);
        this.camera.aspect = this.node.clientWidth / this.node.clientHeight;
        this.camera.updateProjectionMatrix();
        this.render();
    }

    create_atom(position: Coordinates, radius: number = 1, color: string | number | THREE.Color = "blue", opacity: number = 0.9) {
        const geometry = new THREE.SphereBufferGeometry(radius, 30, 30)
        const material = new THREE.MeshLambertMaterial({ color, transparent: true, opacity })
        const mesh = new THREE.Mesh(geometry, material);
        const { x, y, z } = position
        mesh.position.set(x, y, z)
        return mesh
    }

    renderStructureData(data: any) {
        // TODO handle errors
        const sites = data["attributes"]["sites"] as any[]
        const meshes = sites.reduce((a, site) => { a.push(this.create_atom({ x: site["position"][0], y: site["position"][1], z: site["position"][2] })); return a }, [] as THREE.Mesh[]);
        console.log(meshes)
        this.fitCameraToMeshes(meshes, this.camera, this.controls);
        this.scene.add(...meshes);
        this.resize()
    }

    fitCameraToMeshes(meshes: THREE.Mesh[], camera: THREE.PerspectiveCamera, controls: any) {
        var offset = 1.25;
        const points = meshes.reduce((a, m) => { a.push(m.position); return a }, [] as THREE.Vector3[])
        const boundingBox = new THREE.Box3();

        // get bounding box of object - this will be used to setup controls and camera
        boundingBox.setFromPoints(points);
        var center = new THREE.Vector3();
        boundingBox.getCenter(center);
        var size = new THREE.Vector3();
        boundingBox.getSize(size);

        // get the max side of the bounding box (fits to width OR height as needed )
        const maxDim = Math.max(size.x, size.y, size.z) + 1;  // TODO find max radius
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        cameraZ *= offset; // zoom out a little so that objects don't fill the scree
        camera.position.z = cameraZ;
        const minZ = boundingBox.min.z;
        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
        camera.far = cameraToFarEdge * 3;
        camera.updateProjectionMatrix();

        // set camera to rotate around center of loaded object
        controls.target = center;

        // prevent camera from zooming out far enough to create far plane cutoff
        controls.maxDistance = cameraToFarEdge * 2;
        controls.saveState();

    }


}