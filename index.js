import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// USE .env VARIABLES
const MONGO_URI = process.env.MONGO_URI;
const DBNAME = process.env.DBNAME;
const COLLECTION = process.env.COLLECTION;

// Create ONE shared Mongo client
const client = new MongoClient(MONGO_URI);

let db;

// Connect to Mongo BEFORE starting the server
async function init() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        db = client.db(DBNAME);

        app.listen(process.env.PORT ?? 8081, process.env.HOST ?? "0.0.0.0", () => {
            console.log(`Server running at http://0.0.0.0:8081`);
        });

    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

init();

/* ROUTES */

// GET all contacts
app.get("/contacts", async (req, res) => {
    try {
        const results = await db.collection(COLLECTION).find({}).toArray();
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load contacts" });
    }
});

// POST new contact
app.post("/contacts", async (req, res) => {
    try {
        const newDoc = req.body;
        const result = await db.collection(COLLECTION).insertOne(newDoc);
        res.status(201).json({ message: "Contact added", result });
    } catch (err) {
        res.status(500).json({ message: "Failed to add contact" });
    }
});

// GET one contact
app.get("/contacts/:name", async (req, res) => {
    try {
        const contact = await db
            .collection(COLLECTION)
            .findOne({ contact_name: req.params.name });

        if (!contact) return res.status(404).json({ message: "Not found" });

        res.json(contact);
    } catch (err) {
        res.status(500).json({ message: "Error fetching contact" });
    }
});

// PUT update contact
app.put("/contacts/:name", async (req, res) => {
    try {
        const result = await db.collection(COLLECTION).updateOne(
            { contact_name: req.params.name },
            { $set: req.body }
        );

        res.json({ message: "Updated", result });
    } catch (err) {
        res.status(500).json({ message: "Failed to update" });
    }
});

// DELETE contact
app.delete("/contacts/:name", async (req, res) => {
    try {
        const result = await db
            .collection(COLLECTION)
            .deleteOne({ contact_name: req.params.name });

        res.json({ message: "Deleted", result });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete" });
    }
});
