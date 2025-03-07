const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const RefreshToken = require('../models/RefreshToken')

const generateToken = async(user) => {
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username
    },
    process.env.JWT_KEY, {expiresIn: '60m'}
    )

    const refreshToken = crypto.randomBytes(40).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); //refresh token expires in 7 days
    const refreshtoken= new RefreshToken({
        token: refreshToken,
        user: user._id,
        expireAt : expiresAt
    })
    await refreshtoken.save()
   // await RefreshToken.save({
    //    token: refreshToken,
   //     user: user._id,
   //     expiresAt : expiresAt
   // })
    return {accessToken, refreshToken}
}
module.exports = generateToken