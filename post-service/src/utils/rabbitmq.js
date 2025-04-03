const amqp = require('amqplib')
const logger = require('./logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events"

async function connectToRabbitMq(){
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable:false})

        logger.info('connected to rabbitmq successfully!')
        return channel;
    } catch (error) {
        logger.error('error with connection with rabbitmq',error)
    }
}
async function publishEvent(routingkey,message){
    try {
        if(!channel){
            await connectToRabbitMq()
        }
        channel.publish(EXCHANGE_NAME,routingkey,Buffer.from(JSON.stringify(message)))
        logger.info(`published event successfully ${routingkey}`)
    } catch (error) {
        logger.error('error while publishing event',error)
    }
}

module.exports ={connectToRabbitMq,publishEvent}