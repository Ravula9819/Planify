require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));  // Serve static files like HTML, CSS, JS


// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hello123", // Change to your MySQL password
  database: "planify",
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected...");
});

// ✅ Add Task (POST)
app.post("/add-task", (req, res) => {
  const { taskname, term, category, date, time } = req.body;
  if (!taskname || !term || !category || !date || !time) {
    return res.status(400).json({ error: "⚠ All fields are required!" });
  }

  const sql = "INSERT INTO tasks (taskname, term, category, date, time, status) VALUES (?, ?, ?, ?, ?, 'pending')";
  db.query(sql, [taskname, term, category, date, time], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Task added successfully!", taskId: result.insertId });
  });
});

// ✅ Get All Tasks (GET)
app.get("/tasks", (req, res) => {
  const sql = "SELECT * FROM tasks ORDER BY date, time";
  
  db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
  });
});



// ✅ Mark Task as Completed (PUT)
app.put("/complete-task/:id", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE tasks SET status = 'completed' WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Task marked as completed!" });
  });
});



// ✅ Delete Task (DELETE)
app.delete("/delete-task/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Task deleted successfully!" });
  });
});

const nodemailer = require("nodemailer");

// ✅ Configure Email Transporter (Use Your Gmail)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com", // Replace with your email
        pass: "your-app-password" // Use an App Password, NOT your real password
    }
});

// ✅ Function to Send Email Notifications
async function sendEmailNotification(to, subject, text) {
    try {
        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: to,
            subject: subject,
            text: text
        });
        console.log("✅ Email Sent Successfully!");
    } catch (error) {
        console.error("❌ Error Sending Email:", error);
    }
}

// ✅ Example Usage
sendEmailNotification("recipient@example.com", "Task Reminder", "Don't forget to complete your task!");

const cron = require("node-cron");

// ✅ Run Every Minute (for testing) OR Change to "0 9 * * *" for 9 AM daily
cron.schedule("* * * * *", async () => {
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; // Get today's date

    db.query("SELECT * FROM tasks WHERE date = ?", [formattedDate], async (err, results) => {
        if (err) {
            console.error("❌ Error fetching tasks:", err);
            return;
        }

        for (let task of results) {
            await sendEmailNotification(task.email, "Task Reminder", `Reminder: '${task.taskname}' is scheduled for today at ${task.time}`);
        }
    });
});



// ✅ Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
