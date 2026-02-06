export interface ApplicationFullInformation {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  phone: string;
  applicationDate: string;
  status: string;
  resumeUrl: string;
  answers: {
    question: string;
    answer: string;
  }[];
}
