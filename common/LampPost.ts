import { GameObject } from "./Rendering/GameObject.js";
import { ShaderMaterial } from "./Rendering/ShaderMaterial.js";
import { Spotlight } from "./Rendering/Spotlight.js";
import { Shape } from "./shapes/Shape.js";
import * as Shaders from "./Rendering/Shaders.js"

export class LampPost extends GameObject{
    spotlight: Spotlight

    constructor(name: string, parent: GameObject){
        super(name, parent, null)

        this.spotlight = new Spotlight()
        this.spotlight.parent = this.transform
        this.spotlight.intensity = 0.8

        let lampCover = new GameObject(name + " LampCover", this, Shape.cube)
        lampCover.transform.scaling = [1,0.125,1]
        lampCover.transform.position = [0, 0.125, 0]

        let lamp = new GameObject(name + " Lamp", this, Shape.cube)
        lamp.transform.scaling = [1,0.125,1]
        lamp.transform.position = [0, -0.125, 0]

        let post = new GameObject(name + " Post", this, Shape.cube)
        post.transform.scaling = [0.1,2,0.1]
        post.transform.position = [0, -2, 0]

        ShaderMaterial.create(Shaders.PhongSpotlightShader).then(mat => {
            lampCover.material = mat
            post.material = mat
            mat.setColor([29/256, 15/256, 17/256, 1])
        })
        ShaderMaterial.create(Shaders.UniformShader).then(mat => {
            lamp.material = mat
            let c = this.spotlight.color
            c[3] = 1
            mat.setColor(c)
        })
    }
}