import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostComponent from '../components/PostComponent';

type MenuKey = 'searchActors' | 'searchPosts';

type PostProps = {
    user: string;
    userProfileImage: string;
    postImage?: string;
    hashtags: string;
    caption: string;
    onClick: () => void;
    handleLike: () => void;
    isLiked: boolean;
    likes: number;
    timestamp: string;
};

interface Actor {
    name: string;
    username: string;
    interests: string[];
    birthday: string;
    affiliation: string;
    imageUrl: string;
}

//ACTOR PROFILE COMPONENT
const ActorProfile: React.FC<{ actor: Actor }> = ({ actor }) => {
    return (
        <div className="bg-white w-fit p-4 border border-gray-300 rounded-lg m-2 shadow-sm">
            <div className="mb-4">
                <img src={actor.imageUrl} alt={actor.name} className="w-[300px] rounded-md" />
            </div>
            <h2 className="text-lg font-semibold">{actor.name}</h2>
            <p className="italic text-gray-600">{actor.username}</p>
            <p className="max-w-[300px]"><strong>Interests: </strong>{actor.interests.join(' ')}</p>
            <p className=""><strong>Birthday:</strong> {actor.birthday}</p>
            <p className=""><strong>Affiliation:</strong> {actor.affiliation}</p>
        </div>
    );
};


//MAIN FUNCTION
export default function Search() {

    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Actor[]>([]);
    const [activeMenu, setActiveMenu] = useState<MenuKey>('searchPosts');
    const [actorResults, setActorResults] = useState<Actor[]>([]);
    const [postResults, setPostResults] = useState<PostProps[]>([]);
    const [response, setResponse] = useState('');


    const mockActors: Actor[] = [
        {
            name: 'Lady Gaga',
            username: '@lady_gaga_123',
            interests: ['#hashtag', '#hashtag', '#hashtag', '#hashtag', '#hashtag'],
            birthday: 'May 4, 1999',
            affiliation: 'Star Wars',
            imageUrl: 'https://people.com/thmb/44MYbIoCwyb2qaBAK_S8_bS9dJc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(599x0:601x2)/lady-gaga-5-545e96aeff0b4b08a6597b2af742adb2.jpg',
        },
        {
            name: 'Lady Gaga',
            username: '@lady_gaga_123',
            interests: ['#hashtag', '#hashtag', '#hashtag', '#hashtag', '#hashtag'],
            birthday: 'May 4, 1999',
            affiliation: 'Star Wars',
            imageUrl: 'https://people.com/thmb/44MYbIoCwyb2qaBAK_S8_bS9dJc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(599x0:601x2)/lady-gaga-5-545e96aeff0b4b08a6597b2af742adb2.jpg',
        },
    ];

    const mockPosts = [{
        user: 'JohnDoe',
        userProfileImage: 'https://cdn.vectorstock.com/i/1000v/06/18/male-avatar-profile-picture-vector-10210618.jpg',
        postImage: 'https://i.natgeofe.com/n/c9107b46-78b1-4394-988d-53927646c72b/1095.jpg',
        isLiked: false,
        likes: 3,
        timestamp: 'May 4, 2024',
        hashtags: '#nature #travel',
        caption: 'Exploring the great outdoors!'
    },
    {
        user: 'JohnDoe',
        userProfileImage: 'https://cdn.vectorstock.com/i/1000v/06/18/male-avatar-profile-picture-vector-10210618.jpg',
        postImage: 'https://i.natgeofe.com/n/c9107b46-78b1-4394-988d-53927646c72b/1095.jpg',
        isLiked: false,
        likes: 3,
        timestamp: 'May 4, 2024',
        hashtags: '#nature #travel',
        caption: 'Exploring the great outdoors!'
    }];

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        newMenu: MenuKey | null) => {
        // if (newMenu !== null) {
        //     setActiveMenu(newMenu);
        //     // Optionally clear out irrelevant data
        //     if (newMenu === 'searchActors') {
        //         setPostResults([]);
        //         if (searchTerm) handleSearchActors(searchTerm);
        //     } else {
        //         setActorResults([]);
        //         if (searchTerm) handleSearchPosts(searchTerm);
        //     }
        // }
    }

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
            // Assume the backend returns the new likes count
            const newLikes = response.data.likes;

            // Update the posts state with the new like status and count
            setPostResults(prevPosts => prevPosts.map(post =>
                post.post_id === postId ? { ...post, isLiked: !isLiked, likes: newLikes } : post
            ));
        } catch (error) {
            console.error('Error (un)liking the post:', error);
        }
    };

    const handleSearchActors = (term: string) => {
        setSearchTerm(term);
        //to do 
        if (term.length > 2) {
            setActorResults(mockActors);
        } else {
            setActorResults([]);
        }
    };

    const handleSearchPosts = async (term: string) => {
        console.log("handling search for " + term);
        setSearchTerm(term);
        setResponse('Loading results');
        let result = await axios.get(`${rootURL}/query?prompt=${term}`);
        console.log(result.data);
        if (result.status == 200) {
            // to do 
            let json = JSON.parse(result.data.llm);
            console.log(json);
            setResponse(json.explanation);
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
        searchActors: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <div className='flex flex-row items-center space-x-3'>
                        <input
                            type="text"
                            placeholder={`Search for ${activeMenu === 'searchActors' ? 'actors' : 'posts'}...`}
                            value={searchTerm}
                            onChange={(e) => {
                                
                                setSearchTerm(e.target.value);
                               
                            }}
                            style={{ padding: '10px', margin: '10px', width: '300px' }}
                        />
                        <button
                            type="button"
                            className='h-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                            onClick={() => {

                                if (activeMenu === 'searchActors') {
                                    handleSearchActors(searchTerm);
                                } else {
                                    handleSearchPosts(searchTerm);
                                }
                            }}
                        >
                            Search
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-2">
                        {mockActors.map((actor) => (
                            <ActorProfile
                                key={actor.username}
                                actor={actor}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ),
        searchPosts: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <div className='flex flex-row items-center space-x-3'>
                        <input
                            type="text"
                            placeholder={`Search for ${activeMenu === 'searchActors' ? 'actors' : 'posts'}...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                            }}
                            style={{ padding: '10px', margin: '10px', width: '300px' }}
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
                                userProfileImage={post.userProfileImage}
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
                <div className='flex space-x-4 justify-center'>
                    <div className="">
                        <ToggleButtonGroup
                            value={activeMenu}
                            exclusive
                            onChange={handleMenuClick}
                            orientation="vertical"
                            className="w-full"
                        >
                            <ToggleButton value="searchPosts" className="text-left">
                                Search Posts
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <div className='bg-slate-200 w-3/4 p-4'>
                        {content[activeMenu]}
                    </div>
                </div>
            </div>
        </div>
    )
}
