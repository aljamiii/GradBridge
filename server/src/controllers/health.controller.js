// CONTROLLER (the C in MVC): the logic that runs when a route is hit.
// Controllers take the request, do the work (usually via models), and send a response.
import mongoose from "mongoose";

export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    service: "GradBridge API",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    time: new Date().toISOString(),
  });
};
