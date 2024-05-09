import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import axios from 'axios';
import config from '../../config.json';

interface props {
  username?: string
}

export default function Navigation({ username }: props) {

  const pages = ['Friends', 'Chat', 'Profile', 'Search'];
  const navigate = useNavigate();

  const rootURL = config.serverRootURL;

  const handleLogout = async () => {
    axios.defaults.withCredentials = true;
    const response = await axios.post(`${rootURL}/${username}/logout`);
    if (response.status === 200) {
      alert('You are logged out.');
      navigate('/login');
    }
  }

  return (
    <div className='w-screen space-y-24'>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar className='bg-slate-700'>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} onClick={() => navigate(`/${username}/`)}>
              Instalite
            </Typography>
            {pages.map((page) => (
              <Button color="inherit" onClick={() => navigate(`/${username}/${page.toLowerCase()}`)}>{page}</Button>
            ))}
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </Toolbar>
        </AppBar>
      </Box>
    </div>
  )
}
