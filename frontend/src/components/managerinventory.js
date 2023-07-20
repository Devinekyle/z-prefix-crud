import React, {useEffect, useState, useRef, useContext} from "react";
import "./inventory.css"
import useAuthCheck from './authcheck.js'
import {BackEndURL, AuthContext} from './../App.js'
import {useParams, useNavigate} from 'react-router-dom'
import {ItemMod} from './itemmod.js';



//I feel like this should have just used inventory and modified the result somehow... I dont know why I didnt do that yesterday
export const ManagerInventory = () =>
{
  //Declare our state
  const [inventory, setInventory] = useState([]);
  const {token, setToken, login, SetLogin} = useContext(AuthContext)
  const markIDRef = useRef([]);
  const userRef = useRef("");
  const isAuth = useAuthCheck();
  const {id} = useParams();
  const navigate = useNavigate();
  const handleChecks = e =>
  {
    let newArray = [...markIDRef.current];

    if(e.target.checked)
    {
      newArray.push(e.target.name)
    }
    else
    {
      let index = newArray.indexOf(e.target.name);
      newArray.splice(index, 1);
    }
    markIDRef.current = newArray;
  }
  //Do our fetch in here for inventory list.
  useEffect(() =>
  {
    const fetchData = async () =>
    {

      let response = await fetch(`${BackEndURL}/accounts/${id}`)
      if(response.status === 400)
      {
        //Backend broken logic
      }
      else
      {
        let data = await response.json();
        let rowNames = data.map(element =>
          {
            let keyValue = element.id;
            if(token)
            {
              keyValue = element.id + token
            }
            return (
            <tr className = "tableRow" key={keyValue}>
              {isAuth ? <td className = "tableValueCenter">{element.id}</td> : <></>}
              {isAuth ? <td className = "tableValueCenter"><input type="checkbox" name={element.id} onChange={(e)=>handleChecks(e)}/></td> : <></>}
              <td className = "tableValue">{element.username}</td>
              <td className = "tableValue buttonclass" onClick={()=>{navigate(`/inventory/${element.id}`)}}>{element.item_name}</td>
              <td className = "tableValue">{element.description.length < 100 ? element.description : `${element.description.substring(0, 100)}...`}</td>
              <td className = "tableValue">{element.quantity}</td>
            </tr>)
          })
          //This is a dirty hack...
          userRef.current = data[0]?.username
          setInventory(rowNames);
      }
    }
    fetchData();
  }, [isAuth, login])

  //return jsx
  return (
    <div className = "tableDiv">
        <ItemMod delID={markIDRef} userRef = {userRef}/>
      <table className = "inventoryTable">
        <tr>
          {isAuth ? <th className = "markTitle">Mark</th> : <></>}
          <th className = "managerTitle">Manager</th>
          <th className = "itemTitle">Item</th>
          <th className = "descTitle">Description</th>
          <th className = "countTitle">Quantity</th>
        </tr>
      {inventory ? inventory : <></>}
      </table>
    </div>
  )
}

export default ManagerInventory;