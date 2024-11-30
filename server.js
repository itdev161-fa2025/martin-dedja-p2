import express from "express";
import connectDatabase from "./config/db.js";
import { check, validationResult } from "express-validator";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "config";
import User from "./models/User.js";
import Task from "./models/Task.js";
import auth from "./middleware/auth.js";

const app = express();

connectDatabase();

app.use(express.json({ extended: false }));
app.use(
  cors({
    origin: "http://localhost:3000",
    origin: "http://localhost:3001",
  })
);

app.get("/", (req, res) =>
  res.send("HTTP GET request sent to the root API endpoint")
);

app.post(
  "/api/users",
  [
    check("name", "Please enter your name").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      returnToken(user, res);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

app.post(
  "/api/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      returnToken(user, res);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

const returnToken = (user, res) => {
  const payload = {
    user: {
      id: user.id,
      name: user.name,
    },
  };

  jwt.sign(
    payload,
    config.get("jwtSecret"),
    { expiresIn: "10hr" },
    (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    }
  );
};

app.post("/api/tasks", auth, async (req, res) => {
  try {
    const { task, status } = req.body;

    const newTask = new Task({
      task,
      status,
      user: req.user.id,
    });

    await newTask.save();
    res.json(newTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/api/tasks", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.put("/api/tasks/:id", auth, async (req, res) => {
  try {
    const { task, status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { task, status },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ msg: "Task not found" });
    }
    res.json(updatedTask);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ msg: "Task removed" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
