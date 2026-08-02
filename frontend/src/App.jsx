import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/common/Navbar';
import TopBar from './components/common/TopBar';
import PlayersPage from './pages/PlayersPage';
import PlayerDetail from './pages/PlayerDetail';
import LoginPage from './pages/LoginPage';
import DiscordCallbackPage from './pages/DiscordCallbackPage';
import StorePage from './pages/StorePage';
import CollectionPage from './pages/CollectionPage';
import PromoPage from './pages/PromoPage';
import SquadPage from './pages/SquadPage';
import MatchHubPage from './pages/MatchHubPage';
import MatchLivePage from './pages/MatchLivePage';
import EvolutionPage from './pages/EvolutionPage';
import SBCPage from './pages/SBCPage';
import useAuthStore from './store/useAuthStore';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminPacks from './pages/admin/AdminPacks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminObjectives from './pages/admin/AdminObjectives';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  duration: 0.2,
  ease: 'easeInOut',
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/squad" element={<SquadPage />} />
          <Route path="/matches" element={<MatchHubPage />} />
          <Route path="/matches/live" element={<MatchLivePage />} />
          <Route path="/evolution" element={<EvolutionPage />} />
          <Route path="/sbc" element={<SBCPage />} />
          <Route path="/promos/:promoName" element={<PromoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<DiscordCallbackPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/players" element={<AdminRoute><AdminPlayers /></AdminRoute>} />
          <Route path="/admin/packs" element={<AdminRoute><AdminPacks /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/objectives" element={<AdminRoute><AdminObjectives /></AdminRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const init = useAuthStore((s) => s.init);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Navbar />
      <TopBar />
      <main className="app-main">
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}

export default App;
