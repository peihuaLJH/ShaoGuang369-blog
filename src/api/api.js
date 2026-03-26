const API_BASE_URL = 'http://localhost:5000/api';

// 通用请求方法
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // 添加token
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '请求失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 认证相关
export const authApi = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
};

// 文章相关
export const postApi = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/posts?${queryString}`);
  },
  
  getPost: (id) => request(`/posts/${id}`),
  
  createPost: (postData) => request('/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }),
  
  updatePost: (id, postData) => request(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData)
  }),
  
  deletePost: (id) => request(`/posts/${id}`, {
    method: 'DELETE'
  }),
  
  likePost: (id) => request(`/posts/${id}/like`, {
    method: 'POST'
  })
};

// 评论相关
export const commentApi = {
  getComments: (postId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/comments/post/${postId}?${queryString}`);
  },
  
  createComment: (commentData) => request('/comments', {
    method: 'POST',
    body: JSON.stringify(commentData)
  }),
  
  deleteComment: (id) => request(`/comments/${id}`, {
    method: 'DELETE'
  }),
  
  likeComment: (id) => request(`/comments/${id}/like`, {
    method: 'POST'
  }),
  
  getAllComments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/comments?${queryString}`);
  },
  
  reviewComment: (id, status) => request(`/comments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};

// 统计相关
export const statsApi = {
  recordVisit: (data) => request('/stats/record', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/stats?${queryString}`);
  },
  
  getTotalStats: () => request('/stats/total')
};

export default {
  auth: authApi,
  post: postApi,
  comment: commentApi,
  stats: statsApi
};