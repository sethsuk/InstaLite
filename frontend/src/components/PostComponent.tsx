import { FaHeart, FaComment } from 'react-icons/fa';

export default function PostComponent({
  user = 'username',
  userProfileImage = '../assets/avatar.svg',
  postImage,
  hashtags = '#hashtag',
  caption = 'Caption here',
  onClick,
  handleLike,
  isLiked,
  likes
}: {
  user: string;
  userProfileImage: string;
  postImage?: string;
  hashtags: string;
  caption: string;
  onClick: () => void;
  handleLike: () => void;
  isLiked: boolean;
  likes: number
}) {
  return (
    <div className='bg-slate-100 w-full space-y-6 max-w-[500px] mx-auto p-6 rounded-md'
      onClick={onClick}
    >
      {/* User display at the top */}
      <div className='flex items-center space-x-2'>
        <img src={userProfileImage} alt="Profile" className='w-8 h-8 rounded-full' /> {/* User profile image */}
        <span className='font-semibold text-slate-800'>{user}</span>
      </div>

      {/* Image for the post */}
      {postImage && (
        <img src={postImage} className='mt-2 mb-2 w-[450px] h-[350px] object-cover' /> // Main post image
      )}

      <div>
        {/* Like and comment icons */}
        <div className='flex items-center space-x-4 text-lg'>
          <FaHeart className={`cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
            onClick={handleLike} />
          <span>likes</span>
          <FaComment className='cursor-pointer' />
        </div>
        {/* Text and hashtags */}
        <div className='mt-2'>
          <span className='text-slate-800 font-semibold'>{user}</span>
          <span className='text-slate-600'> {caption}</span>
          <div className='text-blue-500'>{hashtags}</div>
        </div>
      </div>
    </div>
  );
}
