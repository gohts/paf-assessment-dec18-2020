require('dotenv').config()
// load libraries
//dotenv mysql2 mongodb sha1
const morgan = require('morgan')
const express = require('express')
const mysql = require('mysql2/promise')
const { MongoClient } = require('mongodb');
const fs = require('fs');
const multer = require('multer');
const AWS = require('aws-sdk');
const sha1 = require('sha1');


// configure environment
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// configure sql
const pool  = mysql.createPool({
    connectionLimit : process.env.MYSQL_CONNECTION,
    host            : process.env.MYSQL_SERVER,
    port            : process.env.MYSQL_PORT,
    user            : process.env.MYSQL_USERNAME,
    password        : process.env.MYSQL_PASSWORD,
    database        : process.env.MYSQL_DATABASE,
    timezone        : '+08:00'
});

const SQL_GET_USER_DETAILS = `select * from user where user_id = ?;`;

const mkQuery = (sql, pool) => {
    return async (args) => {
        const conn = await pool.getConnection();
        try {
            const [result, _] = await conn.query(sql, args);
            return result
        } catch(err) {
            console.error('Error: ', err)
            throw err;
        } finally {
            conn.release();
        }
    }
}
const findUser = mkQuery(SQL_GET_USER_DETAILS, pool)

// configure mongo
const MONGO_URL = 'mongodb://localhost:27017';
const MONGO_DATABASE = 'paf2020';
const MONGO_COLLECTION = 'posts'

const mongoClient = new MongoClient(MONGO_URL, 
    { useNewUrlParser: true, useUnifiedTopology: true }
)

const mkPost = (params, image) => {
	return {
		ts: new Date(),
        title: params.title,
        comments: params.comments,
		image
	}
}

// configure multer and s3
const AWS_S3_HOSTNAME = process.env.AWS_S3_HOSTNAME;
const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY;
const AWS_S3_SECRET_ACCESSKEY = process.env.AWS_S3_SECRET_ACCESSKEY;
const AWS_S3_BUCKETNAME = process.env.AWS_S3_BUCKETNAME;

const spaceEndPoint = new AWS.Endpoint(AWS_S3_HOSTNAME);
const s3 = new AWS.S3({
    endpoint: spaceEndPoint,
    accessKeyId: AWS_S3_ACCESS_KEY,
    secretAccessKey: AWS_S3_SECRET_ACCESSKEY
});

const upload = multer({
    dest: process.env.TMP_DIR || './temp'
})

// new promise to read the file from multer fileUpload path
const readFile = (path) => new Promise(
    (resolve, reject) => {
        fs.readFile(path, (err, buff) => {
            if (null != err)
                reject(err)
            else
                resolve(buff)
        })
})

// new promise to upload file to s3
const putObject = (fileKey, file, buff, s3) => new Promise(
    (resolve, reject) => {
        const params = {
            Bucket: AWS_S3_BUCKETNAME,
            Key: fileKey,
            Body: buff,
            ACL: 'public-read',
            ContentType: file.mimetype,
			ContentLength: file.size
        }
        s3.putObject(params, (err, result) => {
            if (null != err)
                reject(err)
            else
                resolve(result)
        })
    }
)

// create express instance
const app = express()
app.use(morgan('combined'))
app.use(express.json());
app.use(express.urlencoded({extended: true}))

// configure routes
// POST /api/login
app.post('/api/login', async (req, res) => {

    const inputUser = req.body['user_id']
    const inputPassword = sha1(req.body['password'])
    res.type('application/json');

    try {
        const result = await findUser([inputUser])

        // check whether user exists
        if (result.length <= 0) {
            res.status(401)
            res.json({ message: `Cannot find user ${inputUser}`})
            return
        }
        
        // check whether password matches
        if (result[0].password != inputPassword) {
            res.status(401)
            res.json({ message: `Password doesn't match for user ${inputUser}`})
            return 
        }

        // user and password matches
        res.status(200)
        res.json({ message: `Authentication successful for user ${inputUser}`})

    } catch (e) {
        console.error(e)
        res.status(500).json({error: e});
    }
})

// POST /api/share
app.post('/api/share', 

    upload.single('imageData'), 
    
    async (req, res, next) => {

        const inputUser = req.body['user_id']
        const inputPassword = sha1(req.body['password'])
        res.type('application/json');
    
        try {
            const result = await findUser([inputUser])
    
            // check whether user exists
            if (result.length <= 0) {
                res.status(401)
                res.json({ message: `Cannot find user ${inputUser}`})
                return
            }
            
            // check whether password matches
            if (result[0].password != inputPassword) {
                res.status(401)
                res.json({ message: `Password doesn't match for user ${inputUser}`})
                return 
            }

            next();

        } catch (e) {
            console.error(e)
            res.status(500).json({error: e});
        }
    },

    async (req, res) => {
        console.log('>>>req body back',req.body);
        console.log('>>>req file back',req.file);

        const fileKey = new Date().getTime() + '_' + req.file.filename;
        const doc = mkPost(req.body, fileKey)

        readFile(req.file.path)
            .then(buff => 
                putObject(fileKey, req.file, buff, s3)
            )
            .then(() => 
                mongoClient.db(MONGO_DATABASE).collection(MONGO_COLLECTION)
                    .insertOne(doc)
            )
            .then(results => {
                console.info('insert results: ', results.ops[0])
                fs.unlink(req.file.path, () => { })
                res.status(200)
                res.json({ id: results.ops[0]._id })
            })
            .catch(error => {
                console.error('insert error: ', error)
                res.status(500)
                res.json({ error })
            })

    }
)

// load static resources
app.use(express.static(__dirname + '/frontend'));

// start the application
const p0 = (async () => {
    const conn = await pool.getConnection();
    await conn.ping()
    conn.release()
    return true
})();

const p1 = (async () => {
    await mongoClient.connect();
    return true
})();

Promise.all([ p0, p1 ])
    .then((r) => {
        app.listen(PORT, () => {
            console.info(`Application started on PORT: ${PORT} at ${new Date()}`);
        })
    })
    .catch(e => {
        console.error(`Cannot connect to database: `,e)
	});