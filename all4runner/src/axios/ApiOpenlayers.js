import axios from 'axios'
const apiClient = axios.create(
  {
    baseURL : "http://localhost:7070",
    timeout : 5000
  })
export const retrieveRouteApi1 = (fnode,tnode,distance)=>apiClient.get(`/sql1/${fnode}/${tnode}/${distance}`)

export const retrieveRouteApi2 = (coorddistanceobject)=>apiClient.post(`/sql2`,coorddistanceobject)