import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Menu, MenuItem, Dialog, ListItem, List, ListItemText, IconButton, AppBar, Toolbar, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import config from '../../config.json';
import { Socket, io } from 'socket.io-client';

const rootURL = config.serverRootURL;
axios.defaults.withCredentials = true;
//ADD FRIENDS MODAL 
type AddFriendsModalProps = {
    open: boolean;
    onClose: () => void;
    friends: { username: string, user_id: number }[];
    onInvite: (user_id: number, username: string) => void;
};


const AddFriendsModal = ({ open, onClose, friends, onInvite }: AddFriendsModalProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <AppBar color="primary" sx={{ position: 'relative' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        Add online friends
                    </Typography>
                </Toolbar>
            </AppBar>
            <List>
                {friends.map((friend) => (
                    <ListItem key={friend.user_id} button>
                        <ListItemText primary={friend.username} />
                        <Button onClick={() => onInvite(friend.user_id, friend.username)}>Invite</Button>
                    </ListItem>
                ))}
            </List>
        </Dialog>
    );
};


//CHAT HEADER COMPONENT
type ChatHeaderProps = {
    username: any;
    chatName: String;
    chatId: Number;
    onBack: () => void;
    onLeaveChat: () => void;
    anouncer: (arg0: String) => void;
};

const ChatHeader = ({ username, onBack, onLeaveChat, chatName, chatId, anouncer }: ChatHeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [isModalOpen, setModalOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [updated, setUpdated] = useState(false);

    const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleInvite = async (friend_id: Number, friend_name: String) => {
        console.log(friend_id);
        console.log(chatId);
        console.log(username);
        let result = await axios.get(`${rootURL}/${username}/inviteToChat?friend_id=${friend_id}&chatId=${chatId}`);
        console.log(result.status);
        if (result.status == 200) {
            setFriends(prevData => prevData.filter(friend => friend.user_id !== friend_id));
            anouncer(`Invitation sent to ${friend_name} by ${username}`);
        }
    };

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };
    const onLoad = async () => {
        if (!updated) {
            console.log("loading friends");
            let result = await axios.get(`${rootURL}/${username}/invitableToChat?chatId=${chatId}`);
            setFriends(result.data.friends);
            console.log(result.data);
            setUpdated(true);
        }
    }
    useEffect(() => {
        onLoad();
    });

    return (
        <AppBar position="static" color="default" sx={{ boxShadow: 0 }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="back" onClick={onBack}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {chatName}
                </Typography>
                <IconButton edge="end" color="inherit" aria-label="display more actions" onClick={handleMenu}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id="action-menu"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={open}
                    onClose={handleClose}
                >
                    <MenuItem onClick={handleOpenModal}>Add Friends</MenuItem>
                    <MenuItem onClick={() => { handleClose(); onLeaveChat(); }}>Leave Chat</MenuItem>
                </Menu>
            </Toolbar>
            <AddFriendsModal
                open={isModalOpen}
                onClose={handleCloseModal}
                friends={friends}
                onInvite={handleInvite}
            />
        </AppBar>
    );
};

//MESSAGE LIST COMPONENT
type MessageProps = {
    text: string;
    time: string;
    user: string;
    announcement: boolean;
    isMine: boolean;
};


const Message = ({ text, time, user, announcement, isMine }: MessageProps) => {
    // Check message type
    if (announcement) {
        return (
            <div className="text-center text-gray-400 italic text-sm">
                {text}
            </div>
        );
    }

    // Standard message
    return (
        <div className={`p-2 flex flex-col space-y-1 ${isMine ? 'ml-auto' : 'mr-auto'}`}>
            <span className="text-xs font-semibold">{user}</span>
            <div className={`p-2 ${isMine ? 'rounded-md bg-indigo-100' : 'rounded-md bg-gray-100'}`}>
                {text}
            </div>
            <span className="text-xs italic text-slate-400">{time}</span>
        </div>
    );
};

type MessageListProps = {
    messages: { text: string; time: string; username: string; announcement: boolean; isMine: boolean }[];
};

const MessageList = ({ messages }: MessageListProps) => (
    <div className="flex flex-col space-y-2 p-4">
        {messages.map((message, index) => (
            <Message key={index} text={message.text} time={message.time} user={message.username} announcement={message.username == 'Info'} isMine={message.isMine} />
        ))}
    </div>
);

interface Message {
    text: string;
    username: string;
    time: string,
}


//MAIN FUNCTION
export default function ChatRoom() {
    const input = useRef();
    const [message, setMessage] = useState('');
    const [clickHandler, setClickHandler] = useState(() => () => console.log('Initial handler'));
    const [auth, setAuth] = useState("loading");
    const { username, chatId } = useParams();
    const [sendAnouncement, setSendAnouncement] = useState(() => () => console.log('sending anouncement'));
    const [leaveChat, setLeaveChat] = useState(() => () => console.log('sending anouncement'));


    const onLoad = async () => {
        try {
            let authStatus = await axios.get(`${rootURL}/${username}/authenticateChat?chatId=${chatId}`);
            setAuth("authenticated");
            let socket = io("http://localhost:3000");
            socket.emit("joinRoom", { username, chatId });

            // TODO: Join the chat socket
            socket.on("message", (message: Message) => {
                // console.log([...messages, { text: message.text, isMine: message.username == username }]);
                setMessages(currentArray => [...currentArray, { text: message.text, isMine: message.username == username, time: message.time, username: message.username }]);
            });
            setClickHandler(() => () => {
                console.log("click handler run");
                console.log(input.current.value);
                if (input.current.value.trim()) {
                    console.log("handling new message: " + input.current.value);
                    socket.emit("chatMessage", input.current.value);
                    input.current.value = '';
                    setMessage('');
                } else {
                    socket.emit("chatMessage", "test");
                }
            });

            setSendAnouncement(() => (anouncement: String) => {
                socket.emit("anouncement", `${anouncement}`);
            });
            setLeaveChat(() => async () => {
                // to do 
                let result = await axios.get(`${rootURL}/${username}/leaveChat?chatId=${chatId}`);
                console.log(result.status);
                if (result.status == 200) {
                    navigate(-1);
                    socket.emit("anouncement", `${username} left the chat`);
                }
            });
        } catch (e) {
            console.log("Auth failed")
            setAuth("failed");
        }
    }
    useEffect(() => {
        onLoad();
    }, [username]);


    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);

    const handleBack = () => {
        navigate(-1);
    };



    if (auth == "authenticated") {
        return (
            <div>
                <Navbar username={username}></Navbar>
                <div className='flex justify-center p-8'>
                    <div className='w-[700px]'>
                        <ChatHeader
                            username={username}
                            chatName={chatId}
                            chatId={chatId}
                            onBack={handleBack}
                            anouncer={sendAnouncement}
                            onLeaveChat={leaveChat}
                        />
                        <MessageList messages={messages} />

                        <div className="flex items-center p-4">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded"
                                placeholder="Type here..."
                                ref={input}
                            />
                            <button onClick={clickHandler} className="ml-4 p-2 bg-indigo-500 text-white rounded">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (auth == "loading") {
        return (
            <div>
                <Navbar username={username}></Navbar>
                Authenticating...

            </div>
        );
    } else {
        return (
            <div>
                <Navbar username={username}></Navbar>
                You are not in this chat.

            </div>
        );
    }
};
