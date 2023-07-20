//Init express
const express = require('express');
const app = express();
//Grab express extensions
const cors = require('cors');
const COOKIE = require('cookie-parser');
//Declare our server port
const PORT = 8080;
//Grab our crypto stuffs
const jwt = require('jsonwebtoken');
const crpyto = require('bcrypt');
const keycrypt = require('crypto');

//File reading
const fs = require('fs');
//Declare our express extensions
app.use(cors());
app.use(COOKIE())
app.use(express.json())
//Our PG Information We'll grab .env file for this one
require('dotenv').config({ path: './../.env' })
const Client = require('pg').Client

//Setup our pg client. Not using pools though...
const client = new Client({
  host: process.env.PGADD,
  port: process.env.PGPORT,
  database: process.env.PGDB,
  user: process.env.PGUSER,
  password: process.env.PGPWD,
})

//Grab our keys while we're at it.
let private = process.env.PRIVATE;
let public = process.env.PUBLIC;

//And since we're here setup a changeable expirate date for tokens in seconds
const expTimer = (60 * 60)

//Declare some functions and extensions for SQL to make my life easier.
const cryptoExt = `DROP EXTENSION IF EXISTS pgcrypto; CREATE EXTENSION pgcrypto;`
const passwordSQL = `DROP FUNCTION IF EXISTS password;
CREATE OR REPLACE FUNCTION password(pwd varchar(255)) RETURNS text as $$
	BEGIN
		RETURN crypt(pwd, gen_salt('bf', 10));
	END
$$ LANGUAGE plpgsql;`;
const updateInsertSQL = `DROP FUNCTION IF EXISTS updateInsertItem;
CREATE OR REPLACE FUNCTION updateInsertItem(itemid INT, useridupdate INT,  itemname varchar(255), itemdescription varchar(10000), itemquantity int) RETURNS text as $$
	BEGIN
		UPDATE item_table SET userid = useridupdate, item_name = itemname, description = itemdescription, quantity = itemquantity WHERE id = itemid;
		IF NOT FOUND THEN
		INSERT INTO item_table (userid, item_name, description, quantity) VALUES (useridupdate, itemname, itemdescription, itemquantity);
		END IF;
	END
$$ LANGUAGE plpgsql;`;

//Make this to save some effort. Globally declare an error code as well.
var errorCode = {err: 0, errInfo: ""};

const errorCodeCreate = (errNum, errString) =>
{
  return {err: errNum, errInfo: errString}
}
//Why do we have this? Literally just to do .status(something).send(errorHandlerDB) if theres an error
const errorHandlerDB = e =>
{
  let errCode = e.errno;
  console.log(e);
  if(!errCode)
  {
    errCode = e.code;
  }
  if(!errCode)
  {
    return; //I accidentally .then'd instead of .catch, I'm keeping this just incase.
  }
  console.log(errCode);
  switch(errCode)
  {
    case -111:
      errorCode = errorCodeCreate(errCode, "Failed to Connect to DB server");
      break;
    case '3D000':
      errorCode = errorCodeCreate(errCode, "Database does not exist");
      break;
    case '23505':
      errorCode = errorCodeCreate(errCode, "Attempted to add duplicate key");
      break;
    default:
      errorCode = errorCodeCreate(errCode, "Unknown or Unhandled Error");
      break;
  }
}

//Setup crypto

const cryptoSetup = () =>
{
  if(!process.env.PRIVATE || !process.env.PUBLIC)
  {
    console.log("Private or public key unavailable. Generating new keys and adding to .env.")
    //our fair crypto, long may it be uncrackable
    const {
      publicKey,
      privateKey,
    } = keycrypt.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    public = publicKey;
    private = privateKey;
    const keyPair = `\nPUBLIC = '${publicKey.replace(/\\n/g, '\n')}'\nPRIVATE = '${privateKey.replace(/\\n/g, '\n')}'`
    //This shouldn't fail... though I suppose if you have a way of connecting to the DB without env variables it could. Please dont...
    fs.open('./../.env', 'a', 0o666, (err, res) =>
    {
      if(err) {
        return;
      }
      fs.write(res, keyPair, null, 'utf8', (err, written, res) =>
      {
        if(err)
        {
          console.log("woops");
        }

      } )
    })
  }

}

