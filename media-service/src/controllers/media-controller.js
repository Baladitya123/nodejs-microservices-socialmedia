const Media = require('../models/Media')
const { uploadMediaToCloudinary } = require('../utils/cloudinary')
const logger = require('../utils/logger')

const uploadMedia = async(req,res)=>{
    logger.info('upload media endpoint hit')
    try {
        if(!req.file){
            logger.error('no file found , please add a file and try again')
            return res.status(400).json({
                success:false,
                message:'no file found , please add a file and try again'
            })
        }
        const {originalname,mimetype,buffer} =  req.file
        const userId = req.user.userId

        logger.info(`file details : name = ${originalname} , type = ${mimetype}`)
        logger.info('uploading media to cloudinary started.....')
        
        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file)
        console.log(cloudinaryUploadResult.url)

        logger.info(`cloudinary upload successfull . public id =${cloudinaryUploadResult.public_id}`)

        const newlyCreatedMedia = new Media({
            publicId:cloudinaryUploadResult.public_id,
            originalName:originalname,
            mimeType:mimetype,
            urls:cloudinaryUploadResult.secure_url,
            userId
        })
        await newlyCreatedMedia.save()
        return res.status(200).json({
            success:true,
            message:'media uploaded successfully',
            mediaId:newlyCreatedMedia._id,
            url:newlyCreatedMedia.urls
        })
    } catch (error) {
        logger.error('error while uploading media ',error)
        return res.status(400).json({
            success:false,
            message:'internal server error in media service'
        })
    }
}

const getAllMedia = async(req,res)=>{
    try {
        const results = await Media.find({})
        return res.json({results})
    } catch (error) {
        logger.error('error while getting all medias ',error)
        return res.status(400).json({
            success:false,
            message:'internal server error in media service'
        })
    }
}

module.exports={uploadMedia,getAllMedia}