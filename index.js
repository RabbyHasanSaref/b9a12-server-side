const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');   
const app = express();
const port = process.env.PORT || 5000;  

// middleware
const corsOptions = {
    origin: ['http://localhost:5173', 'https://onlineedubd.netlify.app'],  
    credentials: true,
    optionSuccessStatus: 200, 
} 

app.use(cors(corsOptions));
app.use(express.json())
app.use(cookieParser())

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log(token)
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.Access_Secret_Token, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded
        next()
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Pass}@cluster0.3x1kphs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db('online_edu_bd').collection('online_edu_user');
        const teachCollection = client.db('online_edu_bd').collection('online_edu_teach')
        const addClassCollection = client.db('online_edu_bd').collection('online_edu_addclass')


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.Access_Secret_Token, {
                expiresIn: '365d',
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })
        // Logout
        app.get('/logout', async (req, res) => {
            try {
                res
                    .clearCookie('token', {
                        maxAge: 0,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    })
                    .send({ success: true })
                console.log('Logout successful')
            } catch (err) {
                res.status(500).send(err)
            }
        })


        // addclasscollection 
        app.post('/addclass', async (req, res) => {
            const addClass = req.body
            const result = await addClassCollection.insertOne(addClass)
            res.send(result)
        })

        app.patch('/update', async (req, res) =>{
            
        })

        app.delete('/delete', async (req, res) =>{

        })

        app.get('/allclass/:email', async (req, res) => {
            const email =  req.params.email
            const query = {email: email}
            const result = await addClassCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/allclass', async (req, res) => {
            const result = await addClassCollection.find().toArray()
            res.send(result)
        })



        // teacherCollection 
        app.put('/teacher', async (req, res) => {
            const teacher = req.body
            const query = { email: teacher?.email }

            const isExist = await teachCollection.findOne(query)
            if (isExist) return res.send(isExist)
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...teacher,
                    timestamp: Date.now(),
                },
            }
            const result = await teachCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        app.patch('/teacher/:id/:teacherEmail', async (req, res) => {
            const id = req.params.id
            const email = req.params.teacherEmail
            const filter = {_id: new ObjectId(id)}
            const updateDoc = {
                $set: {
                    role: 'teacher',
                    status: 'accepted'
                }
            }
            const result = await teachCollection.updateOne(filter, updateDoc)

            const query = {email: email}
            const updateRole = {
                $set: {
                    role: 'teacher',
                    status: 'accepted'
                }
            }
            const userRole = await userCollection.updateOne(query, updateRole)

            res.send({result, userRole})
        })

        app.get('/teacher',  async (req, res) => {
            const result = await teachCollection.find().toArray()
            res.send(result)
        })

        // userCollection 
        app.put('/user', async (req, res) => {
            const user = req.body
            const query = { email: user?.email }

            const isExist = await userCollection.findOne(query)
            if (isExist) return res.send(isExist)
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    ...user,
                    timestamp: Date.now(),
                },
            }
            const result = await userCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        app.patch('/user/:id', async (req, res) =>{
            const id =  req.params.id
            const query = {_id: new ObjectId(id)}
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(query, updateDoc)
            res.send(result)
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const result = await userCollection.findOne({ email })
            res.send(result)
          })

        app.get('/users',  async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('online edu bd server side open');
})

app.listen(port, () => {
    console.log(`online edu bd server side open ${port}`);
})
