import React, { useState} from 'react'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { FaHome } from 'react-icons/fa';
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteApiStopOver} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'
import { LineString } from 'ol/geom'
import { Draw } from 'ol/interaction'
import { getLength } from 'ol/sphere';
import { transform  } from 'ol/proj'
import { excludeOpt,AddingJSONLayerToMap,createPoint, deleteAllLayer,drawing, makingHttpRequestBody } from '../js/sidebar_map_function'



import PortalComponent  from '../components/PortalComponent'

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
  // 생성된 link 정보를 지시하는 Modal 창 표시여부
  const [isShowmodalOpen , setShowmodalOpen]=useState(false)
  
  // Modal에 지시할 정보의의 초기값 정의
  const [modalinfo,setModalInfo] = useState({totdistance:0,crosswalkcnt:0,bridgecnt:0,parkcnt:0});
  
  // Map 초기화
  mapdispatch({type:"getmap"})

  // 마우스 클릭으로 최단경로를 생성하는 콜백함수
  const createRoutebyMouse = ({weightslope,checkbox,checkboxdistance})=>{

    // 거리제한 없음
    var distanceshort ;

    // draw 기능 작동
    var drawsource = drawing(mapstate)
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
        if (checkboxdistance.length===0){
          // 체크박스 체크 안하면 거리제한 없음
          distanceshort= 99999999999;
        }else{
          // 체크 시 draw 거리를 한정해서 거리제한.
          distanceshort=initdistance;
        }

        // // 거리표현
        setDrawdistance(Math.round(initdistance));
      })
    })

    
    // 경로생성 버튼 숨김
    setActive(true)
    // 점 클릭 메시지 지시
    setShowGuide1(true)
     // 오류 발생 메시지 표시 x
    setShowGuide2(false)

    // 횡단보도, 육교 제외여부
    var excludeoption = excludeOpt(checkbox)

    // 초기 설정
    var clickend = false
    var coordarr = []
    var iter=0    
    var firstlastpoints;

    // 클릭이벤트로로 얻는 좌표를 배열로 넣는 콜백함수
    const addcoord = (evt) => {

      // 더블클릭이 수행될때까지 작동
      if (clickend===false){
        // 좌표 획득 후 배열에 입력 및 포인트 생성
        var clickedcoord = evt.coordinate;
        coordarr[iter]=clickedcoord

        // 해당 좌표로 포인팅 용도로 포인트를 생성하는 함수
        createPoint(coordarr[iter++],0,mapstate)
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

        // , 로 구분되는 위도 , 경도 좌표의 문자열을 생성하여
        // Spring에서 @RequestBody로 받을 Object 객체 정의하는 function
        const coorddistanceobject = makingHttpRequestBody(weightslope,totalpointcount,coordarr,distanceshort,excludeoption)

        // 로딩 표현
        setLoading(true)

        // excludeoption 초기화
        excludeoption=0

        // 경로 생성을 위한 API 호출 
        retrieveRouteApiStopOver(coorddistanceobject)
        .then((result)=>{
          // Map상에 link 생성 후 link 정보 반환.
          setModalInfo(AddingJSONLayerToMap(result.data,firstlastpoints,mapstate,setShowGuide2,setLoading,setActive,setShowmodalOpen))
        })
        .catch((error)=>{
          // 오류발생시 안내문 표시
          console.log(error)
          setShowGuide2(true)
          setLoading(false)
          setActive(false)
          deleteAllLayer(mapstate)
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
    {/* ReactDOM.createPortal을 이용해 경로정보표현 */ }
      <PortalComponent>
        <div className={`${isShowmodalOpen ?"card border-dark mb-3 attributemodal":"" }`} style={{position: 'fixed', zIndex: 1000,width:"30vh"}}>
            <Container className="card-header">
              <Row>
                <Col xs={10} md={10} lg={10}>생성된 경로 정보</Col>
                <Col xs={2} md={2} lg={2}><button className="closemodal" onClick={()=>{setShowmodalOpen(false)}}><FaTimes/></button></Col>
              </Row>
            </Container>
          <div className="card-body">
            <p className="card-text" style={{margin:"2px"}}>총거리 : {Math.round(modalinfo.totdistance)}m</p>
            <p className="card-text" style={{margin:"2px"}}>횡단보도 수 : {modalinfo.crosswalkcnt}</p>
            <p className="card-text" style={{margin:"2px"}}>육교, 다리 수 : {modalinfo.bridgecnt}</p>
            <p className="card-text" style={{margin:"2px"}}>공원길 수 : {modalinfo.parkcnt}</p>
          </div>
        </div>
      </PortalComponent>
      <aside className={`${isSidebarOpen? 'sidebar show-sidebar':'sidebar'}`}>
        {/* 사이드바 메뉴 */}
        <ul className="links" style={{marginTop:"5px"}}>
        <hr style={{width:"90%"}} />
        <Container>
          <Row>
            <Col xs={9} md={9} lg={9}>
              <li key={1}>
                    <a href={"/"} style={{width:"100%"}}>
                      {<FaHome />}
                      {"home"}
                    </a>
              </li>
            </Col>
            <Col xs={3} md={3} lg={3}>
            <div style={{display: "flex",
  justifyContent: "spaceBetween",
  alignItems: "center"}}>
              <button className="close-btn" onClick={closeSidebar} >
                < FaTimes />
              </button>
            </div>
            </Col>
          </Row>
        </Container>
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
                  <li><button className="dropdown-item" onClick={()=>{setExploreOption(2)}}>위치검색</button></li>
                </ul>
              </div>
              </Col>
            </Row>
          </Container>
          </li>
          <hr style={{width:"90%"}} />
          { exploreopt === 1 ? 
            <li>
            <h3>최적경로탐색</h3>
            <hr style={{width:"50%"}} />
              {
                <Formik initialValues={{ weightslope:0,checkbox :  [],checkboxdistance:[]}}
                enableReinitialize={true}
                onSubmit={(value)=>{createRoutebyMouse(value)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row>
                              <fieldset className="form-group">
                                <label htmlFor="weightslopeid" className="form-label">경사도 가중치</label>
                                <Field type="range" name="weightslope" className="form-range" min="0" max="20" step="5" id="weightslopeid" style={{width:"90%"}}/>
                              </fieldset>
                            </Row>
                            <Row>
                              <fieldset className="form-group">
                                <hr style={{width:"90%"}} />
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"crosswalk"} name="checkbox" id="checkboxshortexcludecrosswalkid" />
                                  <label className="form-check-label" htmlFor="checkboxshortexcludecrosswalkid">횡단보도최소</label>
                                </div>
                                <div className="form-check form-check-inline">
                                  <Field className="form-check-input" type="checkbox" value={"bridge"} name="checkbox" id="checkboxshortexcludefootbridgeid"/>
                                  <label className="form-check-label" htmlFor="checkboxshortexcludefootbridgeid">육교최소</label>
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
          { exploreopt === 2 ?
          <li>
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

