const API_BASE_URL = process.env.REACT_APP_API_BASE || '/api';

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

// 分类相关
export const categoryApi = {
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' })
};

// 留言相关
export const messageApi = {
  getMessages: () => request('/messages'),
  createMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  getAllMessages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/messages/all?${queryString}`);
  },
  updateStatus: (id, status) => request(`/messages/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteMessage: (id) => request(`/messages/${id}`, { method: 'DELETE' })
};

// 友链相关
export const friendLinkApi = {
  getLinks: () => request('/friendlinks'),
  createLink: (data) => request('/friendlinks', { method: 'POST', body: JSON.stringify(data) }),
  updateLink: (id, data) => request(`/friendlinks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLink: (id) => request(`/friendlinks/${id}`, { method: 'DELETE' })
};

// 网站设置
export const settingsApi = {
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) })
};

// 访客统计
export const visitorApi = {
  trackVisit: (data) => request('/visitors/track', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => request('/visitors/stats')
};

export default {
  auth: authApi,
  post: postApi,
  comment: commentApi,
  category: categoryApi,
  message: messageApi,
  friendLink: friendLinkApi,
  settings: settingsApi,
  visitor: visitorApi
};