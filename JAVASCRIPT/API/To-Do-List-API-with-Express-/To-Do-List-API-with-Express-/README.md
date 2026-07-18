# To-Do List API (Express.js)

 Project Description
This is a RESTful API built with **Node.js** and **Express.js**. It manages a To-Do list stored in a server-side array, allowing users to view, add, update, and delete tasks.

 How to Run the Server
1. **Initialize & Install:**
   ```bash
   npm init -y
   npm install express
   node index.js
   Method,Endpoint,Description
GET,/tasks,View all tasks.
POST,/tasks,Add a new task (JSON Body: title).
PUT,/tasks/:id,Replace a task entirely.
PATCH,/tasks/:id,"Update part of a task (e.g., completed)."
DELETE,/tasks/:id,Remove a task by ID.


Postman Screenshots


GET All Tasks:
![alt text](<Screenshot 2026-01-25 133340.png>)


POST New Task:
![alt text](<Screenshot 2026-01-25 124229.png>)

put New Updates:
![alt text](<Screenshot 2026-01-25 135326.png>)


PATCH Update:
![alt text](<Screenshot 2026-01-25 135449.png>)

DELETE Task:
![alt text](<Screenshot 2026-01-25 135639.png>)


Presentation video[https://docs.google.com/videos/d/1eoUOw5d2R7t3FLfna-nO515lXVMTnLdpn4yuqbl68fw/edit?usp=sharing]

Final Step for Full Marks:
Since your previous attempt showed a **404**, remember that when you test in Postman, you **must** use the URL `http://localhost:3000/tasks` (including the `/tasks` at the end).

Would you like me to explain how to upload these files to GitHub using the command line?

