import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Very simple in-memory data for demos
const user = {
  id: 1,
  name: "Demo User",
  role: "tester",
};

const todos = [
  { id: 1, title: "Learn custom hooks", completed: false },
  { id: 2, title: "Wire up dummy backend", completed: true },
  { id: 3, title: "Practice fetch patterns", completed: false },
];

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/profile", (_req, res) => {
  res.json(user);
});

app.get("/api/todos", (_req, res) => {
  res.json(todos);
});

app.post("/api/echo", (req, res) => {
  res.json({ received: req.body ?? null });
});

const port = Number(process.env.DUMMY_BACKEND_PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[dummy-backend] Listening on http://localhost:${port}`);
});
