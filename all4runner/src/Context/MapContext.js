import React ,{useContext} from 'react'
export const MapContext = React.createContext({});
export const useMapContext = ()=>{
  return useContext(MapContext)
}