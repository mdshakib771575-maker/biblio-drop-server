const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
dotenv.config(); 
app.use(cors());
app.use(express.json())

const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
  await client.connect();
   const db = client.db('biblio-drop-db')
    const bookCollection = db.collection("books");
    const deliveriCollection = db.collection("deliveries");


     app.post('/api/books',async(req,res)=>{
      // console.log(req.body)
      const booksData=req.body;
     const addData = {
     ...booksData,
       createdAt: new Date(),
       status:"Pending Approval",
        isPublished: false

     }
     const result = await bookCollection.insertOne(addData)
     console.log(result)
     res.send(result)
    })

    app.get("/api/books", async (req, res) => {
  const email = req.params.email;
  console.log(email)

  const result = await bookCollection.find().toArray();
   console.log(result)
  res.send(result);
});
    app.get("/api/deliveries", async (req, res) => {
      
  const result = await deliveriCollection.find().toArray();
   console.log(result)
  res.send(result);
});
    
app.patch("/api/deliveries/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    console.log("ID:", id);
    console.log("Status:", status);

    const result = await deliveriCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
        },
      }
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const id = req.params.id;


    const result = await bookCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.send({
      success: result.deletedCount > 0,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});


app.patch("/api/books/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const result = await bookCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updatedData,
      }
    );

    res.send({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

