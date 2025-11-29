export interface ICreateSuperadminSessionData {
  session_id: string;
  expires_at: Date;
}

export interface IRevokeSuperadminSessionData {
  revoked: boolean;
  session_id: string;
}

export interface IRevokeAllSuperadminSessionsData {
  revoked_count: number;
}
