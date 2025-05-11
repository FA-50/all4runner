import axios from 'axios'

export const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 30000
  })

export const JWTAuthenticationApi = (basic64header)=>apiClient.post('/authenticate',{},{headers :{Authorization:basic64header}})

// 경유지포함 좌표를 기반으로 최단경로 도출
export const retrieveRouteStopOverApi = (httprequestobject)=> apiClient.post(`/retrieveRouteStopOverApi`,httprequestobject)

// 시작점 좌표, 거리를 입력받아 예상 도착점 nodeid return.
export const retrievePointByDistanceApi = (httprequestobject)=>
  apiClient.post('/getnodeid',httprequestobject)

// 최적 복수 경로 생성 전 DB Table 초기화.
export const initDBRouteTableApi = ()=> apiClient.delete('/initDBroute')

// 시작점좌표와 목표노드 id 및 옵션을 전달받아 경로 생성
export const createRouteApi = (httprequestobject)=> apiClient.post('/createRoute' , httprequestobject)

// 경로 생성 후 경로 조회 시 사용
export const retrieveRouteApi = (httprequestobject)=> apiClient.post('/retrieveRoute',httprequestobject)

// 경로 생성 후 클릭을 통해 경로 조회 시 사용
export const retrieveRouteByClick = (httprequestobject)=> apiClient.post('/retrieveRouteByClick',httprequestobject)

export const createAccountApi = (httprequestobject)=>apiClient.post('/createAccount',httprequestobject)
