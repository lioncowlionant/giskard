import axios from 'axios';
import { apiUrl } from '@/env';
import {
  IUserProfile, IUserProfileUpdate, IUserProfileCreate, IRole, IProject, IProjectCreate,
  IProjectUpdate, IUserProfileMinimal, IProjectFile, IProjetFileModel, IDataMetadata, IModelMetadata,
  IFeedbackCreate, IFeedbackForList, IFeedbackDisplay, IAppInitData
} from './interfaces';

function authHeaders(token: string) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

const axiosProject = axios.create({
  baseURL: `${apiUrl}/api/v1/projects`
});
// this is to automatically parse responses from the projects API, be it array or single objects
axiosProject.interceptors.response.use(resp => {
  if (Array.isArray(resp.data)) {
    resp.data.map(p => p.created_on = new Date(p.created_on))
  } else {
    resp.data.created_on = new Date(resp.data.created_on)
  }
  return resp
})

export const api = {
  async logInGetToken(username: string, password: string) {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    return axios.post(`${apiUrl}/api/v1/login/access-token`, params);
  },
  async getAppConfig(token: string) {
    return axios.get<IUserProfile>(`${apiUrl}/api/v1/app-config`, authHeaders(token));
  },
  async getMe(token: string) {
    return axios.get<IAppInitData>(`${apiUrl}/api/v1/users/me`, authHeaders(token));
  },
  async updateMe(token: string, data: IUserProfileUpdate) {
    return axios.put<IUserProfile>(`${apiUrl}/api/v1/users/me`, data, authHeaders(token));
  },
  async getUsers(token: string) {
    return axios.get<IUserProfile[]>(`${apiUrl}/api/v1/users/`, authHeaders(token));
  },
  async getRoles(token: string) {
    return axios.get<IRole[]>(`${apiUrl}/api/v1/roles/`, authHeaders(token));
  },
  async updateUser(token: string, userId: number, data: IUserProfileUpdate) {
    return axios.put(`${apiUrl}/api/v1/users/${userId}`, data, authHeaders(token));
  },
  async createUser(token: string, data: IUserProfileCreate) {
    return axios.post(`${apiUrl}/api/v1/users/`, data, authHeaders(token));
  },
  async signupUser(userData: IUserProfileCreate, token: string) {
    return axios.post(`${apiUrl}/api/v1/users/open`, { ...userData, token });
  },
  async deleteUser(token: string, userId: number) {
    return axios.delete(`${apiUrl}/api/v1/users/${userId}`, authHeaders(token));
  },
  async passwordRecovery(email: string) {
    return axios.post(`${apiUrl}/api/v1/password-recovery/${email}`);
  },
  async resetPassword(password: string, token: string) {
    return axios.post(`${apiUrl}/api/v1/reset-password/`, {
      new_password: password,
      token,
    });
  },
  async getSignupLink(token: string) {
    return axios.get(`${apiUrl}/api/v1/users/signuplink`, authHeaders(token));
  },
  async inviteToSignup(token: string, email: string) {
    return axios.post(`${apiUrl}/api/v1/users/invite`, { email }, authHeaders(token));
  },
  async getCoworkersMinimal(token: string) {
    return axios.get<IUserProfileMinimal[]>(`${apiUrl}/api/v1/users/me/coworkers`, authHeaders(token));
  },
  async getApiAccessToken(token: string) {
    return axios.get(`${apiUrl}/api/v1/security/api-access-token`, authHeaders(token));
  },

  // Projects
  async getProjects(token: string) {
    return axiosProject.get<IProject[]>(`/`, authHeaders(token))
  },
  async getProject(token: string, id: number) {
    return axiosProject.get<IProject>(`/${id}`, authHeaders(token));
  },
  async createProject(token: string, data: IProjectCreate) {
    return axiosProject.post<IProject>(`/`, data, authHeaders(token));
  },
  async deleteProject(token: string, id: number) {
    return axiosProject.delete<IProject>(`/${id}`, authHeaders(token));
  },
  async editProject(token: string, id: number, data: IProjectUpdate) {
    return axiosProject.put<IProject>(`/${id}`, data, authHeaders(token));
  },
  async inviteUserToProject(token: string, projectId: number, userId: string) {
    return axiosProject.put<IProject>(`/${projectId}/invite`, { user_id: userId }, authHeaders(token));
  },
  async uninviteUserFromProject(token: string, projectId: number, userId: string) {
    return axiosProject.put<IProject>(`/${projectId}/uninvite`, { user_id: userId }, authHeaders(token));
  },
  // Models
  async getProjectModels(token: string, id: number) {
    return axios.get<IProjetFileModel[]>(`${apiUrl}/api/v1/projects/${id}/models`, authHeaders(token));
  },
  async deleteModelFiles(token: string, modelId: number) {
    return axios.delete(`${apiUrl}/api/v1/files/models/${modelId}`, authHeaders(token));
  },
  async deleteDatasetFile(token: string, id: number) {
    return axios.delete(`${apiUrl}/api/v1/files/datasets/${id}`, authHeaders(token));
  },
  async downloadModelFile(token: string, modelId: number) {
    return axios.get(`${apiUrl}/api/v1/files/models/${modelId}`, { ...authHeaders(token), 'responseType': 'blob' });
  },
  async downloadDataFile(token: string, id: number) {
    return axios.get(`${apiUrl}/api/v1/files/datasets/${id}`, { ...authHeaders(token), 'responseType': 'blob' });
  },
  async peakDataFile(token: string, id: number) {
    return axios.get(`${apiUrl}/api/v1/files/datasets/${id}/peak`, authHeaders(token));
  },
  async getFeaturesMetadata(token: string, modelId: number, datasetId: number) {
    return axios.get<IDataMetadata[]>(`${apiUrl}/api/v1/models/${modelId}/features/${datasetId}`, authHeaders(token));
  },
  async getDataByRowId(token: string, datasetId: number, rowId: number) {
    return axios.get(`${apiUrl}/api/v1/files/datasets/${datasetId}/row/${rowId}`, authHeaders(token));
  },
  async getDataRandom(token: string, datasetId: number) {
    return axios.get(`${apiUrl}/api/v1/files/datasets/${datasetId}/row/random`, authHeaders(token));
  },
  async getProjectDatasets(token: string, id: number) {
    return axios.get<IProjectFile[]>(`${apiUrl}/api/v1/projects/${id}/datasets`, authHeaders(token));
  },
  async uploadDataFile(token: string, projectId: number, fileData: any) {
    const formData = new FormData();
    formData.append("file", fileData);
    const config = authHeaders(token)
    config.headers["content-type"] = "multipart/form-data"
    return axios.post(`${apiUrl}/api/v1/files/data/upload?projectId=${projectId}`, formData, config)
  },
  async getModelMetadata(token: string, modelId: number) {
    return axios.get<IModelMetadata>(`${apiUrl}/api/v1/models/${modelId}/metadata`, authHeaders(token));
  },
  async predict(token: string, modelId: number, inputData: object) {
    return axios.post(`${apiUrl}/api/v1/models/${modelId}/predict`, { features: inputData }, authHeaders(token));
  },
  async explain(token: string, modelId: number, datasetId: number, inputData: object) {
    return axios.post(`${apiUrl}/api/v1/models/${modelId}/${datasetId}/explain`, { features: inputData }, authHeaders(token));
  },
  async explainText(token: string, modelId: number, inputData: object, featureName: string) {
    return axios.post(`${apiUrl}/api/v1/models/${modelId}/explain_text/${featureName}`, {features: inputData}, authHeaders(token)); 
  },
  // feedbacks
  async submitFeedback(token: string, payload: IFeedbackCreate, projectId: number) {
    return axios.post(`${apiUrl}/api/v1/feedbacks/${projectId}`, payload, authHeaders(token));
  },
  async getProjectFeedbacks(token: string, projectId: number) {
    return axios.get<IFeedbackForList[]>(`${apiUrl}/api/v1/feedbacks/all/${projectId}`, authHeaders(token));
  },
  async getFeedback(token: string, id: number) {
    return axios.get<IFeedbackDisplay>(`${apiUrl}/api/v1/feedbacks/${id}`, authHeaders(token));
  },
  async replyToFeedback(token: string, feedbackId: number, content: string, replyToId: number | null = null) {
    return axios.post(`${apiUrl}/api/v1/feedbacks/${feedbackId}/reply`, {content, reply_to_reply: replyToId}, authHeaders(token));
  }

};
