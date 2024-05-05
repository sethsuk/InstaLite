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

export default function CreatePost() {

    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const handleCreatePost = async () => {
        console.log("triggered handleCaption");
        const response = await axios.post(`${rootURL}/${username}/createPost`, {
            caption: caption
        });

        if (response.status === 200) {
            //to do update post
        } else {
            console.error('Fail to update caption.');
            alert("Failed to update caption.");
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            const fileLabel = document.getElementById('file-label');
            if (fileLabel) {
                fileLabel.innerText = e.target.files[0].name;
            }
        } else {
            setFile(null);
            const fileLabel = document.getElementById('file-label');
            if (fileLabel) {
                fileLabel.innerText = 'No file chosen';
            }
        }
    };

    return (
        <div className='w-screen h-screen space-y-8'>
            <Navbar username={username}></Navbar>
            <div className='flex flex-col justify-center items-center space-y-8'>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-[800px]'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        New post
                    </div>
                    <div className='flex flex-row space-x-40'>
                        <div className='flex flex-col space-y-12'>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Choose a photo</h2>
                                <input
                                    type="file"
                                    id="profile-photo"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                <label htmlFor="profile-photo" className='w-fit text-indigo-400 font-semibold cursor-pointer'>
                                    Select Photo
                                </label>
                                <span id="file-label" className="italic text-slate-400">No file chosen</span>
                            </div>
                        </div>

                        <div className='flex flex-col space-y-24'>
                            <div className='flex flex-col space-y-6'>
                                <h2 className='font-semibold'> Caption </h2>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <input
                                        id="caption"
                                        type="text"
                                        className='outline-none w-[300px] bg-white rounded-md border border-slate-100 p-2'
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-end'>
                        <button
                            type="button"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                            onClick={handleCreatePost}
                        >
                            Create Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}