// MongoDB connection via Mongoose.
import mongoose from "mongoose";
import dns from "node:dns";

// Atlas "mongodb+srv://" URIs need SRV DNS lookups, which some ISP/local DNS
// setups refuse for Node's resolver. Point it at Google + Cloudflare DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    // Beginner-friendly: don't crash if the DB isn't set up yet —
    // the server still runs so you can test routes that don't need data.
    console.warn("⚠️  MONGO_URI is not set in server/.env — running WITHOUT a database.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`🍃 MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // a wrong URI is a real problem — stop so you notice
  }
};

export default connectDB;
