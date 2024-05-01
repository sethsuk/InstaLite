import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import SignupActor from "./pages/SignupActor";
import ChatInterface from "./pages/ChatInterface";
import Profile from "./pages/Profile";
import ProfileActor from "./pages/ProfileActor";
import Post from "./pages/Post";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/signupactor' element={<SignupActor />} />
        <Route path='/' element={<Home />} />
        <Route path='/post' element={<Post />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/profileactor' element={<ProfileActor />} />
        <Route path='/friends' element={<Friends />} />
        <Route path="/chat" element={<ChatInterface />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
