import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Publish from './pages/Publish';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Detail from './pages/Detail';
import EditGarment from './pages/EditGarment';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/publish"
              element={
                <ProtectedRoute>
                  <Publish />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-garment/:id"
              element={
                <ProtectedRoute>
                  <EditGarment />
                </ProtectedRoute>
              }
            />
            <Route path="/explore" element={<Explore />} />
            <Route path="/garment/:id" element={<Detail />} />
            <Route path="/post/:id" element={<Detail />} />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

