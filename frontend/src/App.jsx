import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { MakerPage } from "./pages/MakerPage";
import { BoxPage } from "./pages/BoxPage";
import { MakersPage } from "./pages/MakersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/makers" element={<MakersPage />} />
        <Route path="/maker/:makerId" element={<MakerPage />} />
        <Route path="/box/:boxId" element={<BoxPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
