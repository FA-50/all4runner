import React, { useState} from 'react'
import logo from '../img/all4runner_1.svg'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { FaHome } from 'react-icons/fa';
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteApiStopOver,retrieveOptimalRouteApiStopOver} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'

import { GeoJSON } from 'ol/format';
import  VectorSource from 'ol/source/Vector';
import  VectorLayer from 'ol/layer/Vector'
import { Style, Stroke , Circle as CircleStyle , Fill , Icon} from 'ol/style'
import { Point, LineString } from 'ol/geom'
import {Feature} from 'ol'
import { Draw } from 'ol/interaction'

import { getLength } from 'ol/sphere';
import { transform  } from 'ol/proj'


const SidebarMap = () => {
  // 사이드바를 Context에서 가져옴
  const { isSidebarOpen , closeSidebar } = useGlobalContext()
  // useReducer을 통한 map instance 불러오기
  const { mapstate,mapdispatch } = useMapContext()

  // 육교, 횡단보도 state
  const [ exploreopt , setExploreOption ] = useState(null)
  // 버튼 지정 안내문 표시 여부
  const [ showguide1,setShowGuide1 ] = useState(false)
  // 경로 생성 에러 안내문 표시 여부
  const [ showguide2, setShowGuide2 ] = useState(false)
  // 로딩 표시 여부
  const [ loading , setLoading ] = useState(false)
  // 경로생성 버튼 누를 경우 작동상태 표시여부
  const [ active , setActive ] = useState(false)
  // Draw 거리 정보
  const [ drawdistance , setDrawdistance ] = useState(0)
  
  
  // Map 초기화
  mapdispatch({type:"getmap"})

  // Map상의 Tile Map을 제외한 모든 Layer 삭제하는 함수
  const deleteAllLayer = () =>{
    // 현재 map객체에 포함된 layer 갯수 가져오기
    var maplayerlength = mapstate.getLayers().array_.length 
      
    // map에서 해당 index의 layer를 가져온 후 map에서 삭제
    for(var i=1;i<maplayerlength;i++){
      const layerinstance = mapstate.getLayers().item(1)
      mapstate.removeLayer(layerinstance) 
    }
  }

  // Map상에 경로 생성을 위해 클릭 시 포인트 생성하는 함수
  const createPoint=(coord,opt)=>{
    var xcoord = coord[0]
    var ycoord = coord[1]
    const pointfeature = new Feature({
      geometry : new Point([xcoord,ycoord]),
    })
    var featurestyle;
    if (opt==0){
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

  // draw 기능에 필요한 draw vector source를 제공하는 함수
  const drawing = ()=>{
    // drawing vector의 초기 배열 정의
    const drawSource = new VectorSource({})
    const drawLayer = new VectorLayer({
      source:drawSource,
      zIndex:102
    })
    mapstate.addLayer(drawLayer)
    return drawSource
  }


  // 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 Feature 배열로 반환하는 함수
  const MakeFeatureFromJSON = (jsonarr) =>{
    var featurearr=[]
    var i=0

    var bridgecnt=0;
    var crosswalkcnt=0;
    var parkcnt=0;
    var tunnelcnt=0;
    var prelinktype=["일반"];

    jsonarr.map((json)=>{
      if (i==0){
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
      if(crosswalk==1){ 
        innerlinestyle = new Style({ stroke : new Stroke({color :'#ff0000',width : 6}),zIndex:11})
        prelinktype[i]="횡단보도"
        // 이전 link가 동일한 종류인 경우 count하지 않는다.
        if(prelinktype[i-1]!="횡단보도"){ 
          crosswalkcnt++ 
        }

      }else if(footbridge == 1 | bridge == 1){
        // 다리, 육교인 경우 오렌지색
        innerlinestyle = new Style({ stroke : new Stroke({color :'#FFA500',width : 6}),zIndex:12})
        prelinktype[i]="육교"
        if(prelinktype[i-1]!="육교"){ 
          bridgecnt++ 
      }else if(park==1){
        // 공원, 녹지 길인 경우 녹색
        innerlinestyle = new Style({ stroke : new Stroke({color :'#32CD32',width : 6}),zIndex:13})
        prelinktype[i]="공원"
        if(prelinktype[i-1]!="공원"){ 
          parkcnt++ 
        }}
      }else if(subwaynetw==1 | tunnel==1){
        // 터널, 지하철네트워크인 경우 갈색 
        innerlinestyle = new Style({ stroke : new Stroke({color :'#D2691E',width : 6}),zIndex:10})
        prelinktype[i]="터널"
        if(prelinktype[i-1]=="터널"){ 
          tunnelcnt++ 
        } 
      }else{
        // 모두 해당하지 않는 경우 회색
        innerlinestyle = new Style({ stroke : new Stroke({color :'#708090',width : 6}),zIndex:9})
        outerlinestyle = new Style({})
        prelinktype[i]="일반"
      };
      geojsonfeature.setStyle([outerlinestyle,innerlinestyle])

      featurearr[i++]= geojsonfeature
    })
    return { countarr : [crosswalkcnt,bridgecnt,parkcnt,tunnelcnt] , featurearr: featurearr};
  }

  // 경로 한개 선택 시 json 배열을 입력받아서 경로생성
  const AddingJSONLayerToMap = ( jsonarr , firstlastpoints )=>{
    if (jsonarr.length==0){
      setShowGuide2(true)
      deleteAllLayer()
      setLoading(false)
      setActive(false)
    }else{
      var maplayerlength = mapstate.getLayers().array_.length;
      if ( maplayerlength >2){
        deleteAllLayer()
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
      createPoint(firstlastpoints[0],1)
      createPoint(firstlastpoints[1],1)
      mapstate.render()
      // 로딩창종료
      setLoading(false)
      setActive(false)
    }
  }


  // 마우스 클릭으로 최단경로를 생성하는 콜백함수
  const createRoutebyMouse = ({checkbox,checkboxdistance})=>{

    // 거리제한 없음
    var distanceshort ;

    // draw 기능 작동
    var drawsource = drawing()
    var draw = new Draw({
      source:drawsource,
      type : 'LineString',
      minPoints : 2
    })
    mapstate.addInteraction(draw)

    // draw 거리정보 제공
    draw.on('drawstart', (evt)=>{
      evt.feature.getGeometry().on('change',(geomEvt)=>{
        var coords = geomEvt.target.getCoordinates();
        if (coords.length < 2) {
          setDrawdistance(0);
          return;
        }

        // EPSG:4326 → EPSG:3857로 변환
        var coords3857 = coords.map((c) => transform(c, 'EPSG:4326', 'EPSG:3857'));
        var geom3857 = new LineString(coords3857);

        // 거리 설정
        // getLength : ol / sphere
        var initdistance = getLength(geom3857); // 단위: 미터

        // 거리제한 설정 여부
        if (checkboxdistance.length==0){
          // 체크박스 체크 안하면 거리제한 없음
          distanceshort= 99999999999;
        }else{
          // 체크 시 draw 거리를 한정해서 거리제한.
          distanceshort=initdistance;
        }

        // 거리표현
        setDrawdistance(Math.round(initdistance));
      })
    })

    
    // 경로생성 버튼 숨김
    setActive(true)
    // 점 클릭 메시지 지시
    setShowGuide1(true)
     // 오류 발생 메시지 표시 x
    setShowGuide2(false)


    var excludeoption; 
    // 횡단보도, 육교 제외여부
    if (checkbox.length==0){
      // 횡단보도, 육교 전부 포함시 1
      excludeoption = 1
    }else if(checkbox.length==1 && checkbox[0]=="crosswalk"){
      // 횡단보도 제외 시 2
      excludeoption = 2
    }else if(checkbox.length==1 && checkbox[0]=="bridge"){
      // 육교 제외 시 3
      excludeoption = 3
    }else{
      // 횡단보도, 육교 제외 시 4
      excludeoption = 4
    }

    


    // 초기 설정
    var coordarr = []
    var iter=0
    var clickend = false
    
    var firstlastpoints;

    

    // 클릭이벤트로로 얻는 좌표를 배열로 넣는 콜백함수
    const addcoord = (evt) => {

      // 더블클릭이 수행될때까지 작동
      if (clickend==false){
        // 좌표 획득 후 배열에 입력 및 포인트 생성
        var clickedcoord = evt.coordinate;
        coordarr[iter]=clickedcoord

        // 해당 좌표로 포인팅 용도로 포인트를 생성하는 함수
        createPoint(coordarr[iter++],0)
      }
      else{ // 더블 클릭 후 dblclick 이벤트 작동 시 작용

        // 이벤트 해제
        mapstate.un('click',addcoord)
        // 안내문 해제
        setShowGuide1(false)
        // Draw 기능 종료
        mapstate.removeInteraction(draw)


        // 포인트 총 갯수
        var totalpointcount = coordarr.length;
        
        // 시작점 끝점 아이콘 지정용
        firstlastpoints = [coordarr[0],coordarr[totalpointcount-1]]

        var xcoord = ""
        var ycoord = ""
        // , 로 구분되는 위도 , 경도 좌표의 문자열을 생성.
        for( var i=0;i<totalpointcount;i++){
          if (i==totalpointcount-1){
            xcoord += coordarr[i][0].toString()
            ycoord += coordarr[i][1].toString()
          }else{
            xcoord = xcoord + coordarr[i][0].toString() + ","
            ycoord += coordarr[i][1].toString() + ","
          }
        }
        
        // Spring에서 @RequestBody로 받을 Object 객체 정의하기.
        const coorddistanceobject = {
          xcoord : xcoord,
          ycoord : ycoord,
          totpointcount : totalpointcount,
          distance : distanceshort,
          excludeoption : excludeoption
        }
        setLoading(true)
        excludeoption=0

        // 경로 생성을 위한 API 호출 
        retrieveRouteApiStopOver(coorddistanceobject)
        .then((result)=>{
          AddingJSONLayerToMap(result.data,firstlastpoints)
          // 로딩창 표시
        })
        .catch((error)=>{
          // 오류발생시 안내문 표시
          console.log(error)
          setShowGuide2(true)
          setLoading(false)
          setActive(false)
          deleteAllLayer()
        })
        .finally(console.log("실행끝"))
      }
    }
    // 선 생성 이벤트 실행
    mapstate.on('click',addcoord)
    // 더블클릭 이벤트 : 경로 생성 끝
    mapstate.on('dblclick',()=>{clickend=true})
  }



   // 마우스 클릭으로 최단경로를 생성하는 콜백함수
  const createOptimalRoutebyMouse = ({weightcrosswalk,weightdrink,weightslope,weighttoilet,checkboxoptimalexclude,checkboxdistance})=>{

    // 거리제한 없음
    var distanceshort ;

    // draw 기능 작동
    var drawsource = drawing()
    var draw = new Draw({
      source:drawsource,
      type : 'LineString',
      minPoints : 2
    })
    mapstate.addInteraction(draw)

    // draw 거리정보 제공
    draw.on('drawstart', (evt)=>{
      evt.feature.getGeometry().on('change',(geomEvt)=>{
        var coords = geomEvt.target.getCoordinates();
        if (coords.length < 2) {
          setDrawdistance(0);
          return;
        }

        // EPSG:4326 → EPSG:3857로 변환
        var coords3857 = coords.map((c) => transform(c, 'EPSG:4326', 'EPSG:3857'));
        var geom3857 = new LineString(coords3857);

        // 거리 설정
        // getLength : ol / sphere
        var initdistance = getLength(geom3857); // 단위: 미터

        // 거리제한 설정 여부
        if (checkboxdistance.length==0){
          // 체크박스 체크 안하면 거리제한 없음
          distanceshort= 99999999999;
        }else{
          // 체크 시 draw 거리를 한정해서 거리제한.
          distanceshort=initdistance;
        }

        // 거리표현
        setDrawdistance(Math.round(initdistance));
      })
    })

    
    // 경로생성 버튼 숨김
    setActive(true)
    // 점 클릭 메시지 지시
    setShowGuide1(true)
     // 오류 발생 메시지 표시 x
    setShowGuide2(false)


    var excludeoption; 
    // 횡단보도, 육교 제외여부
    if (checkboxoptimalexclude.length==0){
      // 횡단보도, 육교 전부 포함시 1
      excludeoption = 1
    }else if(checkboxoptimalexclude.length==1 && checkboxoptimalexclude[0]=="crosswalk"){
      // 횡단보도 제외 시 2
      excludeoption = 2
    }else if(checkboxoptimalexclude.length==1 && checkboxoptimalexclude[0]=="bridge"){
      // 육교 제외 시 3
      excludeoption = 3
    }else{
      // 횡단보도, 육교 제외 시 4
      excludeoption = 4
    }

    


    // 초기 설정
    var coordarr = []
    var iter=0
    var clickend = false
    
    var firstlastpoints;

    

    // 클릭이벤트로로 얻는 좌표를 배열로 넣는 콜백함수
    const addcoord = (evt) => {

      // 더블클릭이 수행될때까지 작동
      if (clickend==false){
        // 좌표 획득 후 배열에 입력 및 포인트 생성
        var clickedcoord = evt.coordinate;
        coordarr[iter]=clickedcoord

        // 해당 좌표로 포인팅 용도로 포인트를 생성하는 함수
        createPoint(coordarr[iter++],0)
      }
      else{ // 더블 클릭 후 dblclick 이벤트 작동 시 작용

        // 이벤트 해제
        mapstate.un('click',addcoord)
        // 안내문 해제
        setShowGuide1(false)
        // Draw 기능 종료
        mapstate.removeInteraction(draw)


        // 포인트 총 갯수
        var totalpointcount = coordarr.length;
        
        // 시작점 끝점 아이콘 지정용
        firstlastpoints = [coordarr[0],coordarr[totalpointcount-1]]

        var xcoord = ""
        var ycoord = ""
        // , 로 구분되는 위도 , 경도 좌표의 문자열을 생성.
        for( var i=0;i<totalpointcount;i++){
          if (i==totalpointcount-1){
            xcoord += coordarr[i][0].toString()
            ycoord += coordarr[i][1].toString()
          }else{
            xcoord = xcoord + coordarr[i][0].toString() + ","
            ycoord += coordarr[i][1].toString() + ","
          }
        }
        
        // Spring에서 @RequestBody로 받을 Object 객체 정의하기.
        const coorddistanceobject = {
          xcoord : xcoord,
          ycoord : ycoord,
          totpointcount : totalpointcount,
          distance : distanceshort,
          excludeoption : excludeoption
        }
        setLoading(true)
        excludeoption=0

        // 경로 생성을 위한 API 호출 
        retrieveOptimalRouteApiStopOver(coorddistanceobject)
        .then((result)=>{
          AddingJSONLayerToMap(result.data,firstlastpoints)
          // 로딩창 표시
        })
        .catch((error)=>{
          // 오류발생시 안내문 표시
          console.log(error)
          setShowGuide2(true)
          setLoading(false)
          setActive(false)
          deleteAllLayer()
        })
        .finally(console.log("실행끝"))
      }
    }
    // 선 생성 이벤트 실행
    mapstate.on('click',addcoord)
    // 더블클릭 이벤트 : 경로 생성 끝
    mapstate.on('dblclick',()=>{clickend=true})
  }
  

  return (
    <>
      <aside className={`${isSidebarOpen? 'sidebar show-sidebar':'sidebar'}`}>
        <div className="sidebar-header">
        <img src={logo} width="300" height="auto" alt="error from img" />
        <button className="close-btn" onClick={closeSidebar} >
          < FaTimes />
        </button>
        </div>
        {/* 사이드바 메뉴 */}
        <ul className="links" style={{marginTop:"-30px"}}>
        <hr style={{width:"90%"}} />
          <li key={1}>
                  <a href={"/"} style={{width:"90%"}}>
                    {<FaHome />}
                    {"home"}
                  </a>
          </li>
          <hr style={{width:"90%"}} />
          <li>
          <Container>
            <Row>
              <Col xs={6} md={6} lg={6}>
              <div className="dropdown">
                <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                경로탐색
                </button>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(1)}}>최단경로탐색</button></li>
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(2)}}>최적경로탐색</button></li>
                </ul>
              </div>
              </Col>
            </Row>
          </Container>
          </li>
          <hr style={{width:"90%"}} />
          { exploreopt == 1 ? 
            <li>
            <h3>최단경로탐색</h3>
            <hr style={{width:"50%"}} />
              {
                <Formik initialValues={{ checkbox :  [],checkboxdistance:[]}}
                enableReinitialize={true}
                onSubmit={(value)=>{createRoutebyMouse(value)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row>
                              <fieldset className="form-group">
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"crosswalk"} name="checkbox" id="checkboxshortexcludecrosswalkid" />
                                  <label className="form-check-label" htmlFor="checkboxshortexcludecrosswalkid">횡단보도제외</label>
                                </div>
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"bridge"} name="checkbox" id="checkboxshortexcludefootbridgeid"/>
                                  <label className="form-check-label" htmlFor="checkboxshortexcludefootbridgeid">육교제외</label>
                                </div>
                              </fieldset>
                            </Row>
                            <Row style={{marginTop:10}}>
                            <hr style={{width:"90%"}} />
                              <fieldset className="form-group">
                                <div className="form-check form-check-inline">
                                      <Field className="form-check-input" type="checkbox" value={"distancelimitactive"} name="checkboxdistance" id="distancelimitid"/>
                                      <label className="form-check-label" htmlFor="distancelimitid">거리제한 시 체크</label>
                                </div>
                                <hr style={{width:"90%"}} />
                              </fieldset>
                              <Col xs={12} md={12} lg={12}>
                                { active ? 
                                <div className="alert alert-light" role="alert" style={{width:"90%",marginTop:10}}>
                                최소거리 : {drawdistance} m
                                </div>
                                :
                                <button type="submit" className="btn btn-primary" style={{marginTop:10}}>경로생성</button> 
                                }
                              </Col>
                            </Row>
                            <hr style={{width:"90%"}} />
                            { showguide1 ? <div>맵 상단에 이동할 구간을 클릭하세요.</div> : <div></div> }
                            { showguide2 ? <div>경로 생성에 문제가 발생했습니다.</div> : <div></div> }
                          </Container>
                        </Form>
                    )
                  }
                </Formik>
              }
            </li>
          : <div/>}
          { exploreopt == 2 ?
          <li>
          <h3>최적경로탐색</h3>
          <hr style={{width:"50%"}} />
            {
              <Formik initialValues={{weightslope:5.5, weighttoilet:5, weightdrink:5, weightcrosswalk:5 , checkboxdistance:[], checkboxoptimalexclude:[]}}
              enableReinitialize={true}
              onSubmit={(value)=>{console.log(value);createOptimalRoutebyMouse(value)}}>
                {
                  (props)=>(
                    <Form className="container-fluid">
                        <Container>
                          <Row>
                            <fieldset className="form-group">
                              <label htmlFor="weightslopeid" className="form-label">경사도 가중치</label>
                              <Field type="range" name="weightslope" className="form-range" min="1" max="11" step="0.5" id="weightslopeid" style={{width:"90%"}}/>
                            </fieldset>
                            <fieldset className="form-group">
                              <label htmlFor="weighttoiletid" className="form-label">화장실 가중치</label>
                              <Field type="range" name="weighttoilet" className="form-range" min="0" max="10" step="0.5" id="weighttoiletid" style={{width:"90%"}}/>
                            </fieldset>
                            <fieldset className="form-group">
                              <label htmlFor="weightdrinkid" className="form-label">급수대 가중치</label>
                              <Field type="range" name="weightdrink" className="form-range" min="0" max="10" step="0.5" id="weightdrinkid" style={{width:"90%"}}/>
                            </fieldset>
                            <fieldset className="form-group">
                              <label htmlFor="weightcrosswalkid" className="form-label">횡단보도 가중치</label>
                              <Field type="range" name="weightcrosswalk" className="form-range" min="0" max="10" step="0.5" id="weightcrosswalkid" style={{width:"90%"}}/>
                            </fieldset>
                          </Row>
                          <Row>
                            <fieldset className="form-group">
                              <hr style={{width:"90%"}} />
                              <div className="form-check form-check-inline">
                                <Field className="form-check-input" type="checkbox" value={"crosswalk"} name="checkboxoptimalexclude" id="checkboxoptimalexcludecrosswalkid" />
                                <label className="form-check-label" htmlFor="checkboxoptimalexcludecrosswalkid">횡단보도제외</label>
                              </div>
                              <div className="form-check form-check-inline">
                                <Field className="form-check-input" type="checkbox" value={"bridge"} name="checkboxoptimalexclude" id="checkboxoptimalexcludefootbridgeid"/>
                                <label className="form-check-label" htmlFor="checkboxoptimalexcludefootbridgeid">육교제외</label>
                              </div>
                            </fieldset>
                          </Row>
                          <Row style={{marginTop:10}}>
                            <hr style={{width:"90%"}} />
                              <fieldset className="form-group">
                                <div className="form-check form-check-inline">
                                      <Field className="form-check-input" type="checkbox" value={"distancelimitactive"} name="checkboxdistance" id="distancelimitid"/>
                                      <label className="form-check-label" htmlFor="distancelimitid">거리제한 시 체크</label>
                                </div>
                                <hr style={{width:"90%"}} />
                              </fieldset>
                              <Col xs={12} md={12} lg={12}>
                                { active ? 
                                <div className="alert alert-light" role="alert" style={{width:"90%",marginTop:10}}>
                                최소거리 : {drawdistance} m
                                </div>
                                :
                                <button type="submit" className="btn btn-primary" style={{marginTop:10}}>경로생성</button> 
                                }
                              </Col>
                            </Row>
                            <hr style={{width:"90%"}} />
                        </Container>
                      </Form>
                  )
                }
              </Formik>
            }
          </li>
          : <div/>}
          <li>
            { loading ?
              <div className="spinner-border" role="status" style={{marginLeft:30}}>
                <span className="visually-hidden">Loading...</span>
              </div> : <div/>
            }
          </li>
        </ul>
      </aside>
    </>
  )
}
export default SidebarMap;