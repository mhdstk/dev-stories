export interface GitHubUser {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    html_url: string;
}

export interface AuthenticationResult {
    user: GitHubUser;
    token: string;
}