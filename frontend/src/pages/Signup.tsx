import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function Signup() {
    const navigate = useNavigate();

    const rootURL = config.serverRootURL;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [file, setFile] = useState<File | null>(null); // For storing the uploaded image file
    const [hashtagsInput, setHashtagsInput] = useState<string>('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [options, setOptions] = useState<string[]>([]);

    // Fetch top10 hashtags from the backend
    useEffect(() => {
        const fetchHashtags = async () => {
            try {
                const response = await axios.get(`${rootURL}/getTop10Hashtags`);
                setOptions(response.data.hashtags);
            } catch (error) {
                console.error("Error fetching hashtags:", error);
            }
        };

        fetchHashtags();

    }, []);

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleAddHashtags = async () => {
        try {
            const newTags = hashtagsInput.split(/[\s,]+/).filter(tag => tag && !hashtags.includes(tag));
            if (newTags.length > 0) {
                setHashtags([...hashtags, ...newTags]);
            }
            const response = await axios.post(`${rootURL}/addHashtags`, {
                interests: hashtags
            });
            if (response.status === 200) {
                console.log("Hashtags added successfully:", response.data);
            }
        } catch (error) {
            console.error("Failed to add hashtags:", error);
            alert("Failed to add hashtags.");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();


        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        if (!file) {
            alert('Please select a profile photo.')
            return;
        }

        console.log("sending to back end");
        console.log("BEFORE FORMDATA");

        const formData = new FormData();
        formData.append('file', file);


        const userData = {
            username: username,
            password: password,
            first_name: firstName,
            last_name: lastName,
            email: email,
            affiliation: affiliation,
            birthday: birthday,
            interests: Array.from(new Set([...hashtags, ...selectedItems]))
        };

        // // Append the JSON data as a string under the key 'json_data'
        formData.append('json_data', JSON.stringify(userData));

        console.log("sending to back end");
        console.log(formData);

        try {
            const response = await axios.post(`${rootURL}/signup`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Response: ' + response);

            if (response.status === 200) {
                alert("Sign up successful!");
                navigate(`/${username}/signupactor`);
            } else {
                console.log('Response Status: ' + response.status);
                alert("v1 Registration failed.");
            }
        } catch (error) {
            console.error(error);
            console.log(error);
            alert("v2 Registration failed.");
        }
    };

    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form onSubmit={handleSubmit}>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Create a new account
                    </div>
                    <div className='flex flex-row space-x-40'>
                        <div className='flex flex-col space-y-12'>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Upload your profile photo</h2>
                                <input
                                    type="file"
                                    id="profile-photo"
                                    style={{ display: 'none' }}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                                    }}
                                    accept="image/*"
                                />
                                <label htmlFor="profile-photo" className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white cursor-pointer'>
                                    Select Photo
                                </label>
                                <span id="file-label">No file chosen</span>
                            </div>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'>Choose your interests</h2>
                                <div>
                                    <FormGroup>
                                        {options.map((option, index) => (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox checked={selectedItems.includes(option)} onChange={handleCheckboxChange} name={option} />
                                                }
                                                label={option}
                                                key={index}
                                            />
                                        ))}
                                    </FormGroup>
                                </div>
                                <div className='flex flex-col space-y-2'>
                                    <label htmlFor="username">Create your own hashtag</label>
                                    <input
                                        id="user-hashtag"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={hashtagsInput}
                                        onChange={(e) => setHashtagsInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault(); // Prevent form submission on Enter
                                                handleAddHashtags();
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handleAddHashtags}
                                >
                                    Add hashtag
                                </button>
                            </div>
                        </div>
                        <div className='flex flex-col space-y-6'>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="username" className='font-semibold'>Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>First name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Last name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Birthday</label>
                                <input
                                    id="birthday"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    placeholder='YYYY-MM-DD'
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Affiliation</label>
                                <input
                                    id="linked_nconst"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={affiliation}
                                    onChange={(e) => setAffiliation(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="password" className='font-semibold'>Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="confirmPassword" className='font-semibold'>Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="confirmPassword" className='font-semibold'>Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='w-full flex justify-between'>
                        <button
                            type="button"
                            className='px-4 py-2 rounded-md bg-slate-400 outline-none font-semibold text-white'
                            onClick={() => navigate("/login")}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
