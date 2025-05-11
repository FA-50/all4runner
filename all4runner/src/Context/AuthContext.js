import { createContext, useState , useContext} from 'react'
import { JWTAuthenticationApi } from '../axios/ApiOpenlayers';
import { apiClient } from '../axios/ApiOpenlayers';

// Global State로서 작용
export const AuthContext = createContext();

// 자식 Component Side에서 바로 사용할 수 있게끔 설정.
export const ExportContext = () => useContext(AuthContext)

const AuthProvider = ({ children })=>{
  const [ AuthState , setAuthState ] = useState(false);
  // 계정명을 저장할 State
  const [username,setUsername] = useState(null)
  const [token, setToken] = useState(null)

  async function logIn(username, password){
      try {
        // Base64로 인코딩된 ID와 PW 생성
        // Basic Base64코드 로 전달.
      const basic64 = 'Basic ' + window.btoa(username + ':' + password)
      const response = await JWTAuthenticationApi(basic64)

      if (response.status === 200){
        // "Bearer JWT토큰코드" JWT Token변수 설정.
        const jwtToken = 'Bearer ' + response.data.token;
        setAuthState(true)
        setToken(jwtToken)
        setUsername(username)
        // axios instance를 통해 API 호출 시 Intercepting하여 Authentication Header를 JWT Token으로 설정.
        apiClient.interceptors.request.use((config)=>{
          console.log('intercepting and adding a token')
          config.headers.Authorization=jwtToken
          return config
        })
        return true
      } else {
        // 로그인 실패 시
        Logoutfunction()
        return false
      }
    } catch {
      Logoutfunction()
      return false
    }
  }
    // 로그아웃 시
    const Logoutfunction = ()=>{
      setAuthState(false);
      setToken(null);
      setUsername(null);
    }

    return(
      // username State를 추가로 Context객체로서 다른 Component로 전달.
      <AuthContext.Provider value={{AuthState,logIn,Logoutfunction,username,token}}>
        {children}
      </AuthContext.Provider>
    )
}



export default AuthProvider;