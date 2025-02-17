import {IAppSettings, IProject, IUserProfile, IUserProfileMinimal} from '@/interfaces';
import { MainState, AppNotification } from './state';
import { getStoreAccessors } from 'typesafe-vuex';
import { State } from '../state';


export const mutations = {
    setToken(state: MainState, payload: string) {
        state.token = payload;
    },
    setLoggedIn(state: MainState, payload: boolean) {
        state.isLoggedIn = payload;
    },
    setLogInError(state: MainState, payload: string | null) {
        state.logInError = payload;
    },
    setUserProfile(state: MainState, payload: IUserProfile) {
        state.userProfile = payload;
    },
    setAppSettings(state: MainState, payload: IAppSettings) {
        state.appSettings = payload;
    },
    setCoworkers(state: MainState, payload: IUserProfileMinimal[]) {
        state.coworkers = payload;
    },
    setProjects(state: MainState, payload: IProject[]) {
        state.projects = payload;
    },
    setProject(state: MainState, payload: IProject) {
        const projects = state.projects.filter((p: IProject) => p.id !== payload.id);
        projects.push(payload);
        state.projects = projects;
    },
    addNotification(state: MainState, payload: AppNotification) {
        state.notifications.push(payload);
    },
    removeNotification(state: MainState, payload: AppNotification) {
        state.notifications = state.notifications.filter((notification) => notification !== payload);
    },
};

const {commit} = getStoreAccessors<MainState | any, State>('');

export const commitSetLoggedIn = commit(mutations.setLoggedIn);
export const commitSetLogInError = commit(mutations.setLogInError);
export const commitSetToken = commit(mutations.setToken);
export const commitSetUserProfile = commit(mutations.setUserProfile);
export const commitSetAppSettings = commit(mutations.setAppSettings);
export const commitSetCoworkers = commit(mutations.setCoworkers);
export const commitSetProjects = commit(mutations.setProjects);
export const commitSetProject = commit(mutations.setProject);
export const commitAddNotification = commit(mutations.addNotification);
export const commitRemoveNotification = commit(mutations.removeNotification);
