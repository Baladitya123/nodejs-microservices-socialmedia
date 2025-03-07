const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

const validToken = async(req,res,next)=>{
    authheader=req.headers['authorization']
    token = authheader && authheader.split(" ")[1]
    if(!token){
        logger.warn('authentication required')
        return res.status(401).json({
            success:false,
            message:'authentication required'
        })
    }
    jwt.verify(token,process.env.JWT_KEY,(err,user)=>{
        if(err){
            logger.warn('invalid token')
            return res.status(401).json({
                success:false,
                message:'invalid token'
            })
        }
        req.user = user
        next()
    })
}

module.exports= validToken