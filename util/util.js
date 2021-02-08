const jwt = require("jsonwebtoken")
require("dotenv").config()

const issueJWT = user => {
    const id = user._id

    const payload = {
        sub: id,
        iat: Date.now()
    }

    let token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: "1d"})
    return {
        token: "Bearer " + token
    }
}

module.exports.issueJWT = issueJWT;