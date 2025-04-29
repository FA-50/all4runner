import  VectorSource from 'ol/source/Vector';
import  VectorLayer from 'ol/layer/Vector'
import { Point} from 'ol/geom'
import { Style, Stroke , Circle as CircleStyle , Fill , Icon} from 'ol/style'
import {Feature} from 'ol'
import { GeoJSON } from 'ol/format';

 // draw 기능에 필요한 draw vector source를 제공하는 함수
export const drawing = (mapstate)=>{
  // drawing vector의 초기 배열 정의
  const drawSource = new VectorSource({})
  const drawLayer = new VectorLayer({
    source:drawSource,
    zIndex:102
  })
  mapstate.addLayer(drawLayer)
  return drawSource
}

// Map상의 Tile Map을 제외한 모든 Layer 삭제하는 함수
export const deleteAllLayer = (mapstate) =>{
  // 현재 map객체에 포함된 layer 갯수 가져오기
  var maplayerlength = mapstate.getLayers().array_.length 
    
  // map에서 해당 index의 layer를 가져온 후 map에서 삭제
  for(var i=1;i<maplayerlength;i++){
    const layerinstance = mapstate.getLayers().item(1)
    mapstate.removeLayer(layerinstance) 
  }
}

// Map상에 경로 생성을 위해 클릭 시 좌표를 입력받아아 지시용 포인트를 Vector Layer로 생성하는 함수
export const createPoint=(coord,opt,mapstate)=>{
  var xcoord = coord[0]
  var ycoord = coord[1]
  const pointfeature = new Feature({
    geometry : new Point([xcoord,ycoord]),
  })
  var featurestyle;
  if (opt===0){
      featurestyle = new Style({
        image : new CircleStyle({
          radius: 6,
          fill: new Fill({ color: 'red' }),  // 내부 색상
          stroke: new Stroke({ color: 'white', width: 2 }), // 테두리
        }),
      })
  }else{
    featurestyle = new Style({
        image: new Icon({
          anchor: [0.2, 1.1],
          src: '/img/flag.png', // 아이콘 이미지 URL
          scale: 0.05,
        })
      })
    }
  pointfeature.setStyle(featurestyle)
  var pointvectorsource = new VectorSource({
    features:[pointfeature]
  })
  var pointvectorlayer = new VectorLayer({
    source : pointvectorsource,
    zIndex : 101
  })
  mapstate.addLayer(pointvectorlayer)
  mapstate.render()
}

// 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 Feature 배열로 반환하는 함수
export const MakeFeatureFromJSON = (jsonarr) =>{
  var featurearr=[]
  var i=0
  var bridgecnt=0;
  var crosswalkcnt=0;
  var parkcnt=0;
  var tunnelcnt=0;
  var prelinktype=["일반"];

  jsonarr.map((json)=>{
    if (i===0){
      prelinktype[i]="일반"
    }
    var crosswalk = json.crosswalk;
    var footbridge = json.footbridge;
    var bridge = json.bridge;
    var park = json.park;
    var subwaynetw = json.subwaynetw;
    var tunnel = json.tunnel;
    var geojson = json.geojson;
    
    var geojsonfeature = new GeoJSON().readFeature(geojson,{featureProjection: 'EPSG:4326'})

    var innerlinestyle;
          // 외곽선 스타일
    var outerlinestyle = new Style({
            stroke: new Stroke({
              color: 'black',      // 실제 라인 색상
              width: 9,           // 라인 두께
            }),
          });
    // 보행로 종류 별 색상 배정
    // 해당 link가 횡단보도 인 경우 붉은색
    if(crosswalk===1){ 
      innerlinestyle = new Style({ stroke : new Stroke({color :'#ff0000',width : 6}),zIndex:11})
      prelinktype[i]="횡단보도"
      // 이전 link가 동일한 종류인 경우 count하지 않는다.
      if(prelinktype[i-1]!=="횡단보도"){ 
        crosswalkcnt++ 
      }

    }else if(footbridge === 1 | bridge === 1){
      // 다리, 육교인 경우 오렌지색
      innerlinestyle = new Style({ stroke : new Stroke({color :'#FFA500',width : 6}),zIndex:12})
      prelinktype[i]="육교"
      if(prelinktype[i-1]!=="육교"){ 
        bridgecnt++ 
    }else if(park===1){
      // 공원, 녹지 길인 경우 녹색
      innerlinestyle = new Style({ stroke : new Stroke({color :'#32CD32',width : 6}),zIndex:13})
      prelinktype[i]="공원"
      if(prelinktype[i-1]!=="공원"){ 
        parkcnt++ 
      }}
    }else if(subwaynetw===1 | tunnel===1){
      // 터널, 지하철네트워크인 경우 갈색 
      innerlinestyle = new Style({ stroke : new Stroke({color :'#D2691E',width : 6}),zIndex:10})
      prelinktype[i]="터널"
      if(prelinktype[i-1]==="터널"){ 
        tunnelcnt++ 
      } 
    }else{
      // 모두 해당하지 않는 경우 회색
      innerlinestyle = new Style({ stroke : new Stroke({color :'#708090',width : 6}),zIndex:9})
      prelinktype[i]="일반"
    };
    geojsonfeature.setStyle([outerlinestyle,innerlinestyle])
    featurearr[i++]= geojsonfeature
    return featurearr
  })
  return { countarr : [crosswalkcnt,bridgecnt,parkcnt,tunnelcnt] , featurearr: featurearr};
}


