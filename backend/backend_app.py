import json
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_limiter import Limiter


def configure_app():
    app = Flask(__name__)
    app.secret_key = "pass1"
    app.config['JWT_SECRET_KEY'] = 'pass'
    return app


def initialize_jwt_and_limiter(app_flask):
    jwt = JWTManager(app_flask)
    limiter = Limiter(app_flask)
    return jwt, limiter


app = configure_app()
CORS(app)
jwt, limiter = initialize_jwt_and_limiter(app)


POSTS_FILE = "backend/posts.json"
USERS_FILE = "backend/users.json"


def open_files(file_data):
    """
    Open and load data from a JSON file.
    Args:
        file_data (str): The file path.
    Returns:
        list: The loaded data from the JSON file.
    """
    try:
        with open(file_data, "r") as fileobj:
            data = json.load(fileobj)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    return data


def save_files(file_data, data):
    """
    Save data to a JSON file.
    Args:
        file_data (str): The file path.
        data (list): The data to be saved.
    """
    with open(file_data, "w") as fileobj:
        json.dump(data, fileobj, indent=4)


@app.errorhandler(404)
def not_found_error():
    """
    Handle 404 Not Found error.
    Returns:
        dict: JSON response with an error message and status code 404.
    """
    return jsonify({"error": "Post was not found"}), 404


@app.errorhandler(400)
def bad_request_error():
    """
    Handle 400 Bad Request error.
    Returns:
        dict: JSON response with an error message and status code 400.
    """
    return jsonify({"error": "Bad Request"}), 400


def generate_id(posts):
    """
    Generate a new ID for a post.
    Args:
        posts (list): The list of posts.
    Returns:
        int: The new ID.
    """
    if not posts:
        return 1
    else:
        new_id = max(post.get('id', 0) for post in posts) + 1
        return new_id


def sort_list(posts, sort, direction):
    """
    Sort a list of posts based on the specified sorting field and direction.
    Args:
        posts (list): The list of posts.
        sort (str): The sorting field ('title', 'content', 'author', 'date').
        direction (str): The sorting direction ('asc' or 'desc').
    Returns:
        list: The sorted list of posts.
    """
    reverse = (direction == 'desc')
    sorted_posts = sorted(posts, key=lambda post: post.get(sort), reverse=reverse)
    return [post for post in sorted_posts]


