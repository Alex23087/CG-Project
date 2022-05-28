import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js";
import { Camera } from "./Cameras.js";
import { Framebuffer } from "./Framebuffer.js";
import { GameObject } from "./GameObject.js";
import { Renderer } from "./Renderer.js";

export class Projector extends GameObject{
    private texture: string

    public camera: Camera
    public framebuffer: Framebuffer

    constructor(name: string, parent: GameObject, texture: string){
        super(name, parent, null)
        this.texture = texture
        Renderer.instance.textureManager.loadImage(texture)

        this.camera = new ProjectorCamera()
        this.framebuffer = new Framebuffer(name + " shadow framebuffer", {x: 1024, y: 1024})
        
        Renderer.instance.addProjector(this)
    }

    getTexture(): string{
        return this.texture
    }

    public update(deltaT: number): void {
        this.updateViewMatrix()
    }

    private updateViewMatrix(){
		let frame = this.transform.getWorldMatrix()

        var worldEye = glMatrix.vec3.create()
        var worldTarget = glMatrix.vec3.create()
		glMatrix.vec3.transformMat4(worldEye, this.transform.position, frame)
		glMatrix.vec3.transformMat4(worldTarget, glMatrix.vec3.add(glMatrix.vec3.create(), [0, 0, -1], this.transform.position), frame)
		this.camera.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), worldEye, worldTarget, [0, 1, 0])
    }

    getMatrix(): mat4{
        return this.camera.viewMatrix
    }
}

class ProjectorCamera implements Camera{
    viewMatrix: mat4
    mouseMoved(coords: vec2): void {}
    projectionMatrix(fov: number, ratio: number): mat4 {
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), fov, ratio, 1, 100)
    }
}