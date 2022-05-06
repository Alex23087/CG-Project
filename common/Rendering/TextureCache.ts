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
        this.limit = Renderer.instance.gl.MAX_TEXTURE_IMAGE_UNITS
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

        textureUnit += Renderer.instance.gl.TEXTURE0

        Renderer.instance.gl.activeTexture(textureUnit);
        let texture = Renderer.instance.gl.createTexture();
        Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_2D, texture);
        Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_2D, 0, Renderer.instance.gl.RGB, Renderer.instance.gl.RGB, Renderer.instance.gl.UNSIGNED_BYTE, image.image);
        Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_S, Renderer.instance.gl.REPEAT);
        Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_T, Renderer.instance.gl.REPEAT);
        Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MAG_FILTER, Renderer.instance.gl.LINEAR);
        Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MIN_FILTER, Renderer.instance.gl.LINEAR_MIPMAP_LINEAR);
        Renderer.instance.gl.generateMipmap(Renderer.instance.gl.TEXTURE_2D)

        textureUnit -= Renderer.instance.gl.TEXTURE0

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