import {Control} from 'ol/control'
import "../css/control.css"
import "bootstrap/dist/css/bootstrap.css"


// Toilet을 추가하는 Control
export class AddtoiletControl extends Control{
  constructor(opt_options) {
    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML = 'toilet';
    button.className = 'btn btn-dark';
    const element = document.createElement('div');
    element.className = 'addtoilet'
    element.appendChild(button);
    super({
      element: element,
      target: options.target,
    });
  }
}