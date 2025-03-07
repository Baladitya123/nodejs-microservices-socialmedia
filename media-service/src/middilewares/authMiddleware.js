const logger = require('../utils/logger')


const authenticateRequest = async(req,res,next)=>{
    const userId = req.headers['x-user-id']
     if(!userId){
        logger.warn('access attempted without userId')
        return res.status(400).json({
            success:false,
            message:'authentication required! please login for continue'
        }
        )
     }
     req.user={userId}
     next()
}

module.exports = authenticateRequest