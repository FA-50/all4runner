
import React, { useEffect, useRef ,useState} from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile , Graticule, Heatmap} from 'ol/layer';
import {GeoJSON} from 'ol/format'
import { XYZ , Vector } from 'ol/source'
import { Style, Stroke } from 'ol/style'
import '../css/all4runner.css'
import {FaBars} from 'react-icons/fa'
import {useGlobalContext} from '../Context/globalcontext'
import VectorLayer from 'ol/layer/Vector';
import SidebarMap from './Sidebar_map';


const MapComponent = ()=>{
  const [map,setmap]= useState(null)
  // 구조분해로 받기
  const {openSidebar} = useGlobalContext()

  const mapRef = useRef(null);
  // Sidebar_map에서 createRoute 함수 실행 시 실행.
  const AddRoutebyJSON = (jsonarr)=>{
    var geojsonarr =[]
    var i=0
    jsonarr.map((json)=>{
      geojsonarr[i]=new GeoJSON().readFeature(json.geojson,{featureProjection: 'EPSG:4326'})
      i=i+1
    })
    const jsonvectorsource = new Vector({
      features : geojsonarr
    })
    const jsonvectorlayer1 = new VectorLayer({
      source : jsonvectorsource,
      style : new Style({
        stroke : new Stroke({
          color : '#ff0000',
          width : 5,
          lineDash : [5,10],
        })
      }),
      zIndex:100,
    })
    console.log(map.getLayers())
    jsonvectorlayer1.setMap(map)
    map.render()
    console.log(map.getLayers())
  }
  useEffect(() => {
    // OpenLayers 맵을 초기화.
    if (map==null){
      const initialMap = new Map({
        target: mapRef.current,  // React의 ref를 통해 DOM 요소에 맵을 추가
        layers: [
          new Tile({
            source : new XYZ({ url : "https://api.vworld.kr/req/wmts/1.0.0/45C98863-0CE9-39F9-881C-ED4E6DB5B3EE/Base/{z}/{y}/{x}.png" }),
            zIndex:0
          })
        ],
        view: new View({
          projection : 'EPSG:4326',
          center: [127.05994054600626, 37.58400223316397],  // 맵의 초기 위치
          zoom: 10,  // 초기 줌 레벨
        }),
      })
      setmap(initialMap)
      initialMap.setTarget(null);
    }
    else{
      
    }
  }, []);

  useEffect(()=>{
    if(map==null){
      return
    }else{
      console.log(1222)
      map.setTarget(mapRef.current)
      const gridMapLayer = new Graticule({
        map:map,
        showLabels:true,
        zIndex:4
      });
    }
  },[map])

  return (
      <main>
        <SidebarMap property1={AddRoutebyJSON}/>
        <button className='sidebar-toggle'
        onClick={openSidebar}>
          <FaBars />
        </button>
        <div ref={mapRef} className="map"/>       
      </main>
  );
};
export default MapComponent;
