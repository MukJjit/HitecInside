const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var Comment = require('../models/Comment');
var Post = require('../models/Post');
var util = require('../util');

//create
router.post('/', util.isLoggedin, checkPostId, (req, res) => {
    var post = res.locals.post;

    req.body.author = req.user._id;
    req.body.post = post._id;

    Comment.create(req.body, (err, comment) => {
        if(err) {
            req.flash('commentForm', {_id: null, form:req.body});
            req.flash('commentError', { _id: null, parentComment: req.body.parentComment, errors:util.parseError(err)});
        }

        return res.redirect('/posts/'+post._id+res.locals.getPostQueryString());
    });
});

//update
router.put('/:id', util.isLoggedin, checkPermission, checkPostId, (req, res) => {
    var post = res.locals.post;

    req.body.updatedAt = Date.now();
    Comment.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, (err, comment) => {
        if(err) {
            req.flash('commentForm', { _id: req.params.id, form:req.body });
            req.flash('commentError', { _id: req.params.id, parentComment: req.body.parentComment, errors:util.parseError(err)});
        }

        return res.redirect('/posts/'+post._id+res.locals.getPostQueryString());
    });
});

//destroy
router.delete('/:id', util.isLoggedin, checkPermission, checkPostId, (req, res) => {
    var post = res.locals.post;

    Comment.findOne({_id:req.params.id}, (err, comment) => {
        if(err) return res.json(err);

        //save updated comment
        comment.isDeleted = true;
        comment.save((err, comment) => {
            if(err) return res.json(err);

            return res.redirect('/posts/'+post._id+res.locals.getPostQueryString());
        });
    });
});

module.exports = router;

function checkPostId(req, res, next) {
    Post.findOne({_id:req.query.postId}, (err, post) => {
        if(err) return res.json(err);

        res.locals.post = post;

        next();
    });
}

function checkPermission(req, res, next) {
    Comment.findOne({ _id:req.params.id }, (err,comment) => {
        if(err) return res.json(err);

        if(comment.author != req.user.id) return util.noPermission(req, res);

        next();
    });
}