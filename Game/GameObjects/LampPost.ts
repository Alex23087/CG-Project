import { GameObject } from "../../common/Rendering/GameObject.js";
import { ShaderMaterial } from "../../common/Rendering/ShaderMaterial.js";
import { Spotlight } from "../../common/Rendering/Spotlight.js";
import { Shape } from "../../common/shapes/Shape.js";
import * as Shaders from "../../common/Rendering/Shaders.js"
import * as Globals from "../Globals.js"

export class LampPost extends GameObject{
    spotlight: Spotlight

    constructor(name: string, parent: GameObject){
        super(name, parent, null)

        this.spotlight = new Spotlight()
        this.spotlight.parent = this.transform
        this.spotlight.intensity = 0.8
        this.spotlight.cutoff = 0.85
        this.spotlight.attenuation = 0.7

        let lampCover = new GameObject(name + " LampCover", this, Shape.cylinder)
        lampCover.transform.scaling = [1,0.125,1]
        lampCover.transform.position = [0, 0.125, 0]

        let lamp = new GameObject(name + " Lamp", this, Shape.cylinder)
        lamp.transform.scaling = [1,0.125,1]
        lamp.transform.position = [0, -0.125, 0]

        let post = new GameObject(name + " Post", this, Shape.cylinder)
        post.transform.scaling = [0.1,2,0.1]
        post.transform.position = [0, -4, 0]

        ShaderMaterial.create(Globals.renderer < 2 ? Shaders.PhongSpotlightShader : Shaders.PhongSpotlightProjectorShader).then(mat => {
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

    private timeAccumulator = 0
    private timeDivisor = 50 + Math.random() * 32;
    public update(deltaT: number): void {
        this.timeAccumulator += deltaT
        this.spotlight.focus = 10 + Math.sin(this.timeAccumulator / this.timeDivisor)
    }
}