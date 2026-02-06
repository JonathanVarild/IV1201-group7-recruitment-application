export interface ApplicationCardSummary {
  id: string;
  name: string;
  applicationDate: string;
  status: string;
}

export interface ApplicationFullInformation {
  id: string;
  name: string;
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
