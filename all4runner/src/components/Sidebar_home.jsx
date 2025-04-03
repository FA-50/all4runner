import React from 'react'
import logo from '../img/all4runner_1.svg'
import { FaTimes } from 'react-icons/fa'
import { social, links } from '../data/data_home'
import { useGlobalContext } from '../Context/SidebarContext'
const SidebarHome = () => {
  const { isSidebarOpen , closeSidebar } = useGlobalContext()
  return (
    <aside className={`${isSidebarOpen? 'sidebar show-sidebar':'sidebar'}`}>
      <div className="sidebar-header">
      <img src={logo} width="300" height="auto" alt="error from img" />
      <button className="close-btn" onClick={closeSidebar}>
        < FaTimes />
      </button>
      </div>
      {/* 사이드바 메뉴 */}
      <ul className="links">
        {
          links.map((link)=>{
            // data의 links로부터 전달된 link를 구조분해
            const {id, url, text, icon}=link
            return(
              <li key={id}>
                <a href={url}>
                  {icon}
                  {text}
                </a>
              </li>
            )
          })
        }
      </ul>
      {/* social 아이콘 */}
      <ul className='social-icons'>
        {social.map((link) => {
          const {id, url, icon} = link
          return (
            <li key={id}>
              <a href={url}>{icon}</a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
export default SidebarHome;