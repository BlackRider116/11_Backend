const express = require('express');
const cors = require('cors');
const multer = require('multer');
const uuid = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const errorNotFound = { error: 'id.not_found' };

let nextId = 13;
let posts = [
    { id: 1, content: 'Старый пост 1', type: '', file: '', likes: -1 },
    { id: 2, content: 'Старый пост 2', type: '', file: '', likes: -2 },
    { id: 3, content: 'Старый пост 3', type: '', file: '', likes: -3 },
    { id: 4, content: 'Старый пост 4', type: '', file: '', likes: -4 },
    { id: 5, content: 'Старый пост 5', type: '', file: '', likes: -5 },
    { id: 6, content: 'Старый пост 6', type: '', file: '', likes: -6 },
    { id: 7, content: 'Старый пост 7', type: '', file: '', likes: -7 },
    { id: 8, content: 'Аудио пост. Трек не выбирал, просто скачал первый попавшийся 😊', type: 'audio', file: 'http://localhost:9999/static/e5d36551-0620-4d80-b1bf-98e16c1ebf8c.webm', likes: 33 },
    { id: 9, content: 'Видео пост. Видео так же, первый попавшийся 😁', type: 'video', file: 'http://localhost:9999/static/b92e0cbc-f293-4297-8d3c-7ec179944502.mp4', likes: 14 },
    { id: 10, content: 'Пост с картинкой. А картинка в ПК завалялась в документах 😋', type: 'image', file: 'http://localhost:9999/static/69b6c0e0-8e2b-4fc9-ad30-8025d2ad1ecb.jpg', likes: 7 },
    { id: 11, content: 'Еще есть функция проверки новых записей (кнопка "Показать новые записи"), скопировать ссылку, открыть в новой вкладке и добавить записи', type: '', file: '', likes: 0 },
    { id: 12, content: 'Запись стрима (10 сек), фото с камеры. Данные хранятся на сервере, обнуляется сервер после 1ч простоя', type: '', file: '', likes: 0 },
];
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
        // res.send(newPost)
        console.log(posts)
        res.send(posts[posts.length - 1])
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

