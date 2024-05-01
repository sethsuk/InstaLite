import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate } from 'react-router-dom'
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';

type MenuKey = 'invitations' | 'yourFriends'; // Add more keys as needed

//preloaded invitations
const invitationsData = [
    { id: 1, username: 'user1', online: true },
    { id: 2, username: 'user2', online: false },
    { id: 3, username: 'user3', online: true },
    { id: 4, username: 'user4', online: false },
    { id: 5, username: 'user5', online: true }
]

//preloaded friends
const friendsData = [
    { id: 1, username: 'friend1', online: true },
    { id: 2, username: 'friend2', online: false },
    { id: 3, username: 'friend3', online: true },
    { id: 4, username: 'friend4', online: false },
    { id: 5, username: 'friend5', online: true }

]

const UserInvitation = ({ username, online, onAccept, onReject }) => (
    <div className="flex justify-between items-center p-2 bg-slate-100 rounded-md mb-2">
        <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            <span className="font-semibold">{username}</span>
            {online && <span className="text-sm text-gray-500">Currently online</span>}
        </div>
        <div>
            <button onClick={onAccept} className="text-green-600 hover:text-green-800 mr-4">Accept</button>
            <button onClick={onReject} className="text-red-600 hover:text-red-800">Reject</button>
        </div>
    </div>
);

const FriendsList = ({ username, online, removed}) => (
    <div className="flex justify-between items-center p-2 bg-slate-100 rounded-md mb-2">
        <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            <span className="font-semibold">{username}</span>
            {online && <span className="text-sm text-gray-500">Currently online</span>}
        </div>
        <div>
            <button onClick={removed} className="text-blue-600 hover:text-blue-800 mr-4">Remove</button>
        </div>
    </div>
);

export default function Friends() {

    const navigate = useNavigate();
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // TODO: add state variables for friends and recommendations
    const [activeMenu, setActiveMenu] = useState<MenuKey>('invitations');

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        newMenu: MenuKey | null,) => {
        if (newMenu !== null) {
            setActiveMenu(newMenu);
        }
    }

    useEffect(() => {
        //to implement
    }, [username, rootURL]);

    const handleAccept = (userId: number) => {
        console.log('Accepted invitation from:', userId);
        // Implement acceptance functionality...
    };

    const handleReject = (userId: number) => {
        console.log('Rejected invitation from:', userId);
        // Implement rejection functionality...
    };

    const handleRemove = (userId: number) => {
        console.log('Removed friend:', userId);
        // Implement removal functionality...
    }



    const content: Record<MenuKey, JSX.Element> = {
        invitations: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Invitations</h2>
                    <div className="space-y-2">
                        {invitationsData.map((friend) => (
                            <UserInvitation
                                key={friend.id}
                                username={friend.username}
                                online={friend.online}
                                onAccept={() => handleAccept(friend.id)}
                                onReject={() => handleReject(friend.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ),
        yourFriends: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Your Friends</h2>
                    <div className="space-y-2">
                        {friendsData.map((friend) => (
                            <FriendsList
                                key={friend.id}
                                username={friend.username}
                                online={friend.online}
                                removed={() => handleRemove(friend.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar></Navbar>
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
                            <ToggleButton value="invitations" className="text-left">
                                Invitations
                            </ToggleButton>
                            <ToggleButton value="yourFriends" className="text-left">
                                Your Friends
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
