import  VectorSource from 'ol/source/Vector';
import  VectorLayer from 'ol/layer/Vector'
import { Point} from 'ol/geom'
import { Style, Stroke , Circle as CircleStyle , Fill , Icon} from 'ol/style'
import {Feature} from 'ol'
import { GeoJSON } from 'ol/format';
import { retrievePointByDistanceApi, createRouteApi , retrieveRouteApi,initDBRouteTableApi,retrieveRouteByClick} from '../axios/ApiOpenlayers'

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
  for(let i=1;i<maplayerlength;i++){
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

  switch(opt){
    case 0:
      // 일반 Point
      featurestyle = new Style({
        image : new CircleStyle({
          radius: 4,
          fill: new Fill({ color: 'red' }),  // 내부 색상
          stroke: new Stroke({ color: 'white', width: 2 }), // 테두리
        }),
      })
      break;
    case 1:
      // 화장실
      featurestyle = new Style({
        image: new Icon({
          anchor: [0.2, 1.1],
          src: '/img/toilet.png', // 아이콘 이미지 URL
          scale: 0.05,
        })
      })
      break;
    case 2:
      // 급수대
      featurestyle = new Style({
        image: new Icon({
          anchor: [0.2, 1.1],
          src: '/img/drink.png', // 아이콘 이미지 URL
          scale: 0.05,
        })
      })
      break;
    case 3:
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
export const MakeFeatureFromJSON = (jsonarr,mapstate) =>{
  
  // 초기값 설정
  var featurearr=[];

  var i=0
  var bridgecnt=0;
  var crosswalkcnt=0;
  var toiletcnt=0;
  var drinkcnt=0;
  var totkcal=0;
  var totslope=0;
  var totruntime=0;
  var prelinktype=["일반"];
  jsonarr.map((json)=>{
    var { crosswalk,bridge,geojson,tunnel,
      drinklat,drinklong,toiletlat,toiletlong,kcal,slope,toblertime
    } = json

    totkcal+=kcal;
    totslope+=slope;
    totruntime+=toblertime;

    var drawSelectColorOption
    try{
      drawSelectColorOption = json.drawSelectColorOption;
    } catch{
      drawSelectColorOption=1
    }

    if (i===0){
      prelinktype[i]="일반"
    }
    
    var geojsonfeature = new GeoJSON().readFeature(geojson,{featureProjection: 'EPSG:4326'})


    // Feature에 link의 DBtable 이름을 metadata로 등록하기
    // LinkTableId , 'linknum0'
    geojsonfeature.set('LinkTableId',json.linktablename)

    var innerlinestyle;
          // 외곽선 스타일
    var outerlinestyle = new Style({
            stroke: new Stroke({
              color: 'black',      // 실제 라인 색상
              width: 9,           // 라인 두께
            }),
          });
    
    // drawSelectColorOption = 0 ( 최적경로 아님 ) 은 검정색.
    // drawSelectColorOption = 1 ( 최적경로 ) 는 색상배정.
    switch(drawSelectColorOption){
      case 0:
        innerlinestyle = new Style({ stroke : new Stroke({color :'#FFFFFF',width : 6}),zIndex:11})
        break;
      default:
        // 보행로 종류 별 색상 배정
        // 해당 link가 횡단보도 인 경우 붉은색
        if(crosswalk===1){ 
          innerlinestyle = new Style({ stroke : new Stroke({color :'#ff0000',width : 6}),zIndex:11})
          prelinktype[i]="횡단보도"
          // 이전 link가 동일한 종류인 경우 count하지 않는다.
          if(prelinktype[i-1]!=="횡단보도"){ 
            crosswalkcnt++ 
          }

        }else if(bridge === 1){
          // 다리, 육교인 경우 오렌지색
          innerlinestyle = new Style({ stroke : new Stroke({color :'#FFA500',width : 6}),zIndex:12})
          prelinktype[i]="육교"
          if(prelinktype[i-1]!=="육교"){ 
            bridgecnt++ 
        }
        }else if(tunnel===1){
          // 터널, 지하철네트워크인 경우 갈색 
          innerlinestyle = new Style({ stroke : new Stroke({color :'#D2691E',width : 6}),zIndex:15})
        }else if(toiletlat!==0){
          // 화장실에 해당하는 경우 
          innerlinestyle = new Style({ stroke : new Stroke({color :'#FF7F50',width : 6}),zIndex:16})
          prelinktype[i]="화장실"
          if(prelinktype[i-1]!=="화장실"){ 
            toiletcnt++
            createPoint([toiletlong,toiletlat],1,mapstate)
          }

        }else if(drinklat!==0){
          // 급수대에 해당하는 경우 
          innerlinestyle = new Style({ stroke : new Stroke({color :'#1E90FF',width : 6}),zIndex:16})
          prelinktype[i]="급수대"
          if(prelinktype[i-1]!=="급수대"){ 
            drinkcnt++ 
            createPoint([drinklong,drinklat],2,mapstate)
          }
        }
        else{
          // 모두 해당하지 않는 경우 회색
          innerlinestyle = new Style({ stroke : new Stroke({color :'#708090',width : 6}),zIndex:9})
          prelinktype[i]="일반"
        };
      }
    geojsonfeature.setStyle([outerlinestyle,innerlinestyle])
    featurearr[i++]= geojsonfeature
    return featurearr
  })
  let avgslope = totslope/jsonarr.length
  return { countarr : [crosswalkcnt,bridgecnt,toiletcnt,drinkcnt,totkcal,avgslope,totruntime] , featurearr: featurearr};
}


// 경로 한개 선택 시 json 배열을 입력받아서 경로생성
export const AddingJSONLayerToMap = ( jsonarr , firstlastpoints, mapstate,setShowGuide2,setLoading,setActive, setShowmodalOpen)=>{
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
    var {countarr , featurearr} = MakeFeatureFromJSON(jsonarr,mapstate)

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
    createPoint(firstlastpoints[0],3,mapstate)
    createPoint(firstlastpoints[1],3,mapstate)
    mapstate.render()
    // 로딩창종료
    setLoading(false)
    // 경로생성 버튼 다시 지시.
    setActive(false)
    // 정보 지시
    setShowmodalOpen(true)
    // link 정보 반환.
    return { 
      totdistance:jsonarr[jsonarr.length-1].totdistance,
      crosswalkcnt:countarr[0],
      bridgecnt:countarr[1],
      toiletcnt:countarr[2],
      drinkcnt:countarr[3],
      totkcal:countarr[4],
      avgslope:countarr[5],
      totruntime:countarr[6]
    }
  }
}

// 경로 생성
export const createRouteOnMap = (jsonarr,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading)=>{
  var countarr={totdistance:0,crosswalkcnt:0,bridgecnt:0,tunnelcnt:0,drinkcnt:0,toiletcnt:0};
  if (jsonarr.length===0){ 
    SetShowErrorOccured(true)
  } else{
    // 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 
    // Feature 배열로 반환.
    var { countarr , featurearr } = MakeFeatureFromJSON(jsonarr,mapstate)
    var jsonvectorsource1 = new VectorSource({
      features : featurearr
    })
    var jsonvectorlayer1;
    // 생성 경로 중 최적경로일 경우 최상단에 표현.
    if (jsonarr[0].drawSelectColorOption===1){
      jsonvectorlayer1 = new VectorLayer({
        source : jsonvectorsource1,
        zIndex:100,
      })
    } else{
      jsonvectorlayer1 = new VectorLayer({
        source : jsonvectorsource1,
        zIndex:99,
      })
    }
    
    // Context에서 Global State로서 전달된 Map instance에 Layer 추가
    mapstate.addLayer(jsonvectorlayer1)
    mapstate.render()
    SetAutoCreateOpt(0)
    setLoading(false)
  }
  return { 
    totdistance:jsonarr[jsonarr.length-1].totdistance,
    crosswalkcnt:countarr[0],
    bridgecnt:countarr[1],
    toiletcnt:countarr[2],
    drinkcnt:countarr[3]
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
export const makingHttpRequestBody = (slopeopt,totalpointcount,coordarr,distanceshort,excludeoption,username)=>{
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
  const httprequestobject = {
    slopeopt:slopeopt,
    xcoord : xcoord,
    ycoord : ycoord,
    totpointcount : totalpointcount,
    distance : distanceshort,
    excludeoption : excludeoption,
    username : username
  }
  return httprequestobject
}

// 자동경로 생성 시 시점을 지정하는 콜백함수
export const setStartPoint = (mapstate,SetShowErrorOccured,SetStartPointCoord,SetAutoCreateOpt,username)=>{
   // username을 전달하여 경로를 생성할 DB 경로 Table 초기화
  initDBRouteTableApi(username)
  .then((result)=>{
    console.log(result.data)
  }).catch((err)=>{
    console.log(err)
  }).finally("경로초기화완료")

  SetShowErrorOccured(false)
  // Map 상 Tilemap 제외 Layer를 모두 삭제하여 초기화
  deleteAllLayer(mapstate)
  // 클릭 이벤트를 통해 좌표를 획득하는 콜백함수
  const aquireclickcoord = (evt)=>{
    var coord = evt.coordinate;
    // 포인트 생성
    createPoint(coord,0,mapstate)
    // State에 좌표정보 전달
    SetStartPointCoord(coord)
    // 다음 Process로 설정
    SetAutoCreateOpt(2)
    // 클릭 이벤트 해제
    mapstate.un('click',aquireclickcoord)
  }
  mapstate.on('click',aquireclickcoord)
}

// 거리에 존재하는 node id를 가져오는 콜백함수
export const setDistance = ({distance},SetLimitDistance,startpointcoord,SetTargetPointArr,SetAutoCreateOpt,SetIsErrorFindNode,SetShowErrorOccured)=>{
  SetLimitDistance(distance)
  // Http Request Body 생성
  const httprequestobject = {
    distance:distance,
    xcoord:startpointcoord[0],
    ycoord:startpointcoord[1]
  }
  // API 전달
  retrievePointByDistanceApi(httprequestobject)
  .then((result)=>{
    if(result.data.length>5){
      SetTargetPointArr(result.data)
      SetAutoCreateOpt(3)
      SetIsErrorFindNode(false)
    }else{
      SetIsErrorFindNode(true)
      setDistance(distance)
    }
  })
  .catch((error)=>{
    console.log(error)
    SetShowErrorOccured(true)
  })
  .finally(console.log("예비도착점좌표배열가져오기실행끝"))
}

// 거리 설정 완료 후 벡터 생성 Api 전달후 경로를 표현하는 함수
export const createMultipleRoutes = ({routecnt,weightslope,checkbox},SetAutoCreateOpt,setLoading,targetpointarr,limitdistance,startpointcoord,SetShowErrorOccured,mapstate,setModalInfo,setShowmodalOpen,reloadRouteByClick)=>{
  // 경로생성중 상태 지시
  SetAutoCreateOpt(4)
  setLoading(true)

  // 경로 생성 및 최적경로 조회
  createAndLoadRoute(routecnt,targetpointarr,checkbox,startpointcoord,limitdistance,weightslope,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading,setModalInfo,setShowmodalOpen,reloadRouteByClick)

}

// async await 활용해서 경로가 DB에서 모두 생성된 후 Map상에 한꺼번에 조회되도록 설정.
async function createAndLoadRoute(routecnt,targetpointarr,checkbox,startpointcoord,limitdistance,weightslope,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading,setModalInfo,setShowmodalOpen,reloadRouteByClick){
  // 횡단보도, 육교 제외여부
  var excludeoption = excludeOpt(checkbox)

  for(let i=1; i<=routecnt;i++){
    var randomnodeid = targetpointarr[Math.floor(Math.random() * targetpointarr.length)].nodeId
    // Http Request Body 생성
    // Target Node는 매 Iter마다 Random으로 선정.
    const httprequestobject1 = {
      xcoord : startpointcoord[0],
      ycoord : startpointcoord[1],
      distance:limitdistance,
      targetnodeid : randomnodeid,
      excludeoption : excludeoption,
      weightslope:weightslope,
      iter:i
    }
        // 경로생성 API 전달
    try{
      const result1 = await createRouteApi(httprequestobject1)
      console.log(result1.data)
    }catch(error){
      console.log(error)
    }finally{
    }
  }
  // 생성한 경로를 Api를 통해 조회 및 불러와서 Map상에 표현
  for (let i=1; i<=routecnt ; i++){
    var tablenm = "linknum"+i
    const httprequestobject2 = { tablenm : tablenm }
    // 생성한 경로 선택해서 가져오기
    try{
      const result2 = await retrieveRouteApi(httprequestobject2)
      var moduleinfo = createRouteOnMap(result2.data,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading)
      if (result2.data[0].drawSelectColorOption === 1){
        // 생성된 경로 중 가장 최적경로의 정보 표현 및
        // 모달창 표현
        setModalInfo(moduleinfo)
        setShowmodalOpen(true)
      }
    }catch(error){
      console.log(error)
    }finally{
      console.log("경로 조회끝")
    }
  }
  
  // 이벤트 종료조건때문에 react에서 선언하여 가져온 함수
  // 경로가 표현된 후 클릭이 될 수 있도록 설정.
  await reloadRouteByClick(routecnt);
}

// 생성된 경로클릭 시 클릭된 경로의 이름을 기반으로 경로 조회 후 기존 경로 하나 삭제 후 하나 경로 재생성하는 과정 반복하여 경로 재생성.
export const retrieveClickedRoute = (clickedLinkName,routecnt,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading,setModalInfo,setShowmodalOpen)=>{

  for(let i=1 ; i <= routecnt; i++){
    // 0번째 : tile map layer 1번째 : point vector layer 
    // 2번째에 해당하는 기존 생성된 경로 layer를 하나 삭제 후 새로운 경로 하나 생성하면서 반복.
    mapstate.removeLayer(mapstate.getLayers().getArray()[2])

    var tablenm = "linknum"+i;
    const httprequestobject3 = { tablenm : tablenm, 
      clickedtablenm :  clickedLinkName };
    // 경로생성 Api 전달
    retrieveRouteByClick(httprequestobject3)
    .then((result)=>{
      // Spring에서 전달된 data로 Vector Layer 생성.
      var moduleinfo = createRouteOnMap(result.data,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading)
      if (result.data[0].drawSelectColorOption === 1){
        // 클릭된 경로의 정보 모달창 표현
        setModalInfo(moduleinfo)
        setShowmodalOpen(true)
      }
    })
    .catch((error)=>{
      console.log(error)
    })
    .finally("클릭을 통해 경로조회 끝")
  }
}