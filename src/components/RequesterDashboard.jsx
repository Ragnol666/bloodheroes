import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../firebase';

const RequesterDashboard = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    location: '',
    agreeToTerms: false
  });
  const [requestForm, setRequestForm] = useState({
    bloodType: '',
    unitsNeeded: 1,
    hospital: '',
    location: '',
    urgency: 'normal',
    notes: ''
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Firebase data states
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Check if user is logged in on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        // Fetch user data from Firestore
        fetchUserData(user.uid);
        // Fetch user requests
        fetchUserRequests(user.uid);
        // Fetch available donors
        fetchDonors();
        // Fetch conversations
        fetchConversations(user.uid);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        // Reset all data when user logs out
        setRequests([]);
        setDonors([]);
        setConversations([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setCurrentUser(prev => ({ ...prev, ...userData }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showNotification('Error loading user data', 'error');
    }
  };

  // Fetch user requests from Firestore
  const fetchUserRequests = async (userId) => {
    try {
      const requestsRef = collection(db, 'requests');
      const q = query(
        requestsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt // Keep as timestamp for formatting
        });
      });
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification('Error loading requests', 'error');
    }
  };

  // Fetch available donors from Firestore
  const fetchDonors = async () => {
    try {
      const donorsRef = collection(db, 'users');
      const q = query(
        donorsRef,
        where('role', '==', 'donor'),
        where('isAvailable', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const donorsData = [];
      querySnapshot.forEach((doc) => {
        donorsData.push({ id: doc.id, ...doc.data() });
      });
      setDonors(donorsData);
    } catch (error) {
      console.error('Error fetching donors:', error);
      // If the query fails, try without the isAvailable filter
      try {
        const donorsRef = collection(db, 'users');
        const q = query(donorsRef, where('role', '==', 'donor'));
        const querySnapshot = await getDocs(q);
        const donorsData = [];
        querySnapshot.forEach((doc) => {
          donorsData.push({ id: doc.id, ...doc.data() });
        });
        setDonors(donorsData);
      } catch (secondError) {
        console.error('Error in second attempt to fetch donors:', secondError);
        showNotification('Error loading donors', 'error');
      }
    }
  };

  // Fetch conversations from Firestore
  const fetchConversations = async (userId) => {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastUpdated', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversationsData = [];
      querySnapshot.forEach((doc) => {
        conversationsData.push({ id: doc.id, ...doc.data() });
      });
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showNotification('Error loading conversations', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  // Handle login form changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle register form changes
  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle request form changes
  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  // Register new user with Firebase Auth and Firestore
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerForm.name || !registerForm.email || !registerForm.password ||
        !registerForm.confirmPassword || !registerForm.bloodType || !registerForm.location) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (!registerForm.agreeToTerms) {
      showNotification('Please agree to the terms and conditions', 'error');
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerForm.email,
        registerForm.password
      );

      const user = userCredential.user;

      // Save user data to Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name: registerForm.name,
        email: registerForm.email,
        bloodType: registerForm.bloodType,
        location: registerForm.location,
        role: 'requester',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      showNotification('Registration successful! You are now logged in.');
      setShowRegister(false);
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        bloodType: '',
        location: '',
        agreeToTerms: false
      });
    } catch (error) {
      console.error('Error registering user:', error);
      showNotification(`Registration failed: ${error.message}`, 'error');
    }
  };

  // Login user with Firebase Auth
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      showNotification('Please enter your email and password', 'error');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      showNotification('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error);
      showNotification(`Login failed: ${error.message}`, 'error');
    }
  };

  // Logout user with Firebase Auth
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('You have been logged out.');
    } catch (error) {
      console.error('Error logging out:', error);
      showNotification('Logout failed. Please try again.', 'error');
    }
  };

  // Submit blood request to Firestore
  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!requestForm.bloodType || !requestForm.hospital || !requestForm.location) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        bloodType: requestForm.bloodType,
        unitsNeeded: requestForm.unitsNeeded,
        hospital: requestForm.hospital,
        location: requestForm.location,
        urgency: requestForm.urgency,
        notes: requestForm.notes,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setRequestForm({
        bloodType: '',
        unitsNeeded: 1,
        hospital: '',
        location: '',
        urgency: 'normal',
        notes: ''
      });

      showNotification('Blood request submitted successfully!');
      setActiveSection('dashboard');

      // Refresh requests
      fetchUserRequests(currentUser.uid);
    } catch (error) {
      console.error('Error submitting request:', error);
      showNotification(`Request submission failed: ${error.message}`, 'error');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';

    let date;
    try {
      // Check if it's a Firestore timestamp
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        // If it's already a string or other format, return as is
        return timestamp;
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Recently';
    }
  };

  // Start a conversation with a donor
  const startConversation = async (donorId, donorName) => {
    try {
      const conversationData = {
        participants: [currentUser.uid, donorId],
        participantNames: [currentUser.displayName || currentUser.name || 'Requester', donorName || 'Donor'],
        lastMessage: '',
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'conversations'), conversationData);
      setActiveSection('messages');
      showNotification('Conversation started with donor');

      // Refresh conversations
      fetchConversations(currentUser.uid);
    } catch (error) {
      console.error('Error starting conversation:', error);
      showNotification('Failed to start conversation', 'error');
    }
  };

  // Render login section
  const renderLogin = () => (
    <div className="login-container">
      <h2 className="text-center mb-4 text-danger">Login to Your Account</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label htmlFor="login-email" className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            id="login-email"
            name="email"
            value={loginForm.email}
            onChange={handleLoginChange}
            placeholder="name@example.com"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="login-password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="login-password"
            name="password"
            value={loginForm.password}
            onChange={handleLoginChange}
            placeholder="Enter your password"
          />
        </div>
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-danger">Login</button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>Register here</a></p>
      </div>
    </div>
  );

  // Render register section
  const renderRegister = () => (
    <div className="register-container">
      <h2 className="text-center mb-4 text-danger">Create an Account</h2>
      <form onSubmit={handleRegister}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="register-name" className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              id="register-name"
              name="name"
              value={registerForm.name}
              onChange={handleRegisterChange}
              placeholder="John Doe"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="register-email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="register-email"
              name="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              placeholder="name@example.com"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="register-password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="register-password"
              name="password"
              value={registerForm.password}
              onChange={handleRegisterChange}
              placeholder="Create a password"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="register-confirm-password" className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="register-confirm-password"
              name="confirmPassword"
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              placeholder="Confirm your password"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="register-blood-type" className="form-label">Blood Type Needed</label>
            <select
              className="form-select"
              id="register-blood-type"
              name="bloodType"
              value={registerForm.bloodType}
              onChange={handleRegisterChange}
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="register-location" className="form-label">Location</label>
            <input
              type="text"
              className="form-control"
              id="register-location"
              name="location"
              value={registerForm.location}
              onChange={handleRegisterChange}
              placeholder="City, State"
            />
          </div>
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="register-terms"
            name="agreeToTerms"
            checked={registerForm.agreeToTerms}
            onChange={handleRegisterChange}
          />
          <label className="form-check-label" htmlFor="register-terms">I agree to the Terms and Conditions</label>
        </div>
        <div className="d-grid gap-2">
          <button type="submit" className="btn btn-danger">Create Account</button>
        </div>
      </form>
      <div className="text-center mt-3">
        <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(false); }}>Login here</a></p>
      </div>
    </div>
  );

  // Render dashboard section
  const renderDashboard = () => (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-8">
          <h2 className="text-danger fw-bold">Requester Dashboard</h2>
          <p className="text-muted">Manage your blood requests and connect with donors</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-danger" onClick={() => setActiveSection('new-request')}>
            <i className="bi bi-plus-circle"></i> New Request
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted">Active Requests</h6>
                  <h3 className="fw-bold">{requests.filter(req => req.status === 'open').length}</h3>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-clipboard-plus text-danger fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted">Donors Found</h6>
                  <h3 className="fw-bold">{donors.length}</h3>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-people-fill text-danger fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted">Messages</h6>
                  <h3 className="fw-bold">{conversations.length}</h3>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-chat-dots-fill text-danger fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted">Urgent Needs</h6>
                  <h3 className="fw-bold">{requests.filter(r => r.urgency === 'emergency').length}</h3>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Recent Blood Requests</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {requests.length > 0 ? (
                  requests.slice(0, 5).map(request => (
                    <div key={request.id} className="list-group-item border-0 blood-request mb-2">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{request.bloodType} Blood needed at {request.hospital}</h6>
                        <span className={`badge ${request.urgency === 'emergency' ? 'bg-danger' : request.urgency === 'urgent' ? 'bg-warning' : 'bg-primary'}`}>
                          {request.urgency?.charAt(0)?.toUpperCase() + request.urgency?.slice(1)}
                        </span>
                      </div>
                      <p className="mb-1">{request.notes || `Need ${request.unitsNeeded} units of ${request.bloodType} blood`}</p>
                      <small className="text-muted">Posted {formatTimestamp(request.createdAt)}</small>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-3">
                    No blood requests found. <button className="btn btn-link p-0" onClick={() => setActiveSection('new-request')}>Create your first request!</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Available Donors</h5>
            </div>
            <div className="card-body">
              {donors.length > 0 ? (
                donors.slice(0, 3).map(donor => (
                  <div key={donor.id} className="d-flex align-items-start mb-3">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-person-fill text-muted"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{donor.name || 'Anonymous Donor'}</h6>
                      <p className="mb-0 text-muted">{donor.bloodType} • {donor.location || 'Unknown location'}</p>
                      <button
                        className="btn btn-sm btn-outline-danger mt-1"
                        onClick={() => startConversation(donor.uid, donor.name)}
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-3">
                  No available donors found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render new request section
  const renderNewRequest = () => (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Create New Blood Request</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleRequestSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="blood-type" className="form-label">Blood Type Needed</label>
                    <select
                      className="form-select"
                      id="blood-type"
                      name="bloodType"
                      value={requestForm.bloodType}
                      onChange={handleRequestChange}
                      required
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="units-needed" className="form-label">Units Needed</label>
                    <input
                      type="number"
                      className="form-control"
                      id="units-needed"
                      name="unitsNeeded"
                      value={requestForm.unitsNeeded}
                      onChange={handleRequestChange}
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="hospital" className="form-label">Hospital Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="hospital"
                    name="hospital"
                    value={requestForm.hospital}
                    onChange={handleRequestChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="location" className="form-label">Hospital Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={requestForm.location}
                    onChange={handleRequestChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="urgency" className="form-label">Urgency Level</label>
                  <select
                    className="form-select"
                    id="urgency"
                    name="urgency"
                    value={requestForm.urgency}
                    onChange={handleRequestChange}
                    required
                  >
                    <option value="normal">Normal (Within 48 hours)</option>
                    <option value="urgent">Urgent (Within 24 hours)</option>
                    <option value="emergency">Emergency (Immediate)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">Additional Notes</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    name="notes"
                    value={requestForm.notes}
                    onChange={handleRequestChange}
                    rows="3"
                  ></textarea>
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-danger">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render messages section
  const renderMessages = () => (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Conversations</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {conversations.map(convo => {
                  const otherParticipant = convo.participantNames ?
                    convo.participantNames.find(name => name !== (currentUser.displayName || currentUser.name)) :
                    'Unknown User';
                  return (
                    <a
                      key={convo.id}
                      href="#"
                      className="list-group-item list-group-item-action"
                      onClick={(e) => {
                        e.preventDefault();
                        // Here you would set the active conversation and fetch its messages
                      }}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{otherParticipant}</h6>
                        <small>{formatTimestamp(convo.lastUpdated)}</small>
                      </div>
                      <p className="mb-1 text-truncate">{convo.lastMessage || 'No messages yet'}</p>
                    </a>
                  );
                })}
                {conversations.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No conversations yet. Start a conversation with a donor!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">Messages</h5>
            </div>
            <div className="card-body" style={{ height: '400px', overflowY: 'auto' }}>
              <div className="text-center text-muted py-5">
                <i className="bi bi-chat-dots fs-1"></i>
                <p>Select a conversation to view messages</p>
              </div>
            </div>
            <div className="card-footer bg-white">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Type your message..." disabled />
                <button className="btn btn-danger" type="button" disabled>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="requester-dashboard">
      {/* Add Bootstrap Icons via CDN */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" />

      <style>
        {`
          :root {
            --primary-color: #dc3545;
            --secondary-color: #f8d7da;
            --dark-color: #333;
            --light-color: #f8f9fa;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: var(--dark-color);
          }

          .navbar {
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .navbar-brand {
            font-weight: 700;
            color: var(--primary-color) !important;
          }

          .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
          }

          .btn-primary:hover {
            background-color: #bb2d3b;
            border-color: #b02a37;
          }

          .card {
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease;
            border: none;
          }

          .card:hover {
            transform: translateY(-5px);
          }

          .stats-card {
            border-top: 4px solid var(--primary-color);
          }

          .blood-request {
            border-left: 4px solid var(--primary-color);
          }

          .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            animation: slideIn 0.3s ease-out;
          }

          .notification.success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
          }

          .notification.error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
          }

          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .login-container, .register-container {
            max-width: 500px;
            margin: 50px auto;
            padding: 30px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          .chat-message {
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 18px;
            margin-bottom: 10px;
          }

          .received {
            background-color: #e9ecef;
            border-top-left-radius: 4px;
          }

          .sent {
            background-color: #d4edda;
            margin-left: auto;
            border-top-right-radius: 4px;
          }
        `}
      </style>

      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
        <div className="container">
          <a className="navbar-brand" href="#">
            <i className="bi bi-droplet-fill"></i> BloodConnect
          </a>
          {isLoggedIn && (
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <a className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('dashboard'); }}>Dashboard</a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${activeSection === 'requests' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('requests'); }}>My Requests</a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${activeSection === 'donors' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('donors'); }}>Find Donors</a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link ${activeSection === 'messages' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveSection('messages'); }}>Messages</a>
                </li>
              </ul>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <span className="text-muted">Welcome, </span>
                  <span className="fw-bold">{currentUser?.name}</span>
                </div>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
          <div>
            <h6 className="mb-0">{notification.type === 'success' ? 'Success!' : 'Error!'}</h6>
            <p className="mb-0">{notification.message}</p>
          </div>
          <button
            className="btn-close ms-auto"
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

      {/* Main Content */}
      <main>
        {!isLoggedIn ? (
          showRegister ? renderRegister() : renderLogin()
        ) : (
          <>
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'new-request' && renderNewRequest()}
            {activeSection === 'messages' && renderMessages()}
            {activeSection === 'requests' && renderDashboard()}
            {activeSection === 'donors' && renderDashboard()}
          </>
        )}
      </main>
    </div>
  );
};

export default RequesterDashboard;