import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MakerPage } from "./pages/MakerPage";
import { BoxPage } from "./pages/BoxPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maker/:makerId" element={<MakerPage />} />
        <Route path="/box/:boxId" element={<BoxPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
