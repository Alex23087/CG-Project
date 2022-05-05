import * as Shaders from "./Shaders.js"

export class ShaderMaterial{
    public shader: Shaders.Shader
    public properties: [] = []

    public static create(shader: {new(): Shaders.Shader}): Promise<ShaderMaterial>{
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
}