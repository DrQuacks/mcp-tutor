import express from "express";
import cors from "cors";

type Todos = {
    id: number;
    title: string;
    completed: boolean;
}

const app = express();

app.use(cors());
app.use(express.json());

// Very simple in-memory data for demos
const user = {
  id: 1,
  name: "Demo User",
  role: "tester",
};

let nextTodoId = 4;

const todos: Todos[] = [
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

app.post("/api/todos", (req, res) => {
  const title = (req.body?.title ?? "").toString().trim();
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTodo: Todos = {
    id: nextTodoId++,
    title,
    completed: false,
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.patch("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  if (typeof req.body?.title === "string") {
    todo.title = req.body.title;
  }
  if (typeof req.body?.completed === "boolean") {
    todo.completed = req.body.completed;
  }

  res.json(todo);
});

app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const [removed] = todos.splice(index, 1);
  res.json(removed);
});

app.post("/api/echo", (req, res) => {
  res.json({ received: req.body ?? null });
});

const port = Number(process.env.DUMMY_BACKEND_PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[dummy-backend] Listening on http://localhost:${port}`);
});
