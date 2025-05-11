import {Routes,Route, BrowserRouter, Navigate} from 'react-router-dom';
// import MapComponent from './MapComponent';
import Home from './Home'
import AppContext from '../Context/SidebarContext'
import AuthProvider from '../Context/AuthContext'
import Footer from './Footer';
import ModifyingMapComponent from './ModifyingMapComponent'
import MapComponent from './MapComponent'
import { ExportContext } from '../Context/AuthContext';

// 자식Component를 매개변수로 가져오는 Component
// Global State에 의해 로그인 상태인 경우 자식 Component를 그대로 전달하고 로그아웃 상태인 경우 LoginComponent로 routing.
const AuthenticatedRoute = ({children})=>{
  const AuthContext = ExportContext()
  if (AuthContext.AuthState){
    return (children)
  }else{
    return ( <Navigate to="/"/>)
  }
}

export default function Container(){
  
  return(
    <div className="container-fluid">
      <AppContext>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
              {/* <Route>의 element 속성의 Component를 AuthenticatedRoute Component wrapping하여 자식 Component로 설정. */}
              <Route path="/map/:username" element={
                <AuthenticatedRoute>
                  <MapComponent>
                    <ModifyingMapComponent/>
                  </MapComponent>
                </AuthenticatedRoute>}/>
              <Route path="/*" element={<Home/>}/>
          </Routes>
          <Footer/>
          </BrowserRouter>
        </AuthProvider>
      </AppContext>
    </div>
  );
};

