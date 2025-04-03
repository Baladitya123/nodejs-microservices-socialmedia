const express = require('express')
const router = express.Router()
const multer = require('multer')

const { uploadMedia,getAllMedia } = require('../controllers/media-controller')
const authenticateRequest = require('../middilewares/authMiddleware')
const logger = require('../utils/logger')

router.use(authenticateRequest)

//configure multer for uploading file
const upload = multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize:5*1024*1024
    }
}).single("file")

router.post('/upload',(req,res,next)=>{
    upload(req,res,(err)=>{
        if(err instanceof multer.MulterError){
            logger.error('multer error while uploading media',err)
            return res.status(400).json({
                success:false,
                message:'multer error while uploading media',
                error:err.message,
                stack:err.stack
            })
        } else if(err){
            logger.error('unknown error occur while uploading media in multer',err)
            return res.status(500).json({
                success:false,
                message:'unknown error occur while uploading media in multer',
                error:err.message,
                stack:err.stack
            })
        }
        if(!req.file){
            return res.status(400).json({
                success:false,
                message:'file is not found'
            })
        }
        next()
    })
},uploadMedia)
router.get("/get",authenticateRequest,getAllMedia);

module.exports = router;