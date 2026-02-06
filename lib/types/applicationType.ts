export interface ApplicationFullInformation {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  username: string;
  email: string;
  applicationDate: string;
  status: string;
  answers: {
    question: string;
    answer: string;
  }[];
}
