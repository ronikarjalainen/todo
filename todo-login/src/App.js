import './App.css';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

function App() {
  return (
    <div className="App">
			<Container maxWidth="md" sx={{ mt: 24 }}>
				<form action={process.env.REACT_APP_TODO_BACKEND_LOGIN} method="post">
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Typography variant="h4" align="center" gutterBottom>
							Log in
						</Typography>
						<TextField
							label="Title"
							id="username"
							name="username"
							required
						/>
		        <TextField
							label="Password"
		          id="password"
							name="password"
		          type='password'
							required
		        />
						<Button type="submit" variant="contained" color="primary">
							Log in
						</Button>
					</Box>
				</form>
			</Container>
    </div>
  );
}

export default App;
