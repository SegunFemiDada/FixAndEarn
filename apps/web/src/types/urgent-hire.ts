export interface UrgentHireFormValues {
  skillCategory: string;
  state: string;
  city: string;
  lga?: string;
  area?: string;
}

export interface UrgentHireRequest
  extends UrgentHireFormValues {
  fixerId: string;
}

export interface UrgentHireResponse {
  authorizationUrl: string;
  reference: string;
  jobId: string;
}