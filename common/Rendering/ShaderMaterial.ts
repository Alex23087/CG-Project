import { Renderer } from "./Renderer.js"
import * as Shaders from "./Shaders.js"
import { CubemapNames } from "./TextureCache.js"

export class ShaderMaterial{
    public shader: Shaders.Shader
    public properties: [] = []

    public static async create(shader: {new(): Shaders.Shader}): Promise<ShaderMaterial>{
        return Shaders.create(shader).then(s => {
            let material = new ShaderMaterial()
            material.shader = s

            if(Shaders.isColorable(s)){
                material.properties["color"] = [1, 0, 1, 1]
            }

            if(Shaders.isShiny(s)){
                material.properties["shininess"] = 10
            }

            return material
        })
    }

    public setColor(color: vec4){
        this.properties["color"] = color
    }

    public setShininess(shininess: number){
        this.properties["shininess"] = shininess
    }

    public setColorTexture(textureURL: string){
        this.properties["texture"] = textureURL
        Renderer.instance.textureCache.loadImage(textureURL)
    }

    public setCubemapTexture(cubemap: CubemapNames){
        this.properties["cubemap"] = cubemap.posX
        Renderer.instance.textureCache.loadCubemap(cubemap)
    }
}