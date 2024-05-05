import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navigation';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Menu, MenuItem, Dialog, ListItem, List, ListItemText, IconButton, AppBar, Toolbar, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

//ADD FRIENDS MODAL 
type AddFriendsModalProps = {
    open: boolean;
    onClose: () => void;
    friends: { username: string }[];
    onInvite: (username: string) => void;
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
                    <ListItem key={friend.username} button>
                        <ListItemText primary={friend.username} />
                        <Button onClick={() => onInvite(friend.username)}>Invite</Button>
                    </ListItem>
                ))}
            </List>
        </Dialog>
    );
};


//CHAT HEADER COMPONENT
type ChatHeaderProps = {
    username: string;
    onBack: () => void;
    onLeaveChat: () => void;
};

const ChatHeader = ({ username, onBack, onLeaveChat}: ChatHeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [isModalOpen, setModalOpen] = useState(false);
    const [friends, setFriends] = useState([
        { username: 'username1' },
        { username: 'username2' },
        { username: 'username3' }
    ]);

    const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleInvite = () => {
        // to do 
    };

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    return (
        <AppBar position="static" color="default" sx={{ boxShadow: 0 }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="back" onClick={onBack}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {username}
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
    isMine: boolean;
};

const Message = ({ text, isMine }: MessageProps) => (
    <div className={`p-2 ${isMine ? 'ml-auto rounded-md bg-indigo-100' : 'mr-auto rounded-md bg-gray-100'}`}>
        {text}
    </div>
);

type MessageListProps = {
    messages: { text: string; isMine: boolean }[];
};

const MessageList = ({ messages }: MessageListProps) => (
    <div className="flex flex-col space-y-2 p-4">
        {messages.map((message, index) => (
            <Message key={index} text={message.text} isMine={message.isMine} />
        ))}
    </div>
);


//CHAT INPUT COMPONENT
type ChatInputProps = {
    onSend: (message: string) => void;
};

const ChatInput = ({ onSend }: ChatInputProps) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    return (
        <div className="flex items-center p-4">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Type here..."
            />
            <button onClick={handleSend} className="ml-4 p-2 bg-indigo-500 text-white rounded">Send</button>
        </div>
    );
};




//MAIN FUNCTION
export default function ChatRoom() {
    const { username } = useParams();
    

    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { text: "Hello", isMine: false },
        { text: "Hi!", isMine: true }
    ]);

    const handleSendNewMessage = (newMessage: string) => {
        setMessages([...messages, { text: newMessage, isMine: true }]);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleLeaveChat = () => {
        // to do 
    };



    return (
        <div>
            <Navbar username={username}></Navbar>
            <div className='flex justify-center p-8'>
                <div className='w-[700px]'>
                    <ChatHeader
                        username="username"
                        onBack={handleBack}
                        onLeaveChat={handleLeaveChat}
                    />
                    <MessageList messages={messages} />
                    
                    <ChatInput onSend={handleSendNewMessage} />
                </div>
            </div>
        </div>
    );
};

