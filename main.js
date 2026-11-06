const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.TMDB_API_KEY;

const BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbRequest(endpoint) {
    if (!API_KEY) {
        throw new Error('TMDB API token is missing.');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
    }

    return await response.json();
}

// Test TMDB API connection
async function testAPI() {
    try {
        await tmdbRequest('/movie/popular');
        console.log(true);
        return true;
    } catch (error) {
        console.log(false);
        console.error('TMDB Error:', error.message);
        return false;
    }
}

// Search movies
ipcMain.handle('search-movies', async (event, query) => {
    return await tmdbRequest(
        `/search/movie?query=${encodeURIComponent(query)}`
    );
});

// Discover movies by genre
ipcMain.handle('discover-movies', async (event, genre) => {
    return await tmdbRequest(
        `/discover/movie?with_genres=${encodeURIComponent(genre)}`
    );
});

// Get movie details
ipcMain.handle('movie-details', async (event, movieId) => {
    return await tmdbRequest(`/movie/${encodeURIComponent(movieId)}`);
});

// Create application window
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1000,
        minHeight: 650,
        center: true,
        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

// Start application
app.whenReady().then(async () => {
    await testAPI();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Close application
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
