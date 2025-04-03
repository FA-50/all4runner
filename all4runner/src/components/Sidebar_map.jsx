import React from 'react'
import logo from '../img/all4runner_1.svg'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { FaHome } from 'react-icons/fa';
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteApi1,retrieveRouteApi2} from '../axios/ApiOpenlayers'
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
    
    mapdispatch({type:"getmap"})
    // 현재 map객체에 포함된 layer 갯수 가져오기
    const maplayerlength = mapstate.getLayers().array_.length
    if ( maplayerlength > 3)
    { // map에서 해당 index의 layer를 가져온 후 map에서 삭제
      var i=0;
      for(i=1;i<maplayerlength;i++){
        const layerinstance = mapstate.getLayers().item(1)
        mapstate.removeLayer(layerinstance) 
      }
    }
    
    var geojsonarr =[]
    i=0
    jsonarr.map((json)=>{
      geojsonarr[i]=new GeoJSON().readFeature(json.geojson,{featureProjection: 'EPSG:4326'})
      i=i+1
    })
    const jsonvectorsource = new VectorSource({
      features : geojsonarr
    })
    const jsonvectorlayer = new VectorLayer({
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
    mapstate.addLayer(jsonvectorlayer)
    console.log(mapstate.getLayers())
  }


  // Axios를 통해 노드를 입력하여여 루트를 생성
  const createRoute= ({fnode,tnode,distance})=>{
    retrieveRouteApi1(fnode,tnode,distance)
    .then((result)=>{
      console.log(result)
      AddingJSONLayerToMap(result.data)
    })
    .catch((error)=>{console.log(error)})
    .finally(console.log("실행끝"))
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
  const createRoutebyMouse = ({distance})=>{
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
          distance : distance
        }
        // 경로 생성을 위한한 API 호출 
        retrieveRouteApi2(coorddistanceobject)
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
        <button className="close-btn" onClick={closeSidebar}>
          < FaTimes />
        </button>
        </div>
        {/* 사이드바 메뉴 */}
        <ul className="links">
          <li key={1}>
                  <a href={"/"}>
                    {<FaHome />}
                    {"home"}
                  </a>
          </li>
          <li>
          <hr/>
            {
              <Formik initialValues={{ }}
                      enableReinitialize={true}
                      onSubmit={(value)=>{createRoute(value)}}>
                        {
                          (props)=>(
                            <Form className="container-fluid">
                                <Container>
                                  <Row>
                                    <Col xs={6} md={6} lg={6}>
                                      <fieldset className="from-group">
                                        <label htmlFor="fnodeid" className="form-label">Fnode</label>
                                        <Field required = "required" type="text" className="form-control" id="fnodeid" name="fnode" placeholder='시작노드'/>
                                      </fieldset>
                                    </Col>
                                    <Col xs={6} md={6} lg={6}>
                                      <fieldset className="from-group">
                                        <label htmlFor="tnodeid" className="form-label">Tnode</label>
                                        <Field type="text" required = "required" className="form-control" id="tnodeid" name="tnode" placeholder='끝노드'/>
                                      </fieldset>
                                    </Col>
                                  </Row>
                                  <Row style={{marginTop:30}}>
                                  <Col xs={6} md={6} lg={6}>
                                    <fieldset className="from-group">
                                      <label htmlFor="distanceid" className="form-label">Distance</label>
                                      <Field required = "required" type="text" className="form-control" name="distance" id="distanceid" placeholder='거리'/>
                                    </fieldset>
                                  </Col>
                                  <Col xs={3} md={3} lg={3}>
                                    <button type="submit" className="btn btn-primary" style={{marginTop:30}}>Submit</button>
                                  </Col>
                                  </Row>
                                </Container>
                              </Form>
                          )
                        }
                      </Formik>
            }
          </li>
          <li>
          <hr/>
            {
              <Formik initialValues={{ }}
                      enableReinitialize={true}
                      onSubmit={(value)=>{createRoutebyMouse(value)}}>
                        {
                          (props)=>(
                            <Form className="container-fluid">
                                <Container>
                                  <Row style={{marginTop:30}}>
                                  <Col xs={6} md={6} lg={6}>
                                    <fieldset className="from-group">
                                      <label htmlFor="distanceid" className="form-label">Distance</label>
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
        </ul>
        <hr />
      </aside>
    </>
  )
}
export default SidebarMap;