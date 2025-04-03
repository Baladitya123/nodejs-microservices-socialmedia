const express = require('express')
const router = express.Router()

const { searchPost } = require('../controllers/search-controller')
const authenticateRequest = require('../middilewares/authMiddleware')

router.use(authenticateRequest)

router.get('/posts',searchPost)

module.exports=router