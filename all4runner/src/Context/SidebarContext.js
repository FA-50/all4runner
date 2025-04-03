import React , { useState , useContext } from 'react'

// Context 생성
export const AppContext = React.createContext()

// 다른 component에서 매번 useContext(AppContext)를
// 사용하지 않도록록
// 기존 생성된 Context 객체를 전달하여 useContext()를 통해 Global State를 포함하는 Context를 생성하여 export
export const useGlobalContext = ()=>{
  return useContext(AppContext)
}

export default function AppProvider({children}){
  const[isSidebarOpen, setIsSidebarOpen]=useState(false)
  const [isModalOpen, setIsModalOpen]= useState(false)
  const openSidebar = ()=>{
    setIsSidebarOpen(true)
  }
  const closeSidebar=()=>{
    setIsSidebarOpen(false)
  }
  const openModal =()=>{
    setIsModalOpen(true)
  }
  const closeModal =()=>{
    setIsModalOpen(false)
  }
  // State와 State변경함수를 조작하는 함수를를 Context로서 export.
  return (<AppContext.Provider value={{isModalOpen,
    isSidebarOpen,
    openModal,
    openSidebar,
    closeModal,
    closeSidebar}}>
{ children }
  </AppContext.Provider>)
}

