import React, {useEffect, useState} from 'react'
import logo from '../img/all4runner_1.svg'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { FaHome } from 'react-icons/fa';
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteApi,retrieveRouteApiStopOver} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'

import { GeoJSON } from 'ol/format';
import  VectorSource from 'ol/source/Vector';
import  VectorLayer from 'ol/layer/Vector'
import { Style, Stroke , Circle as CircleStyle , Fill} from 'ol/style'
import { Point } from 'ol/geom'
import {Feature} from 'ol'



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
  mapdispatch({type:"getmap"})


  // Map상의 모든 Layer 삭제하는 함수수
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
  const createPoint=(coord)=>{
    var xcoord = coord[0]
    var ycoord = coord[1]
    const pointfeature = new Feature({
      geometry : new Point([xcoord,ycoord]),
      style : new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: 'red' }),  // 내부 색상
          stroke: new Stroke({ color: 'white', width: 2 }), // 테두리
        }),
      })
    })
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
  const MakeFeatureFromJSON = (jsonarr) =>{
    var featurearr=[]
    var i=0
    jsonarr.map((json)=>{
      var geojsonfeature = new GeoJSON().readFeature(json.geojson,{featureProjection: 'EPSG:4326'})
      // 보행로 종류 별 색상 배정
      // 해당 link가 횡단보도 인 경우 붉은색
      if(json.crosswalk==1){ 
        geojsonfeature.setStyle(new Style({ stroke : new Stroke({color :'#ff0000',width : 5})}))
      }else if(json.footbridge == 1 | json.bridge == 1){
        // 다리, 육교인 경우 오렌지색
        geojsonfeature.setStyle(new Style({ stroke : new Stroke({color :'#FFA500',width : 5})}))
      }else if(json.park==1){
        // 공원, 녹지 길인 경우 녹색
        geojsonfeature.setStyle(new Style({ stroke : new Stroke({color :'#32CD32',width : 5})}))
      }else if(json.subwaynetw==1 | json.tunnel==1){
        // 터널, 지하철네트워크인 경우 회색 
        geojsonfeature.setStyle(new Style({ stroke : new Stroke({color :'#708090',width : 5})}))
      }else{
        // 모두 해당하지 않는 경우 갈색
        geojsonfeature.setStyle(new Style({ stroke : new Stroke({color :'#D2691E',width : 5})}))
      };
      featurearr[i++]= geojsonfeature
    })
    return featurearr;
  }




  // 경로 한개 선택 시 json 배열을 입력받아서 경로생성
  const AddingJSONLayerToMap = ( jsonarr )=>{
    if (jsonarr.length==0){
      setShowGuide2(true)
    }else{
      // 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 
      // Feature 배열로 반환.
      var featurearr = MakeFeatureFromJSON(jsonarr)

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
    }
  }

  // 마우스 클릭으로 최단경로를 생성하는 콜백함수
  const createRoutebyMouse = ({distanceshort,checkboxshortexclude})=>{
    setShowGuide1(true)
    setShowGuide2(false)
    var excludeoption; 
    // 횡단보도, 육교 제외여부
    if (checkboxshortexclude==undefined){
      // 횡단보도, 육교 전부 포함시 1
      excludeoption = 1
    }else if(checkboxshortexclude.length==1 && checkboxshortexclude[0]=="crosswalk"){
      // 횡단보도 제외 시 2
      excludeoption = 2
    }else if(checkboxshortexclude.length==1 && checkboxshortexclude[0]=="bridge"){
      // 육교 제외 시 3
      excludeoption = 3
    }else{
      // 횡단보도, 육교 제외 시 4
      excludeoption = 4
    }

    // 초기 설정
    var coordarr = []
    var iter=0
    // 클릭이벤트로로 얻는 좌표를 배열로 넣는 콜백함수
    const addcoord = (evt) => {
      // 좌표 획득 후 배열에 입력 및 포인트 생성
      var clickedcoord = evt.coordinate;
      coordarr[iter]=clickedcoord
      // 해당 좌표로 포인트를 생성하는 함수
      createPoint(coordarr[iter++])
      // 좌표배열 갯수가 2개 이상일때 작용
      if (coordarr.length >= 2){
        
        // 시작 xy좌표와 목표 xy좌표 배열을 구조분해
        const [fcoord,tcoord] = coordarr
        // 이벤트 해제
        mapstate.un('click',addcoord)
        // 안내문 해제
        setShowGuide1(false)

        // Spring에서 @RequestBody로 받을 Object 객체 정의하기.
        const coorddistanceobject = {
          fxcoord : fcoord[0],
          txcoord : tcoord[0],
          fycoord : fcoord[1],
          tycoord : tcoord[1],
          distance : distanceshort,
          excludeoption : excludeoption
        }
        // 경로 생성을 위한한 API 호출 
        retrieveRouteApi(coorddistanceobject)
        .then((result)=>{
          AddingJSONLayerToMap(result.data)
        })
        .catch((error)=>{
          // 오류발생시 안내문 표시
          console.log(error)
          setShowGuide2(true)
          deleteAllLayer()
        })
        .finally(console.log("실행끝"))
      }
    }
    // 이벤트 실행
    mapstate.on('click',addcoord)
  }





  // 경유지 선택 시의 json 배열을 입력받아서 경로생성
  const AddingJSONLayerToMapStopOver = ( jsonarr )=>{
    // 빈 배열의 GeoJSON 입력 시 오류 표시시 
    if (jsonarr.length==0){
      setShowGuide1(false)
    }else{
      // 각 행의 json 데이터를 각각의 feature 데이터로 생성하여 
      // Feature 배열로 반환.
      var featurearr = MakeFeatureFromJSON(jsonarr)
      
      var jsonvectorsource2 = new VectorSource({
        features : featurearr
      })
      var jsonvectorlayer2 = new VectorLayer({
        source : jsonvectorsource2,
        zIndex:100,
      })
      // Context에서 Global State로서 전달된 Map instance에 Layer 추가
      mapstate.addLayer(jsonvectorlayer2)
    }
  }



  const createRouteWithStopOver = ({checkboxshortexclude})=>{
    // 점 클릭 메시지 지시
    setShowGuide1(true)
    // 오류 발생 메시지 표시 x
    setShowGuide2(false)

    // 횡단보도, 육교 제외여부
    var excludeoption = 1

    // 초기값
    var coordarr = []
    var iter=0
    var clickend = false

    // 클릭이벤트로로 얻는 좌표를 배열로 넣는 콜백함수
    const addcoord = (evt) => {

      // 좌표 획득 후 배열에 입력 및 포인트 생성
      var clickedcoord = evt.coordinate;
      coordarr[iter]=clickedcoord

      // 해당 좌표로 포인트를 생성하는 함수 실행
      createPoint(coordarr[iter++])

      // 배열에 2개 이상 요소 존재 시
      if (coordarr.length >= 2){
        
        // 시작 xy좌표와 목표 xy좌표 배열을 구조분해
        const [fcoord,tcoord] = coordarr


        // Spring에서 @RequestBody로 받을 Object 객체 정의하기.
        const coorddistanceobject = {
          fxcoord : fcoord[0],
          txcoord : tcoord[0],
          fycoord : fcoord[1],
          tycoord : tcoord[1],
          excludeoption : excludeoption
        }
        // 경로 생성을 위한 API 호출 
        retrieveRouteApiStopOver(coorddistanceobject)
        .then((result)=>{
          // 레이어 생성 함수 작동
          AddingJSONLayerToMapStopOver(result.data)
        })
        .catch((error)=>{
          console.log(error)
          // 이벤트 해제
          mapstate.un('click',addcoord)
          setShowGuide1(false)
        })
        .finally(console.log("실행끝"))

        // 더블 클릭 시 점생성 중단
        if(clickend){
          // 이벤트 해제
          mapstate.un('click',addcoord)
          // 안내문 해제
          setShowGuide1(false)
        }
        // 앞 요소 삭제하여 초기화하여 반복 수행.
        coordarr.shift()
        iter=1
      }
    }
    // 클릭 이벤트 : 선 생성 시작
    mapstate.on('click',addcoord)
    // 더블클릭 이벤트 : 선 생성 끝
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
                <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" onClick={deleteAllLayer}>
                경로탐색
                </button>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(1)}}>최단경로탐색</button></li>
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(2)}}>최적경로탐색</button></li>
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(3)}}>왕복최적경로탐색</button></li>
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(4)}}>최단경로탐색(경유지포함)</button></li>
                </ul>
              </div>
              </Col>
              <Col xs={6} md={6} lg={6}>
                <button type="submit" className="btn btn-danger"  onClick={deleteAllLayer}>경로 삭제</button>
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
                <Formik initialValues={{ }}
                enableReinitialize={true}
                onSubmit={(value)=>{createRoutebyMouse(value)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row>
                              <fieldset className="form-group">
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"crosswalk"} name="checkboxshortexclude" id="checkboxshortexcludecrosswalkid" />
                                  <label className="form-check-label" htmlFor="checkboxshortexcludecrosswalkid">횡단보도제외</label>
                                </div>
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"bridge"} name="checkboxshortexclude" id="checkboxshortexcludefootbridgeid"/>
                                  <label className="form-check-label" htmlFor="checkboxshortexcludefootbridgeid">육교제외</label>
                                </div>
                              </fieldset>
                            </Row>
                            <Row style={{marginTop:10}}>
                            <hr style={{width:"90%"}} />
                            <Col xs={6} md={6} lg={6}>
                              <fieldset className="from-group">
                                <label htmlFor="distanceshortid" className="form-label">최대거리설정</label>
                                <Field required = "required" type="text" className="form-control" name="distanceshort" id="distanceshortid" placeholder='거리'/>
                              </fieldset>
                            </Col>
                            <Col xs={6} md={6} lg={6}>
                              <button type="submit" className="btn btn-primary" style={{marginTop:30}}>경로생성</button>
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
              <Formik initialValues={{weightslope:5.5, weighttoilet:5, weightdrink:5, weightcrosswalk:5 }}
              enableReinitialize={true}
              onSubmit={(value)=>{console.log(value);createRoutebyMouse(value)}}>
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
                          <Col xs={6} md={6} lg={6}>
                            <fieldset className="from-group">
                              <label htmlFor="distanceoptimalid" className="form-label">최대거리설정</label>
                              <Field required = "required" type="text" className="form-control" name="distanceoptimal" id="distanceoptimalid" placeholder='거리'/>
                            </fieldset>
                          </Col>
                          <Col xs={6} md={6} lg={6}>
                            <button type="submit" className="btn btn-primary" style={{marginTop:30}}>경로생성</button>
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
          { exploreopt == 4 ? 
            <li>
            <h3>최단경로탐색(경유지)</h3>
            <hr style={{width:"50%"}} />
              {
                <Formik initialValues={{ }}
                enableReinitialize={true}
                onSubmit={(value)=>{createRouteWithStopOver(value)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row style={{marginTop:10}}>
                            <Col xs={6} md={6} lg={6}>
                              <button type="submit" className="btn btn-primary">경로생성</button>
                            </Col>
                            </Row>
                            <hr style={{width:"90%"}} />
                            { showguide1 ? <><div>맵 상단에 이동할 구간을 클릭하세요.</div><hr style={{width:"90%"}} /></> : <div></div> }
                            { showguide2 ? <><div>경로 생성에 문제가 발생했습니다.</div> <hr style={{width:"90%"}} /></> : <div></div> }
                          </Container>
                        </Form>
                    )
                  }
                </Formik>
              }
            </li>
          : <div/>}
        </ul>
      </aside>
    </>
  )
}
export default SidebarMap;
