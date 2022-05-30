import { Renderer } from "../common/Rendering/Renderer.js"
import { Car } from "./GameObjects/Car.js"
import { Camera, FreeCamera } from "../common/Rendering/Cameras.js"
import { Game } from "./Game.js"
import { GameObject } from "../common/Rendering/GameObject.js"

//Class to implement the correct behaviour of pressing and releasing buttons
export class Controls {
    static changeCameraKeys = ['c', 'C']
    static fullscreenKeys = ['f', 'F']
    static forwardKeys = ['w', 'W', "ArrowUp"]
    static backwardKeys = ['s', 'S', "ArrowDown"]
    static rightKeys = ['d', 'D', "ArrowRight"]
    static leftKeys = ['a', 'A', "ArrowLeft"]
    static upKeys = ['q', 'Q']
    static downKeys = ['z', 'Z']
    static headlightKeys = ['h', 'H']

    renderer: Renderer
    game: Game
    cameraSelector: HTMLSelectElement

    public constructor(renderer: Renderer, game: Game, cameraSelector: HTMLSelectElement){
        this.renderer = renderer
        this.game = game
        this.cameraSelector = cameraSelector
    }

    keyPressed(key: string){
        this.setKey(this.game.car, key, true, (this.renderer.currentCamera as unknown as GameObject).name == "FreeCamera")
    }

    keyReleased(key: string){
        this.setKey(this.game.car, key, false, (this.renderer.currentCamera as unknown as GameObject).name == "FreeCamera")
    }

    private setKey(car: Car, key: string, value: boolean, passToCamera: boolean){
        let cam = (this.renderer.currentCamera as unknown as FreeCamera)
        if(Controls.forwardKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[2] = value ? 1 : 0
            }else{
                car.control_keys["ArrowUp"] = value
            }
        } else if(Controls.backwardKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[2] = value ? -1 : 0
            }else{
                car.control_keys["ArrowDown"] = value
            }
        } else if(Controls.leftKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[0] = value ? 1 : 0
            }else{
                car.control_keys["ArrowLeft"] = value
            }
        } else if(Controls.rightKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[0] = value ? -1 : 0
            }else{
                car.control_keys["ArrowRight"] = value
            }
        } else if(Controls.upKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[1] = value ? -1 : 0
            }
        } else if(Controls.downKeys.indexOf(key) >= 0){
            if(passToCamera){
                cam.movement[1] = value ? 1 : 0
            }
        } else if(Controls.changeCameraKeys.indexOf(key) >= 0){
            if(value){
                this.toggleCamera()
            }
        } else if(Controls.fullscreenKeys.indexOf(key) >= 0){
            if(value){
                this.renderer.toggleFullscreen()
            }
        } else if(Controls.headlightKeys.indexOf(key) >= 0){
            if(value){
                this.game.car.toggleHeadlights()
            }
        } else {
            car.control_keys[key] = value
        }
    }

    public mouseup(){
        if((Renderer.instance.currentCamera as unknown as GameObject).name == "FreeCamera"){
            (Renderer.instance.currentCamera as unknown as FreeCamera).mouseup()
        }
    }

    public mousedown(e){
        if((Renderer.instance.currentCamera as unknown as GameObject).name == "FreeCamera"){

            let sensitivity = 6
            var amount = [
                ((e.clientX / Renderer.instance.canvas.width) - 0.5) * sensitivity,
                ((e.clientY / Renderer.instance.canvas.height) - 0.5) * sensitivity
            ];
            (Renderer.instance.currentCamera as unknown as FreeCamera).mousedown(amount)
        }
    }

    private toggleCamera(){
        if((this.renderer.currentCamera as unknown as GameObject).name == (this.game.cameras[0] as unknown as GameObject).name){
            this.setCamera(1)
        }else if((this.renderer.currentCamera as unknown as GameObject).name == (this.game.cameras[1] as unknown as GameObject).name){
            this.setCamera(2)
        }else if((this.renderer.currentCamera as unknown as GameObject).name == (this.game.cameras[2] as unknown as GameObject).name){
            this.setCamera(3)
        }else{
            this.setCamera(0)
        }
    }

    public setCamera(value: number){
    	this.renderer.currentCamera = this.game.cameras[value]
        this.cameraSelector.value = value as unknown as string
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