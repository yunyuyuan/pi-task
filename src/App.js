import './App.css';
import TodoComponent from "./pages/todo/todo";
import {useEffect, useState} from "react";

function App() {
  const [token, updateToken] = useState(localStorage.getItem('token') || '');
  
  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token])

  return (
    <div className="App">
      <TodoComponent token={token} updateToken={updateToken}/>
    </div>
  );
}

export default App;