const authCheck = async (req) =>
{
  let authorized = false;
  //Check the header for a token
  let auth = req.headers?.authorization;
  if(auth)
  {
    //Split the token. If it fails it ain't my problem. The front end supports it.
    let token = auth?.split(" ")[1];
    if(token)
    {
      //But if the token is valid try to decrypt it and see whats inside.
      await jwt.verify(token, private, async (err, result) =>
      {
        //Check if error, else its valid as long as whatever we put in the token matches what we expect. In this case user...
        if(err)
        {
          return;
        }
        let queryRes = await client.query(`SELECT (username = $1) AS match FROM user_table WHERE username ILIKE $1`, [result.tokenUser])
        if( queryRes.rows[0].match && Math.floor(Date.now() / 1000) < result.exp)
        {
          authorized = {status: true, user: result.tokenUser};
        }

      })
    }
  }
  else
  {
    return authorized;
  }

  return authorized;
}
app.post("/login", async (req, res) =>
{
  let {user, password, firstname, lastname} = req.body;
  //No alts allowed. At least logout first...
  let authd = await authCheck(req);
  if(!authd)
  {
    if(user && password && firstname && lastname)
    {
      //Safe. username is a unique. If you want to have 50 Ricky Bobbys go for it.
      let result = await client.query(`INSERT INTO user_table (username, password, firstname, lastname) VALUES ($1, password($2), $3, $4)`,
      [user, password, firstname, lastname])
      .catch(err => errorHandlerDB(err));
      //This should be 1 or 0... it'd be frightening if it wasn't...
      if(result?.rowCount)
      {
        let token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (expTimer), tokenUser: user}, private, { algorithm: 'RS256' })
        res.status(202).send(JSON.stringify(token));
      }
      else
      {
        res.status(403).send(JSON.stringify("User already exists."))
      }
    }
    else
    {
      res.status(400).send(JSON.stringify("Invalid parameters"));
    }
  }
})

//Patch for login? Put for create user I guess, im just gonna go ahead and use put for checking auth
app.patch("/login", async (req, res) =>
{
  let {user, password} = req.body;
  let authd = await authCheck(req);
  if(!authd)
  {
    if(user && password)
    {
      let result = await client.query(`SELECT (password = crypt($1, password)) AS pswmatch, id FROM user_table WHERE $2 ILIKE username`, [password, user])
      if(result.rows[0]?.pswmatch)
      {
        let token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (expTimer), tokenUser: user}, private, { algorithm: 'RS256' })
        res.status(202).send(JSON.stringify({id: result.rows[0].id, token: token}));
        return;
      }
      res.sendStatus(401);
    }
    else
    {
      res.sendStatus(401);
    }
  }
  else
  {
    res.status(200).send("Already logged in");
  }
})

app.put("/login", async (req, res) =>
{
  let authd = await authCheck(req);
  if(authd)
  {
    res.status(202).send(JSON.stringify("Valid"));
  }
  else
  {
    res.status(401).send(JSON.stringify("Invalid"))
  }
})

app.get("/", async (req, res) =>
{
  console.log("Get works!");
})

app.get("/inventory", async (req, res) =>
{
  let result = await client.query(`SELECT item_table.id, userid, username, item_name, description, quantity FROM item_table JOIN user_table ON user_table.id = userid`)
  if(result.rows)
  {
    res.status(200).send(result.rows)
  }
  else
  {
    res.status(400);
  }
})

app.get("/accounts/:id", async (req, res) =>
{
  let id = Number(req.params.id);
  if(id)
  {
    let result = await client.query(`SELECT item_table.id, userid, username, item_name, description, quantity FROM item_table JOIN user_table ON user_table.id = item_table.userid WHERE user_table.id = $1`, [id])
    if(result.rows)
    {
      res.status(200).send(result.rows)
    }
    else
    {
      res.status(400);
    }
  }
  else
  {
    res.sendStatus(400);
  }
})

app.get("/inventory/:id", async (req, res)=>
{
  let id = Number(req.params.id);
  if(id)
  {
    let result = await client.query(`SELECT *, username FROM item_table JOIN user_table ON user_table.id = userid WHERE item_table.id = $1`, [id])
    if(result.rows)
    {
      res.status(200).send(result.rows)
    }
    else
    {
      res.status(400);
    }
  }
  else
  {
    res.sendStatus(400);
  }
})

app.post('/inventory', async (req, res) =>
{
  let {username, name, desc, itemQuantity} = req.body;

  //{username: user.current.current, desc: itemDesc, name: itemTitle, itemQuantity: itemCount} update format
  let authd = await authCheck(req);
  if(authd)
  {
    let result = client.query(`INSERT INTO item_table (userid, item_name, description, quantity) VALUES ((SELECT id FROM user_table WHERE username ILIKE $1), $2, $3, $4)`, [username, name, desc, Number(itemQuantity)])
    console.log(result)
    if(result?.rowCount >= 1)
    {
      res.status(200).send(JSON.stringify(`Found and removed ${result.rowCount} items`))
    }
    else
    {
      res.status(200).send(JSON.stringify("No items with ID found"))
    }
  }
  else
  {
    res.sendStatus(401);
  }
})

