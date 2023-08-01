import React, {useEffect, useState, useContext} from "react";
import "./user.css"
import useAuthCheck from './authcheck.js'
import {BackEndURL, AuthContext} from './../App.js'
import {useParams, useNavigate} from 'react-router-dom'

export const Login = () =>
{
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const {token, setToken, login, setLogin} = useContext(AuthContext);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const isAuth = useAuthCheck();

  useEffect(()=>
  {
    if(isAuth)
    {
      setLogin(!login);
      setToken(token)
    }
    else
    {
      sessionStorage.clear()
    }
  }, [isAuth, login])
  let {url} = useParams();
  const submit = async (e) =>
  {
    e.preventDefault();
    let loginInfo = {"user": user, "password": password};
    const header = {method: "PATCH", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(loginInfo)}

    let response = await fetch(`${BackEndURL}/login`, header)

    if(response.status == 202)
    {
      let data = await response.json();
      setToken(data.token);
      //Im making this on a set timeout because holy crap this bug is annoying.
      navigate(`/account/${data.id}`)
    }
    else
    {
      setError("Failed to login")
    }

  }

  return (
    <div className="userDiv">
      {error ? <p>{error}</p> : <></>}
      <form method="post" onSubmit={(e)=>submit(e)}>
        <label>
          Username: <input type="text" onChange={(e)=>{setUser(e.target.value)}}></input>
        </label>
        <label>
          Password: <input type="password" onChange={(e)=>{setPassword(e.target.value)}}></input>
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Login