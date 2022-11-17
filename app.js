const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

/*
//-------------Todo Object----------------------------
const convertTodoDBObj = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

//---------------------MultiLineNode----------

//------------------API-1--------------------------------
//Scenario-1-- list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q } = request.query;
  console.log(status);
  const statusQuery = `
    SELECT * FROM todo 
    WHERE status = '${status}'
    OR priority = '${priority}'
    OR (priority = '${priority}'
    AND status = '${status}')
    OR todo LIKE '%${search_q}%';
    `;

  const statusTodo = await db.all(statusQuery);
  response.send(statusTodo.map((eachTodo) => convertTodoDBObj(eachTodo)));
});

*/

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo 
            WHERE 
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo 
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT * 
            FROM  todo 
            WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//---Get--a specific todo based on the todo ID---------------
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * FROM todo 
    WHERE id = ${todoId}
    `;

  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//---Post--Create a todo in the todo table--------------------
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createTodoQuery = `
    INSERT INTO todo(id, todo,priority,status)
    VALUES (${id}, '${todo}', '${priority}', '${status}')
    `;

  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//---API-4-------------------------------------------
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const reqDetail = request.body;

  let updateTodoData = "";

  switch (true) {
    case reqDetail.status !== undefined:
      updateTodoData = "Status";
      break;
    case reqDetail.priority !== undefined:
      updateTodoData = "Priority";
      break;
    case reqDetail.todo !== undefined:
      updateTodoData = "Todo";
      break;
  }

  const oldTodoQuery = `
  SELECT * FROM todo
  WHERE id = ${todoId};`;

  const oldTodos = await db.get(oldTodoQuery);

  const {
    todo = oldTodos.todo,
    priority = oldTodos.priority,
    status = oldTodos.status,
  } = request.body;

  const updateTodoQuery = `
  UPDATE todo
  SET todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateTodoData} Updated`);
});

//---Delete --Deletes a todo table based on the todo ID----
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM todo WHERE id = ${todoId}
    `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
