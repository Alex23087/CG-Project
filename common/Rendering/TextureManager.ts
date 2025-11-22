import { Dimension, Renderer } from "./Renderer.js"

type TextureCacheElement = {
    name: string
    unit: number
    lastUsed: number
}

type ImageElement = {
    name: string
    image: HTMLImageElement | CubemapImages | null,
    texture: WebGLTexture | null
}

export type CubemapNames = {
    posX: string
    negX: string
    posY: string
    negY: string
    posZ: string
    negZ: string
}

type CubemapImages = {
    posX: HTMLImageElement
    negX: HTMLImageElement
    posY: HTMLImageElement
    negY: HTMLImageElement
    posZ: HTMLImageElement
    negZ: HTMLImageElement
}

type WEBGLTextureWrapMode = typeof Renderer.instance.gl.REPEAT | typeof Renderer.instance.gl.CLAMP_TO_EDGE

export class TextureManager {
    limit: number
    private elements: TextureCacheElement[]
    private images: ImageElement[]

    get size() {
        return this.elements.length
    }

    constructor() {
        this.limit = Renderer.instance.gl.MAX_TEXTURE_IMAGE_UNITS - 1
        this.elements = []
        this.images = []
    }

    private getFreeUnit(): number {
        var i = 0
        while (this.elements.find(e => e.unit == i)) {
            i++
        }
        return i
    }

    getTextureUnit(name: string, wrap: WEBGLTextureWrapMode = Renderer.instance.gl.REPEAT, size: Dimension = { x: 0, y: 0 }, isDepthbuffer: boolean = false): number {
        var tex = this.elements.find(e => e.name == name)
        if (!tex) {
            if (this.size >= this.limit) {
                let evicted = this.evict()
                return this.loadTexture(name, evicted.unit, wrap, size, isDepthbuffer)
            } else {
                return this.loadTexture(name, this.getFreeUnit(), wrap, size, isDepthbuffer)
            }
        }
        tex.lastUsed = Date.now()
        return tex.unit
    }

    getTextureData(name: string) {
        let img = this.images.find(v => v.name == name)
        if (!img) {
            return null
        } else {
            return img.texture
        }
    }

    getCubemapTexture(name: string): number {
        var tex = this.elements.find(e => e.name == name)
        if (!tex) {
            if (this.size >= this.limit) {
                let evicted = this.evict()
                return this.loadCubemapTexture(name, evicted.unit)
            } else {
                return this.loadCubemapTexture(name, this.getFreeUnit())
            }
        }
        let img = this.images.find(i => i.name == name)
        if (img && !img.texture) {
            this.loadCubemapTexture(name, tex.unit, true)
        }
        tex.lastUsed = Date.now()
        return tex.unit
    }

    loadImage(name: string) {
        let img = this.images.find(v => v.name == name)
        if (!img) {
            this.loadSingleImage(name, (image) => {
                let img = this.images.find(v => v.name == name)
                if (!img) {
                    this.images.push({
                        name: name,
                        image: image,
                        texture: null
                    })
                }
            })
        }
    }

    private loadSingleImage(name: string, callback: (image: HTMLImageElement) => void) {
        let image = new Image()
        image.src = name
        image.addEventListener('load', () => {
            callback(image)
        })
    }


    loadCubemap(textures: CubemapNames) {
        let img = this.images.find(v => v.name == textures.posX)
        if (!img) {
            let cubemapImages: CubemapImages = {
                posX: null,
                negX: null,
                posY: null,
                negY: null,
                posZ: null,
                negZ: null
            }

            this.loadSingleImage(textures.posX, (image) => {
                cubemapImages.posX = image
                let img = this.images.find(v => v.name == textures.posX)
                this.loadSingleImage(textures.negX, (image) => {
                    cubemapImages.negX = image
                    this.loadSingleImage(textures.posY, (image) => {
                        cubemapImages.posY = image
                        this.loadSingleImage(textures.negY, (image) => {
                            cubemapImages.negY = image
                            this.loadSingleImage(textures.posZ, (image) => {
                                cubemapImages.posZ = image
                                this.loadSingleImage(textures.negZ, (image) => {
                                    cubemapImages.negZ = image
                                    if (!img) {
                                        this.images.push({
                                            name: textures.posX,
                                            image: cubemapImages,
                                            texture: null
                                        })
                                    }
                                })
                            })
                        })
                    })
                })
            })
        }
    }


    private getImage(name: string): ImageElement | undefined {
        return this.images.find(v => v.name == name)
    }

