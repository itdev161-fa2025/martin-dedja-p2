import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

const Task = mongoose.model("task", TaskSchema);

export default Task;
