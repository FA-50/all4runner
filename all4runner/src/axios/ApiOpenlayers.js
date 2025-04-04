import axios from 'axios'
const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 5000
  })

// 좌표기반으로 최단경로를 도출하는 axios api
export const retrieveRouteApi = (coorddistanceobject)=>apiClient.post(`/sql3`,coorddistanceobject)

// 화장실 벡터 데이터를 도출하는 axios api
export const retrieveToiletApi = ()=>{
  apiClient.get('')
}