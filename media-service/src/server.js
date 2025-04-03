const dotenv= require('dotenv')
dotenv.config()

const express = require('express')
const app = express()
const cors = require('cors')
const helmet = require('helmet')
const Mediaroutes = require('./routes/media-routes')
const errorHandler = require('./middilewares/errorhandler')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const {rateLimit} = require('express-rate-limit')
const Redis = require('ioredis')
const {RedisStore}=require('rate-limit-redis')
const { connectToRabbitMq, consumeEvent } = require('./utils/rabbitmq')
const handleMediaDelete = require('./eventHandlers/media-event-handler')

const PORT = process.env.PORT || 3003
const redis_uri = process.env.REDIS_URL

const RedisClient = new Redis(redis_uri)


mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    logger.info('connected to mongodb')
})
.catch((e)=>{
    logger.error('error while connecting to mongodb',e)
})

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`received ${req.method} request to ${req.url}`)
    logger.info(`request body ${req.body}`)
    next()
})
console.log(process.env.cloud_name)

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

app.use('/api/media',Mediaroutes)

app.use(errorHandler)

async function startServer(){
    try {
        await connectToRabbitMq()
        //consume all the events
        await consumeEvent('post-deleted',handleMediaDelete)
        app.listen(PORT,()=>{
            logger.info(`media service running on port ${PORT} `)
        })
    } catch (error) {
        logger.error('failed to connect to the server',error)
        process.exit(1)
    }
}
startServer()


//unhandled promise rejection

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('unhandledRejection at',promise,'reason:',reason)
})