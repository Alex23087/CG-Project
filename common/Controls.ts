import { Renderer } from "./Rendering/Renderer.js"
import { Car } from "./Car.js"
import { Camera } from "./Rendering/Cameras.js"
import { Game } from "./Game.js"
import { GameObject } from "./Rendering/GameObject.js"

//Class to implement the correct behaviour of pressing and releasing buttons
export class Controls {
    static changeCameraKeys = ['c', 'C']
    static fullscreenKeys = ['f', 'F']
    static upKeys = ['w', 'W', "ArrowUp"]
    static downKeys = ['s', 'S', "ArrowDown"]
    static rightKeys = ['d', 'D', "ArrowRight"]
    static leftKeys = ['a', 'A', "ArrowLeft"]

    renderer: Renderer
    game: Game

    public constructor(renderer: Renderer, game: Game){
        this.renderer = renderer
        this.game = game
    }

    keyPressed(key: string){
        this.setKey(this.game.car, key, true)
    }

    keyReleased(key: string){
        this.setKey(this.game.car, key, false)
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
        if((this.renderer.currentCamera as unknown as GameObject).name == (this.game.cameras[0] as unknown as GameObject).name){
            this.renderer.currentCamera = this.game.cameras[1]
        }else if((this.renderer.currentCamera as unknown as GameObject).name == (this.game.cameras[1] as unknown as GameObject).name){
            this.renderer.currentCamera = this.game.cameras[2]
        }else{
            this.renderer.currentCamera = this.game.cameras[0]
        }
    }

    public setCamera(value: number){
    	this.renderer.currentCamera = this.game.cameras[value];
    }

    on_mouseMove(e: MouseEvent){
        var sensitivity = 6

        var amount = [
            ((e.clientX / this.renderer.canvas.width) - 0.5) * sensitivity,
            ((e.clientY / this.renderer.canvas.height) - 0.5) * sensitivity
        ];

        (this.renderer.currentCamera as Camera).mouseMoved(amount)
    }

    onClick(e){
        return //pointer lock disabled because it causes issues on some platforms
        this.renderer.canvas.requestPointerLock = this.renderer.canvas.requestPointerLock || (this.renderer.canvas as any).mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || (document as any).mozExitPointerLock;

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);
        document.addEventListener('mozpointerlockchange', this.lockChangeAlert, false);

        this.renderer.canvas.requestPointerLock()
    }

    lockChangeAlert = () => {
        if (document.pointerLockElement === this.renderer.canvas ||
            (document as any).mozPointerLockElement === this.renderer.canvas) {
          console.log('The pointer lock status is now locked');
          document.addEventListener("mousemove", onmousemove, false);
        } else {
          console.log('The pointer lock status is now unlocked');
          document.removeEventListener("mousemove", onmousemove, false);
        }
      }
      
}