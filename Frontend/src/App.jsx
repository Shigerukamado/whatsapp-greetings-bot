import {Routes, Route} from "react-router-dom";
import Landing from "./Pages/Landing.jsx";
import Login from "./Pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing/>} />
      <Route path="/login" element={<Login/>} />
      {/* <Route path="/" element={} /> */}
    </Routes>
  );

}