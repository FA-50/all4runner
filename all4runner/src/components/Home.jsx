import React, { useState } from 'react'
import { Container, Row , Col } from 'react-bootstrap'
import { Formik , Field , Form, ErrorMessage } from "formik"
import '../css/sidebar.css'
import { createAccountApi } from '../axios/ApiOpenlayers'
import { ExportContext } from '../Context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { social } from '../data/data_home'


const Home = () =>{
  // 로그인 성공여부
  const [ showLoginSuccess, setShowLoginSuccess] = useState(true);
  // 회원가입 성공여부
  const [ showSignUpSuccess, setshowSignUpSuccess] = useState(false);
  const [ showSignUpFail , setshowSignUpFail] = useState(false);

  const AuthContext = ExportContext();

  const navigate = useNavigate()

  // 로그인 입력필드 Error 발생 시 <ErrorMessage>에 표현될 Error Message를 표현하는 함수
  const validateSignInForm = (value)=>{
    // 입력필드name : "error message"를 담을 빈 배열.
    let errors = {}
    // Validation Logic 정의
    if (value.userid1.length<1){
      errors.userid1 = "ID를 입력해주세요."
    }
    if (value.userpw1.length<1){
      errors.userpw1 = "PW를 입력해주세요."
    }
    return errors;
  }

  const validateSignUpForm = (value)=>{
    // 입력필드name : "error message"를 담을 빈 배열.
    let errors = {}
    // Validation Logic 정의
    if (value.userid2.length<1){
      errors.userid2 = "ID를 입력해주세요."
    }
    if (value.userpw2.length<1){
      errors.userpw2 = "PW를 입력해주세요."
    }
    return errors;
  }

  // 계정생성
  const createAccount=({userid2,userpw2,avgspeed,userweight})=>{
    const HttpRequestBody={
      username:userid2,
      password:userpw2,
      avgspeed:avgspeed,
      userweight:userweight
    }
    createAccountApi(HttpRequestBody)
    .then((result)=>{
      console.log(result)
      setshowSignUpSuccess(true)
      setshowSignUpFail(false)
    })
    .catch((error)=>{
      console.log(error);
      setshowSignUpFail(true)
      setshowSignUpSuccess(false)
    })
    .finally(console.log("계정작업끝"))
  }

  async function logInStatus({userid1,userpw1}){
    if (await AuthContext.logIn(userid1,userpw1))
    {
      setShowLoginSuccess(true)
      navigate(`/map/${userid1}`)
    }else{
      setShowLoginSuccess(false)
      setshowSignUpSuccess(false)
    }
  }

  return(
    <main style={{backgroundColor: "#e9ecef"}}>
      <div className="jumbotron">
        {/* social 아이콘 */}
        <ul className='social-icons' style={{marginLeft:"-40px"}}>
                  {social.map((link) => {
                    const {id, url, icon} = link
                    return (
                      <li key={id}>
                        <a href={url}>{icon}</a>
                      </li>
                    )
                  })}
                </ul>
        <h1 className="display-4">All 4 Runner</h1>
        <p className="lead">서울시내 최적 러닝코스를 추천하는 웹 기반 지도어플리케이션.
        </p>
        <hr className="my-4"/>
        <div className="container" style={{backgroundColor:"#FFFFFF", padding:"10px" , border: "2px solid black", borderRadius:"2px" }}>
          <Container className="card-header" >
            <Row>
              <Col xs={6} md={6} lg={6} style={{borderRight:"1px solid black"}}>
                <Formik
                initialValues={{userid1:"",userpw1:""}}
                  enableReinitialize={true}
                  onSubmit={(value)=>{logInStatus(value)}}
                  validate = {validateSignInForm}
                  validateOnChange={false}>
                  {(props)=>(
                    <Form className="container-fluid">
                      <div className="lead" style={{marginTop:"10px",marginBottom:"10px"}}>Sign-In</div> 
                      <Row className="mb-3 row">
                          <Col xs={0} md={2} lg={2}>
                            <label htmlFor="userid1" className="lead">
                                ID 
                              </label>
                          </Col>
                          <Col xs={10} md={10} lg={10}>
                            <Field type="text" name="userid1" className="form-control" id="userid1"/>
                          </Col>
                      </Row>
                      <Row className="mb-3 row">
                      <Col xs={0} md={2} lg={2}>
                        <label htmlFor="userpw1" className="lead">
                              PW
                        </label>
                      </Col>
                      <Col xs={10} md={10} lg={10}>
                        <Field type="password" name="userpw1" className="form-control" id="userpw1"/>
                      </Col>
                      </Row>
                      <Row>
                        <Col xs={6} md={6} lg={6}>
                          <button type="submit" className="btn btn-primary">로그인</button> 
                        </Col>
                      </Row>
                      {!showLoginSuccess && <div className="lead">로그인 실패</div>}
                      <ErrorMessage
                      name = "userid1"
                      component = "div"
                      className = "alert alert-warning"/>
                      <ErrorMessage
                      name = "userpw1"
                      component = "div"
                      className = "alert alert-warning"/>
                    </Form>
                  )}
                </Formik>
              </Col>
              <Col xs={6} md={6} lg={6}>
                <Formik
                  initialValues={{avgspeed:1,userid2:"",userpw2:"",userweight:1}}
                  enableReinitialize={true}
                  onSubmit={(value)=>{createAccount(value)}}
                  validate = {validateSignUpForm}
                  validateOnChange={false}>
                    {(props)=>(
                      <Form className="container-fluid">
                        <div className="lead" style={{marginTop:"10px",marginBottom:"10px"}}>Sign-Up</div>
                        <Row className="mb-3 row">
                          <Col xs={0} md={2} lg={2}>
                            <label htmlFor="userid2" className="lead">
                                ID 
                              </label>
                          </Col>
                          <Col xs={10} md={10} lg={10}>
                            <Field type="text" name="userid2" className="form-control" id="userid2"/>
                          </Col>
                        </Row>
                        <Row className="mb-3 row">
                          <Col xs={0} md={2} lg={2}>
                            <label htmlFor="userpw2" className="lead">
                                  PW
                            </label>
                          </Col>
                          <Col xs={10} md={10} lg={10}>
                            <Field type="password" name="userpw2" className="form-control" id="userpw2"/>
                          </Col>
                        </Row>
                        <Row className="mb-3 row">
                          <Col xs={4} md={4} lg={4}>
                            <label htmlFor="avgspeed" className="lead">
                                러닝속도(km/h)
                              </label>
                          </Col>
                          <Col xs={2} md={2} lg={2}>
                            <Field type="number" min="1" max="20" name="avgspeed" className="form-control" id="avgspeed"/>
                          </Col>
                          <Col xs={3} md={3} lg={3}>
                            <label htmlFor="userweight" className="lead">
                                체중(kg)
                              </label>
                          </Col>
                          <Col xs={2} md={2} lg={2}>
                            <Field type="number" min="1" max="200"  name="userweight" className="form-control" id="userweight"/>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={6} md={6} lg={6}>
                          <button type="submit" className="btn btn-primary">회원가입</button> 
                          </Col>
                        </Row>
                        {showSignUpSuccess && <div className="lead">회원가입 성공</div>}
                        {showSignUpFail && <div className="lead">이미 존재하는 계정명입니다.</div>}
                        <ErrorMessage
                        name = "userid2"
                        component = "div"
                        className = "alert alert-warning"/>
                        <ErrorMessage
                        name = "userpw2"
                        component = "div"
                        className = "alert alert-warning"/>
                      </Form>
                    )}
                </Formik>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
      
    </main>
  )
}
export default Home;