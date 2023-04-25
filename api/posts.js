const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostById, getPostsByTagName } = require('../db');
const { requireUser } = require('./utils');

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/)
  const postData = {};

  // only send the tags if there are some to send
  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    // Add authorId, title, content, and tags (if any) to postData object
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;
  
    // Call the createPost function to create the post and tags
    const post = await createPost(postData);
  
    // If the post is successfully created, send it back in the response
    if (post) {
      res.send({ post });
    } else {
      // If the post is not created, send an appropriate error object
      next({
        name: "PostCreationError",
        message: "There was a problem creating the post",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
  
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.use((req, res, next) => {
    console.log("A request is being made to /api/posts");
  
    next();
  });
  
  postsRouter.get('/', async (req, res, next) => {
    try {
      const allPosts = await getAllPosts();
  
      const posts = allPosts.filter(post => {
        return post.active || (req.user && post.author.id === req.user.id);
      });
  
      res.send({
        posts
      });
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

  postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
      const post = await getPostById(req.params.postId);
  
      if (post && post.author.id === req.user.id) {
        const updatedPost = await updatePost(post.id, { active: false });
  
        res.send({ post: updatedPost });
      } else {
        // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
        next(post ? { 
          name: "UnauthorizedUserError",
          message: "You cannot delete a post which is not yours"
        } : {
          name: "PostNotFoundError",
          message: "That post does not exist"
        });
      }
  
    } catch ({ name, message }) {
      next({ name, message })
    }
  });

  postsRouter.get('/tags/:tagName/posts', async (req, res, next) => {
    const { tagName } = req.params;
    
    try {
      const allPosts = await getPostsByTagName(tagName);
  
      const posts = allPosts.filter(post => {
        return post.active || (req.user && post.author.id === req.user.id);
      });
  
      res.send({
        posts
      });
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

module.exports = postsRouter;