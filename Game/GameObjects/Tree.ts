import { GameObject } from "../../common/Rendering/GameObject.js";
import { ShaderMaterial } from "../../common/Rendering/ShaderMaterial.js";
import { Shape } from "../../common/shapes/Shape.js";
import * as Shaders from "../../common/Rendering/Shaders.js"
import * as Globals from "../Globals.js"

export class Tree extends GameObject{

    constructor(name: string, parent: GameObject){
        super(name, parent, null)

        let foliage = new GameObject(name + " LampCover", this, Shape.cone)
        foliage.transform.scaling = [1.5,2,1.5]
        foliage.transform.position = [0, 1.2, 0]

        let trunk = new GameObject(name + " Post", this, Shape.cylinder)
        trunk.transform.scaling = [0.3,2,0.3]
        trunk.transform.position = [0, 0, 0]

        ShaderMaterial.create(Globals.renderer < 2 ? Shaders.PhongSpotlightShader : Shaders.PhongSpotlightProjectorShader).then(mat => {
            foliage.material = mat
            mat.setColor([48/256, 113/256, 8/256, 1])
            mat.setShininess(0)
        })
        ShaderMaterial.create(Globals.renderer < 2 ? Shaders.PhongSpotlightShader : Shaders.PhongSpotlightProjectorShader).then(mat => {
            trunk.material = mat
            mat.setColor([29/256, 15/256, 17/256, 1])
        })
    }

    public update(deltaT: number): void {}
}