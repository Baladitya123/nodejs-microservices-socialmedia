const Search = require('../models/Search')
const logger = require('../utils/logger')

async function invalidatePostCache(){
    const keys = await req.redisClient.keys('search:*');
    if(keys.length>0){
        await req.redisClient.del(keys)
    } 
}

async function handlePostCreated(event){
    try {
        const newSearchPost = new Search({
            postId:event.postId,
            userId:event.userId,
            content:event.content,
            createdAt:event.createdAt
        });
        await invalidatePostCache()
        await newSearchPost.save()
        logger.info(`search post created of postId ${event.postId} and search post id ${newSearchPost._id.toString()}`)

    } catch (error) {
        logger.error('error handeling in creation of post event',error)
    }
}

async function handlePostDeleted(event) {
    try {
        const searchPostToBeDeleted = await Search.findOneAndDelete({postId:event.postId})
        await invalidatePostCache()
        logger.info(`search post deleted of postId ${event.postId} and search post id ${searchPostToBeDeleted._id.toString()}`)
    } catch (error) {
        logger.error(`error handeling in deleting the search post`,error)
    }
}

module.exports = {handlePostCreated,handlePostDeleted}