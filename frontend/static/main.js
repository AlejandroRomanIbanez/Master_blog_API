// Function that runs once the window is fully loaded
window.onload = function() {
    // Attempt to retrieve the API base URL from the local storage
    var savedBaseUrl = localStorage.getItem('apiBaseUrl');
    // If a base URL is found in local storage, load the posts
    if (savedBaseUrl) {
        document.getElementById('api-base-url').value = savedBaseUrl;
    loadPosts();
    }
    document.getElementById('sort-button').addEventListener('click', sortPosts);
};

function register() {
    var baseUrl = document.getElementById('api-base-url').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Send a POST request to the registration endpoint
    fetch(baseUrl + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Registration successful');
        // Optional: You can automatically log in the user after registration if desired
        // Call the login function here or display a success message to the user
    })
    .catch(error => console.error('Error:', error));
}


function login() {
    var baseUrl = document.getElementById('api-base-url').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Send a POST request to the login endpoint
    fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
        // Store the access token in localStorage
        localStorage.setItem('accessToken', data.access_token);
        console.log('Login successful');

        // Call the function to load posts
        loadPosts();
    })
    .catch(error => console.error('Error:', error));
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
        <p><strong>Author:</strong> ${post.author}</p>
        <p><strong>Date:</strong> ${post.date}</p>
        <div class="post-buttons">
            <button onclick="deletePost(${post.id})">Delete</button>
            <button onclick="updatePost(${post.id})">Update</button>
        </div>
    `;
    return postDiv;
}

function sortPosts() {
    // Retrieve the sort and direction values from the select elements
    var sortValue = document.getElementById('sort-by').value;
    var directionValue = document.getElementById('sort-direction').value;

    // Retrieve the base URL from the input field
    var baseUrl = document.getElementById('api-base-url').value;

    // Construct the URL with the sorting parameters
    var url = baseUrl + '/posts?sort=' + sortValue + '&direction=' + directionValue;

    // Use the Fetch API to send a GET request to the constructed URL
    fetch(url)
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => {  // Once the data is ready, we can use it
            // Clear out the post container first
            const postContainer = document.getElementById('post-container');
            postContainer.innerHTML = '';

            // For each post in the response, create a new post element and add it to the page
            data.forEach(post => {
                const postDiv = createPostElement(post);
                postContainer.appendChild(postDiv);
            });
        })
        .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to fetch all the posts from the API and display them on the page
function loadPosts() {
    // Retrieve the base URL from the input field and save it to local storage
    var baseUrl = document.getElementById('api-base-url').value;
    var accessToken = localStorage.getItem('accessToken');
    localStorage.setItem('apiBaseUrl', baseUrl);

    // Use the Fetch API to send a GET request to the /posts endpoint
    fetch(baseUrl + '/posts', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => {  // Once the data is ready, we can use it
            // Clear out the post container first
            const postContainer = document.getElementById('post-container');
            postContainer.innerHTML = '';

            // For each post in the response, create a new post element and add it to the page
            data.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `<h2>${post.title}</h2><p>${post.content}</p>
                <p>Author: ${post.author}</p>
                <p>Date: ${post.date}</p>
                  <div class="post-buttons">
                    <button onclick="deletePost(${post.id})">Delete</button>
                    <button onclick="updatePost(${post.id})">Update</button>
                  </div>
                `;
                postContainer.appendChild(postDiv);
            });
        })
        .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a POST request to the API to add a new post
function addPost() {
    // Retrieve the values from the input fields
    var baseUrl = document.getElementById('api-base-url').value;
    var accessToken = localStorage.getItem('accessToken');
    var postTitle = document.getElementById('post-title').value;
    var postContent = document.getElementById('post-content').value;
    var postAuthor = document.getElementById('post-author').value;
    var currentDate = new Date();
    var formattedDate = currentDate.toLocaleDateString();

    // Use the Fetch API to send a POST request to the /posts endpoint
    fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({ title: postTitle, content: postContent, author: postAuthor, date: formattedDate })
    })
    .then(response => response.json())  // Parse the JSON data from the response
    .then(post => {
        console.log('Post added:', post);
        loadPosts(); // Reload the posts after adding a new one
    })
    .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a DELETE request to the API to delete a post
function deletePost(postId) {
    var baseUrl = document.getElementById('api-base-url').value;
    var accessToken = localStorage.getItem('accessToken');

    // Use the Fetch API to send a DELETE request to the specific post's endpoint
    fetch(baseUrl + '/posts/' + postId, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => {
        console.log('Post deleted:', postId);
        loadPosts(); // Reload the posts after deleting one
    })
    .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}
function updateBaseUrl() {
    var baseUrl = document.getElementById('api-base-url').value;
    localStorage.setItem('apiBaseUrl', baseUrl);
    loadPosts();
}

// Function to search for posts based on filters
function searchPosts() {
    var baseUrl = document.getElementById('api-base-url').value;
    var accessToken = localStorage.getItem('accessToken');
    var title = document.getElementById('search-title').value;
    var content = document.getElementById('search-content').value;
    var author = document.getElementById('search-author').value;

    var url = new URL(baseUrl + '/posts/search');
    if (title) url.searchParams.append('title', title);
    if (content) url.searchParams.append('content', content);
    if (author) url.searchParams.append('author', author);

    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    })
    .then(response => response.json())
    .then(data => {
        const postContainer = document.getElementById('post-container');
        postContainer.innerHTML = '';

        data.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `<h2>${post.title}</h2>
                                 <p>${post.content}</p>
                                 <p>Author: ${post.author}</p>
                                 <p>Date: ${post.date}</p>
                                 <div class="post-buttons">
                                     <button onclick="deletePost(${post.id})">Delete</button>
                                     <button onclick="updatePost(${post.id})">Update</button>
                                 </div>`;
            postContainer.appendChild(postDiv);
        });
    })
    .catch(error => console.error('Error:', error));
}

// Function to update a post
function updatePost(postId) {
    var baseUrl = document.getElementById('api-base-url').value;
    var accessToken = localStorage.getItem('accessToken');
    var postTitle = document.getElementById('update-title').value;
    var postContent = document.getElementById('update-content').value;

    fetch(baseUrl + '/posts/' + postId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({ title: postTitle, content: postContent })
    })
    .then(response => response.json())
    .then(updatedPost => {
        console.log('Post updated:', updatedPost);
        loadPosts();
    })
    .catch(error => console.error('Error:', error));
}
