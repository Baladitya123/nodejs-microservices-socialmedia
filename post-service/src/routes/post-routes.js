const express = require('express');
const router = express.Router();
const { createPost, getAllPosts ,getPost,deletePost} = require('../controllers/post-controllers');
const authenticateRequest = require('../middilewares/authMiddleware');

router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/get-posts', getAllPosts);
router.get('/:id',getPost)
router.delete('/:id',deletePost)

module.exports = router;
