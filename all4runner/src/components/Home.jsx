import React from 'react'
import {FaBars} from 'react-icons/fa'
import {useGlobalContext} from '../Context/SidebarContext'
import '../css/sidebar.css'

const Home = () =>{
  // 구조분해로 받기
  const {openSidebar, openModal}=useGlobalContext()
  return(
    <main>
      <button className='sidebar-toggle'
      onClick={openSidebar}>
        <FaBars />
      </button>
      <div className="jumbotron">
        <h1 className="display-4">All 4 Runner</h1>
        <p className="lead">This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.</p>
        <hr className="my-4"/>
        <p>It uses utility classes for typography and spacing to space content out within the larger container.</p>
        <p className="lead">
          <a class="btn btn-primary btn-lg" onClick={openModal} role="button">Learn more</a>
        </p>
      </div>
    </main>
  )
}
export default Home;