import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Essays from './pages/Essays';
import PostDetail from './pages/PostDetail';
import Messages from './pages/Messages';
import FriendLinks from './pages/FriendLinks';
import About from './pages/About';
import AdminPanel from './admin/AdminPanel';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [flashStyle, setFlashStyle] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    const goingTo = theme === 'dark' ? 'to-light' : 'to-dark';
    setFlashStyle(goingTo);
    setTimeout(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), 200);
    setTimeout(() => setFlashStyle(null), 650);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    fetch(API + '/settings')
      .then(function(r) { return r.json(); })
      .then(function(data) { setSettings(data); })
      .catch(function() {});
  }, []);

  useEffect(() => {
    fetch(API + '/visitors/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: window.location.pathname })
    }).catch(function() {});
  }, []);

  var handleAdminLogin = function(userData) {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  var handleLogout = function() {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  var isAdmin = user && user.role === 'admin';

  return (
    <Router>
      <div className="app app-wrapper">
        {flashStyle && <div className={`theme-flash ${flashStyle}`} />}
        <Navbar settings={settings} user={user} onAdminLogin={handleAdminLogin} onLogout={handleLogout} theme={theme} onThemeToggle={handleThemeToggle} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home settings={settings} />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/essays" element={<Essays />} />
            <Route path="/post/:id" element={<PostDetail user={user} />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/friends" element={<FriendLinks />} />
            <Route path="/about" element={<About settings={settings} />} />
            <Route path="/admin" element={
              isAdmin ? <AdminPanel user={user} onLogout={handleLogout} onSettingsChange={setSettings} />
                : <Navigate to="/" replace />
            } />
          </Routes>
        </main>
        <Footer settings={settings} />
      </div>
    </Router>
  );
}

export default App;

