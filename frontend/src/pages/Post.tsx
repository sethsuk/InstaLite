import Navbar from '../components/Navigation';
import { FaHeart, FaComment } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

interface CommentProps {
  username: string;
  userProfileImage: string;
  comment: string;
}

interface PostProps {
  user_id: number;
  user: string;
  userProfileImage: string;
  postImage: string;
  hashtags: string;
  caption: string;
  timestamp: string
}


export default function Post() {
  const { username, postId } = useParams();
  const rootURL = config.serverRootURL;

  const [post, setPost] = useState<PostProps>();
  const [comments, setComments] = useState<CommentProps[]>([]);

  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const fetchPost = async () => {
    try {
      console.log("fetching post");
      axios.defaults.withCredentials = true;
      const response = await axios.post(`${rootURL}/${username}/getSinglePost`, {
        post_id: postId
      });

      console.log(response.data[0]);

      setPost(response.data[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchComments = async () => {
    try {
      console.log("fetching comments");
      axios.defaults.withCredentials = true;
      const response = await axios.post(`${rootURL}/${username}/getComments`, {
        post_id: postId
      });

      console.log(response.data);

      setComments(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [username]); // Rerun when username changes

  if (!post || !comments) { // Check if post is not defined
    return <div>Loading...</div>; // Or any other placeholder
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center space-y-8 justify-start">
      <Navbar username={username}></Navbar>
      <div className="max-w-[1000px] flex bg-slate-100 rounded-lg overflow-hidden">
        <div className="w-3/5">
          <img src={post.postImage} className=" object-cover" />
        </div>
        <div className="p-8 space-y-8">
          <div >
            {/* Username */}
            <div className="flex items-center space-x-2 mb-2">
              <img src={post.userProfileImage} alt="user profile" className="w-10 h-10 rounded-full" />
              <strong>{post.user}</strong>
            </div>

            {/* Text and hashtags */}
            <div className='mt-2'>
              <span className='text-slate-800 font-semibold'>{post.user}</span>
              <span className='text-slate-600'> {post.caption}</span>
              <div className='text-blue-500'>{post.hashtags}</div>
            </div>
          </div>
          {/* Comments */}
          <div className='space-y-4'>
            <div>
              <strong>Comments</strong>
              {comments.map((comment, index) => (
                <div key={index} className="flex items-center space-x-3 py-2">
                  <div className="flex items-center space-x-2">
                    <img src={comment.userProfileImage} alt="user profile" className="w-7 h-7 rounded-full" />
                    <strong>{comment.username}</strong>
                  </div>
                  <div>{comment.comment}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 p-4 flex items-center space-x-3">
              {/* Like and comment icons */}
              <div className='flex items-center space-x-4'>
              </div>
              <input className="flex-1 p-2 border rounded" placeholder="Add a comment..." />
              <button className="px-4 py-2 bg-indigo-400 text-white rounded hover:bg-indigo-600">Post</button>
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleBack} className="mt-4 px-4 py-2 text-sm text-gray-500">Go Back</button>
    </div>
  );
}

