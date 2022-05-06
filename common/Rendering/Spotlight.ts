import * as glMatrix from "../libs/gl-matrix/dist/esm/index.js"
import { Renderer } from "./Renderer.js"
import { Transform } from "./Transform"

export class Spotlight{
    position: vec3
    direction: vec3
    attenuation: number
    cutoff: number
    color: vec3
    focus: number
    intensity: number
    parent: Transform | null

    constructor(
        position: vec3 = [0, 0, 0],
        direction: vec3 = [0, -1, 0],
        attenuation: number = 0,
        cutoff: number = 0,
        color: vec3 = [0.996, 0.698, 0.902],
        focus: number = 10.0,
        intensity: number = 0.4,
        parent: Transform | null = null
    ){
        this.position = position
        this.direction = direction
        this.attenuation = attenuation
        this.cutoff = cutoff
        this.color = color
        this.focus = focus
        this.intensity = intensity
        this.parent = parent

        Renderer.instance.addSpotlight(this)
    }

    get worldPosition(): vec3{
        if(!this.parent){
            return this.position
        }else{
            let out = [this.position[0], this.position[1], this.position[2], 1]
            glMatrix.vec4.transformMat4(out, out, this.parent.getWorldMatrix())
            return out.slice(0, 3)
        }
    }

    get worldDirection(): vec3{
        if(!this.parent){
            return this.direction
        }else{
            let out = [this.direction[0], this.direction[1], this.direction[2], 0]
            glMatrix.vec4.transformMat4(out, out, this.parent.getWorldMatrix())
            return out.slice(0, 3)
        }
    }
}