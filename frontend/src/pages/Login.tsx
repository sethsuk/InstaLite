import { useState } from 'react';
import axios from 'axios'; // Import Axios
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  // TODO: set appropriate state variables for username and password 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const rootURL = config.serverRootURL;

  const handleLogin = async () => {
    // TODO: check username and password using /login route 
    try {
      axios.defaults.withCredentials = true;
      const response = await axios.post(`${rootURL}/login`, {
        username: username,
        password: password
      });

      if (response.status === 200) {
        console.log('User ' + username + ' logged in');
        navigate(`/${username}/`);
      } else {
        alert("v1 Log in failed");
      }
    } catch (error) {
      console.error(error);
      alert("v2 Log in failed.");
    }
  };

  const signup = () => {
    navigate("/signup");
  };

  return (
    <div className='space-y-16 w-screen h-screen flex flex-col items-center justify-center'>
      <div>
        <h1 className='text-4xl font-bold'>Welcome to JavaSwingers' Instalite!</h1>
      </div>
      <div className='space-x-24 flex flex-row items-center justify-center'>
        <div className='space-y-2'>
          <div className='pt-4'>
            <p>Don't have an account?</p>
          </div>
          <div className='w-full flex justify-center'>
            <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none text-white'
              onClick={signup}>Sign up</button>
          </div>
        </div>
        <form>
          <div className='rounded-md bg-slate-200 p-6 space-y-2 w-full'>
            <div className='font-bold flex w-full justify-center text-2xl mb-4'>
              Log In
            </div>
            <div className='flex space-x-4 items-center justify-between'>
              <label htmlFor="username" className='font-semibold'>Username</label>
              <input id="username" type="text" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className='flex space-x-4 items-center justify-between'>
              <label htmlFor="password" className='font-semibold'>Password</label>
              <input id="password" type="password" className='outline-none bg-white rounded-md border border-slate-100 p-2'
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className='w-full flex justify-center'>
              <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
                onClick={handleLogin}>Log in</button>
            </div>

          </div>
        </form>

      </div>
    </div>
  )
}
