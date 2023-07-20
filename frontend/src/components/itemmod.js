import React, {useState, createContext, useContext, useRef} from 'react';
import {useAuthCheck} from "./authcheck.js";
import {BackEndURL, AuthContext} from './../App.js'
import "./itemmod.css"

const ItemModContext = createContext(null);

export const AddItem = () =>
{
  const {user, display, setDisplay, setType, itemTitle, setItemTitle, itemDesc, setItemDesc, itemCount, setItemCount} = useContext(ItemModContext);
  const isAuth = useAuthCheck();
  return (
    <>
    {isAuth ? <p className="buttonclass" onClick={()=>{setType(0); setDisplay(
      <table className = "addItemTable">
        <tr>
          <th className = "markTitleItemMod"></th>
          <th className = "managerTitleItemMod">Manager</th>
          <th className = "itemTitleItemMod">Item</th>
          <th className = "descTitleItemMod">Description</th>
          <th className = "countTitleItemMod">Quantity</th>
        </tr>
        <tr>
          <td className = "markTitleItemMod">
          </td>
          <td className = "managerTitleItemMod">{user.current.current}
          </td>
          <td className = "itemTitleItemMod">
            <label>
              <input className ="itemTitleInput" type="text" onChange={(e) => setItemTitle(e.target.value)}/>
            </label>
          </td>
          <td className = "descTitleItemMod">
            <label>
              <input className = "itemDescInput" type="text" onChange={(e) => setItemDesc(e.target.value)}/>
            </label>
          </td>
          <td className = "countTitleItemMod">
            <label>
              <input className = "itemCountInput" type="text" onChange={(e) => setItemCount(e.target.value)}/>
            </label>
          </td>
        </tr>
      </table>
    )}}>Add Item</p> : <></>}
    </>
  )
}
//Ima cry. I didn't read the full requirement for edit items... Movin this out...
export const EditItem = () =>
{
  const {setItemID, user, display, setDisplay, setType, itemTitle, setItemTitle, itemDesc, setItemDesc, itemCount, setItemCount} = useContext(ItemModContext);
  const isAuth = useAuthCheck();

  return (
    <>
    {isAuth ? <p className="buttonclass" onClick={()=>{setType(1); setDisplay(
      <table className = "addItemTable">
        <tr>
          <th className = "markTitleItemMod">ID</th>
          <th className = "managerTitleItemMod">Manager</th>
          <th className = "itemTitleItemMod">Item</th>
          <th className = "descTitleItemMod">Description</th>
          <th className = "countTitleItemMod">Quantity</th>
        </tr>
        <tr>
          <td className = "markTitleItemMod">
          <label>
              <input className ="itemTitleInput" type="text" onChange={(e) => setItemID(e.target.value)}/>
            </label>
          </td>
          <td className = "managerTitleItemMod">{user.current.current}
          </td>
          <td className = "itemTitleItemMod">
            <label>
              <input className ="itemTitleInput" type="text" onChange={(e) => setItemTitle(e.target.value)}/>
            </label>
          </td>
          <td className = "descTitleItemMod">
            <label>
              <input className = "itemDescInput" type="text" onChange={(e) => setItemDesc(e.target.value)}/>
            </label>
          </td>
          <td className = "countTitleItemMod">
            <label>
              <input className = "itemCountInput" type="text" onChange={(e) => setItemCount(e.target.value)}/>
            </label>
          </td>
        </tr>
      </table>
    )}}>Edit Item</p> : <></>}
    </>
  )
}

export const DeleteItem = () =>
{
  const {display, setDisplay, setType} = useContext(ItemModContext);
  const isAuth = useAuthCheck();
  return (
    <>
    {isAuth ? <p className="buttonclass" onClick={()=>{setType(2); setDisplay(<></>)}}>Delete Item</p> : <></>}
    </>
  )
}

export const ItemMod = ({delID, userRef}) =>
{
  //So many states...
  const user = useRef(userRef);
  const [display, setDisplay] = useState(null);
  const [modType, setType] = useState(null);
  const [itemID, setItemID] = useState(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCount, setItemCount] = useState("");
  const {token, setToken} = useContext(AuthContext);
  const isAuth = useAuthCheck();

  const handleSubmit = async () =>
  {
    let header = {method: "FAIL",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: ""}
    let modData = {username: user.current.current, desc: itemDesc, name: itemTitle, itemQuantity: itemCount}
    console.log(modData);
    switch(modType)
    {
      case 0:
        header.method = "POST";
        if(modData)
        {
          header.body = JSON.stringify(modData)
          let response = await fetch(`${BackEndURL}/inventory`, header)
          let data = await response.json();
          window.location.reload();
        }
        break;
      case 1:
        header.method = "PATCH";
        if(modData)
        {
          header.body = JSON.stringify(modData)
          let response = await fetch(`${BackEndURL}/inventory`, header)
          let data = await response.json();
          window.location.reload();
        }
        break;
      case 2:
        header.method = 'DELETE';
        header.body = JSON.stringify(delID.current)
        let response = await fetch(`${BackEndURL}/inventory`, header)
        let data = await response.json();
        window.location.reload();
        break;
      default:
        break;
    }
    setDisplay(null)
  }

  return (
    <>
    {isAuth ?
    <div className = "itemMod-FlexContainer">
      <ItemModContext.Provider value={{setItemID, user, display, setDisplay, modType, setType, itemTitle, setItemTitle, itemDesc, setItemDesc, itemCount, setItemCount}}>
        <AddItem/>
        <DeleteItem/>
        {display ? <button className="submitButton"onClick={handleSubmit}>Confirm</button> : <></> }
      </ItemModContext.Provider>
    </div>: <></>}
    {display ? display : <></>}
    </>
  )
}