app.patch('/inventory', async (req, res) =>
{
  let {itemID, itemTitle, itemDescription, itemQuantity} = req.body;

  let authd = await authCheck(req);
  if(authd)
  {
    if(!itemID || !itemTitle || !itemDescription || !itemQuantity)
    {
      res.sendStatus(400);
      return;
    }
    let result = await client.query(`UPDATE item_table SET item_name = $2, description = $3, quantity = $4 WHERE id = $1`, [itemID, itemTitle, itemDescription, Number(itemQuantity)])
    if(result?.rowCount)
    {
      res.sendStatus(200);
      console.log("edited");
    }
  }
  else
  {
    res.sendStatus(401);
  }
})

app.delete("/inventory", async (req, res)=>
{
  console.log('watt');
  let delArray = req.body;
  let formattedArray = delArray.map(element => Number(element))
  console.log(formattedArray);
  let authd = await authCheck(req);
  if(authd)
  {
    let result = await client.query(`DELETE FROM item_table WHERE id = ANY($1::int[])`, [formattedArray])
    console.log(result)
    if(result?.rowCount >= 1)
    {
      res.status(200).send(JSON.stringify(`Found and removed ${result.rowCount} items`))
    }
    else
    {
      res.status(200).send(JSON.stringify("No items with ID found"))
    }
  }
  else
  {
    res.sendStatus(401);
  }
})
app.listen(PORT, async ()=>
{
  //forward dec result
  let result;
  //Don't bother running the server if the values in dotenv are bad.
  if(!process.env.PGUSER || !process.env.PGPWD)
  {
    console.error(".env variables for Postgres login invalid. The server may not work without valid login information")
  }
  //Check our login information for PG.
  result = await client.connect()
                  .catch(err => {errorHandlerDB(err)})

  //Add extensions
  result = await client.query(cryptoExt)
  .catch(err => {errorHandlerDB(err)})

  //Add custom functions
  result = await client.query(passwordSQL)
  .catch(err => {errorHandlerDB(err)})

  result = await client.query(updateInsertSQL)
  .catch(err => {errorHandlerDB(err)})

  //Check the status of our database.
  let seeduser = false;
  let seeditems = false;
  let dbcheck = await client.query(`SELECT * FROM information_schema.tables`)
  .catch(err => {errorHandlerDB(err)});
  //Check if user_table DOES NOT exists.
  if(!dbcheck.rows.some(element => element.table_name === 'user_table'))
  {
    //If not create the table
    result = await client.query(`CREATE TABLE user_table (id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      firstname varchar(255),
      lastname varchar(255),
      username varchar(255) UNIQUE,
      password varchar(1000));`)
      .catch((err => errorHandlerDB(err)))
      seeduser = true;
  }


  //Check if item_table does not exist now
  if(!dbcheck.rows.some(element => element.table_name === 'item_table'))
  {
    //If not create the table
    result = await client.query(`CREATE TABLE item_table (id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
      userid integer,
      item_name varchar(255),
      description varchar(10000),
      quantity integer,
      CONSTRAINT fk_userid FOREIGN KEY(userid) REFERENCES user_table(id))`)
      .catch((err => errorHandlerDB(err)))
      seeditems = true;
  }

  //Seed if necessary. We only seed if we created a database. Theoretically after all of this we've kinda verified we can do almost anything.
  if(seeduser)
  {
    result = client.query(`INSERT INTO user_table (firstname, lastname, username, password) VALUES ('kyle', 'devine', 'devinek', password('hi'))`)
    result = client.query(`INSERT INTO user_table (firstname, lastname, username, password) VALUES ('dave', 'mustaine', 'mustained', password('hi'))`)
  }
  if(seeditems)
  {
    result = client.query(`INSERT INTO item_table (userid, item_name, description, quantity) VALUES (1, 'Laptop', 'A really crappy one', 50)`)
    result = client.query(`INSERT INTO item_table (userid, item_name, description, quantity) VALUES (2, 'Good Laptop', 'A really good one', 1)`)
    result = client.query(`INSERT INTO item_table (userid, item_name, description, quantity) VALUES (1, 'Good Laptop', 'A really good one', 5)`)
    result = client.query(`INSERT INTO item_table (userid, item_name, description, quantity) VALUES (1, 'Massive brick', 'Its a really really big brick. Like it would take me hundreds of characters to describe it to you. Its the biggest, baddest brick around. Color is brick red.', 5)`)
  }
  //Create auth keys
  cryptoSetup();

  console.log(`Server up and running on port: ${PORT}`)
})