import './App.css';
import TodoComponent from "./pages/todo/todo";
import {useEffect, useState} from "react";
import {token as token_} from "./utils/data";

function App() {
  const localToken = localStorage.getItem('token');
  token_.value = localToken;
  const [token, updateToken] = useState(localToken || '');
  
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
