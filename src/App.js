import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import AppNavbar from "./components/AppNavbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import DonorList from "./components/DonorList";
import RequestList from "./components/RequestList";
import RequestForm from "./components/RequestForm";
import Homepage from "./components/Homepage";
import RequesterDashboard from "./components/RequesterDashboard";
import About from "./components/About";

// In your App.js or routing file
import RequestDetails from './components/RequestDetails';

// Add this route


function App() {
  return (
    <BrowserRouter>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/donors" element={<DonorList />} />
        <Route path="/requests" element={<RequestList />} />
        <Route path="/post-request" element={<RequestForm />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
         <Route path="/RequesterDashboard" element={<RequesterDashboard />} />
         <Route path="/About" element={<About />} />
        {/* Add a catch-all route for 404 pages */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Protected route component
function ProtectedRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/login" replace />;
}

export default App;