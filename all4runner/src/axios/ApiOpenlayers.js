import axios from 'axios'
const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 30000
  })


// 경유지포함 좌표를 기반으로 최단경로 도출
export const retrieveRouteStopOverApi = (httprequestobject)=> apiClient.post(`/sql1`,httprequestobject)

// 시작점 좌표, 거리를 입력받아 예상 도착점 nodeid return.
export const retrievePointByDistanceApi = (httprequestobject)=>
  apiClient.post('/getnodeid',httprequestobject)

// 시작점좌표와 목표노드 id 및 옵션을 전달받아 경로 생성
export const retrieveRouteApi = (httprequestobject)=> apiClient.post('/createRoute' , httprequestobject)



// 화장실 벡터 데이터를 도출하는 axios api
export const retrieveToiletApi = ()=>{
  apiClient.get('')
}