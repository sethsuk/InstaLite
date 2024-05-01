import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

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

    // Fetch top5 similar actors 
    useEffect(() => {
        const fetchActors = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/getTop10Actors`);
                setActors(response.data.actors);
            } catch (error) {
                console.error("Error fetching hashtags:", error);
            }
        };

        fetchActors();
    }, []);

    const handleActorSelect = (
        event: React.MouseEvent<HTMLElement>,
        newActorNconst: string | null
    ) => {
        setSelectedActor(newActorNconst);
    };

    const handleSubmit = async () => {
        // TODO: Implement your submit logic here
        try {
            console.log(selectedActor);
            const response = await axios.post(`${rootURL}/${username}/associateActor`);
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


    return (
        <div className='w-screen h-screen flex items-center justify-center'>
            <form>
                <div className='rounded-md bg-slate-200 p-12 space-y-12 w-full'>
                    <div className='font-bold flex w-full justify-center text-2xl mb-4'>
                        Associate yourself with an actor
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
                    <div className='flex justify-end'>
                        <button
                            type="submit"
                            className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                            onClick={handleSubmit}
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
