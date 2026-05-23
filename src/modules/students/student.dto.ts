export interface CreateStudentDTO {
  name: string;
  course: string;
  skills: string[];
  availability: string[];
  headline?: string;
  summary?: string;
  city?: string;
  state?: string;
  semester?: string;
  university?: string;
  cr?: string;
  portfolio?: string;
  photoUrl?: string;
  userId: string;
}

export interface UpdateStudentDTO {
  name?: string;
  course?: string;
  skills?: string[];
  availability?: string[];
  headline?: string;
  summary?: string;
  city?: string;
  state?: string;
  semester?: string;
  university?: string;
  cr?: string;
  portfolio?: string;
  photoUrl?: string;
  isVisible?: boolean;
}
