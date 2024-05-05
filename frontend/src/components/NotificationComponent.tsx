import React from 'react';

interface NotificationProps {
  type: string;
  users: string[];
  date: string;
  profileImages: string[];
}

const NotificationComponent: React.FC<NotificationProps> = ({ type, users, date, profileImages }) => {
  const renderContent = (): JSX.Element => {
    switch (type) {
      case 'friendRequest':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>sent you a friend request.</span>
              </div>
            </div>
          </>
        );
      case 'friendRequestAccepted':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>accepted your friend request!</span>
              </div>
            </div>
          </>
        );
      case 'friendRequestRejected':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>rejected your friend request ;(</span>
              </div>
            </div>
          </>
        );
      case 'association':
        return (
          <>
            <div className='space-x-5 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile 1" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>is now linked to</span>
              </div>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[1]} alt="Profile 1" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[1]}`}</span>
              </div>
            </div>
          </>
        );
      case 'chatInvite':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>sent you a chat invite.</span>
              </div>
            </div>
          </>
        );
      case 'chatInviteAccepted':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>accepted your chat invite!</span>
              </div>
            </div>
          </>
        );
      case 'chatInviteRejected':
        return (
          <>
            <div className='space-x-6 flex justify-center items-center'>
              <div className='flex flex-row justify-center items-center space-x-2'>
                <img src={profileImages[0]} alt="Profile" className='w-10 h-10 rounded-full' />
                <span className='font-semibold'>{`${users[0]}`}</span>
              </div>
              <div>
                <span>rejected your chat invite ;(</span>
              </div>
            </div>
          </>
        );
      default:
        return <span>You have a new notification</span>;
    }
  };

  return (
    <div className='bg-indigo-100 p-6 rounded-lg w-[500px]'>
      <div className='flex justify-between items-center'>
        <div className='flex flex-col items-start space-y-4'>
          <div className='italic'>{date}</div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default NotificationComponent;
