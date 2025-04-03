
const logger = require('../utils/logger')
const Media = require('../models/Media')
const { deleteMediaFromCloudinary } = require('../utils/cloudinary')



const handleMediaDelete = async(event)=>{

    try {
        const {postId,mediaIds}=event
        const mediasToDelete = await Media.find({_id:{$in:mediaIds}})

        for(const media of mediasToDelete){
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`deleted the media ${media._id} associated with the post ${postId}`)
        }
        logger.info(`medias of the post ${postId} are deleted`)
    } catch (error) {
        logger.error('error occur while media deletion',error)
    }
}

module.exports=handleMediaDelete;