import { Color, Dimension, Renderer } from "./Renderer.js"

export class Framebuffer{
    framebuffer: WebGLFramebuffer
    depthbuffer: WebGLRenderbuffer
    texture: string
    clearColor: Color = [0, 0, 0, 1]
    size: Dimension

    constructor(name: string, size: Dimension){
        this.texture = name
        this.initFramebuffer(size)
    }

    getTexture(){
        return Renderer.instance.textureManager.getTextureUnit(this.texture, Renderer.instance.gl.CLAMP_TO_EDGE)
    }

    resize(size: Dimension){
        Renderer.instance.textureManager.removeTexture(this.texture)
        Renderer.instance.gl.deleteFramebuffer(this.framebuffer)
        Renderer.instance.gl.deleteRenderbuffer(this.depthbuffer)

        this.initFramebuffer(size)
    }

    clear(){
		Renderer.instance.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
		Renderer.instance.gl.clear(Renderer.instance.gl.COLOR_BUFFER_BIT | Renderer.instance.gl.DEPTH_BUFFER_BIT);
    }

    private initFramebuffer(size: Dimension){
        Renderer.instance.textureManager.getTextureUnit(this.texture, Renderer.instance.gl.CLAMP_TO_EDGE, size)

        this.framebuffer = Renderer.instance.gl.createFramebuffer()
        this.bind()
        Renderer.instance.gl.framebufferTexture2D(Renderer.instance.gl.FRAMEBUFFER, Renderer.instance.gl.COLOR_ATTACHMENT0, Renderer.instance.gl.TEXTURE_2D, Renderer.instance.textureManager.getTextureData(this.texture), 0)

        this.depthbuffer = Renderer.instance.gl.createRenderbuffer()
        Renderer.instance.gl.bindRenderbuffer(Renderer.instance.gl.RENDERBUFFER, this.depthbuffer)
        Renderer.instance.gl.renderbufferStorage(Renderer.instance.gl.RENDERBUFFER, Renderer.instance.gl.DEPTH_COMPONENT16, size.x, size.y)
        Renderer.instance.gl.framebufferRenderbuffer(Renderer.instance.gl.FRAMEBUFFER, Renderer.instance.gl.DEPTH_ATTACHMENT, Renderer.instance.gl.RENDERBUFFER, this.depthbuffer)
        this.unbind()
        this.size = size
    }

    bind(){
        Renderer.instance.gl.bindFramebuffer(Renderer.instance.gl.FRAMEBUFFER, this.framebuffer)
    }

    unbind(){
        Renderer.instance.gl.bindFramebuffer(Renderer.instance.gl.FRAMEBUFFER, null)
    }

    setViewport(){
        Renderer.instance.gl.viewport(0, 0, this.size.x, this.size.y)
    }
}