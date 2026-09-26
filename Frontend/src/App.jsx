import {Routes, Route} from "react-router-dom";
import Landing from "./Pages/Landing.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing/>} />
      {/* <Route path="/" element={} />
      <Route path="/" element={} />
      <Route path="/" element={} /> */}
    </Routes>
  );

}