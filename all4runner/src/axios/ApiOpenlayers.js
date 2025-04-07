import axios from 'axios'
const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 30000
  })

// 좌표기반으로 최단경로를 도출하는 axios api
export const retrieveRouteApi = (coorddistanceobject)=>apiClient.post(`/sql3`,coorddistanceobject)

// 경유지 최단경로
export const retrieveRouteApiStopOver = (coorddistanceobject)=>apiClient.post(`/sql4`,coorddistanceobject)

// 화장실 벡터 데이터를 도출하는 axios api
export const retrieveToiletApi = ()=>{
  apiClient.get('')
}