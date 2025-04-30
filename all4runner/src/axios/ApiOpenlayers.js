import axios from 'axios'
const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 30000
  })


// 경유지포함 좌표를 기반으로 최단경로 도출
export const retrieveRouteApiStopOver = (coorddistanceobject)=> apiClient.post(`/sql1`,coorddistanceobject)


// 화장실 벡터 데이터를 도출하는 axios api
export const retrieveToiletApi = ()=>{
  apiClient.get('')
}