
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validRegistration,validLogin }= require('../utils/validation')
const RefreshToken = require('../models/RefreshToken')





//user registrarion

const registerUser = async (req,res)=>{
    logger.info('Registration endpoint hit')
    try {
        //validate schema
        const {error}= await validRegistration(req.body)
        if(error){
           logger.warn('validation error',error.details[0].message)
            return res.status(400).json({
               success:false,
              message:error.details[0].message
           })
        }
        const {username,email,password}=req.body

        let user = await User.findOne({$or :[{email},{username}]})
        if(user){
            logger.warn('user already exists');
            return res.status(400).json({
                success:false,
                message:"user already exists"
            })
        }
        user = new User({username,email,password});
        await user.save()
        logger.info('user saved successfully',user._id);

        const {accessToken,refreshToken} = await generateToken(user)
        res.status(201).json({
            success:true,
            message:'user registered successfully',
            accessToken,
            refreshToken
        })
        
        
    } catch (error) {
        logger.error('registration error occured',error)
        res.status(500).json({
            success:false,
            message:'internal server error'
        }
        )
    }
}

//user login
const loginUser = async(req,res)=>{
    logger.info('login endpoint hit')
    try {
        const {error} = await validLogin(req.body);
        if(error){
            logger.warn('validation error',error.details[0].message)
             return res.status(400).json({
                success:false,
               message:error.details[0].message
            })
         }
    
        const { email, password } = req.body;
        const user = await User.findOne({ email });
    
        if (!user) {
            logger.warn('invalid user');
            return res.status(400).json({
                success: false,
                message: 'invalid credentials'
            });
        }
    
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn('invalid password');
            return res.status(400).json({
                success: false,
                message: 'invalid password'
            });
        }
    
        const { accessToken, refreshToken } = await generateToken(user);
        res.status(200).json({ accessToken, refreshToken, userId: user._id });
    } catch (err) {
        logger.error('Login error', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
//refresh token
const refreshTokenUser = async(req,res)=>{
    logger.info('refreshtoken endpoint hit')
    try {
        const { refreshToken}=req.body
        if(!refreshToken){
            logger.warn('refreshtoken is missing')
            return res.status(400).json({
                success:false,
                message:'refresh token is missing'
            })
        }
        const storedToken = await RefreshToken.findOne({token:refreshToken})
        if(!storedToken || storedToken.expireAt<new Date()){
            logger.warn('invalid or expired refresh token')
            return res.status(404).json({
                success:false,
                message:'invalid or expired refresh token'
            })
        }
        const user = await User.findById(storedToken.user)
        if(!user){
            logger.warn('user not found')
            return res.status(404).json({
                success:false,
                message:'user not found'
            })
        }
        const {accessToken:newAccessToken,refreshToken:newRefreshToken}= await generateToken(user)
        // delete the old one
        await RefreshToken.deleteOne({_id:storedToken._id})
        return res.status(200).json({
            accessToken:newAccessToken,
            refreshToken:newRefreshToken
        })

    } catch (err) {
        logger.error('refresh token  error', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
//logout
const logoutUser = async(req,res)=>{
    logger.info('logout endpoint hit')
    try {
        const { refreshToken }= req.body
        if(!refreshToken){
            logger.warn('refreshtoken is missing')
            return res.status(400).json({
                success:false,
                message:'refresh token is missing'
            })
        }
        await RefreshToken.deleteOne({_id:refreshToken})
        logger.info('refresh token deleted for logout')
        return res.status(200).json({
            success:true,
            message:'user loggedout successfully'
        })

        
    } catch (err) {
        logger.error('error while loggingout ', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
        
    }
}
module.exports = { registerUser , loginUser , refreshTokenUser,logoutUser}