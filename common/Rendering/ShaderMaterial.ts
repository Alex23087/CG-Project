import { Renderer } from "./Renderer.js"
import * as Shaders from "./Shaders.js"

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
        this._setTexture(textureURL, 0)
    }

    private _setTexture(textureURL: string, textureUnit: number){
        var image = new Image()
        image.src = textureURL
        image.addEventListener('load', () => {
            Renderer.gl.activeTexture(Renderer.gl.TEXTURE0);
            let texture = Renderer.gl.createTexture();
            Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, texture);
            Renderer.gl.activeTexture(Renderer.gl.TEXTURE0)
            Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGB, Renderer.gl.RGB, Renderer.gl.UNSIGNED_BYTE, image);
            Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.REPEAT);
            Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.REPEAT);
            Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.LINEAR);
            Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.LINEAR_MIPMAP_NEAREST);

            (texture as any).name = textureURL

            this.properties["texture"] = texture
            this.properties["textureUnit"] = 1
        })
    }
}