import React, {useEffect, useState, useContext, useRef} from "react";
import "./item.css"
import {useAuthCheck} from "./authcheck.js";
import {BackEndURL, AuthContext} from './../App.js'
import {useParams, useNavigate} from 'react-router-dom'
import ContentEditable from 'react-contenteditable'

export const Item = () =>
{
  const [inventory, setInventory] = useState([]);
  const [adminInv, setAdminInv] = useState([]);
  const {token, setToken, login, setLogin} = useContext(AuthContext);
  const isAuth = useAuthCheck();
  const {id} = useParams();
  const itemTitleRef = useRef(null);
  const itemDescRef = useRef(null);
  const itemCountRef = useRef(null);
  const navigate = useNavigate();
  const submit = async () =>
  {
    //Format for the edit
    const editInfo = {
      itemID: id,
      itemTitle: itemTitleRef.current ? itemTitleRef.current.innerHTML : '',
      itemDescription: itemDescRef.current ? itemDescRef.current.innerHTML : '',
      itemQuantity: itemCountRef.current ? itemCountRef.current.innerHTML : ''
    };
    const header = {method: "PATCH", // or 'PUT'
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(editInfo)}

    let response = await fetch(`${BackEndURL}/inventory`, header)
    let data = await response.json();
    console.log(data);
  }

  useEffect(() =>
  {
    const fetchData = async () =>
    {
      let response = await fetch(`${BackEndURL}/inventory/${id}`)
      if(response.status == 400)
      {
        //Backend broken logic
      }
      else
      {
        let data = await response.json();
        //In hindsight, this should only be a size of one... but you never know.
        let rowNames = data.map(element =>
          {
            let keyValue = element.id;
            if(token)
            {
              keyValue = element.id + token
            }
            return (
            <div key={`normal${keyValue}`}className="makeShiny">
              <div className="makeShiny">
                {<h1>{element.item_name}</h1>}
                {<p>{element.description}</p>}
                {<p>{element.username} currently has {element.quantity} in stock!</p>}
                {<></>}
              </div>
            </div>)
          })
          let adminRows = data.map(element =>
            {
             let keyValue = element.id;
             if(token)
              {
                keyValue = element.id + token
              }
              return (
              <div key={`admin${keyValue}`}className="makeShiny">
                <div className="makeShiny">
                  {<ContentEditable innerRef={itemTitleRef} html={element.item_name} tagName='h1' />}
                  {<ContentEditable innerRef={itemDescRef} html={element.description} tagName='p' />}
                  {<p>Modify Quantity: <ContentEditable innerRef={itemCountRef} html={element.quantity.toString()} tagName='span' /></p>}
                  {<button onClick={submit}>Confirm Changes</button>}
                </div>
              </div>)
            })
          setAdminInv(adminRows)
          setInventory(rowNames);
      }
    }
    fetchData();
  }, [isAuth, login])

  if(isAuth)
  {
    console.log("This is a dumb bug")
  }

  //return jsx
  return (
    <div className = "displayItem">
      {inventory ? (isAuth ? adminInv : inventory) : <></> }
    </div>
  )
}

export default Item;