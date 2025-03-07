const joi = require('joi')


const validRegistration = async(data)=>{
    const schema = joi.object({
        username:joi.string().min(3).max(50).required(),
        email:joi.string().email().required(),
        password:joi.string().min(3).required()
    })
     return await schema.validate(data)
}
const validLogin = async(data)=>{
    const schema = joi.object({
        email:joi.string().email().required(),
        password:joi.string().min(3).required()
    })
     return await schema.validate(data)
}
module.exports = { validRegistration, validLogin}