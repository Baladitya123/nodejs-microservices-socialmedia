const Search = require('../models/Search')
const logger = require('../utils/logger')

const searchPost = async(req,res)=>{
    logger.info('search endpoint hit')
    try {
        const {query} = req.query
        const cachedSearchedKey = `search:${query}`
        const cachedSearch = await req.redisClient.get(cachedSearchedKey)
        if(cachedSearch){
            return res.json(JSON.parse(cachedSearch))
        }
        const results = await Search.find({
            $text:{$search:query}
        },{
            score:{$meta:'textScore'}
        }).sort({score:{$meta:'textScore'}}).limit(10)
        
        await req.redisClient.setex(cachedSearchedKey,300,JSON.stringify(results))

        return res.json(results)
    } catch (error) {
        logger.error('error occured while searching post',error)
        return res.status(404).json({
            success:false,
            message:'error searching a post'
        }) 
    }
}

module.exports={searchPost}