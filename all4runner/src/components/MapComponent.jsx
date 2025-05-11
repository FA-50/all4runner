
import React, { useEffect,useState, useReducer} from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile } from 'ol/layer';
import { TileWMS, XYZ } from 'ol/source'
import '../css/all4runner.css'
import { MapContext } from '../Context/MapContext'
import {defaults} from 'ol/control'
import {LogoutControl} from '../mapcontrol/control'
import { ExportContext } from '../Context/AuthContext';

const MapComponent = ({children})=>{

  const AuthContext = ExportContext();

  const [map,setMap]= useState(new Map())
  // state update 함수 => map 전달 useReducer 적용용도
  const reducer1 = (state,action)=>{
    switch(action.type){
      case "getmap":
        return map
      case "setborder":
        const borderimagesource = new TileWMS({
          url:'http://localhost:8080/geoserver/all4runner/wms',
          params:{
            'FORMAT': 'image/png',   
            'LAYERS':'all4runner:border',
            'VERSION': '1.1.0',
            'TILED': true
          },
          serverType:'geoserver'
        })
        const tileLayer = new Tile({
          source:borderimagesource,
          zIndex:20,
        })
        tileLayer.setMap(map)
        break;
      default:
        return undefined;
    }
  }


  // useReducer State 비동기 해결용용
  const [mapstate, mapdispatch]=useReducer(reducer1,undefined)
  // 구조분해로 받기
  useEffect(() => {
    const Mapinstance = new Map({
      controls:defaults().extend([new LogoutControl({AuthContext})]),
      target: 'map',  // 하위 요소 중 id 가 map 인 element가 있어야함.
      layers: [
          new Tile({
            source : new XYZ({ 
              url : "https://api.vworld.kr/req/wmts/1.0.0/45C98863-0CE9-39F9-881C-ED4E6DB5B3EE/Base/{z}/{y}/{x}.png" }),
            zIndex:0
        })
      ],
      view: new View({
        projection : 'EPSG:4326',
        center: [127.0603522, 37.5827782],  
        zoom: 15,  
      }),
    })
    setMap(Mapinstance)
    // useReducer를 통해 동대문구 border 설정
    mapdispatch({type:"setborder"})
    return () => Mapinstance.setTarget(undefined)
  }, []);



  return (
  <MapContext.Provider value={{mapstate,mapdispatch}}>
    {children}
  </MapContext.Provider>
  )};
export default MapComponent;
