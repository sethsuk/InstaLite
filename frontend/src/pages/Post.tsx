import Navbar from '../components/Navigation';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

interface CommentProps {
  comment_id: number;
  username: string;
  pfp_url: string;
  content: string;
  timestamp: string;
  hashtags: string;
  replies: CommentProps[];
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

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>("");
  const [replyContentParent, setReplyContentParent] = useState<string>("");

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
  }, [username]);



  const renderComment = (comment: CommentProps) => (
    <div key={comment.comment_id} className="flex flex-col space-y-2 ml-4">
      <div className="flex items-center space-x-2">
        <img src={comment.pfp_url} alt="user profile" className="w-7 h-7 rounded-full" />
        <strong>{comment.username}</strong>
      </div>
      <div>{comment.content}</div>
      <div className='flex items-center space-x-1'>
        <div className='text-blue-500'>{comment.hashtags}</div>
        <button className='text-indigo-400 font-bold cursor-pointer' onClick={() => setReplyingTo(comment.comment_id)}>Reply</button>
      </div>
      {replyingTo === comment.comment_id && (
        <div className="ml-8">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="border border-gray-300 p-2 rounded"
            placeholder="Type your reply..."
          ></textarea>
          <button onClick={() => postReply(replyingTo)} className="px-4 py-2 space-x-2 flex items-center bg-indigo-400 text-white rounded hover:bg-indigo-600">Post</button>
        </div>
      )}
      <div className="pl-4">
        {comment.replies.map(renderComment)}
      </div>
    </div>
  );


  const postReply = async (parent_id: number) => {
    try {
      if (parent_id == -1) {
        await axios.post(`${rootURL}/${username}/createComment`, {
          post_id: postId,
          content: replyContentParent
        });

        setReplyContentParent("");
      } else {
        await axios.post(`${rootURL}/${username}/createComment`, {
          post_id: postId,
          parent_id: parent_id,
          content: replyContent
        });

        setReplyContent("");
      }

      setReplyingTo(null);

      fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  if (!post || !comments) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center space-y-8 justify-start">
      <Navbar username={username}></Navbar>
      <div className="max-w-[1000px] flex bg-slate-100 rounded-lg">
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
              {comments.map(renderComment)}
            </div>
            <div className="border-t border-gray-200 p-4 flex items-center space-x-3">
              {/* Like and comment icons */}
              <div className='flex items-center space-x-4'>
              </div>
              <textarea
                value={replyContentParent}
                onChange={(e) => setReplyContentParent(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Add a comment..."
              ></textarea>
              <button onClick={() => { setReplyingTo(null); postReply(-1); }} className="px-4 py-2 bg-indigo-400 text-white rounded hover:bg-indigo-600">Post</button>
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleBack} className="mt-4 px-4 py-2 text-sm text-gray-500">Go Back</button>
    </div>
  );
}

