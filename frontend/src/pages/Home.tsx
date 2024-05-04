import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import PostComponent from '../components/PostComponent';
import NotificationComponent from '../components/NotificationComponent';
import CreatePostComponent from '../components/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navigation';

type PostProps = {
  post_id: number;
  title: string;
  media: string | undefined;
  content: string;
  likes: number;
  timestamp: string;
  user_id: number;
  username: string;
  pfp_url: string | null;
  hashtags: string
};

type NotificationProps = {
  type: string;
  users: string[];
  date: string;
  profileImages: string[];
};


export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostProps[]>([]);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/getPosts`);
      console.log(response.data);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/getNotifications`);
      console.log(response.data.results);
      setNotifications(response.data.results);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchNotifications();
  }, [username]); // Rerun when username changes


  const handleClick = (postId: number) => {
    navigate(`/${username}/post/${postId}`);
  };

  const handleLike = async (postId: number) => {
    try {
      await axios.post(`${rootURL}/${username}/likePost`, {
        post_id: postId
      });

      setPosts(prevPosts => prevPosts.map(post =>
        post.post_id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    } catch (error) {
      console.error('Error liking the post:', error);
    }
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-start'>
      <Navbar username={username}></Navbar>
      <div className='w-full max-w-[1800px] flex flex-col justify-center items-center space-y-8 p-8'>
        <div className='space-y-3'>
          {notifications.map((notification, index) => (
            <NotificationComponent
              key={index}
              type={notification.type}
              users={notification.users}
              date={notification.date}
              profileImages={notification.profileImages}
            />
          ))}
        </div>

        <div className='space-y-3 w-full'>
          {posts.map((post, index) => (
            <PostComponent
              key={index}
              user={post.username}
              userProfileImage={post.pfp_url || 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg'}
              postImage={post.media}
              hashtags={post.hashtags}
              caption={post.content}
              onClick={() => handleClick(post.post_id)}
              handleLike={() => handleLike(post.post_id)}
              likes={post.likes}
              isLiked={isLiked}
            />
          ))}
        </div>
      </div>
    </div>

  );
}
