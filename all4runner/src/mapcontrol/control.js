import {Control} from 'ol/control'
import "../css/control.css"
import "bootstrap/dist/css/bootstrap.css"
import { useMapContext } from '../Context/MapContext'



// Toilet을 추가하는 Control
export class AddtoiletControl extends Control{
  constructor({mapdispatch},opt_options={}) {
    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML = 'toilet';
    button.className = 'btn btn-dark';
    const element = document.createElement('div');
    element.className = 'addtoilet'
    element.appendChild(button);

    const SetToilet = (mapdispatch)=>{
      mapdispatch({type:"settoilet"})
      // if (isActive===false){
      //   mapdispatch({type:"settoilet"})
      //   isActive=true
      //   console.log(isActive)
      // } else{
      //   mapdispatch({type:"untoilet"})
      //   isActive=false
      //   console.log(isActive)
      // }
    }
    super({
      element: element,
      target: options.target,
    });
    button.addEventListener('click', ()=>{SetToilet(mapdispatch)}, false);
  }
}

// 경계선을 추가하는 Control
export class AddBorderline extends Control{
  constructor({mapdispatch},opt_options={}) {
    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML = 'Border';
    button.className = 'btn btn-dark';
    const element = document.createElement('div');
    element.className = 'addborder'
    element.appendChild(button);
    const SetBorder = (mapdispatch)=>{
      mapdispatch({type:"setborder"})
    }
    super({
      element: element,
      target: options.target,
    });
    button.addEventListener('click', ()=>{ SetBorder(mapdispatch) }, false);
  }
}

