import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./features/drive/HomePage";
import MapPage from "./features/map/MapPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="kort" element={<MapPage />} />
      </Route>
    </Routes>
  );
}
