require('dotenv').config()
const express = require('express')
const app = express()
const logger = require('./utils/logger')
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const mongoose = require('mongoose')
const errorHandler = require('./middilewares/errorhandler')
const { connectToRabbitMq , consumeEvent } = require('./utils/rabbitmq')
const { RedisStore}=require('rate-limit-redis')
const {rateLimit} = require('express-rate-limit')
const searchRoutes = require('./routes/search-routes')
const { handlePostCreated,handlePostDeleted }= require('./event-handlers/search-event-handler')

const PORT = process.env.PORT || 3004

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

app.use('/api/search',authenticateRequest,searchRoutes);
app.use(errorHandler)

async function startServer(){
    try {
        await connectToRabbitMq()

        //  consume the event of post created 
        await consumeEvent('post-created',handlePostCreated)
        await consumeEvent('post-deleted',handlePostDeleted)
        app.listen(PORT,()=>{
            logger.info(`search service running on ${PORT}`)
        })
    } catch (error) {
        logger.error('error while starting server of search service',error)
        process.exit(1)
    }
}

startServer()