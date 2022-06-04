import { GameObject } from "../../common/Rendering/GameObject.js"
import { ShaderMaterial } from "../../common/Rendering/ShaderMaterial.js"
import { Shape } from "../../common/shapes/Shape.js"
import * as Shaders from "../../common/Rendering/Shaders.js"
import * as Globals from "../Globals.js"

export class Billboard extends GameObject{
	constructor(name: string, texture: string){
		super(name, null, null)
		let frontad = new GameObject(name + " image", this, Shape.cube)
		ShaderMaterial.create(Shaders.PhongSpotlightTexturedProjectorShader).then(mat => {
			mat.setColorTexture(texture)
			frontad.material = mat
		})
		frontad.transform.scaling = [2, 2, 0.5]
		frontad.transform.position[1] = 4.2

		let border = new GameObject(name + " border", this, Shape.cube)
        let post = new GameObject(name + " post", this, Shape.cylinder)

		ShaderMaterial.create(Globals.renderer < 2 ? Shaders.PhongSpotlightShader : Shaders.PhongSpotlightProjectorShader).then(mat => {
            mat.setColor([29/256, 15/256, 17/256, 1])
			border.material = mat
            post.material = mat
		})
		border.transform.scaling = [2.2, 2.2, 0.4]
		border.transform.position[1] = 4.2

        post.transform.scaling = [0.4, 2, 0.4]
	}
}