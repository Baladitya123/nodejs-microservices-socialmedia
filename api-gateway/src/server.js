require('dotenv').config()
const express = require('express')
const logger = require('./utils/logger')
const errorHandler = require('./middilewares/errorHandler')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const proxy = require('express-http-proxy')
const validToken = require('./middilewares/authMiddleware')

const {rateLimit} = require('express-rate-limit')
const {RedisStore}=require('rate-limit-redis')
const app = express()
const PORT = process.env.PORT || 3000
const RedisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

// rate limiting
const ratelimitoptions = rateLimit({
    windowMs:15*60*1000,
    max:100,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn(`sensitive endpoint rate limit exceeded for ip ${req.ip}`);
        res.status(429).json({success:false,message:'too many requests'});
    },
    store:new RedisStore({
        sendCommand:(...args)=>RedisClient.call(...args)
    })
})

app.use(ratelimitoptions)

app.use((req,res,next)=>{
    logger.info(`received ${req.method} request to ${req.url}`)
    logger.info(`request body ${req.body}`)
    next()
})


//proxy for the user service from api - 3000 to user - 3001 
//                                /api/auth to /v1/auth
const proxyOptions = {
    proxyReqPathResolver : (req)=>{
        return req.originalUrl.replace(/^\/v1/,"/api")
    },
    proxyErrorHandler :(err, res, next)=>{
        logger.error(`proxy error : ${err.message}`)
        res.status(500).json({
            success:false,
            message:'internal server error',
            error: err.message
        })
    }
}

// adding the proxy to the user service 
app.use('/v1/auth',proxy(process.env.USER_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:( proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers['Content-Type']='application/json'
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`response received from user servcie : ${proxyRes.statusCode}`)
        return proxyResData

    }
}))
app.use('/v1/posts',validToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers['Content-Type']= 'application/json'
        proxyReqOpts.headers['x-user-id']= srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`response received from post servcie : ${proxyRes.statusCode}`)
        return proxyResData
    }

}))

app.use(errorHandler)

app.listen(PORT,()=>{
    logger.info(`api gate way running on the port ${PORT}`)
    logger.info(`user service running on the url ${process.env.USER_SERVICE_URL}`)
    logger.info(`post service running on the url ${process.env.POST_SERVICE_URL}`)
    logger.info(`redis client url ${process.env.REDIS_URL}`)
})