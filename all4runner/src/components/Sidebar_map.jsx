import React, { useState,useEffect,useRef} from 'react'
import { FaTimes } from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'
import { Container, Row , Col } from 'react-bootstrap'
import {Formik , Field , Form } from "formik"
import {retrieveRouteStopOverApi,saveRouteApi,retrieveRouteinfoApi,retrieveRouteDataByRouteIdApi} from '../axios/ApiOpenlayers'
import {useMapContext} from '../Context/MapContext'
import { LineString } from 'ol/geom'
import { Draw } from 'ol/interaction'
import { getLength } from 'ol/sphere';
import { transform  } from 'ol/proj'
import { excludeOpt,AddingJSONLayerToMap,createPoint, deleteAllLayer,drawing, makingHttpRequestBody,setStartPoint,setDistance, createMultipleRoutes,retrieveClickedRoute} from '../js/sidebar_map_function'

import $ from 'jquery'

import PortalComponent  from '../components/PortalComponent'
import { useParams } from 'react-router-dom';
import { TiHeadphones } from 'react-icons/ti'

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

  // 경로자동생성일때만 true
  const [ isAuto , setIsAuto ] = useState(false);

  // 경로 생성 몇개 할건지 지정.
  const [ routecnt , SetRouteCnt] = useState(0)
  // 경로 생성 시 몇개가 생성되었는지 count
  const [ createdroutecnt , setCreatedRouteCnt ] = useState(0)
  // 경로생성 버튼 누를 경우 작동상태 표시여부
  const [ active , setActive ] = useState(false)
  // Draw 거리 정보
  const [ drawdistance , setDrawdistance ] = useState(0)
  // 생성된 link 정보를 지시하는 Modal 창 표시여부
  const [ isShowmodalOpen , setShowmodalOpen ]=useState(false)
  

  // Modal에 지시할 정보의 초기값 정의
  const [modalinfo,setModalInfo] = useState({totdistance:0,crosswalkcnt:0,bridgecnt:0,tunnelcnt:0,drinkcnt:0,toiletcnt:0,totkcal:0,avgslope:0,totruntime:0,linktablenm:""});


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
    
    setIsAuto(false)
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

        // 정보지시 모달창 초기화
        setIsCreatedRoute(true)
        SetShowStoreComplete(false)


        // 포인트 총 갯수
        var totalpointcount = coordarr.length;
      

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
          if (result.data.length > 0){
            // Map상에 link 생성 후 link 정보 반환.
            setModalInfo(AddingJSONLayerToMap(result.data,mapstate,setShowGuide2,setLoading,setActive,setShowmodalOpen))
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



// 검색 시 page 번호
const [ pagenum , setPageNum ]= useState(1); 

// 검색결과 표시
const [ showSearchResult,setShowSearchResult] = useState(false);

// ajax 실행 후 검색결과 저장장
const [ storedResult, setStoredResult ] = useState([])

  // Vworld 검색엔진을 사용하여 검색
const searchByVworld = ({searchvalue}) =>{

  setStoredResult([]);
  setShowSearchResult(false);

  var keyword = searchvalue;
  var params = {
    service : "search",
    request : "search",
    version : "2.0",
    crs : "EPSG:4326",
    // 4326 기준 서울시 범위
    bbox : "126.7644,37.4133,127.1831,37.7151",
    size : 5 , 
    page : pagenum,
    query : keyword,
    type : 'PLACE',
    format : 'json',
    errorformat : "json",
    key : "97CA68E3-121B-39B9-AD1B-2D0C8E54E461"
  }

  $.ajax({
    type: 'GET',
    url : "http://api.vworld.kr/req/search",
    dataType : 'JSONP',
    data : params ,
    success : (data)=>{
      showResults(data.response)
    },
    error : (jqXHR, textStatus, errorThrown)=>{
      console.error("요청 실패:", textStatus, errorThrown);
      alert("데이터를 불러오지 못했습니다. 다시 시도해주세요.");
    }
  })
}

// Ajax 실행 후 결과를 State에 저장
const showResults = (response)=>{
  if ( response.status === "OK" ){
    setStoredResult(response.result.items);
    setShowSearchResult(true)
  }else{
    console.log("조회 실패.")
    setShowSearchResult(false)
  }
}

// 경로 저장 완료 시 지시
const [showStoreComplete,SetShowStoreComplete]= useState(false)

// 현재 표현된 경로를 저장
const saveRoute = () =>{

  saveRouteApi(username,modalinfo.linktablenm)
  .then((result)=>{
    console.log(result.data)
    SetShowStoreComplete(true)
  })
  .catch((error)=>{
    console.log("저장실패")
    SetShowStoreComplete(false)
  })
  .finally(
  )

}

// DB에서 로그인된 계정에 할당된 routeid를 가져와서 저장.
const [ storedRouteid, setStoredRouteid ] = useState([])

// 경로를 생성하는 경우 modal창에 경로저장버튼을 지시하고,
// 경로를 조회하는경우 경로저장버튼 숨기기기
const [ isCreatedRoute , setIsCreatedRoute ] = useState(true) 

// 각 계정에 저장된 경로정보를 조회
const retrieveStoredRoute = ()=>{
  retrieveRouteinfoApi(username)
  .then((result)=>{
    setStoredRouteid(result.data)
  })
  .catch((error)=>{
    console.log(error)
  })
  .finally(
  )
}

// 경로정보 클릭 시 경로 불러오기
const retrieveRouteByRouteId = (routeid)=>{
  
  retrieveRouteDataByRouteIdApi(routeid)
  .then((result)=>{
    console.log(result.data)
    if (result.data.length > 0){
      // Map상에 link 생성 후 link 정보 반환.
      setModalInfo(AddingJSONLayerToMap(result.data,mapstate,setShowGuide2,setLoading,setActive,setShowmodalOpen))
      setIsCreatedRoute(false)
    }else{
      setModalInfo({totdistance:0,crosswalkcnt:0,bridgecnt:0,tunnelcnt:0,drinkcnt:0,toiletcnt:0,totkcal:0,avgslope:0,totruntime:0})
      setShowmodalOpen(false)
      setIsCreatedRoute(false)
      deleteAllLayer(mapstate)
    }
  })
  .catch((error)=>{
    // 오류발생시 안내문 표시
    console.log(error)
    deleteAllLayer(mapstate)
  })
  .finally(console.log("실행끝"))
}


  return (
    <>
    {/* ReactDOM.createPortal을 이용해 경로정보표현 */ }
      <PortalComponent>
        <div className={`${isShowmodalOpen ?"card border-dark mb-3 attributemodal":"" }`} style={{position: 'fixed', zIndex: 1000,width:"30vh"}}>
            <Container className="card-header">
              <Row>
                <Col xs={10} md={10} lg={10}>경로 정보</Col>
                <Col xs={2} md={2} lg={2}><button className="closemodal" onClick={()=>{setShowmodalOpen(false)}}><FaTimes/></button></Col>
              </Row>
            </Container>
            <Container className="card-body">
              <p className="card-text" style={{margin:"2px"}}>총거리 : {Math.round(modalinfo.totdistance*10)/10}m</p>
              <p className="card-text" style={{margin:"2px"}}>소모 칼로리 : {Math.round(modalinfo.totkcal*10)/10} kcal</p>
              <p className="card-text" style={{margin:"2px"}}>평균 경사도 : {Math.round(modalinfo.avgslope*10)/10} %</p>
              <p className="card-text" style={{margin:"2px"}}>소요시간 : {calhms()[0]}시 {calhms()[1]}분 {calhms()[2]}초</p>
              <Row>
                <Col xs={1} md={1} lg={1}>
                  <img src={"../img/red.png"} width="10" height="auto" alt="red"/>
                </Col>
                <Col>
                  <p className="card-text" style={{margin:"2px"}}>횡단보도 수 : {modalinfo.crosswalkcnt}</p>
                </Col>
              </Row>
              <Row>
                <Col xs={1} md={1} lg={1}>
                  <img src={"../img/orange.png"} width="10" height="auto" alt="red"/>
                </Col>
                <Col>
                  <p className="card-text" style={{margin:"2px"}}>육교, 다리 수 : {modalinfo.bridgecnt}</p>
                </Col>
              </Row>
              <Row>
                <Col xs={1} md={1} lg={1}>
                  <img src={"../img/green.png"} width="10" height="auto" alt="red"/>
                </Col>
                <Col>
                  <p className="card-text" style={{margin:"2px"}}>인접화장실 수 : {modalinfo.toiletcnt}</p>
                </Col>
              </Row>
              <Row>
                <Col xs={1} md={1} lg={1}>
                  <img src={"../img/blue.png"} width="10" height="auto" alt="red"/>
                </Col>
                <Col>
                  <p className="card-text" style={{margin:"2px"}}>인접급수대 수 : {modalinfo.drinkcnt}</p>
                </Col>
              </Row>
              <Row>
                {/* 경로를 새로 생성한 경우에만 경로저장버튼 활성화 */}
                {isCreatedRoute? 
                  <button className="btn btn-primary" style={{marginTop:"20px" ,width:"150px"}}
                onClick={()=>{saveRoute()}}>
                  경로 저장
                </button>
                : <></>}
                {/* 저장완료 지시 */}
                {showStoreComplete ? <p className="card-text" style={{marginTop:"20px" }}>저장완료</p> : <></>}
              </Row>
            </Container>
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
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(1)}}>경로생성</button></li>
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(2)}}>경로탐색</button></li>
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(3)}}>저장경로조회</button></li>
                    <li><button className="dropdown-item" onClick={()=>{setExploreOption(4)}}>위치검색</button></li>
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
            <h3>경로생성</h3>
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
            <h3>경로자동탐색</h3>
            <hr style={{width:"50%"}} />
              { autoCreateOpt === 0 ? 
                <button type="submit" className="btn btn-primary"
                onClick={()=>{setIsAuto(true);SetAutoCreateOpt(1);setStartPoint(mapstate,SetShowErrorOccured,SetStartPointCoord,SetAutoCreateOpt,username,SetShowStoreComplete,setIsCreatedRoute)}}>
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
                <Formik initialValues={{ routecnt:1,slopeopt:1,checkbox :[]}}
                enableReinitialize={true}
                onSubmit={(value)=>{
                  SetRouteCnt(value.routecnt)
                  ;createMultipleRoutes(value,SetAutoCreateOpt,setLoading,targetpointarr,limitdistance,startpointcoord,SetShowErrorOccured,mapstate,setModalInfo,setShowmodalOpen,reloadRouteByClick,username,setCreatedRouteCnt)}}>
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

          {/* 저장된 경로 조회하기 */}
          { exploreopt === 3 ? 
          <Formik
            initialValues={{searchvalue:""}}
            enableReinitialize={true}
          >
            {
              (props)=>(
                <Form className="d-flex" role="search" style={{width:"40vh"}}>
                        <Container>
                          <Row>
                            <Col xs={8} md={8} lg={8}>
                              <h3>저장경로조회</h3>
                            </Col>
                            <Col xs={4} md={4} lg={4}>
                            <button className="btn btn-primary" style={{}} type="button"
                onClick={()=>retrieveStoredRoute()}>
                  조회
                </button>
                            </Col>
                          </Row>
                          <hr style={{width:"50%", marginTop:"3px"}} />
                          <Row>
                            <div className="list-group">
                              {storedRouteid.map((item,i)=>{
                              return (<button key={i} type="button" className="list-group-item list-group-item-action" onClick={()=>{retrieveRouteByRouteId(item)}}>
                                <div className="ms-2 me-auto">
                                  <div className="fw-bold">경로ID : {item}</div>
                                </div>
                              </button>)
                            })}
                            </div>
                          </Row>
                        <hr style={{width:"100%"}} />
                        </Container>       
                </Form>
              )
            }
          </Formik> : <></>}
          {/* 검색의 경우 */}
          { exploreopt === 4 ?
          <Formik
            initialValues={{searchvalue:""}}
            enableReinitialize={true}
            onSubmit={(value)=>{searchByVworld(value,mapstate,pagenum , setPageNum)}}>
                  {
                    (props)=>(
                      <Form className="d-flex" role="search" style={{width:"40vh"}}>
                        <Container>
                          <Row>
                            <h3>장소검색</h3>
                            <hr style={{width:"50%", marginTop:"3px"}} />
                          </Row>
                          <Row>
                            <Col xs={8} md={8} lg={8}>
                              <Field className="form-control me-2" type="search" name="searchvalue" placeholder="Search" aria-label="Search" style={{marginTop:"8px"}}/>
                            </Col>
                            <Col xs={4} md={4} lg={4}>
                              <button className="btn btn-outline-success" type="submit">Search</button>
                            </Col>
                          </Row>
                          <Row>
                            <Col xs={6} md={6} lg={6}>
                              <button className="btn btn-primary" onClick={()=>deleteAllLayer(mapstate)} type="button" style={{marginTop:10}}>아이콘 삭제</button>
                            </Col>
                          </Row>
                        <hr style={{width:"100%"}} />
                          {/* 검색결과 */}
                          <div className="list-group" >
                            {showSearchResult? 

                              storedResult.map((item,i)=>{
                                let coordarr = [item.point.x,item.point.y]
                                return (<button key={i} type="button" className="list-group-item list-group-item-action" onClick={()=>createPoint(coordarr,4,mapstate)}>
                                  <div className="ms-2 me-auto">
                                    <div className="fw-bold">{item.title}</div>
                                    {item.address.road}
                                  </div>
                                </button>)
                              })

                            :
                            
                            <button type="button" className="list-group-item list-group-item-action">
                                  <div className="ms-2 me-auto">
                                    <div className="fw-bold">검색결과 없음</div>
                                  </div>
                                </button>
                            
                            }
                          </div>
                        <hr style={{width:"100%"}} />
                        </Container>       
                      </Form>
                    )
                  }
          </Formik>
          : <div/>}
          <li>
            { loading ?
            <div>
              <Container>
                <Row>
                  { isAuto? 
                    <Col xs={3} md={3} lg={3} className="lead">
                      {createdroutecnt} / {routecnt} 
                    </Col>
                  : <></> }
                  <Col xs={3} md={3} lg={3}>
                    <div className="spinner-border" role="status" style={{marginLeft:30}}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </Col>
                </Row>
              </Container>
            </div> : <div/>
            }
          </li>
        </ul>
      </aside>
    </>
  )
}
export default SidebarMap;

