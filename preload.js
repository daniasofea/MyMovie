const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('movieAPI', {
    searchMovies: (query) => ipcRenderer.invoke('search-movies', query),
    discoverMovies: (genre) => ipcRenderer.invoke('discover-movies', genre),
    getMovieDetails: (id) => ipcRenderer.invoke('get-movie-details', id)
});