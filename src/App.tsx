import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./features/drive/HomePage";
import MapPage from "./features/map/MapPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import GroupsPage from "./features/groups/GroupsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="kort" element={<MapPage />} />

        {/* Beskyttede ruter — kræver login */}
        <Route element={<ProtectedRoute />}>
          <Route path="bolkar" element={<GroupsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
