import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatar from '../assets/avatar.svg';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import Navbar from '../components/Navigation';

type ActorInfo = {
    id: number;
    name: string;
    imageSrc: string;
};

export default function SignupActor() {
    const navigate = useNavigate();
    const [selectedActor, setSelectedActor] = useState<number | null>(null);

    const actors: ActorInfo[] = [
        {id: 1, name: 'Actor 1', imageSrc: avatar},
        {id: 2, name: 'Actor 2', imageSrc: avatar},
        {id: 3, name: 'Actor 3', imageSrc: avatar},
        {id: 4, name: 'Actor 4', imageSrc: avatar},
        {id: 5, name: 'Actor 5', imageSrc: avatar}
    ];

    const handleActorSelect = (
        event: React.MouseEvent<HTMLElement>,
        newActorId: number | null
    ) => {
        setSelectedActor(newActorId);
    };

    const handleSubmit = async () => {
        // TODO: Implement your submit logic here
        console.log(selectedActor); // Example: logging selected actor
    };

    return (
        <div className='w-screen h-screen'>
            <Navbar></Navbar>
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
                            <ToggleButton value={actor.id} key={actor.id} className="flex flex-col items-center justify-center">
                                <img src={actor.imageSrc} alt={actor.name} className="w-24 h-24 mb-2" />
                                {actor.name}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <div className='flex justify-between'>
                        <button
                            type="button" // Change to "button" if this should not submit the form
                            className='px-4 py-2 rounded-md bg-slate-400 outline-none font-semibold text-white'
                            onClick={() => navigate(-1)}
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
