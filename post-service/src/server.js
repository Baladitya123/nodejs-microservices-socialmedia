require('dotenv').config()
const express = require('express')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet =  require('helmet')
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middilewares/errorhandler')
const {rateLimit} = require('express-rate-limit')
const { RedisStore}=require('rate-limit-redis')


const app = express()
const PORT = process.env.PORT || 3002

mongoose.connect(process.env.MONGO_URI)
.then(()=>logger.info('connected to mongodb'))
.catch((e)=>logger.error('mongo connection error',e))

const redisClient = new Redis(process.env.REDIS_URI)

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`received ${req.method} request to ${req.url}`)
    logger.info(`request body ${req.body}`)
    next()
})
 // implement ip based rate limiting
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
// rate limiting on ip on all routes
app.use(sensitiveEndPointsLimiter)
const authenticateRequest = (req, res, next) => {
    req.redisClient = redisClient;  
    next();
};


app.use('/api/posts',authenticateRequest,postRoutes)

app.use(errorHandler)

app.listen(PORT,()=>{
    logger.info(`post service running on port ${PORT} `)
})
//unhandled promise rejection

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('unhandledRejection at',promise,'reason:',reason)
})