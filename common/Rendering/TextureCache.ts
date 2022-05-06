import { Renderer } from "./Renderer.js"

type TextureCacheElement = {
    name: string
    unit: number
    lastUsed: number
}

type ImageElement = {
    name: string
    image: HTMLImageElement
}

export class TextureCache{
    limit: number
    private elements: TextureCacheElement[]
    private images: ImageElement[]

    get size(){
        return this.elements.length
    }

    constructor(){
        this.limit = Renderer.gl.MAX_TEXTURE_IMAGE_UNITS
        this.elements = []
        this.images = []
    }

    getTexture(name: string): number{
        var tex = this.elements.find(e => e.name == name)
        if(!tex){
            if(this.size >= this.limit){
                let evicted = this.evict()
                return this.loadTexture(name, evicted.unit)
            }else{
                return this.loadTexture(name, this.size)
            }
        }
        tex.lastUsed = Date.now()
        return tex.unit
    }

    loadImage(name: string){
        let img = this.images.find(v => v.name == name)
        if(!img){
			let image = new Image()
			image.src = name
			image.addEventListener('load', () => {
                let img = this.images.find(v => v.name == name)
                if(!img){
                    this.images.push({
                        name: name,
                        image: image
                    })
                }
            })
        }
    }


    private getImage(name: string): ImageElement | undefined{
        return this.images.find(v => v.name == name)
    }

    private loadTexture(name: string, textureUnit: number): number{
        let image = this.getImage(name)
        if(!image){
            return 0
        }

        textureUnit += Renderer.gl.TEXTURE0

        Renderer.gl.activeTexture(textureUnit);
        let texture = Renderer.gl.createTexture();
        Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, texture);
        Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGB, Renderer.gl.RGB, Renderer.gl.UNSIGNED_BYTE, image.image);
        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.REPEAT);
        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.REPEAT);
        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.LINEAR);
        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.LINEAR_MIPMAP_LINEAR);
        Renderer.gl.generateMipmap(Renderer.gl.TEXTURE_2D)

        textureUnit -= Renderer.gl.TEXTURE0

        this.elements.push({
            name: name,
            unit: textureUnit,
            lastUsed: Date.now()
        })
        return textureUnit
    }

    private evict(): TextureCacheElement{
        let evicted = this.elements.reduce((prev, curr, index, array) => {
            if(!prev){
                return curr
            }else if(curr.lastUsed < prev.lastUsed){
                return curr
            }else{
                return prev
            }
        })
        return this.elements.splice(this.elements.findIndex(e => e.lastUsed == evicted.lastUsed), 1)[0]
    }
}