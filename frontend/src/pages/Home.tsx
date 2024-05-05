import { useState, useEffect } from "react";
import axios from 'axios';
import config from '../../config.json';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navigation';
import PostComponent from '../components/PostComponent';
import NotificationComponent from '../components/NotificationComponent';
import InfiniteScroll from "react-infinite-scroll-component";

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
  hashtags: string;
  isLiked: boolean
};

type NotificationProps = {
  type: string;
  users: string[];
  date: string;
  profileImages: string[];
};


export default function Home() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postPage, setPostPage] = useState(1);
  const rootURL = config.serverRootURL;

  const fetchPosts = async () => {
    if (!hasMorePosts) return;
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${rootURL}/${username}/getPosts`, {
        params: { page: postPage }
      });
      if (response.data.length === 0) {
        setHasMorePosts(false);
      } else {
        setPosts(prevPosts => [...prevPosts, ...response.data]);
        setPostPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMorePosts(false); // Assume no more posts if there's an error
    }
  };

  const fetchNotifications = async () => {
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.get(`${rootURL}/${username}/getNotifications`);
      setNotifications(response.data.results);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchPosts(); // Fetch initial posts
    fetchNotifications(); // Fetch notifications
  }, [username]); // Fetch data again when username changes

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      let response;
      if (isLiked) {
        axios.defaults.withCredentials = true;
        response = await axios.post(`${rootURL}/${username}/unlikePost`, {
          post_id: postId
        });
      } else {
        axios.defaults.withCredentials = true;
        response = await axios.post(`${rootURL}/${username}/likePost`, {
          post_id: postId
        });
      }
      // Assume the backend returns the new likes count
      const newLikes = response.data.likes;

      // Update the posts state with the new like status and count
      setPosts(prevPosts => prevPosts.map(post =>
        post.post_id === postId ? { ...post, isLiked: !isLiked, likes: newLikes } : post
      ));
    } catch (error) {
      console.error('Error (un)liking the post:', error);
    }
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-start'>
      <Navbar username={username}></Navbar>
      <div className='w-full max-w-[1800px] flex flex-col justify-center items-center space-y-8 p-8'>
        <button
          type="button"
          className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
          onClick={() => navigate(`/${username}/createPost`)}
        >
          Create Post
        </button>
      </div>
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
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchPosts}
        hasMore={hasMorePosts}
        loader={<h4>Loading...</h4>}
        endMessage={
          <p style={{ textAlign: 'center' }}>
            <b>You have seen it all</b>
          </p>
        }
      >
        <div className='w-full max-w-[1800px] flex flex-col justify-center items-center space-y-8 p-8'>
          {posts.map((post, index) => (
            <PostComponent
              key={index}
              user={post.username}
              userProfileImage={post.pfp_url || 'default-avatar-url'}
              postImage={post.media}
              hashtags={post.hashtags}
              caption={post.content}
              onClick={() => navigate(`/${username}/post/${post.post_id}`)}
              handleLike={() => handleLike(post.post_id, post.isLiked)}
              likes={post.likes}
              isLiked={post.isLiked}
              timestamp={post.timestamp}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}