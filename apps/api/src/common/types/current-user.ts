export type CurrentUserPayload = {
  id: string;
  email?: string;
  roles?: string[]; // keep flexible; don’t assume enum locations
  activeRole?: string;
  isActive?: boolean;
};