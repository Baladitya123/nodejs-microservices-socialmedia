const express = require('express')
const app = express()
require('dotenv').config()
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const helmet = require('helmet')
const cors = require('cors')
const { RateLimiterRedis }= require('rate-limiter-flexible')
const redis = require('ioredis')
const { rateLimit }= require('express-rate-limit')
const { RedisStore}=require('rate-limit-redis')
const routes = require('./routes/user-service')
const errorHandler = require('./middilewares/errorhandler')
const PORT = process.env.PORT  || 3001



//mongodb connection
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    logger.info('connected to mongodb');
})
.catch((error)=>{
    logger.error('mongodb connection error',error);
})
const redisClient = new redis(process.env.REDIS_URL)

//middilewares

app.use(helmet())
app.use(cors())

app.use(express.json())
app.use((req,res,next)=>{
    logger.info(`received ${req.method} request to ${req.url}`)
    logger.info(`request body ${req.body}`)
    next()
})

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix:"middleware",
    points:10,
    duration:1
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`rate limit exceeded for ip ${req.ip}`)
        res.status(429).json({success:false,message:'too many requests'})
    })
})

//ip based rate limiting for sensitive endpoints

const sensitiveEndPointsLimiter = rateLimit({
    windowMs:15*60*1000,
    max:50,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn(`sensitive endpoint rate limit exceeded for ip ${req.ip}`);
        res.status(429).json({success:false,message:'too many requests'});
    },
    store:new RedisStore({
        sendCommand:(...args)=>redisClient.call(...args)
    })
})

//apply this sensitiveEndPointsLimiter to our routes

app.use('/api/auth/register',sensitiveEndPointsLimiter)

//Routes
app.use('/api/auth',routes)

//error handler
app.use(errorHandler)


app.listen(PORT,()=>{
    logger.info(`user service running on port ${PORT} `)
})
//unhandled promise rejection

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('unhandledRejection at',promise,'reason:',reason)
})