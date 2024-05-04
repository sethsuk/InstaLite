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
  user: string;
  userProfileImage: string;
  postImage: string;
  imageDescription: string;
  hashtags: string;
  caption: string;
  comments: CommentProps[];
}


export default function Post() {
  const {username} = useParams();
  const rootURL = config.serverRootURL;

  const [post, setPost] = useState<PostProps>();

  const [comments, setComments] = useState<CommentProps[]>([]);

  // axios here?

  const postData: PostProps =
  {
    user: 'username',
    userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg',
    postImage: 'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*',
    imageDescription: 'Image description here',
    hashtags: '#hashtag #hashtag #hashtag',
    caption: 'Caption here',
    comments: [
      { username: 'friend1', userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg', comment: 'comment1' },
      { username: 'friend2', userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg', comment: 'comment2' },
      { username: 'friend3', userProfileImage: 'https://st3.depositphotos.com/14903220/37662/v/450/depositphotos_376629516-stock-illustration-avatar-men-graphic-sign-profile.jpg', comment: 'comment3' },
    ]
  }

  const navigate = useNavigate();
  const handleBack = () => navigate(-1);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/getPosts`);
      console.log(response.data);
      setPost(response.data); // Ensure fallback to empty array if no results
    } catch (error) {
      console.error('Error fetching data:', error);
      // Optionally handle navigation or display error message
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]); // Rerun when username changes

  return (
    <div className="w-screen h-screen flex flex-col items-center space-y-8 justify-start">
      <Navbar username={username}></Navbar>
      <div className="max-w-[1000px] flex bg-slate-100 rounded-lg overflow-hidden">
        <div className="w-3/5">
          <img src={post.postImage} alt={post.imageDescription} className=" object-cover" />
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
              {post.comments.map((comment, index) => (
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
                <FaHeart className='cursor-pointer' />
                <FaComment className='cursor-pointer' />
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

