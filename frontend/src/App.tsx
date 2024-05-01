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
        <Route path='/:username/signupactor' element={<SignupActor />} />
        <Route path='/:username/' element={<Home />} />
        <Route path='/post' element={<Post />} />
        <Route path='/:username/profile' element={<Profile />} />
        <Route path='/:username/profileactor' element={<ProfileActor />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<ChatInterface />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
