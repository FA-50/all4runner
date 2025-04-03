import {Routes,Route, BrowserRouter} from 'react-router-dom';
// import MapComponent from './MapComponent';
import Home from './Home'
import AppContext from '../Context/SidebarContext'
import Modal from './Modal';
import SidebarHome from './Sidebar_home';
import Footer from './Footer';
import ModifyingMapComponent from './ModifyingMapComponent'
import MapComponent from './MapComponent'

export default function Container(){
  
  return(
    <div className="container-fluid">
      <AppContext>
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<div><Home/><SidebarHome/><Modal/></div>}/>
            <Route path="/map" element={<MapComponent><ModifyingMapComponent/></MapComponent>}/>
        </Routes>
        <Footer/>
        </BrowserRouter>
      </AppContext>
    </div>
  );
};

