// Import necessary modules
const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

// Verify environment variables
const requiredEnvVars = [
  "DATABASE_HOST",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "DATABASE",
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    process.exit(1);
  }
});

// Create an Express application
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse URL-encoded and JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure session middleware
app.use(
  session({
    key: "session_cookie_name",
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Create a MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database!", err.message);
  } else {
    console.log("Database connected successfully!");
  }
});

// Serve the home page as the landing page
app.get("/", (req, res) => {
  res.sendFile("home.html", { root: path.join(__dirname, "public") });
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: path.join(__dirname, "public") });
});

// Serve the registration page
app.get("/register", (req, res) => {
  res.sendFile("register.html", { root: path.join(__dirname, "public") });
});

// Serve the dashboard page
app.get("/dashboard", (req, res) => {
  if (req.session.user && req.session.user.id) {
    res.sendFile("dashboard.html", { root: path.join(__dirname, "public") });
  } else {
    res.redirect("/login");
  }
});

// User registration
app.post("/api/register", async (req, res) => {
  const { email, username, password } = req.body;

  // Basic validation
  if (!email || !username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check for existing user
    const existingUser = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE email = ? OR username = ?",
        [email, username],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email or username already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const sql = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
    const values = [email, username, hashedPassword];

    await new Promise((resolve, reject) => {
      db.query(sql, values, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// User login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  // Validate request body
  if (!username || !password) {
    return res.status(400).send("Username and password are required!");
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Error fetching users:", err.message);
      return res.status(500).send("Internal Server Error");
    }

    // Check if user exists
    if (results.length > 0) {
      const user = results[0];

      // Check password match
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = { id: user.id, username: user.username };
        return res.redirect("/dashboard");
      }
    }

    // If we reach here, authentication failed
    return res.status(401).send("Invalid Username or Password!");
  });
});

// Get all users
app.get("/api/users", (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a user by ID
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(results[0]);
  });
});

// Get all expenses for a user
app.get("/api/expenses", (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.session.user.id;
  const sql = "SELECT * FROM expenses WHERE userId = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching expenses:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a single expense by ID
app.get("/api/expenses/:id", (req, res) => {
  const expenseId = req.params.id;
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.session.user.id;
  const sql = "SELECT * FROM expenses WHERE id = ? AND userId = ?";
  db.query(sql, [expenseId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(results[0]);
  });
});

// Route to get all categories
app.get("/api/categories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// Add an expense
app.post("/api/expenses", (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { category, amount } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ error: "Category and amount are required" });
  }

  const userId = req.session.user.id;
  const sql =
    "INSERT INTO expenses (userId, category, amount) VALUES (?, ?, ?)";
  db.query(sql, [userId, category, amount], (err, result) => {
    if (err) {
      console.error("Error adding expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res
      .status(201)
      .json({ message: "Expense added successfully", id: result.insertId });
  });
});

// Update an expense by ID
app.put("/api/expenses/:id", (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const expenseId = req.params.id;
  const { category, amount } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ error: "Category and amount are required" });
  }

  const userId = req.session.user.id;
  const sql =
    "UPDATE expenses SET category = ?, amount = ? WHERE id = ? AND userId = ?";
  db.query(sql, [category, amount, expenseId, userId], (err, result) => {
    if (err) {
      console.error("Error updating expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ message: "Expense updated successfully" });
  });
});

// Delete an expense by ID
app.delete("/api/expenses/:id", (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const expenseId = req.params.id;
  const userId = req.session.user.id;
  const sql = "DELETE FROM expenses WHERE id = ? AND userId = ?";
  db.query(sql, [expenseId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting expense:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  });
});

// Handle logout
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
