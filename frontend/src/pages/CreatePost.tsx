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
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

    const rootURL = config.serverRootURL;

    const navigate = useNavigate();
    const handleBack = () => navigate(-1);

    const handleCreatePost = async () => {
        const formData = new FormData();
        console.log('Post photo:', file);
        if (file) {
            formData.append('file', file);
        }
        const userData = {
            title: 'title',
            content: caption
        };

        formData.append('json_data', JSON.stringify(userData));
        console.log(formData);

        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/createPost`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                console.log('Post created successfully.');
                alert('Post created successfully!');
                setCaption('');
                setFile(null);
                setImagePreviewUrl('');
                navigate(`/${username}/`);
            } else {
                console.error('Fail to update caption.');
                alert("Failed to update caption.");
            }

        } catch (error) {
            console.error('Error creating post:', error);
        }
    }


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file) {
                setFile(file);
                const fileLabel = document.getElementById('file-label');
                if (fileLabel) {
                    fileLabel.innerText = file.name;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(file);
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
                                {file && (
                                    <img src={imagePreviewUrl} alt="Preview" className="mt-4 w-fit h-fit object-cover" />
                                )}
                                {!file && (
                                    <span id="file-label" className="italic text-slate-400">No file chosen</span>
                                )}
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
            <div className="flex justify-center w-full">
                <button onClick={handleBack} className="px-4 py-2 text-sm text-gray-500">Go Back</button>
            </div>
        </div>
    )
}