import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function Signup() {
    const navigate = useNavigate(); 
    
    // TODO: set appropriate state variables 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [linked_nconst, setLinkedNconst] = useState('');

    const rootURL = config.serverRootURL;

    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const options = ["Option 1", "Option 2", "Option 3"];
    
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
    

    const handleSubmit = async () => {

        // TODO: make sure passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            console.log('Username: ' + username);
            console.log('Selected Interests: ' + selectedItems);
            console.log('Posting to Axios');
            const response = await axios.post(`${rootURL}/register`, {
                username: username,
                password: password,
                linked_nconst: linked_nconst
            });
            console.log('Response: ' + response);

            if (response.status === 200) {
                alert("Sign up successful!");
                console.log('Registration Success');
                navigate('/home/' + username);
            } else {
                console.log('Response Status: ' + response.status);
                alert(" v1 Registration failed");
            }
        } catch (error) {
            console.error(error);
            console.log('Error 1');
            alert("v2 Registration failed");
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
                                <button
                                    type="submit"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    //onclick = ...
                                >
                                Upload
                            </button>
                         </div>
                         <div className='flex flex-col space-y-4'>
                            <h2 className='font-semibold'>Choose your interests</h2>
                            <div>
                                <FormGroup>
                                    {options.map((option, index) => (
                                        <FormControlLabel
                                            control={
                                            <Checkbox checked={selectedItems.includes(option)} onChange={handleChange} name={option} />
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
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
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
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>First name</label>
                                <input
                                    id="linked_nconst"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={linked_nconst}
                                    onChange={(e) => setLinkedNconst(e.target.value)}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Last name</label>
                                <input
                                    id="linked_nconst"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={linked_nconst}
                                    onChange={(e) => setLinkedNconst(e.target.value)}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Birthday</label>
                                <input
                                    id="linked_nconst"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={linked_nconst}
                                    onChange={(e) => setLinkedNconst(e.target.value)}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="linked_nconst" className='font-semibold'>Affiliation</label>
                                <input
                                    id="linked_nconst"
                                    type="text"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={linked_nconst}
                                    onChange={(e) => setLinkedNconst(e.target.value)}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="password" className='font-semibold'>Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className='flex space-x-4 items-center justify-between'>
                                <label htmlFor="confirmPassword" className='font-semibold'>Password</label>
                                <input
                                    id="password"
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
                            type="submit"
                            className='px-4 py-2 rounded-md bg-slate-400 outline-none font-semibold text-white'
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                            // submit button to post to backend
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
