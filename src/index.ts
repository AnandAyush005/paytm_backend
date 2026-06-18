import { configDotenv } from "dotenv";
import express from "express";
import { connectDB } from "./db/db.ts";
import router from "./routes/route.ts";
import cors from "cors";

configDotenv();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);


connectDB()
.then(()=>{
    console.log("Database connected successfully");
    app.listen(8080, ()=>{
    console.log("App is running on the port number 8080");
})
})
