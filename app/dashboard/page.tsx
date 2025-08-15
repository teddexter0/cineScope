// Add these handler functions to your dashboard/page.tsx file
// Place them INSIDE your Dashboard component, before the return statement

const handleAddToWatchlist = async (movieData: any) => {
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: movieData.id,
        status: 'to_watch',
        notes: `Added from recommendations on ${new Date().toLocaleDateString()}`
      })
    })

    const data = await response.json()
    
    if (data.success) {
      // Success feedback with Superman colors
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-6 py-3 rounded-lg font-bold shadow-lg z-50'
      successDiv.textContent = `${movieData.title} added to watchlist! 🎬`
      document.body.appendChild(successDiv)
      
      setTimeout(() => {
        successDiv.remove()
      }, 3000)
    } else {
      alert(data.error || 'Failed to add to watchlist')
    }
  } catch (error) {
    console.error('Add to watchlist error:', error)
    alert('Something went wrong. Please try again.')
  }
}

const handleLikeMovie = async (movieData: any) => {
  try {
    const response = await fetch('/api/movies/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: movieData.id,
        rating: 8.5,
        review: 'Liked from recommendations'
      })
    })

    const data = await response.json()
    
    if (data.success) {
      // Success feedback with Superman colors
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 px-6 py-3 rounded-lg font-bold shadow-lg z-50'
      successDiv.textContent = `Liked ${movieData.title}! Improving your recommendations... 👍`
      document.body.appendChild(successDiv)
      
      setTimeout(() => {
        successDiv.remove()
      }, 3000)
    } else {
      alert(data.error || 'Failed to like movie')
    }
  } catch (error) {
    console.error('Like movie error:', error)
    alert('Something went wrong. Please try again.')
  }
}

// Then in your movie grid, find the buttons section and replace it with:
// (Look for the section with className="flex gap-1 md:gap-2")

<div className="flex gap-1 md:gap-2">
  <button 
    onClick={() => handleLikeMovie(movie)}
    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-blue-900 py-1 px-1 md:px-2 rounded text-xs font-bold transition-all shadow-lg"
    title="Like this movie"
  >
    👍
  </button>
  <button 
    onClick={() => handleAddToWatchlist(movie)}
    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-1 md:px-2 rounded text-xs font-bold transition-all shadow-lg"
    title="Add to watchlist"
  >
    ➕
  </button>
</div>