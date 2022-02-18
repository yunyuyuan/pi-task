import './App.css';
import TodoComponent from "./pages/todo/todo";
import {useEffect, useState, useRef} from "react";

function App() {
  const didMountRef = useRef(false);
  const [token, updateToken] = useState(localStorage.getItem('token') || '');
  
  useEffect(() => {
    if (!didMountRef.current) {
      return didMountRef.current = true;
    }
    didMountRef.current = true;
    localStorage.setItem('token', token);
  }, [token])

  return (
    <div className="App">
      <TodoComponent token={token} updateToken={updateToken}/>
    </div>
  );
}

export default App;
