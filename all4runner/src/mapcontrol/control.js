import {Control} from 'ol/control'
import "../css/control.css"
import "bootstrap/dist/css/bootstrap.css"

// Toilet을 추가하는 Control
export class LogoutControl extends Control{
  constructor({AuthContext},opt_options={}) {


    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML = '로그아웃';
    button.className = 'btn btn-dark';
    const element = document.createElement('div');
    element.className = 'Logout'
    element.appendChild(button);
    super({
      element: element,
      target: options.target,
    });
    button.addEventListener('click', ()=>{AuthContext.Logoutfunction()}, false);
  }
}