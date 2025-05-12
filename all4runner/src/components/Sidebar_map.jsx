import React, { useState,useEffect,useRef} from 'react'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteStopOverApi} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'
import { LineString } from 'ol/geom'
import { Draw } from 'ol/interaction'
import { getLength } from 'ol/sphere';
import { transform  } from 'ol/proj'
import { excludeOpt,AddingJSONLayerToMap,createPoint, deleteAllLayer,drawing, makingHttpRequestBody,setStartPoint,setDistance, createMultipleRoutes,retrieveClickedRoute} from '../js/sidebar_map_function'


import PortalComponent  from '../components/PortalComponent'
import { useParams } from 'react-router-dom';

const SidebarMap = () => {
  const {username} = useParams()  

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
  const [ isShowmodalOpen , setShowmodalOpen ]=useState(false)
  

  // Modal에 지시할 정보의 초기값 정의
  const [modalinfo,setModalInfo] = useState({totdistance:0,crosswalkcnt:0,bridgecnt:0,tunnelcnt:0,drinkcnt:0,toiletcnt:0,totkcal:0,avgslope:0,totruntime:0});


  // 최적경로자동생성 조작 Process 옵션
  const [ autoCreateOpt , SetAutoCreateOpt ] = useState(0);
  // 최적경로자동생성 시작점 좌표
  const [ startpointcoord , SetStartPointCoord] = useState(null);
  // 사용자 설정 거리제한정보 저장
  const [ limitdistance , SetLimitDistance] = useState(0);
  // 최적경로자동생성 예상 도착점 좌표배열
  const [ targetpointarr, SetTargetPointArr ] = useState([])
  // Distance 설정 후 Nodeid를 못찾을때 표현하는 에러메세지 표현여부
  const [ iserrorfindnode, SetIsErrorFindNode ] = useState(false);
  const [ showErrorOccured , SetShowErrorOccured  ] = useState(false);

  // Map 초기화
  mapdispatch({type:"getmap"})
  

  // 시점,중간점, 종점을 마우스 클릭하여 경로를 생성하는 콜백함수
  const createRoutebyClick = ({slopeopt,checkbox})=>{

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

        distanceshort= 99999999999;

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
        coordarr[iter]=evt.coordinate;

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
        const coorddistanceobject = makingHttpRequestBody(slopeopt,totalpointcount,coordarr,distanceshort,excludeoption,username)

        // 로딩 표현
        setLoading(true)

        // excludeoption 초기화
        excludeoption=0

        // 경로 생성을 위한 API 호출 
        retrieveRouteStopOverApi(coorddistanceobject)
        .then((result)=>{
          console.log(result)
          if (result.data.length > 0){
            // Map상에 link 생성 후 link 정보 반환.
            setModalInfo(AddingJSONLayerToMap(result.data,firstlastpoints,mapstate,setShowGuide2,setLoading,setActive,setShowmodalOpen))
          }else{
            setModalInfo({totdistance:0,crosswalkcnt:0,bridgecnt:0,tunnelcnt:0,drinkcnt:0,toiletcnt:0,totkcal:0,avgslope:0,totruntime:0})
            setShowGuide2(true)
            setLoading(false)
            setActive(false)
            deleteAllLayer(mapstate)
          }
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


  // 최적경로생성에서 벡터 생성 후 다른 벡터 선택 시 콜백함수를 정의.
  // useRef에 콜백함수를 동기적으로 선언하여 
  // useEffect를 통해 이벤트 종료 시 활용.
  const clickHandlerRef = useRef(null);

  // 해당 함수는 sidebar_map_function.js의 createAndLoadRoute함수에 의해 작동.
  const reloadRouteByClick = (routecnt)=>{

    var clickHandler = (evt)=>getFeatureByClick(evt,routecnt)
    // 동기적으로 useRef에 함수를 선언.
    clickHandlerRef.current = clickHandler
    // 생성된 경로 클릭 시 작동 
    mapstate.on('singleclick',clickHandler)
  }

  const getFeatureByClick = (evt,routecnt)=>{
    // 클릭된 경로의 DB Table의 이름 설정.
    var clickedLinkName;
    mapstate.forEachFeatureAtPixel(evt.pixel,(feature,layer)=>{
      if(feature){
        clickedLinkName=feature.get('LinkTableId');
      }
    })
    // 생성된 경로 클릭 시
    if (clickedLinkName){
      // 경로 조회 후 생성 함수 실행
      retrieveClickedRoute(username,clickedLinkName,routecnt,mapstate,SetShowErrorOccured,SetAutoCreateOpt,setLoading,setModalInfo,setShowmodalOpen)
    }else{
      console.log("클릭된 벡터 없음")
    }
  }

  // 이벤트 종료용 useEffect
  useEffect(()=>{
    if ( (exploreopt !== 2 || autoCreateOpt!== 0 ) && mapstate && clickHandlerRef.current){
      mapstate.un('singleclick',clickHandlerRef.current)
    }
  },[exploreopt,autoCreateOpt,mapstate])
  

  // 산출된 시 , 분 , 초를 배열로 return. 
  const calhms = ()=>{
    let totruntime = modalinfo.totruntime
    let hour = Math.floor(totruntime/3600)
    let min = Math.floor(Math.round(totruntime/60) - Math.floor(totruntime/3600)*60)
    let sec = Math.floor(totruntime)-(Math.floor(Math.floor(totruntime/60) - Math.floor(totruntime/3600)*60))*60- Math.floor(totruntime/3600)*3600
    return [hour,min,sec]
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
            <p className="card-text" style={{margin:"2px"}}>총거리 : {Math.round(modalinfo.totdistance*10)/10}m</p>
            <p className="card-text" style={{margin:"2px"}}>소모 칼로리 : {Math.round(modalinfo.totkcal*10)/10} kcal</p>
            <p className="card-text" style={{margin:"2px"}}>평균 경사도 : {Math.round(modalinfo.avgslope*10)/10} %</p>
            <p className="card-text" style={{margin:"2px"}}>소요시간 : {calhms()[0]}시 {calhms()[1]}분 {calhms()[2]}초</p>
            <p className="card-text" style={{margin:"2px"}}>횡단보도 수 : {modalinfo.crosswalkcnt}</p>
            <p className="card-text" style={{margin:"2px"}}>육교, 다리 수 : {modalinfo.bridgecnt}</p>
            <p className="card-text" style={{margin:"2px"}}>인접화장실 수 : {modalinfo.toiletcnt}</p>
            <p className="card-text" style={{margin:"2px"}}>인접급수대 수 : {modalinfo.drinkcnt}</p>
          </div>
        </div>
      </PortalComponent>
      <aside className={`${isSidebarOpen? 'sidebar show-sidebar':'sidebar'}`}>
        {/* 사이드바 메뉴 */}
        <ul className="links" style={{marginTop:"5px"}}>
        <hr style={{width:"90%"}} />
        <div className="lead">
          안녕하세요. {username}님!
        </div>
        <hr style={{width:"90%"}} />
          <li>
          <Container>
            <Row>
              <Col xs={9} md={9} lg={9}>
                <div className="dropdown">
                  <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  옵션
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(1)}}>경로계획</button></li>
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(2)}}>경로탐색</button></li>
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(3)}}>위치검색</button></li>
                  </ul>
                </div>
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
          </li>
          <hr style={{width:"90%"}} />
          { exploreopt === 1 ? 
            <li>
            <h3>최적경로계획</h3>
            <hr style={{width:"50%"}} />
              {
                <Formik initialValues={{ slopeopt:1,checkbox :  []}}
                enableReinitialize={true}
                onSubmit={(value)=>{createRoutebyClick(value)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row>
                              <fieldset className="form-group">
                                <label htmlFor="slopeid" className="form-label">경사 필터</label>
                                <Field type="range" name="slopeopt" className="form-range" min="1" max="20" step="1" id="slopeid" style={{width:"90%"}}/>
                              </fieldset>
                            </Row>
                            <Row style={{marginRight:"7px"}}>
                              <Col xs={2} md={2} lg={2}>1%</Col>
                              <Col xs={2} md={2} lg={2}>5%</Col>
                              <Col xs={2} md={2} lg={2}>9%</Col>
                              <Col xs={2} md={2} lg={2}>13%</Col>
                              <Col xs={2} md={2} lg={2}>17%</Col>
                              <Col xs={2} md={2} lg={2}>20%</Col>
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
                              <Col xs={12} md={12} lg={12}>
                                { active ? 
                                <div className="alert alert-light" role="alert" style={{width:"90%",marginTop:10}}>
                                직선거리 : {drawdistance} m
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
            <h3>최적경로탐색</h3>
            <hr style={{width:"50%"}} />
              { autoCreateOpt === 0 ? 
                <button type="submit" className="btn btn-primary"
                onClick={()=>{SetAutoCreateOpt(1);setStartPoint(mapstate,SetShowErrorOccured,SetStartPointCoord,SetAutoCreateOpt,username)}}>
                  시작점 지정
                </button>
              : 
                <></>
              }
              { autoCreateOpt === 1 ? <p className="card-test"> 경로를 생성할 시작점을 클릭해주세요.</p> : <></>}
              { autoCreateOpt === 2 ? 
                <Formik initialValues={{ distance:0 }} enableReinitialize={true} onSubmit={(value)=>{setDistance(value,SetLimitDistance,startpointcoord,SetTargetPointArr,SetAutoCreateOpt,SetIsErrorFindNode,SetShowErrorOccured)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                            <Container>
                              <Row>
                                <fieldset className="form-group">
                                  <label className="form-label" style={{marginRight:"10px"}} htmlFor="distance">거리 :</label>
                                  <Field type="number" name="distance" id="distanceid" min="0" max="40000" style={{width:"150px"}} /><span> m</span>
                                  <div id="numberHelpBlock" className="form-text">
                                    [ 0 , 40000 ] 사이의 숫자를 입력해주세요.
                                  </div>
                                  { iserrorfindnode ? <p style={{marginTop:"5px",color:"red"}}>거리를 낮춰주세요.</p>:<></>}
                                </fieldset>
                              </Row>
                              <Row style={{marginTop:10}}>
                                <hr style={{width:"90%"}} />
                                <Col xs={6} md={6} lg={6}>
                                  <button type="submit" className="btn btn-primary" style={{marginTop:10}}>거리설정</button> 
                                </Col>
                              </Row>
                            </Container>
                      </Form>
                    )
                  }
              </Formik> : <></> }
              { autoCreateOpt===3 ? 
                <Formik initialValues={{ routecnt:1,weightslope:0,checkbox :[]}}
                enableReinitialize={true}
                onSubmit={(value)=>{createMultipleRoutes(value,SetAutoCreateOpt,setLoading,targetpointarr,limitdistance,startpointcoord,SetShowErrorOccured,mapstate,setModalInfo,setShowmodalOpen,reloadRouteByClick)}}>
                  {
                    (props)=>(
                      <Form className="container-fluid">
                          <Container>
                            <Row style={{marginTop:10}}> 
                              <fieldset className="form-group">
                                <label className="form-label" style={{marginRight:"10px"}} htmlFor="routecntid">생성할 경로 수 : </label>
                                <Field type="number" name="routecnt" id="routecntid" min="1" max="5" style={{width:"60px"}}/>
                                <div id="numberHelpBlock" className="form-text">
                                  1~5 사이의 숫자를 입력해주세요.
                                </div>
                              </fieldset>
                            </Row>
                            <Row style={{marginTop:10}}>
                              <hr style={{width:"90%"}} />
                              <fieldset className="form-group">
                                <label htmlFor="weightslopeid" className="form-label">경사도 가중치</label>
                                <Field type="range" name="weightslope" className="form-range" min="0" max="100" step="20" id="weightslopeid" style={{width:"90%"}}/>
                              </fieldset>
                            </Row>
                            <Row style={{marginTop:5}}>
                              <hr style={{width:"90%"}} />
                              <fieldset className="form-group">
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
                              <Col xs={6} md={6} lg={6}>
                                <button type="submit" className="btn btn-primary" style={{marginTop:10}}>경로생성</button> 
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
              : <></> }
              { autoCreateOpt===4 ? <div style={{marginBottom:"20px"}}>경로 생성중...
              { showErrorOccured ? <div>일부 경로 생성에 문제가 발생했습니다.</div> : <div></div> }
              <hr style={{width:"90%"}} />
              </div> : <></> }
          </li>
          : <div/>}
          { exploreopt === 3 ?
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