@app.route('/api/register', methods=['POST'])
def register():
    """
    Register a new user.
    Returns:
        dict: JSON response with a success message or an error message with status code 400.
    """
    users = open_files(USERS_FILE)
    new_user = request.get_json()

    if 'username' not in new_user or 'password' not in new_user:
        return jsonify({"error": "Missing field: username or password"}), 400

    existing_user = next((user for user in users if user['username'] == new_user['username']), None)
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    if not users:
        new_user['id'] = 1
    else:
        new_user['id'] = max(user['id'] for user in users) + 1

    users.append(new_user)
    save_files(USERS_FILE, users)
    return jsonify({"message": "User registered successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    """
    Perform user login and generate an access token.
    Returns:
        dict: JSON response with an access token or an error message with status code 401.
    """
    users = open_files(USERS_FILE)
    credentials = request.get_json()
    if 'username' in credentials and 'password' in credentials:
        user = next((user for user in users if user['username'] == credentials['username']), None)
        if user and user['password'] == credentials['password']:
            session['user_id'] = user['id']
            access_token = create_access_token(identity=user['id'])
            return jsonify({"access_token": access_token}), 200
    return jsonify({"error": "Invalid username or password"}), 401


@app.route('/api/posts', methods=['GET'])
@limiter.limit("10/minute")
def get_posts():
    """
    Get a list of posts.
    Returns:
        dict: JSON response with the list of posts.
    """
    sort = request.args.get('sort')
    direction = request.args.get('direction', 'asc')

    if sort is None:
        return jsonify(open_files(POSTS_FILE))
    if sort not in ['title', 'content', 'author', 'date'] or direction not in ['asc', 'desc']:
        return jsonify({"error": "Invalid sort or direction value"}), 400

    sorted_post = sort_list(open_files(POSTS_FILE), sort, direction)
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))

    start_index = (page - 1) * limit
    end_index = start_index + limit

    paginated_posts = list(sorted_post)[start_index:end_index]
    return jsonify(paginated_posts)


@app.route('/api/posts', methods=['POST'])
@jwt_required()
def add_post():
    """
    Add a new post.
    Returns:
        dict: JSON response with the new post or an error message with status code 400.
    """
    new_post = request.get_json()
    if 'content' in new_post and 'title' in new_post:
        posts = open_files(POSTS_FILE)
        new_post['id'] = generate_id(posts)
        posts.append(new_post)
        save_files(POSTS_FILE, posts)
        return jsonify(new_post), 201
    else:
        error_messages = []
        if 'title' not in new_post:
            error_messages.append("Missing field: title")
        if 'content' not in new_post:
            error_messages.append("Missing field: content")
        if 'author' not in new_post:
            error_messages.append("Missing field: author")
        if 'date' not in new_post:
            error_messages.append("Missing field: date")
        error_message = {"error": ", ".join(error_messages)}
        return jsonify(error_message), 400


def find_post_by_id(post_id):
    """
    Find a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: The post if found, None otherwise.
    """
    posts = open_files(POSTS_FILE)
    for post in posts:
        if post['id'] == post_id:
            return post


@app.route('/api/posts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    """
    Delete a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with a success message or an error message with status code 404.
    """
    posts = open_files(POSTS_FILE)
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    posts.remove(post)
    save_files(POSTS_FILE, posts)
    return {
        "message": f"Post with id {post_id} has been deleted successfully."
    }, 200


@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    """
    Update a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the updated post or an error message with status code 404.
    """
    posts = open_files(POSTS_FILE)
    post_index = None
    for i, post in enumerate(posts):
        if post['id'] == post_id:
            post_index = i
            break
    if post_index is None:
        return jsonify({"error": "Post was not found"}), 404
    updated_post = request.get_json()
    if 'title' in updated_post:
        posts[post_index]['title'] = updated_post['title']
    if 'content' in updated_post:
        posts[post_index]['content'] = updated_post['content']
    if 'author' in updated_post:
        posts[post_index]['author'] = updated_post['author']
    if 'date' in updated_post:
        posts[post_index]['date'] = updated_post['date']
    if 'categories' in updated_post:
        posts[post_index]['categories'] = updated_post['categories']
    if 'tags' in updated_post:
        posts[post_index]['tags'] = updated_post['tags']
    save_files(POSTS_FILE, posts)
    return jsonify(posts[post_index]), 200


@app.route('/api/posts/search', methods=['GET'])
def search_post():
    """
    Search for posts based on the provided parameters.
    Returns:
        dict: JSON response with the list of matching posts.
    """
    all_post_find = []
    posts = open_files(POSTS_FILE)
    content = request.args.get('content')
    title = request.args.get('title')
    author = request.args.get('author')
    date = request.args.get('date')
    for post in posts:
        if title and title.lower() in post['title'].lower():
            all_post_find.append(post)
        elif content and content.lower() in post['content'].lower():
            all_post_find.append(post)
        elif author and author.lower() in post['author'].lower():
            all_post_find.append(post)
        elif date and date.lower() in post['date'].lower():
            all_post_find.append(post)
    return jsonify(all_post_find)


@app.route('/api/posts/<int:id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    """
    Add a comment to a post.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the new comment or an error message with status code 404.
    """
    posts = open_files(POSTS_FILE)
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    new_comment = request.get_json()
    if 'content' in new_comment and 'author' in new_comment:
        if 'comments' not in post:
            post['comments'] = []
        new_comment_id = generate_id(post['comments'])
        new_comment['id'] = new_comment_id
        new_comment['content'] = new_comment['content']
        new_comment['author'] = new_comment['author']
        new_comment['date'] = new_comment['date']
        post['comments'].append(new_comment)
        for i, p in enumerate(posts):
            if p['id'] == post_id:
                posts[i] = post
                break

        save_files(POSTS_FILE, posts)  # Update the posts list
        return jsonify(new_comment), 201
    else:
        error_messages = []
        if 'content' not in new_comment:
            error_messages.append("Missing field: content")
        if 'author' not in new_comment:
            error_messages.append("Missing field: author")
        error_message = {"error": ", ".join(error_messages)}
        return jsonify(error_message), 400


@app.route('/api/posts/<int:id>/comments', methods=['GET'])
def get_comments(post_id):
    """
    Get the comments of a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the list of comments or an error message with status code 404.
    """
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    if 'comments' not in post:
        post['comments'] = []
    return jsonify(post['comments'])


@app.route('/api/posts/<int:id>/categories', methods=['POST'])
@jwt_required()
def add_category(post_id):
    """
    Add a category to a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the new category or an error message with status code 404.
    """
    posts = open_files(POSTS_FILE)
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    new_category = request.get_json()
    if 'category' in new_category:
        if 'categories' not in post:
            post['categories'] = []
        post['categories'].append(new_category['category'])
        for i, p in enumerate(posts):
            if p['id'] == post_id:
                posts[i] = post
                break
        save_files(POSTS_FILE, posts)
        return jsonify(new_category), 201
    else:
        return jsonify({"error": "Missing field: category"}), 400


@app.route('/api/posts/<int:id>/categories', methods=['GET'])
def get_categories(post_id):
    """
    Get the categories of a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the list of categories or an error message with status code 404.
    """
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    return jsonify(post['categories'])


@app.route('/api/posts/<int:id>/tags', methods=['POST'])
@jwt_required()
def add_tag(post_id):
    """
    Add a tag to a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the new tag or an error message with status code 404.
    """
    posts = open_files(POSTS_FILE)
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    new_tag = request.get_json()
    if 'tags' in new_tag:
        if 'tags' not in post:
            post['tags'] = []
        post['tags'].append(new_tag['tags'])
        for i, p in enumerate(posts):
            if p['id'] == post_id:
                posts[i] = post
                break
        save_files(POSTS_FILE, posts)
        return jsonify(new_tag), 201
    else:
        return jsonify({"error": "Missing field: tags"}), 400


@app.route('/api/posts/<int:id>/tags', methods=['GET'])
def get_tags(post_id):
    """
    Get the tags of a post by ID.
    Args:
        post_id (int): The ID of the post.
    Returns:
        dict: JSON response with the list of tags or an error message with status code 404.
    """
    post = find_post_by_id(post_id)
    if post is None:
        return jsonify({"error": "Post was not found"}), 404
    return jsonify(post['tags'])


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)
