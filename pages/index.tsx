import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Movie {
  title: string;
}

interface ApiResponse {
  data: Movie[];
}

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [userPreferences, setUserPreferences] = useState({
    genre: '',
    rating: '',
  });
  
useEffect(() => {
  axios.get<ApiResponse>('/api/recommendations')
    .then((response) => {
      setMovies(response.data.data);
    }) // <--- Add this closing parenthesis
    .catch((error) => {
      console.error(error);
    });
}, []);

  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserPreferences({ ...userPreferences, genre: event.target.value });
  };

  const handleRatingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserPreferences({ ...userPreferences, rating: event.target.value });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
axios.post<ApiResponse>('/api/recommendations', userPreferences)
  .then((response) => {
    setMovies(response.data.data);
  })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div>
      <Head>
        <title>Movie Recommendation System</title>
      </Head>
      <h1>Movie Recommendation System</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Genre:
          <select value={userPreferences.genre} onChange={handleGenreChange}>
            <option value="">Select a genre</option>
            <option value="action">Action</option>
            <option value="comedy">Comedy</option>
            <option value="drama">Drama</option>
          </select>
        </label>
        <label>
          Rating:
          <select value={userPreferences.rating} onChange={handleRatingChange}>
            <option value="">Select a rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <button type="submit">Get Recommendations</button>
      </form>
      <h2>Movies</h2>
      <ul>
        {movies.map((movie, index) => (
          <li key={index}>{movie.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;