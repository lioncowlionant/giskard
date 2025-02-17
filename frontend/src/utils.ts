export const getLocalToken = () => localStorage.getItem('token');

export const saveLocalToken = (token: string) => localStorage.setItem('token', token);

export const removeLocalToken = () => localStorage.removeItem('token');

export const formatSizeForDisplay = (size: number): string => {
    if (size < 1024) return size + ' b';
    else if (size >= 1024 && size < Math.pow(1024, 2)) return (size / 1024).toFixed(2) + ' Kb';
    else return (size / 1024 / 1024).toFixed(2) + ' Mb';
}

import { IUserProfile, IUserProfileMinimal } from '@/interfaces';

export const getUserFullDisplayName = (user: IUserProfile | IUserProfileMinimal): string => {
    return user.display_name? `${user.display_name} (${user.user_id})`: user.user_id;
}
