import { useState } from "react";
import "./App.css";
import axios from "axios";
import jwt_decode from "jwt-decode";

function App() {
  const [user, setUser] = useState(null);
  const [invalidMsg, setInvalidMsg] = useState(null);
  const [logoutMsg, setLogoutMsg] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const refreshToken = async () => {
    try {
      console.log("refresh__", user.refreshToken);
      console.log("insideRefreshToken__1");
      const res = await axios.post("https://main--jwt-login-demo.netlify.app/.netlify/functions/api/api/refresh", { token: user.refreshToken });
      console.log("insideRefreshToken__2");
      console.log("res11__", res);
      console.log("res11__2", res.data.accessToken);
      setUser({
        ...user,
        token: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      return res.data
    } catch (err) {
      console.log(err);
    }
  };

  const axiosJwt = axios.create();

  axiosJwt.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decodeToken = jwt_decode(user.token);
      // console.log("decodeToken__&&", decodeToken.exp *1000)
      // console.log("getTime()==>", currentDate.getTime());
      if (decodeToken.exp * 1000 < currentDate.getTime()) {
        console.log("inside##");
        const data = await refreshToken();
        console.log("data@@", data)
        config.headers["authorization"] = "Bearer " + data.accessToken;
      }
      return config;
    },
    (err) => {
      return Promise.reject(err);
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://main--jwt-login-demo.netlify.app/.netlify/functions/api/api/login", { username, password });
      console.log("login--> ", res);
      setUser(res.data);
    } catch (error) {
      // console.log(error.response.data);
      setInvalidMsg(error.response.data);
      // console.log(error);
    }
  };

  const handleDelete = async (id) => {
    setSuccess(false);
    setError(false);
    console.log("insideDelete", user.token);
    try {
      console.log("insideDelete__1");
      await axiosJwt.delete("https://main--jwt-login-demo.netlify.app/.netlify/functions/api/api/users/" + id, {
        headers: { authorization: "Bearer " + user.token },
      });
      console.log("insideDelete__2");
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  };

  const handleLogout = async ()=> {
    try{
      const res= await axios.post("https://main--jwt-login-demo.netlify.app/.netlify/functions/api/api/logout", {token: user.refreshToken}, {
        headers: {authorization: "Bearer " + user.token}
      })
      setLogoutMsg(res.data)
      console.log(res.data)
      setTimeout(() => {
        setUser(null)
        setInvalidMsg(null)
        setLogoutMsg(null)
        setSuccess(false)
        setError(false)
      }, 1000);
    } catch (err){
      console.log(err)
    }
  }

  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete John
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Jane
          </button>
          {error && (
            <span className="error">
              You are not allowed to delete this user!
            </span>
          )}
          {success && (
            <span className="success">
              User has been deleted successfully...
            </span>
          )}
          {logoutMsg && <p className="error">{logoutMsg}</p>}
          <button className="logoutButton" onClick={()=> handleLogout()}>logout</button>
        </div>
      ) : (
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">JWT Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="current-password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            {invalidMsg && <p className="error">{invalidMsg}</p>}
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
