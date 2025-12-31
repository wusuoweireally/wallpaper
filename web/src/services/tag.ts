import api from '@/config/api'
import type { ApiResponse } from '@/config/api'

export interface Tag {
  id: number
  name: string
  usageCount: number
  createdAt: string
}

export interface SearchTagsQuery {
  keyword?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  page?: number
  limit?: number
}

export interface CreateTag {
  name: string
}

export interface UpdateTag {
  name: string
}

export interface TagListResponse extends ApiResponse<Tag[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class TagService {
  async getTags(query: SearchTagsQuery = {}) {
    return api.get<Tag[]>('/tags', { params: query }) as Promise<TagListResponse>
  }

  async getTagById(id: number) {
    return api.get<Tag>(`/tags/${id}`)
  }

  async createTag(data: CreateTag) {
    return api.post('/tags', data)
  }

  async updateTag(id: number, data: UpdateTag) {
    return api.patch(`/tags/${id}`, data)
  }

  async deleteTag(id: number) {
    return api.delete(`/tags/${id}`)
  }
}

export default new TagService()
