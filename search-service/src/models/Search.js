const mongoose = require('mongoose')
const logger = require('../utils/logger')

const searchSchema =  new mongoose.Schema({
    postId:{
        type:String,
        required:true,
        unique:true
    },
    userId:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        required:true
    }
},{timestamps:true})

searchSchema.index({content:'text'})
searchSchema.index({createdAt:-1})

const Search = mongoose.model('Search',searchSchema)

module.exports=Search;