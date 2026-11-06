const { ipcRenderer } = require('electron');

window.movieAPI = {
    searchMovies: (query) => {
        return ipcRenderer.invoke('search-movies', query);
    },

    discoverMovies: (genre) => {
        return ipcRenderer.invoke('discover-movies', genre);
    },

    getMovieDetails: (movieId) => {
        return ipcRenderer.invoke('movie-details', movieId);
    }
};
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const movieContainer = document.getElementById('movieContainer');
const genreSelect = document.getElementById('genreSelect');
const watchlistContainer = document.getElementById('watchlistContainer');
const totalDuration = document.getElementById('totalDuration');

searchButton.addEventListener('click', searchMovies);

async function searchMovies() {

    const query = searchInput.value.trim();

    if (query === '') {
        alert('Please enter a movie title!');
        return;
    }

    movieContainer.innerHTML = '<p>Searching movies...</p>';

    try {

        const data = await window.movieAPI.searchMovies(query);

        if (!data.results || data.results.length === 0) {
            movieContainer.innerHTML = '<p>No movies found.</p>';
            return;
        }

        displayMovies(data.results);

    } catch (error) {

        console.error('Search Error:', error);

        movieContainer.innerHTML =
            '<p>Something went wrong. Please check your API setup.</p>';
    }
}

genreSelect.addEventListener('change', filterMoviesByGenre);

async function filterMoviesByGenre() {

    const genre = genreSelect.value;

    if (genre === '') {
        movieContainer.innerHTML =
            '<p>Please search for a movie or select a genre.</p>';
        return;
    }

    movieContainer.innerHTML = '<p>Loading movies...</p>';

    try {
        const data = await window.movieAPI.discoverMovies(genre);

        if (!data.results || data.results.length === 0) {
            movieContainer.innerHTML = '<p>No movies found.</p>';
            return;
        }
       

        displayMovies(data.results);

    } catch (error) {

        console.error('Genre Error:', error);

        movieContainer.innerHTML =
            '<p>Unable to load movies. Please try again.</p>';
    }
}

function displayMovies(movies) {

    movieContainer.innerHTML = '';

    movies.forEach(movie => {

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        const poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : '';

        const posterElement = document.createElement('img');

        if (poster) {
            posterElement.src = poster;
            posterElement.alt = 'Movie poster';
            movieCard.appendChild(posterElement);
        }

        const title = document.createElement('h3');
        title.textContent = movie.title;
        movieCard.appendChild(title);

        const release = document.createElement('p');
        release.textContent =
            `Release Date: ${movie.release_date || 'Unknown'}`;
        movieCard.appendChild(release);

        const rating = document.createElement('p');
        rating.textContent =
            `Rating: ${movie.vote_average ?? 'Not available'}`;
        movieCard.appendChild(rating);

        const overview = document.createElement('p');
        overview.textContent =
            movie.overview || 'No description available.';
        movieCard.appendChild(overview);

        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Watchlist';

        addButton.addEventListener('click', function () {
            addToWatchlist(movie);
        });

        movieCard.appendChild(addButton);

        movieContainer.appendChild(movieCard);
    });
}

function getWatchlist() {

    try {

        return JSON.parse(
            localStorage.getItem('myWatchlist') || '[]'
        );

    } catch (error) {

        console.error('Watchlist Error:', error);

        return [];
    }
}

async function addToWatchlist(movie) {

    const watchlist = getWatchlist();

    const existingMovie = watchlist.find(
        item => String(item.id) === String(movie.id)
    );

    if (existingMovie) {
        alert('This movie is already in your watchlist!');
        return;
    }

    try {

        const details =
            await window.movieAPI.getMovieDetails(movie.id);

        const newMovie = {
            id: details.id,
            title: details.title,
            poster: details.poster_path
                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                : '',
            runtime: details.runtime || 0
        };

        watchlist.push(newMovie);

        localStorage.setItem(
            'myWatchlist',
            JSON.stringify(watchlist)
        );

        displayWatchlist();

        alert('Movie added successfully!');

    } catch (error) {

        console.error('Add Movie Error:', error);

        alert('Unable to add movie. Please try again.');
    }
}

function displayWatchlist() {

    const watchlist = getWatchlist();

    watchlistContainer.innerHTML = '';

    if (watchlist.length === 0) {

        watchlistContainer.innerHTML =
            '<p>Your watchlist is empty.</p>';

        calculateTotalDuration();

        return;
    }

    watchlist.forEach(movie => {

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        if (movie.poster) {

            const poster = document.createElement('img');

            poster.src = movie.poster;
            poster.alt = 'Movie poster';

            movieCard.appendChild(poster);
        }

        const title = document.createElement('h3');

        title.textContent = movie.title;

        movieCard.appendChild(title);

        const runtime = document.createElement('p');

        runtime.textContent =
            `Runtime: ${movie.runtime} minutes`;

        movieCard.appendChild(runtime);

        // Edit button
        const editButton = document.createElement('button');

        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.dataset.action = 'edit';
        editButton.dataset.id = movie.id;

        movieCard.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement('button');

        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.dataset.action = 'delete';
        deleteButton.dataset.id = movie.id;

        movieCard.appendChild(deleteButton);

        watchlistContainer.appendChild(movieCard);
    });

    calculateTotalDuration();
}

watchlistContainer.addEventListener('click', function (event) {

    const button = event.target.closest('button[data-action]');

    if (!button || !watchlistContainer.contains(button)) {
        return;
    }

    const movieId = button.dataset.id;

    if (button.dataset.action === 'edit') {

        editMovie(movieId);

    } else if (button.dataset.action === 'delete') {

        deleteMovie(movieId);

    }
});

function editMovie(movieId) {

    const watchlist = getWatchlist();

    const movie = watchlist.find(
        item => String(item.id) === String(movieId)
    );

    if (!movie) {

        alert('Movie not found!');

        return;
    }

    const newTitle = window.prompt(
        'Enter the new movie title:',
        movie.title
    );

    if (newTitle === null) {
        return;
    }

    const updatedTitle = newTitle.trim();

    if (updatedTitle === '') {

        alert('Movie title cannot be empty!');

        return;
    }

    movie.title = updatedTitle;

    localStorage.setItem(
        'myWatchlist',
        JSON.stringify(watchlist)
    );

    displayWatchlist();

    alert('Movie updated successfully!');
}

function deleteMovie(movieId) {

    let watchlist = getWatchlist();

    watchlist = watchlist.filter(
        movie => String(movie.id) !== String(movieId)
    );

    localStorage.setItem(
        'myWatchlist',
        JSON.stringify(watchlist)
    );

    displayWatchlist();

    alert('Movie deleted successfully!');
}

function calculateTotalDuration() {

    const watchlist = getWatchlist();

    let total = 0;

    watchlist.forEach(movie => {

        total += Number(movie.runtime) || 0;

    });

    totalDuration.textContent =
        `Total Watch Time: ${total} minutes`;
}

displayWatchlist();