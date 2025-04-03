const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger')

cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret // Click 'View API Keys' above to copy your API secret
});

const uploadMediaToCloudinary=(file)=>{
    return new Promise((resolve,reject)=>{
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type:"auto"
        },(error,result)=>{
            if(error){
                logger.error('error while uploading media to cloudinary')
                reject(error)
            }else{
                resolve(result)
            }
        })
        uploadStream.end(file.buffer)
    }
)
}
const deleteMediaFromCloudinary=async(publicId)=>{
    try {
        const result = cloudinary.uploader.destroy(publicId)
        logger.info('deleted the media from the cloudinary successfully!',publicId)
        return result
    } catch (error) {
        logger.error('error while deleting media from cloudinary',error)
        throw error
    }
}
module.exports = { uploadMediaToCloudinary , deleteMediaFromCloudinary}