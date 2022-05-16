import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js";
import { GameObject } from "./GameObject.js";
import { Renderer } from "./Renderer.js";

export class Projector extends GameObject{
    private texture: string
    private viewMatrix: mat4

    constructor(name: string, parent: GameObject, texture: string){
        super(name, parent, null)
        this.texture = texture
        Renderer.instance.textureCache.loadImage(texture)

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
		//console.log(tmp)
		glMatrix.vec3.transformMat4(worldEye, this.transform.position, frame)
		glMatrix.vec3.transformMat4(worldTarget, glMatrix.vec3.add(glMatrix.vec3.create(), [0, 0, -1], this.transform.position), frame)
		this.viewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(), worldEye, worldTarget, [0, 1, 0])
    }

    getMatrix(): mat4{
        return this.viewMatrix
    }
}