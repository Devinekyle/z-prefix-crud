import React, {useEffect, useState, useContext} from "react";
import "./inventory.css"
import {useNavigate} from 'react-router-dom';
import {BackEndURL, AuthContext} from './../App.js'


export const InventoryList = () =>
{
  //Declare our state
  const [inventory, setInventory] = useState([]);
  const {token, setToken} = useContext(AuthContext);
  const navigate = useNavigate();
  //Do our fetch in here for inventory list.
  useEffect(() =>
  {
    const fetchData = async () =>
    {
      let response = await fetch(`${BackEndURL}/inventory`)
      if(response.status == 400)
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
              <td className = "tableValue buttonclass" onClick={()=>{navigate(`/account/${element.userid}`)}}>{element.username}</td>
              <td className = "tableValue buttonclass" onClick={()=>{navigate(`/inventory/${element.id}`)}}>{element.item_name}</td>
              <td className = "tableValue">{element.description.length < 100 ? element.description : `${element.description.substring(0, 100)}...`}</td>
              <td className = "tableValue">{element.quantity}</td>
            </tr>)
          })
          setInventory(rowNames);
      }
    }
    fetchData();
  }, [])

  //return jsx
  return (
    <div className = "tableDiv">
      <table className = "inventoryTable">
        <tr>
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

export default InventoryList;