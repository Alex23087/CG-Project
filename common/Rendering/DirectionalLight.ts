import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import { Camera } from "./Cameras.js"
import { Framebuffer } from "./Framebuffer.js"
import { Dimension } from "./Renderer.js"

export class DirectionalLight{
    direction: vec3
    camera: Camera
    framebuffer: Framebuffer

    constructor(direction: vec3, size: Dimension){
        this.camera = new DirectionalLightCamera()
        this.framebuffer = new Framebuffer("Directional Light Framebuffer", size)
        this.setDirection(direction)
    }

    public setDirection(direction: vec3){
        this.direction = direction
        let worldEye = [0,5,0]
        this.camera.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), worldEye, direction, [0, 0, -1])
    }

    public getLightMatrix(){
        return glMatrix.mat4.mul(glMatrix.mat4.create(), this.camera.projectionMatrix(0,0), this.camera.viewMatrix)
    }
}

class DirectionalLightCamera implements Camera{
    viewMatrix: mat4
    mouseMoved(coords: vec2): void {}
    projectionMatrix(fov: number, ratio: number): mat4 {
        return glMatrix.mat4.ortho(glMatrix.mat4.create(), -150, 150, -150, 150, 0, 50)
		return glMatrix.mat4.perspective(glMatrix.mat4.create(), Math.PI / 2, 1, 0.1, 100)
    }
}