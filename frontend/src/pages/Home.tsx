import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import PostComponent from '../components/PostComponent';
import NotificationComponent from '../components/NotificationComponent';
import CreatePostComponent from '../components/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navigation';

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);

  const postsData = [
    {
      user: 'username',
      userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg',
      postImage: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*',
      imageDescription: 'Image description here',
      hashtags: '#hashtag #hashtag #hashtag',
      caption: 'Caption here'
    },
    {
      user: 'username2',
      userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg',
      postImage: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*',
      imageDescription: 'Image description here',
      hashtags: '#hashtag #hashtag #hashtag',
      caption: 'Caption here'
    }
  ]

  const notifications = [
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

  const fetchData = async () => {
    try {
      const response = await axios.get(`${rootURL}/feed/${username}`);
      setPosts(response.data.results || []); // Ensure fallback to empty array if no results
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optionally handle navigation or display error message
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]); // Rerun when username changes

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-start'>
      <Navbar />
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
          {postsData.map((post, index) => (
            <PostComponent
              key={index}
              user={post.user}
              userProfileImage={post.userProfileImage}
              postImage={post.postImage}
              imageDescription={post.imageDescription}
              hashtags={post.hashtags}
              caption={post.caption}
            />
          ))}
        </div>
      </div>
    </div>

  );
}
