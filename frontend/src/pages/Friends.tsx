import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';

type MenuKey = 'invitations' | 'yourFriends'; // Add more keys as needed

type FriendInfo = {
    userId: number;
    name: string;
    online: boolean;
};

type RequestInfo = {
    requestId: number;
    senderId: number;
    senderName: string;
};

type UserInvitationProps = {
    username: string;
    onAccept: () => void;
    onReject: () => void;
};

const UserInvitation = ({ username, onAccept, onReject }: UserInvitationProps) => (
    <div className="flex justify-between items-center p-2 bg-slate-100 rounded-md mb-2">
        <div className="flex items-center space-x-2">
            <span className="font-semibold">{username}</span>
        </div>
        <div>
            <button onClick={onAccept} className="text-green-600 hover:text-green-800 mr-4">Accept</button>
            <button onClick={onReject} className="text-red-600 hover:text-red-800">Reject</button>
        </div>
    </div>
);

type FriendsListProps = {
    username: string;
    online: boolean;
    removed: () => void;
};

const FriendsList = ({ username, online, removed }: FriendsListProps) => (
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

    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // TODO: add state variables for friends and recommendations
    const [activeMenu, setActiveMenu] = useState<MenuKey>('invitations');
    const [invitationsData, setInvitationsData] = useState<RequestInfo[]>([]);
    const [friendsData, setFriendsData] = useState<FriendInfo[]>([]);

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        newMenu: MenuKey | null,) => {
        if (newMenu !== null) {
            setActiveMenu(newMenu);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const friendsResponse = await axios.get(`${rootURL}/${username}/getFriends`);
                setFriendsData(friendsResponse.data.results);
                const invitationsResponse = await axios.get(`${rootURL}/${username}/getFriendRequests`);
                setInvitationsData(invitationsResponse.data.results);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    const handleAccept = async (requestId: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/acceptFriendRequest`, {
                requestId: requestId
            });
            if (response.status === 200) {
                console.log("Request accepted successfully.");
                setInvitationsData(prevData => prevData.filter(request => request.requestId !== requestId));
            }
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/rejectFriendRequest`, {
                requestId: requestId
            });
            if (response.status === 200) {
                console.log("Request rejected successfully.");
                setInvitationsData(prevData => prevData.filter(request => request.requestId !== requestId));
            }
        } catch (error) {
            console.error("Failed to reject request:", error);
        }
    };

    const handleRemove = async (userId: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/removeFriend`, {
                friendId: userId
            });
            if (response.status === 200) {
                console.log("Friend removed successfully.");
                setFriendsData(prevData => prevData.filter(friend => friend.userId !== userId));
            }
        } catch (error) {
            console.error("Failed to remove friend:", error);
        }
    }

    const content: Record<MenuKey, JSX.Element> = {
        invitations: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Invitations</h2>
                    <div className="space-y-2">
                        {invitationsData.map((friend) => (
                            <UserInvitation
                                key={friend.senderId}
                                username={friend.senderName}
                                onAccept={() => handleAccept(friend.requestId)}
                                onReject={() => handleReject(friend.requestId)}
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
                                key={friend.userId}
                                username={friend.name}
                                online={friend.online}
                                removed={() => handleRemove(friend.userId)}
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
