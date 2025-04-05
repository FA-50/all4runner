import React from 'react'
import logo from '../img/all4runner_1.svg'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { FaHome } from 'react-icons/fa';
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteApi} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'

import { GeoJSON } from 'ol/format';
import  VectorSource from 'ol/source/Vector';
import  VectorLayer from 'ol/layer/Vector'
import { Style, Stroke , Circle as CircleStyle , Fill} from 'ol/style'
import { Point } from 'ol/geom'
import {Feature} from 'ol'



const SidebarMap = () => {
  const { isSidebarOpen , closeSidebar } = useGlobalContext()
  const { mapstate,mapdispatch } = useMapContext()

  // dispatch를 통해 useReducer 초기화
  mapdispatch({type:"getmap"})


  // json 배열을통해 벡터데이터 생성
  const AddingJSONLayerToMap = ( jsonarr )=>{
    // 횡단보도 수 카운트
    var featurearr =[]
    // useReducer를 이용한 mapstate 초기화 
    mapdispatch({type:"getmap"})

    // 현재 map객체에 포함된 layer 갯수 가져오기
    const maplayerlength = mapstate.getLayers().array_.length
    if ( maplayerlength > 2)
    { // map에서 해당 index의 layer를 가져온 후 map에서 삭제
      var i=0;
      for(i=1;i<maplayerlength;i++){
        const layerinstance = mapstate.getLayers().item(1)
        mapstate.removeLayer(layerinstance) 
      }
    }

    // 각 행의 json 데이터를 각각의 feature 데이터로 생성
    i=0
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

      featurearr[i]= geojsonfeature
      i=i+1
  })


    const jsonvectorsource = new VectorSource({
      features : featurearr
    })
    const jsonvectorlayer = new VectorLayer({
      source : jsonvectorsource,
      zIndex:100,
    })
    // Context에서 Global State로서 전달된 Map instance에 Layer 추가
    mapstate.addLayer(jsonvectorlayer)
    // Vector Layer 생성 시 Vector Source의 geom 범위로 Viewport의 확대를 수행
    mapstate.getView().fit(jsonvectorsource.getExtent(),{duration:500})
    console.log(mapstate.getLayers())
    console.log(`총 거리 : ${jsonarr[jsonarr.length-1].totdistance}`)
  }

  // Map상에 경로 생성을 위해 클릭 시 포인트생성하는 함수
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
  
  // 마우스 클릭으로 최적경로를 생성하는 콜백함수
  const createRoutebyMouse = ({distance,checkboxexclude})=>{

    // 횡단보도, 육교 제외여부
    var excludeoption;
    if (checkboxexclude[0]==undefined){
      // 횡단보도, 육교 전부 포함시 1
      excludeoption = 1
    }else if(checkboxexclude.length==1 && checkboxexclude[0]=="crosswalk"){
      // 횡단보도 제외 시 2
      excludeoption = 2
    }else if(checkboxexclude.length==1 && checkboxexclude[0]=="bridge"){
      // 육교 제외 시 3
      excludeoption = 3
    }else{
      // 횡단보도, 육교 제외 시 4
      excludeoption = 4
    }


    // 초기값
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


        // Spring에서 @RequestBody로 받을 Object 객체 정의하기.
        const coorddistanceobject = {
          fxcoord : fcoord[0],
          txcoord : tcoord[0],
          fycoord : fcoord[1],
          tycoord : tcoord[1],
          distance : distance,
          excludeoption : excludeoption
        }
        // 경로 생성을 위한한 API 호출 
        retrieveRouteApi(coorddistanceobject)
        .then((result)=>{
          AddingJSONLayerToMap(result.data)
        })
        .catch((error)=>{console.log(error)})
        .finally(console.log("실행끝"))
        console.log("실행끝")
      }
    }
    // 이벤트 실행
    mapstate.on('click',addcoord)
    
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
          <li>
            <hr style={{width:"90%"}} />
          </li>
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
                                <Field className="form-check-input" type="checkbox" value={"crosswalk"} name="checkboxexclude" id="checkboxexcludecrosswalkid" />
                                <label className="form-check-label" htmlFor="checkboxexcludecrosswalkid">횡단보도제외</label>
                              </div>
                              <div className="form-check form-check-inline">
                                <Field className="form-check-input" type="checkbox" value={"bridge"} name="checkboxexclude" id="checkboxexcludefootbridgeid"/>
                                <label className="form-check-label" htmlFor="checkboxexcludefootbridgeid">육교제외</label>
                              </div>
                            </fieldset>
                          </Row>
                          <Row style={{marginTop:10}}>
                          <Col xs={6} md={6} lg={6}>
                            <fieldset className="from-group">
                              <label htmlFor="distanceid" className="form-label">최대거리설정</label>
                              <Field required = "required" type="text" className="form-control" name="distance" id="distanceid" placeholder='거리'/>
                            </fieldset>
                          </Col>
                          <Col xs={6} md={6} lg={6}>
                            <button type="submit" className="btn btn-primary" style={{marginTop:30}}>경로생성</button>
                          </Col>
                          </Row>
                        </Container>
                      </Form>
                  )
                }
              </Formik>
            }
          </li>
          <hr style={{width:"90%"}} />

        </ul>
      </aside>
    </>
  )
}
export default SidebarMap;