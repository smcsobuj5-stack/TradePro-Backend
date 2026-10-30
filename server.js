
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is missing");
}

// Temporary test storage.
// Restart হলে এই তথ্য মুছে যাবে।
const users = [];

app.get("/", (req, res) => {
  res.json({
    app: "TradePro",
    status: "Backend running",
    mode: "TEST ONLY"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Register
app.post("/api/register", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({
      error: "Invalid username"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters"
    });
  }

  if (users.some(u => u.username === username)) {
    return res.status(409).json({
      error: "Username already exists"
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: users.length + 1,
    username,
    passwordHash,
    balance: 10000
  };

  users.push(user);

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "1d" }
  );

  res.status(201).json({
    message: "Account created",
    token,
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance
    }
  });
});

// Login
app.post("/api/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const user = users.find(u => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("TradePro server running on port " + PORT);
});
