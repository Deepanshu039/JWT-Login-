const express = require("express");
const serverless= require('serverless-http')
const jwt = require("jsonwebtoken");
const app = express();
const cors = require('cors')

const router= express.Router();

router.use(express.json());
app.use(cors());

const users = [
  {
    id: "1",
    username: "john",
    password: "john098",
    isAdmin: true,
  },
  {
    id: "2",
    username: "jane",
    password: "jane098",
    isAdmin: false,
  },
];

const generateToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "10s",
  });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey");
  };

let refreshTokens= [];
let loggedUsers= [];

router.post("/api/refresh", (req, res)=>{

    console.log({refreshTokens})
    const refreshToken= req.body.token
    console.log({sentToken__: refreshToken})

    if(!refreshToken) return res.status(401).json("You are not authenticated")
    if(!refreshTokens.includes(refreshToken)){
       return res.status(403).json("Refresh token in not valid")
    }
    jwt.verify(refreshToken, "myRefreshSecretKey", (err, user)=>{
        err && console.log(err);
        console.log("inside refrestoke___")
        refreshTokens = refreshTokens.filter((token)=> token !== refreshToken);
        
        const newAccessToken= generateToken(user);
        const newRefreshToken= generateRefreshToken(user);
        refreshTokens.push(newRefreshToken);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    })

})

router.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // console.log(req)
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });

  if (user) {
    const token = generateToken(user);
    console.log({generatedToken__: token});
    const refreshToken= generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      token,
      refreshToken,
    });
  } else {
    res.status(401).json("username or password is wrong");
    // res.status(201).json("this is backend", username, password)
  }
});

const verify = (req, res, next) => {
  const authToken = req.headers.authorization;
  // const authHeader = req.headers.authorization;
  
  if (authToken) {
      const token = authToken.split(" ")[1];
      
      jwt.verify(token, "mySecretKey", (err, user) => {
        console.log({verifiedToken__: token});
      if (err) {
        console.log(err.message);
        return res.status(403).json("token is not valid");
      }
    //   console.log(user);
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("you are not authenticated");
  }
};

router.post("/api/logout", verify, (req, res)=>{
  const refresToken= req.body.token;
  refreshTokens= refreshTokens.filter((token)=> token !== refresToken);
  res.status(200).json("You have been successfully logged out.")
})

router.delete("/api/users/:userId", verify, (req, res) => {
  // const authToken= req.headers.authorization;
  // console.log(req.headers)
//   console.log(authToken);
  // console.log(req);
  console.log(req.user);
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("The user has been deleted");
  } else {
    res.status(403).json("You are not authorised to delete the user");
  }
});

router.get("/", (req, res)=>{
  res.status(200).json("backend is running")
})

app.use('/.netlify/functions/api', router)

module.exports.handler = serverless(app)

// app.listen(5500, () => console.log("server is running"));
