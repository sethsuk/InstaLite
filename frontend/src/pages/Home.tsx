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
  timestamp: Date;
  user_id: number;
  username: string;
  pfp_url: string | null;
  hashtags: string
};

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostProps[]>([]);
  const [notifications, setNotifications] = useState([]);

  const notifications_test = [
    {
      type: 'friendRequest',
      users: ['friend-1'],
      date: 'April 24, 2024',
      profileImages: ['https://www.svgrepo.com/show/382100/female-avatar-girl-face-woman-user-7.svg']
    },
    {
      type: 'association',
      users: ['Alice', 'Rebecca Ferguson'],
      date: 'April 22, 2024',
      profileImages: [
        'https://www.svgrepo.com/show/382100/female-avatar-girl-face-woman-user-7.svg',
        'https://www.wbw.org/wp-content/uploads/2016/03/Female-Avatar.png'
      ]
    }
  ]

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/getPosts`);
      console.log(response.data);
      setPosts(response.data); // Ensure fallback to empty array if no results
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optionally handle navigation or display error message
    }
  };

  useEffect(() => {
    fetchPost();
  }, [username]); // Rerun when username changes

  const handleClick = () => {
    navigate(`/posts/${postId}`);
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-start'>
      <Navbar username={username}></Navbar>
      <div className='w-full max-w-[1800px] flex flex-col justify-center items-center space-y-8 p-8'>
        <div className='space-y-3'>
          {notifications_test.map((notification, index) => (
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
            />
          ))}
        </div>
      </div>
    </div>

  );
}
