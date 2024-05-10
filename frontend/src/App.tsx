import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import CreatePost from "./pages/CreatePost";
import Search from "./pages/Search";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/:username/signupactor' element={<SignupActor />} />
        <Route path='/:username/' element={<Home />} />
        <Route path='/:username/search' element={<Search />} />
        <Route path='/:username/createpost' element={<CreatePost />} />
        <Route path='/:username/post/:postId' element={<Post />} />
        <Route path='/:username/profile' element={<Profile />} />
        <Route path='/:username/profileactor' element={<ProfileActor />} />
        <Route path='/:username/friends' element={<Friends />} />
        <Route path="/:username/chat" element={<Chat />} />
        <Route path="/:username/chatRoom/:chatId" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