    private loadTexture(name: string, textureUnit: number, wrap: WEBGLTextureWrapMode, size: Dimension, isDepthbuffer: boolean = false): number {
        textureUnit += Renderer.instance.gl.TEXTURE0

        let image = this.getImage(name)
        if (image) { //Image exists, load it into texture unit
            Renderer.instance.gl.activeTexture(textureUnit);
            if (image.texture) {
                Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_2D, image.texture)
            } else {
                let texture = Renderer.instance.gl.createTexture();
                Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_2D, texture);
                Renderer.instance.gl.texImage2D(
                    Renderer.instance.gl.TEXTURE_2D,
                    0,
                    isDepthbuffer ? Renderer.instance.gl.DEPTH_COMPONENT24 : Renderer.instance.gl.RGBA,
                    isDepthbuffer ? Renderer.instance.gl.DEPTH_COMPONENT : Renderer.instance.gl.RGBA,
                    isDepthbuffer ? Renderer.instance.gl.UNSIGNED_INT : Renderer.instance.gl.UNSIGNED_BYTE,
                    image.image as HTMLImageElement
                );
                Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_S, wrap);
                Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_T, wrap);
                Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MAG_FILTER, Renderer.instance.gl.LINEAR);
                Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MIN_FILTER, Renderer.instance.gl.LINEAR_MIPMAP_LINEAR);
                var ext = (
                    Renderer.instance.gl.getExtension('EXT_texture_filter_anisotropic') ||
                    Renderer.instance.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                    Renderer.instance.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
                )
                if (ext) {
                    var max = Renderer.instance.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
                    Renderer.instance.gl.texParameterf(Renderer.instance.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max)
                }
                Renderer.instance.gl.generateMipmap(Renderer.instance.gl.TEXTURE_2D)
                image.texture = texture
            }
        } else { //Image doesn't exist, create new empty texture
            if (size.x == 0 || size.y == 0) { //Invalid dimensions, return first texture
                return 0
            }
            //alert("Creating texture " + name)
            Renderer.instance.gl.activeTexture(textureUnit)
            let texture = Renderer.instance.gl.createTexture()
            Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_2D, texture)
            Renderer.instance.gl.texImage2D(
                Renderer.instance.gl.TEXTURE_2D,
                0,
                isDepthbuffer ? Renderer.instance.gl.DEPTH_COMPONENT24 : Renderer.instance.gl.RGBA,
                size.x,
                size.y,
                0,
                isDepthbuffer ? Renderer.instance.gl.DEPTH_COMPONENT : Renderer.instance.gl.RGBA,
                isDepthbuffer ? Renderer.instance.gl.UNSIGNED_INT : Renderer.instance.gl.UNSIGNED_BYTE,
                null
            )
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MIN_FILTER, Renderer.instance.gl.NEAREST)
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_MAG_FILTER, Renderer.instance.gl.NEAREST)
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_S, wrap)
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_2D, Renderer.instance.gl.TEXTURE_WRAP_T, wrap)

            this.images.push({ name: name, image: null, texture: texture })
        }

        textureUnit -= Renderer.instance.gl.TEXTURE0

        this.elements.push({
            name: name,
            unit: textureUnit,
            lastUsed: Date.now()
        })
        return textureUnit
    }

    private loadCubemapTexture(name: string, textureUnit: number, update: boolean = false): number {
        let image = this.getImage(name)
        if (!image) {
            return 0
        }

        textureUnit += Renderer.instance.gl.TEXTURE0

        Renderer.instance.gl.activeTexture(textureUnit);
        if (image.texture) {
            Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_CUBE_MAP, image.texture)
        } else {
            let texture = Renderer.instance.gl.createTexture();
            Renderer.instance.gl.bindTexture(Renderer.instance.gl.TEXTURE_CUBE_MAP, texture);

            let imgs = (image.image as CubemapImages)

            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.posX ?? imgs.posX as HTMLImageElement);
            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.negX ?? imgs.posX as HTMLImageElement);
            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.posY ?? imgs.posX as HTMLImageElement);
            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.negY ?? imgs.posX as HTMLImageElement);
            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.posZ ?? imgs.posX as HTMLImageElement);
            Renderer.instance.gl.texImage2D(Renderer.instance.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, Renderer.instance.gl.RGBA, Renderer.instance.gl.RGBA, Renderer.instance.gl.UNSIGNED_BYTE, imgs.negZ ?? imgs.posX as HTMLImageElement);

            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_CUBE_MAP, Renderer.instance.gl.TEXTURE_MAG_FILTER, Renderer.instance.gl.LINEAR);
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_CUBE_MAP, Renderer.instance.gl.TEXTURE_MIN_FILTER, Renderer.instance.gl.LINEAR);
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_CUBE_MAP, Renderer.instance.gl.TEXTURE_WRAP_S, Renderer.instance.gl.CLAMP_TO_EDGE);
            Renderer.instance.gl.texParameteri(Renderer.instance.gl.TEXTURE_CUBE_MAP, Renderer.instance.gl.TEXTURE_WRAP_T, Renderer.instance.gl.CLAMP_TO_EDGE);

            image.texture = texture
        }

        textureUnit -= Renderer.instance.gl.TEXTURE0

        if (!update) {
            this.elements.push({
                name: name,
                unit: textureUnit,
                lastUsed: Date.now()
            })
        }

        return textureUnit
    }

    private evict(): TextureCacheElement {
        let evicted = this.elements.reduce((prev, curr, index, array) => {
            if (!prev) {
                return curr
            } else if (curr.lastUsed < prev.lastUsed) {
                return curr
            } else {
                return prev
            }
        })
        return this.elements.splice(this.elements.findIndex(e => e.lastUsed == evicted.lastUsed), 1)[0]
    }

    removeTexture(name: string) {
        this.elements.splice(this.elements.findIndex(e => e.name == name), 1)
        let img = this.images.findIndex(e => e.name == name)
        Renderer.instance.gl.deleteTexture(this.images[img].texture)
        this.images.splice(img, 1)
    }
}