const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(method, path, body = null, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('shieldx_token')
  if (requireAuth && token) headers['Authorization'] = `Bearer ${token}`

  const res  = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Something went wrong')
  return data
}

const get  = (path, auth = true)        => request('GET',  path, null, auth)
const post = (path, body, auth = true)  => request('POST', path, body, auth)
const put  = (path, body)               => request('PUT',  path, body)

export const authAPI = {
  register:       (d) => post('/auth/register',        d, false),
  login:          (d) => post('/auth/login',           d, false),
  me:             ()  => get('/auth/me'),
  forgotPassword: (e) => post('/auth/forgot-password', { email: e }, false),
}

export const productsAPI   = { list: () => get('/products', false) }
export const calculatorAPI = { calculate: (type, p) => post('/calculator/premium', { type, params: p }, false) }

export const policiesAPI = {
  my:      ()        => get('/policies/my'),
  all:     (p)       => get(`/policies?${new URLSearchParams(p)}`),
  approve: (id, d)   => put(`/policies/${id}/approve`, d),
  certUrl: (id)      => `${BASE}/policies/${id}/certificate`,
}

export const claimsAPI = {
  my:           ()      => get('/claims/my'),
  all:          (p)     => get(`/claims?${new URLSearchParams(p)}`),
  updateStatus: (id, d) => put(`/claims/${id}/status`, d),
  file: (formData) => {
    const token = localStorage.getItem('shieldx_token')
    return fetch(`${BASE}/claims`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
    }).then(r => r.json())
  },
}

export const kycAPI = {
  my:      ()       => get('/kyc/my'),
  pending: ()       => get('/kyc/pending'),
  verify:  (id, d)  => put(`/kyc/${id}/verify`, d),
  upload: (formData) => {
    const token = localStorage.getItem('shieldx_token')
    return fetch(`${BASE}/kyc/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
    }).then(r => r.json())
  },
}

export const adminAPI = {
  analytics: () => get('/admin/analytics'),
  users:     () => get('/admin/users'),
  audit:     () => get('/admin/audit'),
}
