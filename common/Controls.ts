import { CameraIndex, Renderer } from "./Renderer.js"
import { Car } from "./Car.js"

//Class to implement the correct behaviour of pressing and releasing buttons
export class Controls {
    static changeCameraKeys = ['c', 'C']
    static fullscreenKeys = ['f', 'F']
    static upKeys = ['w', 'W', "ArrowUp"]
    static downKeys = ['s', 'S', "ArrowDown"]
    static rightKeys = ['d', 'D', "ArrowRight"]
    static leftKeys = ['a', 'A', "ArrowLeft"]

    renderer: Renderer

    public constructor(renderer: Renderer){
        this.renderer = renderer
    }

    keyPressed(key: string){
        this.setKey(this.renderer.car, key, true)
    }

    keyReleased(key: string){
        this.setKey(this.renderer.car, key, false)
    }

    private setKey(car: Car, key: string, value: boolean){
        if(Controls.upKeys.indexOf(key) >= 0){
            car.control_keys["ArrowUp"] = value
        } else if(Controls.downKeys.indexOf(key) >= 0){
            car.control_keys["ArrowDown"] = value
        } else if(Controls.leftKeys.indexOf(key) >= 0){
            car.control_keys["ArrowLeft"] = value
        } else if(Controls.rightKeys.indexOf(key) >= 0){
            car.control_keys["ArrowRight"] = value
        } else if(Controls.changeCameraKeys.indexOf(key) >= 0){
            if(value){
                this.toggleCamera()
            }
        } else if(Controls.fullscreenKeys.indexOf(key) >= 0){
            if(value){
                this.renderer.toggleFullscreen()
            }
        } else {
            car.control_keys[key] = value
        }
    }

    private toggleCamera(){
        this.renderer.currentCamera = (this.renderer.currentCamera + 1) % this.renderer.cameras.length as CameraIndex
    }

    public setCamera(value: CameraIndex){
    	this.renderer.currentCamera = value;
    }
}