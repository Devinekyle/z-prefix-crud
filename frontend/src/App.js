import InventoryList from './components/inventory.js'
import PageHeader from './components/pageheader.js'
import ManagerInventory from './components/managerinventory.js'
import Item from './components/item.js'
import Login from './components/login.js'
import Logout from './components/logout.js'
import CreateUser from './components/createuser.js'
import {Routes, Route} from 'react-router-dom';
import {createContext, useState, useEffect, useContext} from 'react';
import useAuthCheck from './components/authcheck.js';
export const AuthContext = createContext(null);

function App() {

  const [token, setToken] = useState(null);
  const [login, setLogin] = useState(false);
  useEffect(()=>
  {
    setToken(JSON.parse(sessionStorage.getItem("token")));
  },[token])

  return (
    <div className="App">
      <AuthContext.Provider value={{token, setToken, login, setLogin}}>
      <PageHeader/>
      <Routes>
        <Route path="/" element={<InventoryList/>}/>
        <Route path="/account/:id" element={<ManagerInventory/>}/>
        <Route path="/inventory/:id" element={<Item/>}/>
        <Route path="/login/" element={<Login/>}/>
        <Route path="/createuser/" element={<CreateUser/>}/>
        <Route path="/logout" element={<Logout/>}/>
      </Routes>
      </AuthContext.Provider>

    </div>
  );
}

export const BackEndURL = 'http://localhost:8080';

export default App;
