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


    app.post('/api/books', async (req, res) => {
      // console.log(req.body)
      const booksData = req.body;
      console.log("req", req.body)
      const addData = {
        ...booksData,
        createdAt: new Date(),
        status: "Pending Approval",
        isPublished: false

      }
      const result = await bookCollection.insertOne(addData)
      console.log(result)
      res.send(result)
    })

    app.get("/api/librarian/books/:email", async (req, res) => {
      try {
        const { email } = req.params;

        const result = await bookCollection
          .find({ ownerEmail: email })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });



    app.get("/api/books", async (req, res) => {
      try {
        const result = await bookCollection
          .find({
            isPublished: true,
          })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    app.get("/api/deliveries", async (req, res) => {

      const result = await deliveriCollection.find().toArray();
      console.log(result)
      res.send(result);
    });
  // Librarian delevary, displad
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
  //  books delete 
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

    // Librain updata btn click
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

  // all published book 
    app.get("/api/books/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await bookCollection.findOne({
          _id: new ObjectId(id),
          isPublished: true, // শুধুমাত্র Published বই দেখাবে
        });

        if (!result) {
          return res.status(404).send({
            success: false,
            message: "Book not found",
          });
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

// admin book appval 
    app.get("/api/admin/book-approval", async (req, res) => {
      try {
        const result = await bookCollection
          .find({ status: "Pending Approval" })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    //  admin book appeove click
    app.patch("/api/admin/book-approval/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await bookCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "Published",
              isPublished: true,
            },
          }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });


    // total book liberin overView
    app.get("/api/librarian/overview/:email", async (req, res) => {
      try {
        const { email } = req.params;

        const totalBooks = await bookCollection.countDocuments({
          ownerEmail: email,
        });

        res.send({
          totalBooks,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });
    //barchart 
    app.get("/api/librarian/chart/:email", async (req, res) => {
      try {
        const { email } = req.params;

        const result = await bookCollection
          .aggregate([
            {
              $match: {
                ownerEmail: email,
              },
            },
            {
              $group: {
                _id: "$category",
                total: { $sum: 1 },
              },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: error.message,
        });
      }
    });

    // user book detail requent deleberyBtn click
    app.post("/api/deliveries", async (req, res) => {
      try {
        const deliveryData = req.body;

        const result = await deliveriCollection.insertOne({
          ...deliveryData,
          requestDate: new Date(),
          status: "Pending",
        });

        res.send({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // user overView total Red books / total pending
   app.get("/api/user/overview/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const totalBooksRead = await deliveriCollection.countDocuments({
      userEmail: email,
      status: "Delivered",
    });

    const pendingDeliveries = await deliveriCollection.countDocuments({
      userEmail: email,
      status: "Pending",
    });

    // পরে totalSpent যোগ করবে

    res.send({
      totalBooksRead,
      pendingDeliveries,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// user Delevery history
app.get("/api/user/reading-list/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const result = await deliveryCollection
      .find({
        userEmail: email,
        status: "Delivered",
      })
      .toArray();

    res.send(result);
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

