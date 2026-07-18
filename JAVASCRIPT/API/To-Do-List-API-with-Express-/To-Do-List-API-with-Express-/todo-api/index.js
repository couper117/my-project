const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [
    { id: 1, title: "Finish homework", completed: false },
    { id: 2, title: "Go to the gym", completed: true },
    { id: 3, title: "Buy groceries", completed: false }
];

app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/tasks', (req, res) => {
    const newTask = {
        id: Date.now(),
        title: req.body.title || "New Task",
        completed: req.body.completed || false
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.get("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);  
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ error: "Task not found" });
    }
});


app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updatedtask = req.body;
    const task =  tasks.findIndex(t => t.id === id);
     tasks[task].title = updatedtask.title;
    tasks[task].completed = updatedtask.completed;
     res.json(tasks[task]);

app.patch('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (task) {
        Object.assign(task, req.body);
        res.json(task);
    } else {
        res.status(404).json({ error: "Task not found" });
    }
});

app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});