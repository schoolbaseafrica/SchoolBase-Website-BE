export interface IRevokeAllSessionsData {
  revoked_count: number;
}

export interface IRevokeSessionData {
  revoked: boolean;
  session_id: string;
}

export interface ICreateSessionData {
  session_id: string;
  expires_at: Date;
}
