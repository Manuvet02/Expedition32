import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import CompleteProfile from "./pages/CompleteProfile";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Title from "./pages/Title";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* pubblica */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />

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
