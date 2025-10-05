import React, { useEffect, useState } from "react";
import { db } from "../../Firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import "./ToDoList.css";
import { Pencil, Save, Filter, Plus, CheckCircle, Circle, Trash2, Search, Target, Clock, CheckSquare, ClipboardCheck } from "lucide-react";
import Hamburger from "../../Components/Hamburger/Hamburger";

const statusOptions = ["New", "Inprogress", "DONE"];

const ToDoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ name: "", status: "New" });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: "", status: "New" });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showEditStatusDropdown, setShowEditStatusDropdown] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [editLoadingId, setEditLoadingId] = useState(null);

  // Fetch todos
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "TODO"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by status priority: New -> Inprogress -> DONE
        const statusPriority = { "New": 1, "Inprogress": 2, "DONE": 3 };
        list.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
        setTodos(list);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };
    fetchTodos();
  }, []);

  // Add todo
  const handleAdd = async () => {
    if (!newTodo.name.trim()) return;
    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, "TODO"), {
        ...newTodo,
        createdAt: new Date().toISOString()
      });
      setTodos([{ id: docRef.id, ...newTodo }, ...todos]);
      setNewTodo({ name: "", status: "New" });
    } catch (error) {
      console.error("Error adding todo:", error);
    }
    setAdding(false);
  };

  // Edit todo
  const handleEdit = (todo) => {
    setEditId(todo.id);
    setEditData({ name: todo.name, status: todo.status });
  };

  const handleEditSave = async (id) => {
    if (!editData.name.trim()) return;
    setEditLoadingId(id);
    try {
      await updateDoc(doc(db, "TODO", id), {
        ...editData,
        updatedAt: new Date().toISOString()
      });
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, ...editData } : todo
        )
      );
      setEditId(null);
      setEditData({ name: "", status: "New" });
    } catch (error) {
      console.error("Error updating todo:", error);
    }
    setEditLoadingId(null);
  };

  // Delete todo
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) return;
    setDeleteLoadingId(id);
    try {
      await deleteDoc(doc(db, "TODO", id));
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
    setDeleteLoadingId(null);
  };

  // Filter todos by status and search
  const filteredTodos = todos
    .filter((todo) =>
      filterStatus ? todo.status === filterStatus : true
    )
    .filter((todo) =>
      todo.name?.toLowerCase().includes(search.toLowerCase())
    );

  // Calculate statistics
  const getStats = () => {
    const newCount = todos.filter(todo => todo.status === "New").length;
    const inProgressCount = todos.filter(todo => todo.status === "Inprogress").length;
    const doneCount = todos.filter(todo => todo.status === "DONE").length;
    return { newCount, inProgressCount, doneCount, total: todos.length };
  };

  const stats = getStats();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside dropdown containers
      if (!event.target.closest('.todo-dropdown-container')) {
        setShowStatusDropdown(false);
        setShowEditStatusDropdown(false);
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 style={{ 
            fontSize: "22px", 
            fontWeight: 700, 
            color: "var(--txt-dark)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <ClipboardCheck style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            TODO List
          </h1>
        </div>
      </div>

      <div className="todo-main-container">
        {/* Enhanced Header */}
        <div className="todo-header-section">
          <h1 className="todo-main-title">My Todo List</h1>
          <p className="todo-subtitle">Stay organized and get things done efficiently</p>
        </div>

        {/* Statistics Cards */}
        <div className="todo-stats-section">
          <div className="todo-stat-card">
            <div className="todo-stat-number">{stats.total}</div>
            <div className="todo-stat-label">Total Tasks</div>
          </div>
          <div className="todo-stat-card">
            <div className="todo-stat-number" style={{ color: '#2563eb' }}>{stats.newCount}</div>
            <div className="todo-stat-label">New</div>
          </div>
          <div className="todo-stat-card">
            <div className="todo-stat-number" style={{ color: '#d97706' }}>{stats.inProgressCount}</div>
            <div className="todo-stat-label">In Progress</div>
          </div>
          <div className="todo-stat-card">
            <div className="todo-stat-number" style={{ color: '#15803d' }}>{stats.doneCount}</div>
            <div className="todo-stat-label">Completed</div>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="todo-search-row">
          <div className="todo-search-input-wrapper">
            <input
              type="text"
              className="todo-search-input"
              placeholder="🔍 Search your todos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="todo-search-icon">
              <Search />
            </span>
          </div>
        </div>

        {/* Enhanced Add Section */}
        <div className="todo-add-section">
          <input
            type="text"
            className="todo-input"
            placeholder="What needs to be done today?"
            value={newTodo.name}
            onChange={(e) => setNewTodo({ ...newTodo, name: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />

          <div className="todo-dropdown-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`todo-dropdown-header ${showStatusDropdown ? 'open' : ''}`}
              onClick={() => setShowStatusDropdown((s) => !s)}
            >
              <span>{newTodo.status}</span>
              <span className="icon">▼</span>
            </button>
            {showStatusDropdown && (
              <div className="todo-dropdown-list show">
                {statusOptions.map((opt) => (
                  <div
                    key={opt}
                    className={`todo-dropdown-item${newTodo.status === opt ? " active" : ""}`}
                    onClick={() => {
                      setNewTodo((prev) => ({ ...prev, status: opt }));
                      setShowStatusDropdown(false);
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="todo-add-btn" onClick={handleAdd} disabled={adding || !newTodo.name.trim()}>
            {adding ? <span className="loader-white"></span> : <Plus className="icon" />}
            {adding ? "Adding..." : "Add Task"}
          </button>

          <div className="todo-filter-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="todo-filter-btn"
              onClick={() => setShowFilterDropdown((s) => !s)}
            >
              <Filter className="icon" />
              {filterStatus ? `Filter: ${filterStatus}` : "Filter All"}
            </button>
            {showFilterDropdown && (
              <div className="todo-dropdown-list show">
                <div
                  className={`todo-dropdown-item${filterStatus === "" ? " active" : ""}`}
                  onClick={() => {
                    setFilterStatus("");
                    setShowFilterDropdown(false);
                  }}
                >
                  Show All
                </div>
                {statusOptions.map((opt) => (
                  <div
                    key={opt}
                    className={`todo-dropdown-item${filterStatus === opt ? " active" : ""}`}
                    onClick={() => {
                      setFilterStatus(opt);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced List Section */}
        <div className="todo-list-section">
          {filteredTodos.length === 0 ? (
            <div className="todo-empty">
              <div className="todo-empty-icon">
                {search || filterStatus ? "🔍" : "📝"}
              </div>
              <div className="todo-empty-title">
                {search || filterStatus ? "No todos found" : "No todos yet"}
              </div>
              <div className="todo-empty-text">
                {search
                  ? `No todos match "${search}"${filterStatus ? ` with status "${filterStatus}"` : ""}`
                  : filterStatus
                    ? `No todos with status "${filterStatus}"`
                    : "Start by adding your first todo above!"
                }
              </div>
            </div>
          ) : (
            filteredTodos.map((todo) =>
              editId === todo.id ? (
                <div key={todo.id} className="todo-list-item">
                  <input
                    type="text"
                    className="edit-input"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditSave(todo.id)}
                    autoFocus
                  />

                  <div className="todo-dropdown-container" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`todo-dropdown-header ${showEditStatusDropdown ? 'open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusDropdown(false); // Close other dropdown
                        setShowFilterDropdown(false); // Close filter dropdown
                        setShowEditStatusDropdown((s) => !s);
                      }}
                    >
                      <span>{editData.status}</span>
                      <span className="icon">▼</span>
                    </button>
                    {showEditStatusDropdown && (
                      <div className="todo-dropdown-list show">
                        {statusOptions.map((opt) => (
                          <div
                            key={opt}
                            className={`todo-dropdown-item${editData.status === opt ? " active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditData((prev) => ({ ...prev, status: opt }));
                              setShowEditStatusDropdown(false);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="todo-edit-btn"
                    onClick={() => handleEditSave(todo.id)}
                    disabled={editLoadingId === todo.id || !editData.name.trim()}
                    title="Save changes"
                  >
                    {editLoadingId === todo.id ? <span className="loader-white"></span> : <Save className="icon" />}
                  </button>

                  <button
                    className="todo-delete-btn"
                    onClick={() => {
                      setEditId(null);
                      setShowEditStatusDropdown(false);
                    }}
                    title="Cancel editing"
                  >
                    <Trash2 className="icon" />
                  </button>
                </div>
              ) : (
                <div key={todo.id} className="todo-list-item">
                  <span className="todo-name">{todo.name}</span>

                  <span className={`todo-status todo-status-${todo.status.toLowerCase()}`}>
                    {todo.status === "DONE" ? (
                      <CheckCircle className="icon" />
                    ) : todo.status === "Inprogress" ? (
                      <Clock className="icon" />
                    ) : (
                      <Target className="icon" />
                    )}
                    {todo.status}
                  </span>

                  <button
                    className="todo-edit-btn"
                    onClick={() => handleEdit(todo)}
                    disabled={editLoadingId === todo.id}
                    title="Edit todo"
                  >
                    <Pencil className="icon" />
                  </button>

                  <button
                    className="todo-delete-btn"
                    onClick={() => handleDelete(todo.id)}
                    disabled={deleteLoadingId === todo.id}
                    title="Delete todo"
                  >
                    {deleteLoadingId === todo.id ? <span className="loader-white"></span> : <Trash2 className="icon" />}
                  </button>
                </div>
              )
            )
          )}
        </div>
      </div>
    </>

  );
};

export default ToDoList;