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

    const [email, setEmail] = useState('');
    const [currPassword, setCurrPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [affiliation, setAffiliation] = useState('');
    const [currInterests, setCurrInterests] = useState<string[]>([]);
    const [suggestedInterests, setSuggestedInterests] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [hashtagsInput, setHashtagsInput] = useState<string>('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [pfpUrl, setPfpUrl] = useState('');

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

    // TODO
    const fetchCurrInterests = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.get(`${rootURL}/${username}/getHashtags`);
            setCurrInterests(response.data.tags);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchSuggestedInterests = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/suggestHashtags`);
            setSuggestedInterests(response.data.tags);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchPfp = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.get(`${rootURL}/${username}/getPfp`);
            setPfpUrl(response.data.pfp_url);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    useEffect(() => {
        fetchPfp();
        fetchCurrInterests();
        fetchSuggestedInterests();
    }, [username, rootURL]);


    const profileActor = () => {
        navigate(`/${username}/profileactor`);
    };

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

    const handleUpload = async () => {
        try {
            const formData = new FormData();
            if (!file) {
                console.log("null file select photo");
                alert('Please select a profile photo.')
                return;
            }
            console.log(file);
            console.log("added file");
            formData.append('file', file);

            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/updatePfp`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                profileActor();
            } else {
                console.error('Fail to upload photo.');
                alert("Failed to upload photo.");
            }
        } catch (error) {
            console.error("Failed to upload photo:", error);
            alert("Failed to upload photo.");
        }
    }


    const handleEmail = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/changeEmail`, {
                newEmail: email
            });
            if (response.status === 200) {
                console.log("Email changed successfully.");
                alert("Email changed successfully!");
                setEmail('');
            }
        } catch (error) {
            console.error("Failed to update email:", error);
            alert("Failed to update email.");
        }
    };

    const handleAffiliation = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/changeAffiliation`, {
                newAffiliation: affiliation
            });
            if (response.status === 200) {
                console.log("Affiliation changed successfully.");
                alert("Affiliation changed successfully!");
                setAffiliation('');
            }
        } catch (error) {
            console.error("Failed to update affiliation:", error);
            alert("Failed to update affiliation.");
        }
    };

    const handlePassword = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/changePassword`, {
                currentPassword: currPassword,
                newPassword: newPassword
            });
            if (response.status === 200) {
                console.log("Password changed successfully:", response.data);
                alert("Password changed successfully!");
                setCurrPassword('');
                setNewPassword('');
            }
        } catch (error) {
            console.error("Failed to update password:", error);
            alert("Failed to update password.");
        }
    }

    const handleAddHashtags = async () => {
        try {
            const newTags = hashtagsInput.split(/[\s,]+/);
            console.log(newTags);
            if (newTags.length < 1) {
                alert("Field is empty.");
                return;
            }
            setHashtags([...hashtags, ...newTags]);
            setSelectedItems([...selectedItems, ...newTags]);
            setSuggestedInterests([...suggestedInterests, ...newTags]);
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/addHashtags`, {
                interests: newTags
            });
            if (response.status === 200) {
                console.log("Hashtags added successfully.");
            }
        } catch (error) {
            console.error("Failed to add hashtags:", error);
            alert("Failed to add hashtags.");
        }
    };

    const handleAddInterests = async () => {
        try {
            const interests = Array.from(new Set([...hashtags, ...selectedItems]));
            console.log(interests);
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/updateHashtags`, {
                hashtags: interests
            });
            if (response.status === 200) {
                console.log("Interests added successfully.");
                alert('New interests added successfully!');
                setHashtagsInput('');
                fetchCurrInterests();
                fetchSuggestedInterests();
            }
        } catch (error) {
            console.error("Failed to add interests:", error);
            alert("Failed to add interests.");
        }
    };

    const handleRemoveInterests = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/removeHashtags`, {
                hashtags: selectedItems
            });
            if (response.status === 200) {
                console.log("Interests removed successfully.");
                alert("Interests removed successfully!");
                fetchCurrInterests();
            }
        } catch (error) {
            console.error("Failed to remove interests:", error);
            alert("Failed to remove interests.");
        }
    };


    return (
        <div className='w-screen h-screen space-y-8'>
            <Navbar username={username}></Navbar>
            <div className='flex flex-col justify-center items-center space-y-8 py-8'>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-[800px]'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        User Details
                    </div>
                    <div className='flex flex-row space-x-40'>
                        <div className='flex flex-col space-y-12'>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'>Current profile photo</h2>
                                <img src={pfpUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                            </div>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Update your profile photo</h2>
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

                                <span id="file-label" className='italic text-slate-400'>No file chosen</span>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handleUpload}
                                >
                                    Upload photo
                                </button>
                            </div>
                            <div className='flex flex-col space-y-4'>
                                <h2 className='font-semibold'> Update associated actor</h2>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={profileActor}
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handleEmail}
                                >
                                    Update email
                                </button>
                            </div>
                            <div className='flex flex-col space-y-6'>
                                <h2 className='font-semibold'> Change affiliation </h2>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <label htmlFor="email">New affiliation</label>
                                    <input
                                        id="affiliation"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={affiliation}
                                        onChange={(e) => setAffiliation(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handleAffiliation}
                                >
                                    Update affiliation
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
                                        value={currPassword}
                                        onChange={(e) => setCurrPassword(e.target.value)}
                                    />
                                </div>
                                <div className='flex space-x-4 items-center justify-between'>
                                    <label htmlFor="email">New password</label>
                                    <input
                                        id="password"
                                        type="text"
                                        className='outline-none bg-white rounded-md border border-slate-100 p-2'
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handlePassword}
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
                                    value={hashtagsInput}
                                    onChange={(e) => setHashtagsInput(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className='w-fit px-4 py-2 rounded-md bg-indigo-400 outline-none font-semibold text-white'
                                    onClick={handleAddHashtags}
                                >
                                    Add hashtag
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className='w-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-semibold text-white'
                        onClick={handleAddInterests}
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
                        type="button"
                        className='w-fit px-4 py-2 rounded-md bg-indigo-500 outline-none font-semibold text-white'
                        onClick={handleRemoveInterests}
                    >
                        Remove interests
                    </button>
                </div>
            </div>
        </div>
    )
}
