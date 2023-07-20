import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom'
import {AuthContext} from './../App.js'
import {BackEndURL} from './../App.js'
import useAuthCheck from './authcheck.js'
export const Logout = () =>
{
  const {token, setToken, login, setLogin} = useContext(AuthContext);
  const navigate = useNavigate();

  const isAuth = useAuthCheck();
  useEffect(()=>
  {
    if(isAuth)
    {
      setLogin(false);
      setToken(null)
      sessionStorage.clear();
    }
    else
    {
      setLogin(true);
      navigate("/")
      window.location.reload();
    }
  }, [isAuth, login])

  return (
    <>
    {isAuth ? <h1>Logging Out</h1> : sessionStorage.clear()}
    </>
  )
}

export default Logout