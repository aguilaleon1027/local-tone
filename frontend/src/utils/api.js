const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getCatalog: (category) => {
    const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
    return request(`/hanbok/catalog${params}`)
  },
  getCategories: () => request('/hanbok/categories'),
  getFeatured: () => request('/hanbok/featured'),
  getHanbok: (id) => request(`/hanbok/${id}`),
  uploadPhoto: (file) => {
    const form = new FormData()
    form.append('photo', file)
    return request('/fitting/upload-photo', { method: 'POST', body: form })
  },
  generateFitting: (photoId, hanbokId) => {
    const form = new FormData()
    form.append('photo_id', photoId)
    form.append('hanbok_id', hanbokId)
    return request('/fitting/generate', { method: 'POST', body: form })
  },
  getResult: (id) => request(`/fitting/result/${id}`),
  createBooking: (data) => request('/booking/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
}
