import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Navbar from '../components/Navigation';

export default function Profile() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    //update backend
    const currInterests = ["Interest 1", "Interest 2", "Interest 3", "Interest 4", "Interest 5"];
    const suggestedInterests = ["Interest 6", "Interest 7", "Interest 8", "Interest 9", "Interest 10", "Interest 11", "Interest 12", "Interest 13", "Interest 14", "Interest 15"];
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.name;
        setSelectedItems(prev => {
            // Check if the item is already in the array
            if (prev.includes(value)) {
                // If it is, remove it
                return prev.filter(item => item !== value);
            } else {
                // Otherwise, add it
                return [...prev, value];
            }
        });
    };

    const fetchData = async () => {
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
        <div className='w-screen h-screen space-y-8'>
            <Navbar></Navbar>
            <div className='flex flex-col justify-center items-center space-y-8'>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-[800px]'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        User Details
                    </div>
                    <div className='flex flex-row space-x-40'>
                        <div className='flex flex-col space-y-12'>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Upload your profile photo</h2>
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                >
                                    Update image
                                </button>
                            </div>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Update associated actor</h2>
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    //navigate to /profileactor
                                >
                                    Update actor
                                </button>
                            </div>
                        </div>

                        <div className='flex flex-col space-y-24'>
                            <div className='flex flex-col space-y-6'>
                                <h2 className='font-semibold'> Change email </h2>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <label htmlFor="email">New email</label>
                                    <input
                                        id="email"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={username}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                >
                                    Update email
                                </button>
                            </div>
                            <div className='flex flex-col space-y-6'>
                                <h2 className='font-semibold'> Change password </h2>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <label htmlFor="email">Current password</label>
                                    <input
                                        id="email"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={username}
                                    />
                                </div>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <label htmlFor="email">New password</label>
                                    <input
                                        id="email"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={username}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                >
                                    Update password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-[800px]'>
                    <div className='font-bold flex justify-center text-2xl mb-4'>
                        Add Interests
                    </div>
                    <div>
                        <div>
                            <FormGroup>
                                <Grid container spacing={2}>
                                    {suggestedInterests.map((interest, index) => (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox checked={selectedItems.includes(interest)} onChange={handleChange} name={interest} />
                                                }
                                                label={interest}
                                                key={index}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </FormGroup>
                        </div>
                    </div>
                    <div>
                        <div className='flex flex-col space-y-2'>
                            <label htmlFor="username">Create your own hashtag</label>
                            <div className='flex space-x-6'>
                                <input
                                    id="user-hashtag"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={username}
                                />
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    //add hashtag
                                >
                                    Add hashtag
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className='w-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-semibold text-white'
                    >
                        Add interests
                    </button>
                </div>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-[800px]'>
                    <div className='font-bold flex justify-center text-2xl mb-4'>
                        Remove Interests
                    </div>
                    <div className='space-y-4'>
                        <h2> Your current interests are as follows. Select to remove:</h2>
                        <div>
                            <FormGroup>
                                {currInterests.map((interest, index) => (
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={selectedItems.includes(interest)} onChange={handleChange} name={interest} />
                                        }
                                        label={interest}
                                        key={index}
                                    />
                                ))}
                            </FormGroup>
                        </div>

                    </div>
                    <button
                        type="submit"
                        className='w-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-semibold text-white'
                        //onclick = 
                    >
                        Remove interests
                    </button>
                </div>
            </div>
        </div>
    )
}

