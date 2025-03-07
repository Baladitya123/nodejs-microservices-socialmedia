const logger = require('../utils/logger')

const errorHandler = (err,req,res,next)=>{
    if(err){
        logger.error(err.stack);

    res.status(err.status||500).json({
        message:err.message || "internal server error",
    })
    }else{
        next()
    }
    
};

module.exports = errorHandler;