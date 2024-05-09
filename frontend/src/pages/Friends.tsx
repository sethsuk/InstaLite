import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../config.json';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';;
import Navbar from '../components/Navigation';

type MenuKey = 'invitations' | 'yourFriends' | 'recommendations';

type FriendInfo = {
    userId: number;
    username: string;
    online: number;
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

type RecommendationsProps = {
    username: string;
    online: boolean;
    onInvite: () => void;
};

const RecommendationsList = ({ username, online, onInvite }: RecommendationsProps) => (
    <div className="flex justify-between items-center p-2 bg-slate-100 rounded-md mb-2">
        <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            <span className="font-semibold">{username}</span>
            {online && <span className="text-sm text-gray-500">Currently online</span>}
        </div>
        <div>
            <button onClick={onInvite} className="text-blue-600 hover:text-blue-800 mr-4">Send friend request</button>
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
    const [recommendationsData, setRecommendationsData] = useState<FriendInfo[]>([]);
    const [newFriendUsername, setNewFriendUsername] = useState('');

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        newMenu: MenuKey | null) => {
        if (newMenu !== null) {
            setActiveMenu(newMenu);
        }
    }

    const fetchData = async () => {
        try {
            // get friends
            axios.defaults.withCredentials = true;
            const friendsResponse = await axios.get(`${rootURL}/${username}/getFriends`);
            if (friendsResponse.data.results) {
                setFriendsData(friendsResponse.data.results);
            } else {
                console.log('null friends response');
                setFriendsData([]);
            }

            // get friend requests
            axios.defaults.withCredentials = true;
            const invitationsResponse = await axios.get(`${rootURL}/${username}/getFriendRequests`);
            console.log('axios for getFriendRequests sent');
            if (invitationsResponse.data.friendRequests) {
                setInvitationsData(invitationsResponse.data.friendRequests);
            } else {
                console.log('null invitations response');
                setInvitationsData([]);
            }

            // get recommendations
            axios.defaults.withCredentials = true;
            const recommendationResponse = await axios.get(`${rootURL}/${username}/getRecommendations`);
            if (recommendationResponse.data) {
                console.log('Recommendations:', recommendationResponse);
                setRecommendationsData(recommendationResponse.data);
            } else {
                console.log('null recommendations response');
                setRecommendationsData([]);
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };


    useEffect(() => {
        fetchData();
    }, [username, rootURL]);


    const handleAccept = async (senderId: number) => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/acceptFriendRequest`, {
                senderId: senderId
            });
            if (response.status === 200) {
                console.log("Request accepted successfully.");
                fetchData();
            }
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            axios.defaults.withCredentials = true;
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
            axios.defaults.withCredentials = true;
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

    const handleSendFriendRequest = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/sendFriendRequest`, {
                receiverUsername: newFriendUsername
            });
            if (response.status === 400) {
                alert("Invalid username.");
                return;
            }
            if (response.status === 409) {
                alert("Invalid request.");
                return;
            }
            if (response.status === 200) {
                console.log("Friend request sent successfully.");
                alert("Your friend request to " + newFriendUsername + " was sent successfully!");
                setNewFriendUsername('');
            }
        } catch (error) {
            console.error("Failed to send request:", error);
            alert("Fail to send request.");
        }
    }

    // TO DO -- handle invite
    const handleInvite = async (friendUsername: string) => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(`${rootURL}/${username}/sendFriendRequest`, {
                receiverUsername: friendUsername
            });
            if (response.status === 200) {
                console.log("Friend request sent successfully.");
                alert("Friend request sent successfully!");
                fetchData();
            }
        } catch (error) {
            console.error("Failed to remove friend:", error);
        }
    }

    const content: Record<MenuKey, JSX.Element> = {
        invitations: (
            <div className='flex flex-col space-y-4'>
                <div className='p-6 space-y-4 flex flex-col'>
                    <h2 className='font-bold text-2xl'>Invitations</h2>
                    <div className="space-y-2">
                        {invitationsData.length > 0 ? (
                            invitationsData.map((invitation) => (
                                <UserInvitation
                                    key={invitation.senderId}
                                    username={invitation.senderName}
                                    onAccept={() => handleAccept(invitation.senderId)}
                                    onReject={() => handleReject(invitation.requestId)}
                                />
                            ))
                        ) : (
                            <p>You currently have no invitations.</p>
                        )}
                    </div>
                </div>
            </div>
        ),
        yourFriends: (
            <div className='flex flex-col space-y-4'>
                <div className='p-6 space-y-6 flex flex-col'>
                    <div className='space-y-4'>
                        <h2 className='font-bold text-2xl'>Your Friends</h2>
                        <div className="space-y-2">
                            {friendsData.length > 0 ? (
                                friendsData.map((friend) => (
                                    <FriendsList
                                        key={friend.userId}
                                        username={friend.username}
                                        online={friend.online === 1}
                                        removed={() => handleRemove(friend.userId)}
                                    />
                                ))
                            ) : (
                                <p>You currently have no friends. Make a friend request!</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Enter username to add"
                            value={newFriendUsername}
                            onChange={(e) => setNewFriendUsername(e.target.value)}
                            className="border p-2 rounded"
                        />
                        <button
                            onClick={handleSendFriendRequest}
                            className="ml-2 p-2 bg-indigo-400 text-white rounded"
                        >
                            Send friend request
                        </button>
                    </div>
                </div>
            </div>
        ),
        recommendations: (
            <div className='flex flex-col space-y-4'>
                <div className='p-6 space-y-4 flex flex-col'>
                    <h2 className='font-bold text-2xl'>Recommendations</h2>
                    <div className="space-y-2">
                        {recommendationsData.length > 0 ? (
                            recommendationsData.map((recommendation) => (
                                <RecommendationsList
                                    key={recommendation.userId}
                                    username={recommendation.username}
                                    online={recommendation.online === 1}
                                    onInvite={() => handleInvite(recommendation.username)}
                                />
                            ))
                        ) : (
                            <p>You currently have no recommendations.</p>
                        )}
                    </div>
                </div>
            </div>
        ),
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
                            <ToggleButton value="invitations" className="text-left">
                                Invitations
                            </ToggleButton>
                            <ToggleButton value="yourFriends" className="text-left">
                                Your Friends
                            </ToggleButton>
                            <ToggleButton value="recommendations" className="text-left">
                                Recommendations
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
