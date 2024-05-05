import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';

type MenuKey = 'existingChats' | 'requestChats' | 'invitations';

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

type ChatItemProps = {
    usernames: string[];
    onNavigate: () => void;
};

type FriendItemProps = {
    username: string;
    status: 'Invite' | 'Pending';
    onInvite: () => void;
};

const ChatItem = ({ usernames, onNavigate }: ChatItemProps) => (
    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md mb-2 ">
        <div className="flex items-center">
            <span className="font-semibold">{usernames.join(', ')}</span>
        </div>
        <div>
            <button onClick={onNavigate} className="text-blue-600 hover:text-blue-800">Go to chat</button>
        </div>
    </div>
);

const UserInvitation = ({ username, onAccept, onReject }: UserInvitationProps) => (
    <div className="flex justify-between items-center p-4 bg-slate-100 rounded-md mb-2">
        <div className="flex items-center space-x-2">
            <span className="font-semibold">{username}</span>
        </div>
        <div>
            <button onClick={onAccept} className="text-green-600 hover:text-green-800 mr-4">Accept</button>
            <button onClick={onReject} className="text-red-600 hover:text-red-800">Reject</button>
        </div>
    </div>
);

const FriendItem = ({ username, status, onInvite }: FriendItemProps) => (
    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md mb-2">
        <span className="font-semibold">{username}</span>
        {status === 'Invite' ? (
            <button onClick={onInvite} className="text-blue-600 hover:text-blue-800">Invite to chat</button>
        ) : (
            <span className="text-gray-500 italic">Invitation pending</span>
        )}
    </div>
);

export default function Chat() {

    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // Sample data
    const invitationsData1 = [
        { requestId: 1, senderId: 1, senderName: 'friend1' },
        { requestId: 2, senderId: 2, senderName: 'friend2' }
    ];

    const chatData = [
        { id: 1, usernames: ['username1'] },
        { id: 2, usernames: ['username2'] },
        { id: 3, usernames: ['username1', 'username3'] },
    ];

    const requestData = [
        { username: 'username1', status: 'Invite' },
        { username: 'username2', status: 'Invite' },
        { username: 'username3', status: 'Pending' },
    ];

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

    const handleNavigate = async (userId: number) => {
        // to do
    }

    const handleInvite = async (username: string) => {
        // to do
    }

    const content: Record<MenuKey, JSX.Element> = {
        invitations: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Invitations</h2>
                    <div className="space-y-2">
                        {invitationsData1.map((friend) => (
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
        existingChats: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Your Chats</h2>
                    <div className="space-y-2">
                        {chatData.map((chat) => (
                            <ChatItem
                                key={chat.id}
                                usernames={chat.usernames}
                                onNavigate={() => handleNavigate(chat.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ),
        requestChats: (
            <div className='flex flex-col space-y-4'>
                <div className='p6 space-y-4 flex flex-col'>
                    <h2 className='text-bold'>Currently online friends</h2>
                    <div className="space-y-2">
                        {requestData.map((friend, index) => (
                            <FriendItem
                                key={index}
                                username={friend.username}
                                status={friend.status}
                                onInvite={() => handleInvite(friend.username)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <Navbar username={username}></Navbar>
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
                            <ToggleButton value="existingChats" className="text-left">
                                Existing Chats
                            </ToggleButton>
                            <ToggleButton value="requestChats" className="text-left">
                                Request Chats
                            </ToggleButton>
                            <ToggleButton value="invitations" className="text-left">
                                Invitations
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
