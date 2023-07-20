import React, {useEffect} from "react"
import {useNavigate} from 'react-router-dom'
import "./pageheader.css"
import useAuthCheck from './authcheck.js'

export const PageHeader = () =>
{
  const navigate = useNavigate();
  const isAuth = useAuthCheck();

  return (
    <div className="headerBar">
      <h1 className ="pageTitle" onClick={()=>{navigate("/")}}>Inventory</h1>
      {!isAuth ?
      <div>
        <p className="createUserButton buttonclass" onClick={()=>{navigate(`/createuser/`)}}>Create User</p>
        <p className="loginButton buttonclass" onClick={()=>{navigate(`/login/`)}}>Login</p>
      </div> : <p className="loginButton  buttonclass" onClick={()=>{navigate("/logout")}}>Logout</p>}
    </div>
  )
}

export default PageHeader