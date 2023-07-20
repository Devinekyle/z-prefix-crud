import React, {useEffect, useState} from "react";
import "./user.css"
import useAuthCheck from './authcheck.js'
import {BackEndURL} from './../App.js'
import {useParams, useNavigate} from 'react-router-dom'

export const CreateUser = () =>
{
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const submit = async (e) =>
  {
    e.preventDefault();
    let loginInfo = {user: user, password: password, firstname: firstName, lastname: lastName};
    const header = {method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginInfo)}

    let response = await fetch(`${BackEndURL}/login`, header)
    let status = response.status;
    let data = await response.json();
    console.log(status);
    if(status == 202)
    {
      navigate("/")
    }
    else if (status == 403)
    {
      setError("User already exists");
    }
    else
    {
      setError("Unable to add user.");
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
        <label>
          First Name: <input type="text" onChange={(e)=>{setFirst(e.target.value)}}></input>
        </label>
        <label>
          Last Name: <input type="text" onChange={(e)=>{setLast(e.target.value)}}></input>
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default CreateUser