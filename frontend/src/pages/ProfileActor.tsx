import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import Navbar from '../components/Navigation';

type ActorInfo = {
    nconst: string;
    name: string;
    imageUrl: string;
};

export default function SignupActor() {
    const navigate = useNavigate();

    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const [selectedActor, setSelectedActor] = useState<string | null>(null);
    const [actors, setActors] = useState<ActorInfo[]>([]);

    useEffect(() => {
        const fetchActors = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/getTop5Actors`);
                setActors(response.data.actors);
                console.log(response.data.actors);
            } catch (error) {
                console.error("Error fetching actors:", error);
            }
        };

        fetchActors();
    }, [username, rootURL]);

    const handleActorSelect = (
        event: React.MouseEvent<HTMLElement>,
        newActorNconst: string | null
    ) => {
        setSelectedActor(newActorNconst);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            console.log(selectedActor);
            const response = await axios.post(`${rootURL}/${username}/associateActor`, {
                actorNconst: selectedActor
            });
            console.log('Response: ' + response);

            if (response.status === 200) {
                navigate(`/${username}/`);
            } else {
                console.log('Response Status: ' + response.status);
                alert("v1 Failed to associate actor.");
            }
        } catch (error) {
            console.error(error);
            alert('v2 Failed to associate actor.');
        }
    };

    if (!actors) {
        return <div>Loading...</div>;
    }

    return (
        <div className='w-screen h-screen'>
            <Navbar username={username}></Navbar>
            <form onSubmit={handleSubmit} className='flex justify-center items-center py-8'>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-fit'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Update your associated actor
                    </div>
                    <ToggleButtonGroup
                        value={selectedActor}
                        exclusive
                        onChange={handleActorSelect}
                        aria-label="actor selection"
                        className="grid grid-cols-3 gap-2"
                    >
                        {actors.map((actor) => (
                            <ToggleButton value={actor.nconst} key={actor.nconst} className="flex flex-col items-center justify-center">
                                <img src={actor.imageUrl} alt={actor.name} className="w-24 h-24 mb-2" />
                                {actor.name}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <div className='flex justify-between'>
                        <button
                            type="button" // Change to "button" if this should not submit the form
                            className='px-4 py-2 rounded-md bg-slate-400 outline-none font-semibold text-white'
                            onClick={() => navigate(`/${username}/profile`)}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                        >
                            Update actor
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
