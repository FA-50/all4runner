
import React, { useEffect,useState, useReducer} from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile } from 'ol/layer';
import { XYZ } from 'ol/source'
import '../css/all4runner.css'
import { MapContext } from '../Context/MapContext'
import { Graticule ,Vector as VectorLayer} from 'ol/layer'

const MapComponent = ({children})=>{
  const [map,setMap]= useState(new Map())
  const [coord,setCoord] = useState(undefined)
  // state update 함수 => map 전달 useReducer 적용용도
  const reducer1 = (state,action)=>{
    switch(action.type){
      case "getmap":
        return map
        // graticule 설정
      case "setgraticule":
        const gridMapLayer = new Graticule({
          map:map,
          showLabels:true,
          zIndex:4
        });
      default:
        return undefined;
    }
  }



  // 좌표 전달 useReducer 적용용도
  // const reducer2 = (state,action)=>{
    
  // }



  // useReducer State 비동기 해결용용
  const [mapstate, mapdispatch]=useReducer(reducer1,undefined)
  // 구조분해로 받기
  useEffect(() => {
    const Mapinstance = new Map({
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
        center: [127.05994054600626, 37.58400223316397],  // 맵의 초기 위치
        zoom: 10,  // 초기 줌 레벨
      }),
    })
    setMap(Mapinstance)
    // graticule 설정하도록 설정.
    mapdispatch({type:"setgraticule"})
    return () => Mapinstance.setTarget(undefined)
  }, []);




  return (
  <MapContext.Provider value={{mapstate,mapdispatch}}>
    {children}
  </MapContext.Provider>
  )};
export default MapComponent;
