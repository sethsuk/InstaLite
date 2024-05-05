import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import SignupActor from "./pages/SignupActor";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ProfileActor from "./pages/ProfileActor";
import Post from "./pages/Post";
import ChatRoom from "./pages/ChatRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/signupactor' element={<SignupActor />} />
        <Route path='/:username/' element={<Home />} />
        <Route path='/:username/post/:postId' element={<Post />} />
        <Route path='/:username/profile' element={<Profile />} />
        <Route path='/:username/profileactor' element={<ProfileActor />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chatRoom" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
