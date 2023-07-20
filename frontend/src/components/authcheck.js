import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from './../App.js'
import {BackEndURL} from './../App.js'


//Custom hook for auth check, maybe add another one for another user
export const useAuthCheck = () =>
{

  const {token, setToken, login, setLogin} = useContext(AuthContext);
  const [localStorageChecked, setLocal] = useState(false);
  const tempToken = sessionStorage.getItem("token");
  const [auth, setAuth] = useState(false)
  useEffect(()=>
  {
    const checkAuth = async () =>
    {
      //Check the ol local storage first off.
      let useToken;
      if(token !== null)
      {
        useToken = Object.keys(token).length !== 0 ? token : tempToken;
      }
      //Setup header
      if(useToken)
      {
        const header = {method: "PUT", // or 'PUT'
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useToken}`
        }}

        let result = await fetch(`${BackEndURL}/login`, header)
        let data = await result.json();
        if(data ==='Valid')
        {
          setToken(useToken)
          setAuth(true);
          sessionStorage.setItem("token", JSON.stringify(useToken))
          if(!auth)
          {
            setLogin(true);
            return;
          }

          return;
        }

      }
      setAuth(false);

    }
    checkAuth();
  }, [token, login])
  return auth;
}

export default useAuthCheck;