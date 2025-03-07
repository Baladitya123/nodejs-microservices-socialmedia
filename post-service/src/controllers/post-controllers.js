const logger = require('../utils/logger')
const Post = require('../models/Post')
const {validPostCreation} = require('../utils/validation')
const { post } = require('../routes/post-routes')

async function invalidatePostCache(req,input) {
    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)
    const keys = await req.redisClient.keys('posts:*');
    if(keys.length>0){
        await req.redisClient.del(keys)
    } 
}


const createPost = async(req,res)=>{
    logger.info('create post endpoint hit')

    try {
        const {error}= await validPostCreation(req.body)
        if(error){
           logger.warn('post validation error',error.details[0].message)
            return res.status(400).json({
               success:false,
              message:error.details[0].message
           })
        }
        const {content,mediaIds}=req.body
        const newlyCreatedPost = new Post({
            user:req.user.userId,
            content,
            mediaIds:mediaIds || []
        })
        await newlyCreatedPost.save()
        await invalidatePostCache(req,newlyCreatedPost._id.toString())
        logger.info('created post successfully',newlyCreatedPost)
        return res.status(200).json({
            success:true,
            message:"post created successfully"
        })

    } catch (error) {
        logger.error('error occured while creating posts',error)
        return res.status(404).json({
            success:false,
            message:'error creating post'
        })
    }
}

const getAllPosts = async(req,res)=>{
    logger.info('getting all posts endpoint hit')

    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const startingIndex = (page-1)*limit
        const cachekey = `posts:${page}:${limit}`
        
        if (!req.redisClient) {
            logger.error('Redis client is not available');
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
        
        const cachedposts = await req.redisClient.get(cachekey);
        
        if(cachedposts){
            return res.status(200).json(JSON.parse(cachedposts))
        }
        
        const  posts = await Post.find({}).sort({createdAt:-1}).skip(startingIndex).limit(limit)

        const totalnoofposts = await Post.countDocuments()

        const result = {
            posts,
            currentpage:page,
            totalpages:Math.ceil(totalnoofposts/limit),
            totalposts:totalnoofposts
        }
        // save it into first in cache
        await req.redisClient.setex(cachekey,300,JSON.stringify(result))
        return res.status(200).json(result)
    } catch (error) {
        logger.error('error occured while fetching all posts',error)
        return res.status(404).json({
            success:false,
            message:'error fetching posts'
        })
    }
}
const getPost = async(req,res)=>{
    logger.info('fetching a post endpoint hit')
    try {
        postid = req.params.id
        const cachekey = `post:${postid}`
        const cachedpost = await req.redisClient.get(cachekey);
        
        if(cachedpost){
            return res.status(200).json(JSON.parse(cachedpost))
        }
        const singlepostdetailsbyid = await Post.findById(postid)
        if(!singlepostdetailsbyid){
            return res.status(400).json({
                success:false,
                message:'post not found' 
            })
        }
        await req.redisClient.setex(cachekey,300,JSON.stringify(singlepostdetailsbyid))
        return res.status(200).json(singlepostdetailsbyid)


    } catch (error) {
        logger.error('error occured while fetching a post by id',error)
        return res.status(404).json({
            success:false,
            message:'error fetching a post'
        })
    }
}
const deletePost = async(req,res)=>{
    logger.info('delete post endpoint hit')
    try {
        const deletedPost = await Post.findOneAndDelete({
            _id:req.params.id,
            user:req.user.userId
        })
        if (!deletedPost){
           return  res.status(400).json({
                success:false,
                message:'post not found'
            })
        }
        await invalidatePostCache(req,req.params.id)
        return res.status(200).json({
            success:true,
            message:'post deleted successfully'
        })


    } catch (error) {
        logger.error('error occured while deleting post',error)
        return res.status(404).json({
            success:false,
            message:'error deleting a post'
        })
    }
}

module.exports = {createPost,getAllPosts,getPost,deletePost}