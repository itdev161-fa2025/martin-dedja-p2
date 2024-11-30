import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axios";
import "./Home.css";

function Home() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("Latest First");
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get("/api/tasks");
      setTodos(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    }
  };

  const addTodo = async () => {
    if (input.trim()) {
      try {
        const newTodo = { task: input };
        const response = await axiosInstance.post("/api/tasks", newTodo);
        setTodos([...todos, response.data]);
        setInput("");
      } catch (error) {
        console.error("Error adding task", error);
      }
    }
  };

  const removeTodo = async (id) => {
    try {
      await axiosInstance.delete(`/api/tasks/${id}`);
      setTodos(todos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Error removing task", error);
    }
  };

  const updateTodo = async () => {
    if (editText.trim()) {
      try {
        const updatedTodo = { task: editText };
        const response = await axiosInstance.put(
          `/api/tasks/${editTaskId}`,
          updatedTodo
        );
        setTodos(
          todos.map((todo) => (todo._id === editTaskId ? response.data : todo))
        );
        setIsEditing(false);
        setEditTaskId(null);
        setEditText("");
      } catch (error) {
        console.error("Error updating task", error);
      }
    }
  };

  const startEditing = (taskId, taskText) => {
    setIsEditing(true);
    setEditTaskId(taskId);
    setEditText(taskText);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const filteredTodos = todos
    .filter((todo) => todo.task.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === "Latest First") {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortOption === "Earliest First") {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortOption === "ASC") {
        return a.task.localeCompare(b.task);
      } else if (sortOption === "DSC") {
        return b.task.localeCompare(a.task);
      }
      return 0;
    });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="home-container">
      <header>
        <div className="toolbar">
          <h2>TO-DO List</h2>
          {user && (
            <div className="user-info">
              <span>
                <strong>User: </strong>
                {user.name}
              </span>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task"
          className="todo-input"
        />
        <button className="add-button" onClick={addTodo}>
          Add
        </button>
      </div>
      <div className="search-sort-container">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search tasks"
          className="todo-search"
        />
        <div className="sort-container">
          <label htmlFor="sort-select" className="sort-label">
            Sort
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="Latest First">Latest First</option>
            <option value="Earliest First">Earliest First</option>
            <option value="ASC">ASC</option>
            <option value="DSC">DSC</option>
          </select>
        </div>
      </div>
      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <li className="todo-item" key={todo._id}>
            <div className="todo-details">
              {isEditing && editTaskId === todo._id ? (
                <>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="todo-input"
                  />
                  <button className="add-button" onClick={updateTodo}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <p>{todo.task}</p>
                  <span className="timestamp">
                    {new Date(todo.timestamp).toLocaleString()}
                  </span>
                </>
              )}
            </div>
            <div>
              <button
                className="remove-button"
                onClick={() => removeTodo(todo._id)}
              >
                Remove
              </button>
              {!isEditing && (
                <button
                  className="edit-button"
                  onClick={() => startEditing(todo._id, todo.task)}
                >
                  Edit
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
