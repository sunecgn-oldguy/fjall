/**
 * App — appens routing-konfiguration.
 *
 * React Router håndterer navigation mellem sider UDEN at genindlæse hele appen
 * (kaldet "Single Page Application" / SPA). Browseren skifter kun det indhold
 * der ændrer sig, mens headeren og navigationen forbliver.
 *
 * Ruter:
 *   /         → Forsíða (velkomstside)
 *   /login    → QuickStartPage (skriv navn eller email-login)
 *   /kort     → Interaktivt kort med GPS
 *   /bolkar   → Gruppevalg (kræver login)
 *   /skilabod → Gruppechat (kræver login)
 *
 * Layout wrapperer alle ruter og giver dem fælles header, navigation og footer.
 * ProtectedRoute sikrer at /bolkar og /skilabod kræver login.
 */
import { Routes, Route } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./features/drive/HomePage";
import MapPage from "./features/map/MapPage";
import QuickStartPage from "./features/auth/QuickStartPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import GroupsPage from "./features/groups/GroupsPage";
import ChatPage from "./features/chat/ChatPage";

export default function App() {
  return (
    <Routes>
      {/* Layout er den ydre ramme — header, nav, footer */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<QuickStartPage />} />
        <Route path="kort" element={<MapPage />} />

        {/* Beskyttede ruter — ProtectedRoute omdirigerer til /login hvis ikke logget ind */}
        <Route element={<ProtectedRoute />}>
          <Route path="bolkar" element={<GroupsPage />} />
          <Route path="skilabod" element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
