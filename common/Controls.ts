import { Renderer } from "./Renderer.js"
import { Car } from "./game.js"

//Class to implement the correct behaviour of pressing and releasing buttons
export class Controls {
    static upKeys = ['w', 'W', "ArrowUp"]
    static downKeys = ['s', 'S', "ArrowDown"]
    static rightKeys = ['d', 'D', "ArrowRight"]
    static leftKeys = ['a', 'A', "ArrowLeft"]

    static keyPressed(renderer: Renderer, key: string){
        this.setKey(renderer.car, key, true)
    }

    static keyReleased(renderer: Renderer, key: string){
        this.setKey(renderer.car, key, false)
    }

    private static setKey(car: Car, key: string, value: boolean){
        if(Controls.upKeys.indexOf(key) >= 0){
            car.control_keys["ArrowUp"] = value
        } else if(Controls.downKeys.indexOf(key) >= 0){
            car.control_keys["ArrowDown"] = value
        } else if(Controls.leftKeys.indexOf(key) >= 0){
            car.control_keys["ArrowLeft"] = value
        } else if(Controls.rightKeys.indexOf(key) >= 0){
            car.control_keys["ArrowRight"] = value
        } else {
            car.control_keys[key] = value
        }
    }
}