// Entry point: load environment variables, connect to the database, start the server.
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for requests.
await connectDB();

app.listen(PORT, () => {
  console.log(`✅ GradBridge API running at http://localhost:${PORT}`);
});
