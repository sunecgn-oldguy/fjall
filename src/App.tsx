/**
 * App — appens routing-konfiguration.
 *
 * React Router håndterer navigation mellem sider UDEN at genindlæse hele appen
 * (kaldet "Single Page Application" / SPA). Browseren skifter kun det indhold
 * der ændrer sig, mens headeren og navigationen forbliver.
 *
 * Ruter:
 *   /         → MapPage (kortet er appen)
 *   /login    → QuickStartPage (skriv navn eller email-login)
 *   /skilabod → Gruppechat (kræver login)
 *   /turar    → Turhistorik (kræver login)
 *
 * Layout wrapperer alle ruter og giver dem fælles header, navigation og footer.
 * ProtectedRoute sikrer at /skilabod og /turar kræver login.
 */
import { Routes, Route, Navigate } from "react-router";
import Layout from "./components/Layout";
import MapPage from "./features/map/MapPage";
import QuickStartPage from "./features/auth/QuickStartPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import ChatPage from "./features/chat/ChatPage";
import TripHistoryPage from "./features/trips/TripHistoryPage";

export default function App() {
  return (
    <Routes>
      {/* Layout er den ydre ramme — header, nav, footer */}
      <Route element={<Layout />}>
        <Route index element={<MapPage />} />
        <Route path="login" element={<QuickStartPage />} />

        {/* /kort redirect til / for bagudkompatibilitet */}
        <Route path="kort" element={<Navigate to="/" replace />} />

        {/* Beskyttede ruter — ProtectedRoute omdirigerer til /login hvis ikke logget ind */}
        <Route element={<ProtectedRoute />}>
          <Route path="skilabod" element={<ChatPage />} />
          <Route path="turar" element={<TripHistoryPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
