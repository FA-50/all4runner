import axios from 'axios'

export const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 30000
  })

  // base64 방식으로 ID와 PW를 전달하여 검증 후 생성된 JWT Token을 return.
export const JWTAuthenticationApi = (basic64header)=>apiClient.post('/authenticate',{},{headers :{Authorization:basic64header}})

// 경유지포함 좌표를 기반으로 최단경로 도출
export const retrieveRouteStopOverApi = (httprequestobject)=> apiClient.post(`/retrieveRouteStopOverApi`,httprequestobject)

// 시작점 좌표, 거리를 입력받아 예상 도착점 nodeid return.
export const retrievePointByDistanceApi = (httprequestobject)=>
  apiClient.post('/getnodeid',httprequestobject)

// 최적 복수 경로 생성 전 DB Table 초기화.
export const initDBRouteTableApi = (username)=> apiClient.delete(`/initDBroute/${username}`)

// 시작점좌표와 목표노드 id 및 옵션을 전달받아 경로 생성
export const createRouteApi = (httprequestobject)=> apiClient.post('/createRoute' , httprequestobject)

// 경로 생성 후 경로 조회 시 사용
export const retrieveRouteApi = (httprequestobject)=> apiClient.post('/retrieveRoute',httprequestobject)

// 경로 생성 후 클릭을 통해 경로 조회 시 사용
export const retrieveRouteByClick = (httprequestobject)=> apiClient.post('/retrieveRouteByClick',httprequestobject)

export const createAccountApi = (httprequestobject)=>apiClient.post('/createAccount',httprequestobject)

// 경로 저장을 위해 로그인한 계정명과 현재 테이블명을 전송하는 API
export const saveRouteApi = (username,linktablenm)=>apiClient.post(`/saveRoute/${username}/${linktablenm}`)

// 각 계정 저장된 경로정보를 조회하기위해 전송하는 API
export const retrieveRouteinfoApi = (username)=>apiClient.get(`/retrieveRouteinfo/${username}`)

// 경로id를 이용해 경로 데이터를 가져오는 API
export const retrieveRouteDataByRouteIdApi = (routeid)=>apiClient.get(`/retrieveRouteDataByRoute/${routeid}`)