import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Title from "./pages/Title";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* pubblica */}
      <Route path="/login" element={<Login />} />

      {/* protette: serve essere loggati */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/title/:source/:externalId" element={<Title />} />
        <Route path="/u/:id" element={<Profile />} />
      </Route>
    </Routes>
  );
}
