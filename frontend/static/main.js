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
    <p><strong>Categories:</strong> ${post.categories}</p>
    <p><strong>Tags:</strong> ${post.tags}</p>
    <p><strong>Comments:</strong> ${post.comments}</p>
    <div class="comments">
      <h3>Comments:</h3>
      ${post.comments ? post.comments.map(comment => `
        <div class="comment">
          <p><strong>Author:</strong> ${comment.author}</p>
          <p><strong>Date:</strong> ${comment.date}</p>
          <p>${comment.content}</p>
        </div>
      `).join('') : ''}
    </div>
    <div class="post-buttons">
      <button onclick="deletePost(${post.id})">Delete</button>
    </div>
    <div class="input-field">
      <input type="text" id="update-title-${post.id}" placeholder="Enter Title" />
      <textarea id="update-content-${post.id}" placeholder="Enter Content"></textarea>
      <input id="update-author-${post.id}" placeholder="Enter author" >
      <input id="update-categories-${post.id}" placeholder="Enter categories">
      <input id="update-tags-${post.id}" placeholder="Enter tags">
      <button onclick="updatePost(${post.id})">Update</button>
      <form onsubmit="addComment(event, ${post.id})">
        <input type="text" id="comment-author-${post.id}" placeholder="Author" required />
        <textarea id="comment-content-${post.id}" placeholder="Comment" required></textarea>
        <button type="submit">Add Comment</button>
      </form>
    </div>
  `;
  return postDiv;
}

function sortPosts() {
    // Retrieve the sort and direction values from the select elements
    console.log('Sorting posts');
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
            postDiv.innerHTML = `
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <p><strong>Author:</strong> ${post.author}</p>
                <p><strong>Date:</strong> ${post.date}</p>
                <p><strong>Categories:</strong> ${post.categories}</p>
                <p><strong>Tags:</strong> ${post.tags}</p>
                <div class="comments">
                    <h3>Comments:</h3>
                    ${post.comments ? post.comments.map(comment => `
                        <div class="comment">
                            <p><strong>Author:</strong> ${comment.author}</p>
                            <p><strong>Date:</strong> ${comment.date}</p>
                            <p>${comment.content}</p>
                        </div>
                    `).join('') : ''}
                </div>
                <div class="post-buttons">
                    <button onclick="deletePost(${post.id})">Delete</button>
                </div>
                <div class="input-field">
                    <input type="text" id="update-title-${post.id}" placeholder="Enter Title"/>
                    <textarea id="update-content-${post.id}" placeholder="Enter Content"></textarea>
                    <input id="update-author-${post.id}" placeholder="Enter author">
                    <input id="update-categories-${post.id}" placeholder="Enter categories">
                    <input id="update-tags-${post.id}" placeholder="Enter tags">
                    <button onclick="updatePost(${post.id})">Update</button>

                <hr>


                <div class="input-field">
                    <form onsubmit="addComment(event, ${post.id})">
                        <input type="text" id="comment-author-${post.id}" placeholder="Author" required />
                        <textarea id="comment-content-${post.id}" placeholder="Comment" required></textarea>
                        <button type="submit">Add Comment</button>
                    </form>
                </div>
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
    var postTags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim());
    var postCategories = document.getElementById('post-categories').value.split(',').map(category => category.trim());
    var currentDate = new Date();
    var formattedDate = currentDate.toLocaleDateString();

    // Use the Fetch API to send a POST request to the /posts endpoint
    fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
            title: postTitle,
            content: postContent,
            author: postAuthor,
            date: formattedDate,
            tags: postTags,
            categories: postCategories
        })
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

    // Get the updated post data from the input fields
    var title = document.getElementById('update-title-' + postId).value;
    var content = document.getElementById('update-content-' + postId).value;
    var author = document.getElementById('update-author-' + postId).value;
    var tags = document.getElementById('update-tags-' + postId).value;
    var categories = document.getElementById('update-categories-' + postId).value;

    // Create a JSON object with the updated post data
    var updatedPost = {
        title: title,
        content: content,
        author: author,
        tags: tags,
        categories: categories
    };

    // Use the Fetch API to send a PUT request to update the post
    fetch(baseUrl + '/posts/' + postId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(updatedPost)
    })
        .then(response => {
            console.log('Post updated:', postId);
            loadPosts(); // Reload the posts after updating one
        })
        .catch(error => console.error('Error:', error));
}


function addComment(event, postId) {
  event.preventDefault();

  var baseUrl = document.getElementById('api-base-url').value;
  var accessToken = localStorage.getItem('accessToken');
  var author = document.getElementById(`comment-author-${postId}`).value;
  var content = document.getElementById(`comment-content-${postId}`).value;
  var currentDate = new Date();
  var formattedDate = currentDate.toLocaleDateString();

  var comment = {
    author: author,
    content: content,
    date: formattedDate
  };

  fetch(baseUrl + '/posts/' + postId + '/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify(comment)
  })
    .then(response => response.json())
    .then(data => {
      console.log('Comment added:', data);
      loadPosts(); // Reload the posts after adding a comment
    })
    .catch(error => console.error('Error:', error));
}