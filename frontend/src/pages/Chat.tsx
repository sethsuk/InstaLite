import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';

type MenuKey = 'existingChats' | 'requestChats' | 'invitations';

type FriendInfo = {
    user_id: number;
    username: string;
    status: string;
};

type ChatInfo = {
    chat_id: number;
    name: string;
};

type RequestInfo = {
    invite_id: number;
    username: string;
};

type UserInvitationProps = {
    username: string;
    onAccept: () => void;
    onReject: () => void;
};

type ChatItemProps = {
    name: string;
    onNavigate: () => void;
};

type FriendItemProps = {
    username: string;
    user_id: number;
    status: 'Invite' | 'Pending';
    onInvite: () => void;
};

const ChatItem = ({ name, onNavigate }: ChatItemProps) => (
    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md mb-2 ">
        <div className="flex items-center">
            <span className="font-semibold">{name}</span>
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

const FriendItem = ({ username, status, onInvite, user_id }: FriendItemProps) => (
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
    const navigate = useNavigate(); 

    const { username } = useParams();
    const rootURL = config.serverRootURL;

    // Sample data
    const invitationsData1 = [
        { requestId: 1, senderId: 1, senderName: 'friend1' },
        { requestId: 2, senderId: 2, senderName: 'friend2' }
    ];

    const chatData1 = [
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
    const [activeMenu, setActiveMenu] = useState<MenuKey>('existingChats');
    const [invitationsData, setInvitationsData] = useState<RequestInfo[]>([]);
    const [friendsData, setFriendsData] = useState<FriendInfo[]>([]);
    const [chatData, setChatData] = useState<ChatInfo[]>([]);

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        newMenu: MenuKey | null,) => {
        if (newMenu !== null) {
            setActiveMenu(newMenu);
            fetchData();
        }
    }

    const fetchData = async () => {
        try {
            const friendsResponse = await axios.get(`${rootURL}/${username}/getInvitableFriends`);
            let friends = friendsResponse.data.friends;
            console.log("Fetching data");
            console.log(friends);
            setFriendsData(friends.map((friend: any) => ({user_id: friend.user_id,
                username: friend.username,
                status: processStatus(friend.status)})));
            const invitationsResponse = await axios.get(`${rootURL}/${username}/getChatInvites`);
            setInvitationsData(invitationsResponse.data.requests);
            const chatResponse = await axios.get(`${rootURL}/${username}/getChats`);
            setChatData(chatResponse.data.chats);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    useEffect(() => {
        
        fetchData();
    }, []);

    const handleAccept = async (invite_id: number) => {
        try {
            const response = await axios.post(`${rootURL}/${username}/acceptInvite`, {
                inviteId: invite_id
            });
            if (response.status === 200) {
                console.log("Request accepted successfully.");
                setInvitationsData(prevData => prevData.filter(request => request.invite_id !== invite_id));
            }
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleReject = async (invite_id: number) => {
        try {
            console.log(invite_id);
            const response = await axios.post(`${rootURL}/${username}/rejectInvite`, {
                inviteId: invite_id
            });
            if (response.status === 200) {
                console.log("Request rejected successfully.");
                setInvitationsData(prevData => prevData.filter(request => request.invite_id !== invite_id));
            }
        } catch (error) {
            console.error("Failed to reject request:", error);
        }
    };

    const handleNavigate = async (chat_id: number) => {
        // to do
        navigate(`/${username}/chatRoom/${chat_id}`);
    }

    const handleInvite = async (friend_id: number) => {

        // to do

        try {
            console.log(friend_id);
            const response = await axios.post(`${rootURL}/${username}/sendInvite`, {
                friendId: friend_id,
            });
            if (response.status === 200) {
                console.log("Request sent successfully.");
                let prevData = friendsData;
                if (prevData) {
                    console.log(prevData.findIndex((friend: any) => friend.user_id == friend_id));
                    let loc = prevData.findIndex((friend: any) => friend.user_id == friend_id);
                    prevData[loc] = {...prevData[loc], status: "Pending"};
                    console.log(prevData);
                    setFriendsData(prevData);
                    fetchData();
                }
            }
        } catch (error) {
            console.error("Failed to send request:", error);
        }
        

    }
    const processStatus = (status: boolean) => {
        if (status) {
            return 'Pending';
        } else {
            return 'Invite';
        }
    }
    let content: Record<MenuKey, JSX.Element>;
    if (invitationsData && chatData && friendsData) {

        content = {
            invitations: (
                <div className='flex flex-col space-y-4'>
                    <div className='p6 space-y-4 flex flex-col'>
                        <h2 className='text-bold'>Invitations</h2>
                        <div className="space-y-2">
                            {invitationsData.map((friend: RequestInfo) => (
                                <UserInvitation
                                    key={friend.invite_id}
                                    username={friend.username}
                                    onAccept={() => handleAccept(friend.invite_id)}
                                    onReject={() => handleReject(friend.invite_id)}
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
                                    key={chat.chat_id}
                                    name={chat.name}
                                    onNavigate={() => handleNavigate(chat.chat_id)}
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
                            {friendsData.map((friend) => (
                                <FriendItem
                                    key={friend.user_id}
                                    username={friend.username}
                                    status={friend.status}
                                    user_id={friend.user_id}
                                    onInvite={() => handleInvite(friend.user_id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    } else {
        content = {invitations: (<p>Loading...</p>), requestChats: (<p>f</p>), existingChats: (<p>t</p>)};
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
