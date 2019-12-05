const express = require('express');
const cors = require('cors');
const multer = require('multer');
const uuid = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const errorNotFound = { error: 'id.not_found' };

let nextId = 1;
let posts = [];
let types = '';

const server = express();
server.use(express.json());
server.use(express.urlencoded());
server.use(cors());

const publicPath = path.resolve(__dirname, 'public');
fs.ensureDirSync(publicPath);
server.use('/static', express.static(publicPath));



const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, publicPath);
    },
    filename(req, file, callback) {
        const name = uuid.v4();

        console.log(file.mimetype);

        if (file.mimetype === 'image/png') {
            types = 'image';
            callback(null, `${name}.png`);
            return;
        }
        if (file.mimetype === 'image/jpeg') {
            callback(null, `${name}.jpg`);
            types = 'image';
            return;
        }
        if (file.mimetype === 'application/octet-stream') {
            types = 'video';
            callback(null, `${name}.webm`);
            return;
        }
        if (file.mimetype === 'video/mp4') {
            types = 'video';
            callback(null, `${name}.mp4`);
            return;
        }
        if (file.mimetype === 'audio/mp3') {
            types = 'audio'
            callback(null, `${name}.webm`);
            return;
        }
        callback(new Error('Invalid media type'));
    },
});


const fileUpload = multer({ storage }).single('media');
server.post('/upload', (req, res) => {
    // console.log(req.body)
    fileUpload(req, res, err => {
        if (err) {
            res.status(400).send(err);
            return;
        }
        // console.log(types)
        setTimeout(() => {
            res.send({ name: req.file.filename, types });
        }, 5000);

    });
});


//============================================================================================================
function findPostIndexById(id) {
    return posts.findIndex(o => o.id === id);
}

server.get('/posts/seenPosts/:lastSeenId', (req, res) => {
    const lastSeenId = Number(req.params.lastSeenId);
    const index = findPostIndexById(lastSeenId);
    let lastPosts;
    if (lastSeenId === 0) {
        if (posts.length <= 5) {
            lastPosts = posts;
        } else {
            lastPosts = posts.slice(posts.length - 5);
        }

    }
    else if (lastSeenId > 0 && lastSeenId <= 5) {
        lastPosts = posts.slice(0, index);

    }
    else {
        lastPosts = posts.slice(index - 5, index);
    }

    res.send(lastPosts);
});


server.get('/posts/:firstSeenId', (req, res) => {
    const firstSeenId = Number(req.params.firstSeenId);
    res.send(posts.slice(firstSeenId));
    // console.log(firstSeenId)   
});


server.post('/posts', (req, res) => {
    const body = req.body;
    const id = body.id;
    if (id === 0) {
        const newPost = {
            id: nextId++,
            content: body.content,
            type: body.type,
            file: body.file,
            likes: 0,
        }
        posts.push(newPost)
        res.send(newPost)
        return;
    }
    const index = findPostIndexById(id);
    if (index === -1) {
        res.status(404).send(errorNotFound);
        return;
    }
});

server.delete('/posts/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = findPostIndexById(id);
    if (index === -1) {
        res.status(404).send(errorNotFound);
        return;
    }
    posts = posts.filter(o => o.id != id);
    res.send(posts);
});

server.post('/posts/:id/likes', (req, res) => {
    const id = Number(req.params.id);
    const index = findPostIndexById(id);
    if (index === -1) {
        res.status(404).send(errorNotFound);
        return;
    }
    posts = posts.map(o => o.id !== id ? o : { ...o, likes: o.likes + 1 })
    res.send(posts[index]);
});

server.delete('/posts/:id/likes', (req, res) => {
    const id = Number(req.params.id);
    const index = findPostIndexById(id);
    if (index === -1) {
        res.status(404).send(errorNotFound);
        return;
    }
    posts = posts.map(o => o.id !== id ? o : { ...o, likes: o.likes - 1 })
    res.send(posts[index]);
});

server.listen(process.env.PORT || 9999);