// 경로 한개 선택 시 json 배열을 입력받아서 경로생성
export const AddingJSONLayerToMap = ( jsonarr , firstlastpoints, mapstate,setShowGuide2,setLoading,setActive )=>{
  if (jsonarr.length===0){
    setShowGuide2(true)
    deleteAllLayer(mapstate)
    setLoading(false)
    setActive(false)
  }else{
    var maplayerlength = mapstate.getLayers().array_.length;
    if ( maplayerlength >2){
      deleteAllLayer(mapstate)
    }
    // 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 
    // Feature 배열로 반환.
    var {countarr , featurearr} = MakeFeatureFromJSON(jsonarr)

    var jsonvectorsource1 = new VectorSource({
      features : featurearr
    })
    var jsonvectorlayer1 = new VectorLayer({
      source : jsonvectorsource1,
      zIndex:100,
    })
    // Context에서 Global State로서 전달된 Map instance에 Layer 추가
    mapstate.addLayer(jsonvectorlayer1)
    // Vector Layer 생성 시 Vector Source의 geom 범위로 Viewport의 확대를 수행
    mapstate.getView().fit(jsonvectorsource1.getExtent(),{duration:500})
    console.log(`총 거리 : ${jsonarr[jsonarr.length-1].totdistance}`)
    console.log(`횡단보도 수 : ${countarr[0]}`)
    console.log(`다리 수 : ${countarr[1]}`)
    console.log(`공원 수 : ${countarr[2]}`)
    console.log(`터널 수 : ${countarr[3]}`)
    createPoint(firstlastpoints[0],1,mapstate)
    createPoint(firstlastpoints[1],1,mapstate)
    mapstate.render()
    // 로딩창종료
    setLoading(false)
    setActive(false)
  }
}

// 횡단보도, 육교 제외여부
export const excludeOpt = (checkbox)=>{
  var excludeoption;
  if (checkbox.length===0){
    // 횡단보도, 육교 전부 포함시 
    excludeoption = "excludenone"
  }else if(checkbox.length===1 && checkbox[0]==="crosswalk"){
    // 횡단보도 제외 시 
    excludeoption = "excludecrosswalk"
  }else if(checkbox.length===1 && checkbox[0]==="bridge"){
    // 육교 제외 시 3
    excludeoption = "excludebridge"
  }else{
    // 횡단보도, 육교 제외 시 4
    excludeoption = "excludeall"
  }
  return excludeoption;
}

 // , 로 구분되는 위도 , 경도 좌표의 문자열을 생성하여여
  // Spring에서 @RequestBody로 받을 Object 객체 정의하는 function
export const makingHttpRequestBody = (weightslope,totalpointcount,coordarr,distanceshort,excludeoption)=>{
  var xcoord = ""
  var ycoord = ""
  
  for( var i=0;i<totalpointcount;i++){
    if (i===totalpointcount-1){
      xcoord += coordarr[i][0].toString()
      ycoord += coordarr[i][1].toString()
    }else{
      xcoord = xcoord + coordarr[i][0].toString() + ","
      ycoord += coordarr[i][1].toString() + ","
    }
  }
  const coorddistanceobject = {
    weightslope:weightslope,
    xcoord : xcoord,
    ycoord : ycoord,
    totpointcount : totalpointcount,
    distance : distanceshort,
    excludeoption : excludeoption
  }
  return coorddistanceobject
}
