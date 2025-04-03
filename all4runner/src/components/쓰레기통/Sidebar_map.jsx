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
import { Vector } from 'ol/source';
import { Vector as VectorLayer} from 'ol/layer'
import { Style, Stroke } from 'ol/style'


const SidebarMap = () => {
  const { isSidebarOpen , closeSidebar } = useGlobalContext()
  const { mapstate,mapdispatch } = useMapContext()
  // dispatch를 통해 useReducer 초기화화
  mapdispatch({type:"getmap"})

  
  

  // json 배열을통해 벡터데이터 생성성
  const AddingJSONLayerToMap = ( jsonarr )=>{
    mapdispatch({type:"getmap"})
    // 현재 map객체에 포함된 layer 갯수 가져오기
    const maplayerlength = mapstate.getLayers().array_.length
    if ( maplayerlength > 1)
    { // map에서 해당 index의 layer를 가져온 후 map에서 삭제
      for(i=1;i<maplayerlength;i++){
        const layerinstance = mapstate.getLayers().item(1)
        mapstate.removeLayer(layerinstance) 
      }
    }
    
    var geojsonarr =[]
    var i=0
    jsonarr.map((json)=>{
      geojsonarr[i]=new GeoJSON().readFeature(json.geojson,{featureProjection: 'EPSG:4326'})
      i=i+1
    })
    const jsonvectorsource = new Vector({
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



  const createRoute= ({fnode,tnode,distance})=>{
    retrieveRouteApi(fnode,tnode,distance)
    .then((result)=>{
      console.log(result)
      AddingJSONLayerToMap(result.data)
    })
    .catch((error)=>{console.log(error)})
    .finally(console.log("실행끝"))
  }


  return (
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
                                      <Field type="text" className="form-control" id="fnodeid" name="fnode" placeholder='시작노드'/>
                                    </fieldset>
                                  </Col>
                                  <Col xs={6} md={6} lg={6}>
                                    <fieldset className="from-group">
                                      <label htmlFor="tnodeid" className="form-label">Tnode</label>
                                      <Field type="text" className="form-control" id="tnodeid" name="tnode" placeholder='끝노드'/>
                                    </fieldset>
                                  </Col>
                                </Row>
                                <Row style={{marginTop:30}}>
                                <Col xs={6} md={6} lg={6}>
                                  <fieldset className="from-group">
                                    <label htmlFor="distanceid" className="form-label">Distance</label>
                                    <Field type="text" className="form-control" name="distance" id="distanceid" placeholder='거리'/>
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
      </ul>
      <hr />
    </aside>
  )
}
export default SidebarMap;