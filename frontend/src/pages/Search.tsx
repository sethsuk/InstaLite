import { useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config.json';
import Navbar from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostComponent from '../components/PostComponent';

type MenuKey = 'searchPosts';

type PostProps = {
    post_id: number;
    title: string;
    postImage: string | undefined;
    caption: string;
    likes: number;
    timestamp: string;
    user: string;
    userProfileImage: string | null;
    hashtags: string;
    isLiked: boolean
};


//MAIN FUNCTION
export default function Search() {

    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState<MenuKey>('searchPosts');
    const [postResults, setPostResults] = useState<PostProps[]>([]);
    const [response, setResponse] = useState('');

    const handleClick = (postId: number) => {
        navigate(`/${username}/post/${postId}`);
    };

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
            const newLikes = response.data.likes;

            setPostResults(prevPosts => prevPosts.map(post =>
                post.post_id === postId ? { ...post, isLiked: !isLiked, likes: newLikes } : post
            ));
        } catch (error) {
            console.error('Error (un)liking the post:', error);
        }
    };

    const handleSearchPosts = async (term: string) => {
        console.log("handling search for " + term);
        setSearchTerm(term);
        setResponse('Loading results');
        axios.defaults.withCredentials = true;
        let result = await axios.get(`${rootURL}/query?prompt=${term}`);
        console.log(result.data);
        if (result.status == 200) {
            // to do 
            let json = JSON.parse(result.data.llm);
            console.log(json);
            setResponse(json.explanation);
            axios.defaults.withCredentials = true;
            let post = await axios.post(`${rootURL}/${username}/getSinglePost`, {
                post_id: json.selected_post_id
            });

            console.log(post.data);


            if (post.status == 201) {
                let posts = post.data;
                posts[0].post_id = json.selected_post_id;
                setPostResults(post.data);
            }

        } else {
            setResponse('Search failed, please try again');
        }

    };

    const content: Record<MenuKey, JSX.Element> = {
        searchPosts: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <div className='flex flex-row justify-center items-center space-x-3'>
                        <input
                            type="text"
                            placeholder={`Search for posts`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                            }}
                            style={{ padding: '10px', margin: '10px', width: '500px' }}
                        />
                        <button
                            type="button"
                            className='h-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                            onClick={() => handleSearchPosts(searchTerm)}
                        >
                            Search
                        </button>
                    </div>
                    <div className="space-y-2">
                        <h2 className='text-center'>LLM Response: {response}</h2>
                        {postResults.map((post, index) => (
                            <PostComponent
                                key={index}
                                user={post.user}
                                userProfileImage={post.userProfileImage || 'default-avatar-url'}
                                postImage={post.postImage}
                                hashtags={post.hashtags}
                                caption={post.caption}
                                onClick={() => handleClick(post.post_id)}
                                handleLike={() => handleLike(post.post_id, post.isLiked)}
                                likes={post.likes}
                                isLiked={post.isLiked}
                                timestamp={post.timestamp}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar username={username}></Navbar>
            <div className='py-16'>
                <div className='flex space-x-4 justify-center items-center'>
                    <div className='bg-slate-200 w-3/4 p-4'>
                        {content[activeMenu]}
                    </div>
                </div>
            </div>
        </div>
    )
}
