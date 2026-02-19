/**
 * Type used to represent minimal user data.
 */
export type UserData = {
  id: number;
  username: string;
  email: string;
  pnr: string;
  roleID: number;
  role: string;
};

/**
 * Type used to represent the full data of a user, including personal information
 */
export type FullUserData = {
  id: number;
  username: string;
  roleID: number;
  email: string;
  firstName: string;
  lastName: string;
  pnr: string;
};

/**
 * Type used to represent specific availability information for a user.
 */
export type UserAvailability = {
  availabilityID: number;
  fromDate: Date;
  toDate: Date;
};
