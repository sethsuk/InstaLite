import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navigation';

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;

  const navigate = useNavigate(); 
  
    // TODO: add state variable for posts
    const [posts, setPosts] = useState([]);

    const fetchData = async () => {
      // TODO: fetch posts data and set appropriate state variables 
      try {
          const response = await axios.get(`${rootURL}/feed`);
          setPosts(response.data.results);
      } catch (error) {
          console.error('Error fetching data:', error);
      }
  };

    useEffect(() => {
        fetchData();
    }, []);

  return (
    <div className='w-screen h-screen space-y-4'>
      <Navbar></Navbar>
        <div className='h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4'>
          <CreatePostComponent updatePosts={fetchData} />
          {
              // TODO: map each post to a PostComponent
              //sdfdfsdfsdf
              posts.map((p) => (
                <PostComponent title={p['title']} user={p['username']} description={p['content']} key={p['post_id']} />
           ))
            }
        </div>
    </div>
  )
}

