import SidebarMap from './Sidebar_map'
import {FaBars} from 'react-icons/fa'
import { useGlobalContext } from '../Context/SidebarContext'

const ModifyingMapComponent = ()=>{
  const {openSidebar} = useGlobalContext()
  return(
    <>
      <SidebarMap/>
      <button className='sidebar-toggle'
              onClick={openSidebar}>
                <FaBars />
      </button>
      <div id="map" className="map"/>
    </>
  )
}
export default ModifyingMapComponent